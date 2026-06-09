import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, department_id, tenant_id } = await req.json();

    if (!name || !email || !password || !role || !tenant_id) {
      return NextResponse.json(
        { error: 'Os campos Nome, E-mail, Senha, Papel e Tenant ID são obrigatórios.' },
        { status: 400 }
      );
    }

    // 1. Validar autenticação e autorização do usuário requisitante
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user: requester },
    } = await supabase.auth.getUser();

    if (!requester) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // 2. Verificar a role do requisitante no banco
    const { data: requesterProfile, error: reqError } = await supabaseAdmin
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', requester.id)
      .single();

    if (reqError || !requesterProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado ou erro de permissão.' }, { status: 403 });
    }

    // Apenas admins ou consultores podem criar usuários
    if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'consultor') {
      return NextResponse.json({ error: 'Apenas administradores ou consultores podem convidar novos membros.' }, { status: 403 });
    }

    // Garante que consultores/admins só criem usuários para o mesmo tenant (a menos que seja admin global)
    if (requesterProfile.role !== 'admin' && requesterProfile.tenant_id !== tenant_id) {
      return NextResponse.json({ error: 'Você não tem permissão para cadastrar membros em outras empresas.' }, { status: 403 });
    }

    // 3. Cadastrar usuário no Supabase Auth usando o admin client (service_role)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUser = authData?.user;
    if (!newUser) {
      return NextResponse.json({ error: 'Erro ao criar conta no Supabase Auth.' }, { status: 500 });
    }

    // 4. O trigger de banco cria o perfil básico. Vamos atualizar o perfil com os metadados corretos
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        role,
        tenant_id,
        department_id: department_id || null
      })
      .eq('id', newUser.id);

    if (profileUpdateError) {
      // Tentar deletar o usuário criado no auth para evitar inconsistências
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      return NextResponse.json({ error: `Erro ao criar perfil no banco de dados: ${profileUpdateError.message}` }, { status: 550 });
    }

    return NextResponse.json({
      success: true,
      message: 'Membro da equipe cadastrado com sucesso!',
      user: {
        id: newUser.id,
        name,
        email,
        role
      }
    });

  } catch (error: any) {
    console.error('Erro na API de criação de usuário:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
