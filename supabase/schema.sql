-- Habilitar a extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Tenants (Empresas Clientes)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mission TEXT,
    vision TEXT,
    values TEXT,
    purpose TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de Perfis de Usuários (Profiles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'colaborador' CHECK (role IN ('admin', 'consultor', 'colaborador')),
    department_id UUID, -- Vinculado na tabela de departamentos abaixo após sua criação
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Tabela de Associação de Múltiplos Tenants (Para Consultores/Admins)
CREATE TABLE public.user_tenants (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tenant_id)
);

-- 4. Tabela de Departamentos/Setores (Estrutura Organizacional)
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    code TEXT, -- ex: "1", "1.1", "2", "2.1"
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Adicionar a restrição de chave estrangeira de departamento nos profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

-- 5. Tabela de Indicadores (Metas e Acompanhamento)
CREATE TABLE public.indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT '%' CHECK (unit IN ('%', 'R$', 'qtd', 'horas', 'outros')),
    target NUMERIC NOT NULL,
    year INTEGER NOT NULL DEFAULT extract(year from now()),
    measurements JSONB DEFAULT '[]'::jsonb NOT NULL, -- Ex: [{"month": 1, "value": 85}, {"month": 2, "value": 90}]
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Tabela de Planos de Ação (Ações Corretivas/Melhorias)
CREATE TABLE public.action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'atrasado', 'cancelado')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Tabela de Reuniões (Agenda)
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    participants JSONB DEFAULT '[]'::jsonb NOT NULL, -- Lista de IDs de profiles
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Tabela de Atas de Reuniões
CREATE TABLE public.meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT, -- Resumo ou insights gerados por IA
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;

-- 9. Funções auxiliares livres de recursão para obter dados do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função genérica para validar acesso ao tenant
CREATE OR REPLACE FUNCTION public.user_has_access_to_tenant(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_tenant UUID;
    has_rel BOOLEAN;
BEGIN
    user_tenant := public.get_user_tenant();
    user_role := public.get_user_role();

    -- Se for admin global, tem acesso a tudo
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- Se for o tenant principal do usuário
    IF user_tenant = target_tenant_id THEN
        RETURN TRUE;
    END IF;

    -- Verificar na tabela de associação de múltiplos tenants (para consultores)
    SELECT EXISTS (
        SELECT 1 FROM public.user_tenants
        WHERE user_id = auth.uid() AND tenant_id = target_tenant_id
    ) INTO has_rel;

    RETURN has_rel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Políticas de Segurança (RLS)

-- Perfis (Profiles)
CREATE POLICY "Permitir leitura de perfis da mesma empresa" ON public.profiles
    FOR SELECT USING (tenant_id = public.get_user_tenant());

CREATE POLICY "Permitir update no próprio perfil" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins podem gerenciar perfis da mesma empresa" ON public.profiles
    FOR ALL USING (
        tenant_id = public.get_user_tenant() AND 
        public.get_user_role() IN ('admin', 'consultor')
    );

-- Tenants
CREATE POLICY "Permitir ver dados das suas empresas" ON public.tenants
    FOR SELECT USING (public.user_has_access_to_tenant(id));

CREATE POLICY "Admins podem atualizar dados da sua empresa" ON public.tenants
    FOR UPDATE USING (
        public.user_has_access_to_tenant(id) AND 
        public.get_user_role() IN ('admin', 'consultor')
    );

-- User Tenants
CREATE POLICY "Permitir ver associações de tenants" ON public.user_tenants
    FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- Departamentos
CREATE POLICY "Controle por tenant nos departamentos" ON public.departments
    FOR ALL USING (public.user_has_access_to_tenant(tenant_id));

-- Indicadores
CREATE POLICY "Controle por tenant nos indicadores" ON public.indicators
    FOR ALL USING (public.user_has_access_to_tenant(tenant_id));

-- Planos de Ação
CREATE POLICY "Controle por tenant nos planos de ação" ON public.action_plans
    FOR ALL USING (public.user_has_access_to_tenant(tenant_id));

-- Reuniões
CREATE POLICY "Controle por tenant nas reuniões" ON public.meetings
    FOR ALL USING (public.user_has_access_to_tenant(tenant_id));

-- Atas
CREATE POLICY "Controle por tenant nas atas" ON public.meeting_minutes
    FOR ALL USING (public.user_has_access_to_tenant(tenant_id));


-- 11. Gatilho (Trigger) para criar perfil automaticamente no SignUp do auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Se não houver tenants cadastrados, cria um tenant padrão "Senda Consultoria"
    SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name, mission, vision, values, purpose)
        VALUES (
            'Senda Consultoria',
            'Contribuir para a evolução e prosperidade das empresas, das pessoas e da sociedade.',
            'Ser a melhor empresa de consultoria do Brasil.',
            'Ética, transparência, foco em resultados e qualidade.',
            'Se a melhor empresa de consultoria do Brasil'
        ) RETURNING id INTO default_tenant_id;
    END IF;

    -- Inserir perfil
    INSERT INTO public.profiles (id, tenant_id, email, name, role)
    VALUES (
        new.id,
        default_tenant_id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'colaborador')
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger de signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
