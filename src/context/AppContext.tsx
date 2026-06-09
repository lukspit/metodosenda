'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Interfaces dos Modelos de Dados
export interface Tenant {
  id: string;
  name: string;
  mission?: string;
  vision?: string;
  values?: string;
  purpose?: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'consultor' | 'colaborador';
  department_id?: string;
}

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  parent_id: string | null;
  manager_id: string | null;
  manager_name?: string; // Cache local para exibir fácil
  code?: string;
}

export interface Indicator {
  id: string;
  tenant_id: string;
  department_id: string | null;
  name: string;
  description?: string;
  unit: '%' | 'R$' | 'qtd' | 'horas' | 'outros';
  target: number;
  year: number;
  measurements: { month: number; value: number }[];
}

export interface ActionPlan {
  id: string;
  tenant_id: string;
  department_id: string | null;
  name: string;
  description?: string;
  due_date: string;
  responsible_id: string | null;
  responsible_name?: string; // Cache local
  approver_id: string | null;
  approver_name?: string; // Cache local
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado' | 'cancelado';
  progress: number;
}

export interface Meeting {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  department_id: string | null;
  participants: string[];
}

export interface MeetingMinute {
  id: string;
  tenant_id: string;
  meeting_id: string | null;
  title: string;
  content: string;
  summary?: string;
  created_at: string;
}

interface AppContextProps {
  loading: boolean;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
  profiles: Profile[];
  currentProfile: Profile | null;
  departments: Department[];
  indicators: Indicator[];
  actionPlans: ActionPlan[];
  meetings: Meeting[];
  meetingMinutes: MeetingMinute[];
  refreshData: () => Promise<void>;
  createDepartment: (dept: Partial<Department>) => Promise<boolean>;
  updateDepartment: (id: string, dept: Partial<Department>) => Promise<boolean>;
  deleteDepartment: (id: string) => Promise<boolean>;
  createIndicator: (ind: Partial<Indicator>) => Promise<boolean>;
  updateIndicator: (id: string, ind: Partial<Indicator>) => Promise<boolean>;
  deleteIndicator: (id: string) => Promise<boolean>;
  createActionPlan: (plan: Partial<ActionPlan>) => Promise<boolean>;
  updateActionPlan: (id: string, plan: Partial<ActionPlan>) => Promise<boolean>;
  deleteActionPlan: (id: string) => Promise<boolean>;
  createMeeting: (meet: Partial<Meeting>) => Promise<boolean>;
  createMeetingMinute: (minute: Partial<MeetingMinute>) => Promise<boolean>;
  updateActionPlanStatus: (id: string, status: ActionPlan['status'], progress: number) => Promise<boolean>;
  updateTenantCulture: (culture: { mission?: string; vision?: string; values?: string; purpose?: string }) => Promise<boolean>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Dados Fictícios (Mocks) para Demonstração Inicial / Fallback
const MOCK_TENANTS: Tenant[] = [
  {
    id: 't-senda',
    name: 'Senda Consultoria',
    mission: 'Contribuir para a evolução e prosperidade das empresas, das pessoas e da sociedade.',
    vision: 'Ser a melhor empresa de consultoria de gestão estratégica do Brasil.',
    values: 'Somos do bem e queremos fazer as coisas certas da maneira certa. Somos caprichosos e procuramos fazer tudo da melhor forma. Somos responsáveis e cumprimos com nossa palavra e compromissos assumidos.',
    purpose: 'Se a melhor empresa de consultoria do Brasil.'
  },
  {
    id: 't-cliente-a',
    name: 'Operação Comercial Ltda',
    mission: 'Fornecer serviços de venda e logística de alto nível nacional.',
    vision: 'Consolidar-se como a maior distribuidora do Sul do país até 2028.',
    values: 'Foco no cliente, agilidade, comprometimento e segurança.',
    purpose: 'Facilitar a conexão comercial entre fornecedores e varejistas.'
  }
];

const MOCK_PROFILES: Profile[] = [
  { id: 'u-paulo', tenant_id: 't-senda', email: 'paulo@sendaconsultoria.com.br', name: 'Paulo Pit', role: 'admin' },
  { id: 'u-lucas', tenant_id: 't-senda', email: 'lucas@sendaconsultoria.com.br', name: 'Lucas Garcia Pit', role: 'consultor' },
  { id: 'u-fabricio', tenant_id: 't-senda', email: 'fabricio@sendaconsultoria.com.br', name: 'Fabricio Vendas', role: 'colaborador' },
  { id: 'u-solano', tenant_id: 't-senda', email: 'solano@sendaconsultoria.com.br', name: 'Solano Operação', role: 'colaborador' },
  { id: 'u-gessica', tenant_id: 't-senda', email: 'gessica@sendaconsultoria.com.br', name: 'Gessica Financeiro', role: 'colaborador' },
  { id: 'u-ieda', tenant_id: 't-senda', email: 'ieda@sendaconsultoria.com.br', name: 'Ieda TI', role: 'colaborador' }
];

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd-senda', tenant_id: 't-senda', name: 'SENDA', parent_id: null, manager_id: 'u-paulo', code: '0' },
  { id: 'd-comercial', tenant_id: 't-senda', name: '1-COMERCIAL', parent_id: 'd-senda', manager_id: 'u-paulo', code: '1' },
  { id: 'd-vendas', tenant_id: 't-senda', name: '1.1-VENDAS', parent_id: 'd-comercial', manager_id: 'u-fabricio', code: '1.1' },
  { id: 'd-operacao', tenant_id: 't-senda', name: '2-OPERAÇÃO', parent_id: 'd-senda', manager_id: 'u-solano', code: '2' },
  { id: 'd-op-exec', tenant_id: 't-senda', name: '2.1-OPERAÇÃO', parent_id: 'd-operacao', manager_id: 'u-solano', code: '2.1' },
  { id: 'd-admin', tenant_id: 't-senda', name: '3-ADMINISTRATIVO', parent_id: 'd-senda', manager_id: 'u-paulo', code: '3' },
  { id: 'd-financeiro', tenant_id: 't-senda', name: '3.1-FINANCEIRO', parent_id: 'd-admin', manager_id: 'u-gessica', code: '3.1' },
  { id: 'd-ti', tenant_id: 't-senda', name: '4-TI', parent_id: 'd-senda', manager_id: 'u-ieda', code: '4' }
];

const MOCK_INDICATORS: Indicator[] = [
  {
    id: 'i-nps',
    tenant_id: 't-senda',
    department_id: 'd-comercial',
    name: 'NPS Geral (Satisfação)',
    description: 'NPS mensal apurado com os clientes das consultorias ativas.',
    unit: '%',
    target: 85,
    year: 2026,
    measurements: [
      { month: 1, value: 80 },
      { month: 2, value: 82 },
      { month: 3, value: 86 },
      { month: 4, value: 84 },
      { month: 5, value: 88 }
    ]
  },
  {
    id: 'i-faturamento',
    tenant_id: 't-senda',
    department_id: 'd-financeiro',
    name: 'Faturamento Mensal',
    description: 'Total de receita de contratos faturada e recebida no mês.',
    unit: 'R$',
    target: 250000,
    year: 2026,
    measurements: [
      { month: 1, value: 210000 },
      { month: 2, value: 240000 },
      { month: 3, value: 255000 },
      { month: 4, value: 248000 },
      { month: 5, value: 270000 }
    ]
  },
  {
    id: 'i-sla',
    tenant_id: 't-senda',
    department_id: 'd-ti',
    name: 'SLA de Atendimento Interno',
    description: 'Tempo médio de resolução de chamados de suporte dos consultores.',
    unit: '%',
    target: 95,
    year: 2026,
    measurements: [
      { month: 1, value: 92 },
      { month: 2, value: 94 },
      { month: 3, value: 96 },
      { month: 4, value: 95 },
      { month: 5, value: 97 }
    ]
  }
];

const MOCK_ACTION_PLANS: ActionPlan[] = [
  {
    id: 'ap-1',
    tenant_id: 't-senda',
    department_id: 'd-vendas',
    name: 'Revisar Script de Abordagem Comercial',
    description: 'Melhorar o roteiro de ligação fria dos vendedores com novas copys.',
    due_date: '2026-06-25',
    responsible_id: 'u-fabricio',
    approver_id: 'u-paulo',
    status: 'em_andamento',
    progress: 45
  },
  {
    id: 'ap-2',
    tenant_id: 't-senda',
    department_id: 'd-ti',
    name: 'Migração do Banco de Dados para Produção',
    description: 'Mapear e migrar a estrutura de RLS e schemas finais para o Supabase principal.',
    due_date: '2026-06-30',
    responsible_id: 'u-ieda',
    approver_id: 'u-solano',
    status: 'pendente',
    progress: 10
  },
  {
    id: 'ap-3',
    tenant_id: 't-senda',
    department_id: 'd-financeiro',
    name: 'Fechamento Contábil Trimestral',
    description: 'Finalizar relatório de conciliação de contas para auditoria externa.',
    due_date: '2026-06-10',
    responsible_id: 'u-gessica',
    approver_id: 'u-paulo',
    status: 'atrasado',
    progress: 80
  },
  {
    id: 'ap-4',
    tenant_id: 't-senda',
    department_id: 'd-comercial',
    name: 'Renovação do Contrato com Cliente Platinum',
    description: 'Assinatura e aditivo de contrato para mais 12 meses de consultoria.',
    due_date: '2026-06-05',
    responsible_id: 'u-paulo',
    approver_id: 'u-paulo',
    status: 'concluido',
    progress: 100
  }
];

const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'm-1',
    tenant_id: 't-senda',
    title: 'Alinhamento Semanal de Consultoria',
    description: 'Reunião de status dos planos de ação gerais.',
    start_time: '2026-06-08T10:00:00.000Z',
    end_time: '2026-06-08T11:00:00.000Z',
    department_id: 'd-senda',
    participants: ['u-paulo', 'u-lucas', 'u-fabricio']
  },
  {
    id: 'm-2',
    tenant_id: 't-senda',
    title: 'Revisão Mensal de Metas (Q2)',
    description: 'Análise detalhada do atingimento dos indicadores comerciais e de operação.',
    start_time: '2026-06-12T14:00:00.000Z',
    end_time: '2026-06-12T15:30:00.000Z',
    department_id: 'd-senda',
    participants: ['u-paulo', 'u-lucas', 'u-solano', 'u-gessica']
  }
];

const MOCK_MINUTES: MeetingMinute[] = [
  {
    id: 'min-1',
    tenant_id: 't-senda',
    meeting_id: 'm-1',
    title: 'Ata da Reunião de Alinhamento Semanal',
    content: `Aos oito dias do mês de junho de 2026, reuniram-se Paulo, Lucas e Fabricio para alinhar as prioridades.
Decidimos que:
1. Fabricio precisa finalizar a revisão do roteiro comercial até o dia 25 de Junho. Paulo fará a validação final.
2. A migração técnica liderada por Ieda deve ser finalizada até o fim deste mês, com supervisão do Solano.
3. Precisamos adiantar a renovação do cliente Platinum, Paulo já cuidou da assinatura.`,
    summary: `### Resumo da Reunião - 08/06/2026
- **Comercial**: Fabricio está encarregado de revisar o roteiro comercial até 25/06 com aprovação de Paulo.
- **TI**: Ieda liderará a migração técnica de banco de dados com prazo para 30/06 sob supervisão de Solano.
- **Renovação**: Paulo concluiu a renovação de contrato do Cliente Platinum.`,
    created_at: '2026-06-08T12:00:00.000Z'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // Estados dos dados vinculados ao Tenant ativo
  const [departments, setDepartments] = useState<Department[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>([]);

  // Carregar dados (Real do Supabase ou Mock como Fallback)
  const refreshData = async () => {
    if (!currentTenant) return;
    setLoading(true);

    try {
      // 1. Tentar carregar Profiles
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      let activeProfiles = MOCK_PROFILES.filter(p => p.tenant_id === currentTenant.id);
      if (!profError && profData && profData.length > 0) {
        setProfiles(profData);
        activeProfiles = profData;
      } else {
        setProfiles(MOCK_PROFILES);
      }

      // 2. Tentar carregar Departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (!deptError && deptData && deptData.length > 0) {
        const loadedDepts = deptData.map(d => ({
          ...d,
          manager_name: activeProfiles.find(p => p.id === d.manager_id)?.name || 'Sem responsável'
        }));
        setDepartments(loadedDepts);
      } else {
        // Fallback Mock
        const mockFilteredDepts = MOCK_DEPARTMENTS.filter(d => d.tenant_id === currentTenant.id).map(d => ({
          ...d,
          manager_name: MOCK_PROFILES.find(p => p.id === d.manager_id)?.name || 'Sem responsável'
        }));
        setDepartments(mockFilteredDepts);
      }

      // 3. Tentar carregar Indicadores
      const { data: indData, error: indError } = await supabase
        .from('indicators')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (!indError && indData && indData.length > 0) {
        setIndicators(indData);
      } else {
        setIndicators(MOCK_INDICATORS.filter(i => i.tenant_id === currentTenant.id));
      }

      // 4. Tentar carregar Planos de Ação
      const { data: planData, error: planError } = await supabase
        .from('action_plans')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (!planError && planData && planData.length > 0) {
        setActionPlans(planData.map(p => ({
          ...p,
          responsible_name: activeProfiles.find(ap => ap.id === p.responsible_id)?.name || 'Não atribuído',
          approver_name: activeProfiles.find(ap => ap.id === p.approver_id)?.name || 'Não atribuído'
        })));
      } else {
        setActionPlans(MOCK_ACTION_PLANS.filter(ap => ap.tenant_id === currentTenant.id).map(p => ({
          ...p,
          responsible_name: MOCK_PROFILES.find(ap => ap.id === p.responsible_id)?.name || 'Não atribuído',
          approver_name: MOCK_PROFILES.find(ap => ap.id === p.approver_id)?.name || 'Não atribuído'
        })));
      }

      // 5. Reuniões
      const { data: meetData, error: meetError } = await supabase
        .from('meetings')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (!meetError && meetData && meetData.length > 0) {
        setMeetings(meetData);
      } else {
        setMeetings(MOCK_MEETINGS.filter(m => m.tenant_id === currentTenant.id));
      }

      // 6. Atas
      const { data: minData, error: minError } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (!minError && minData && minData.length > 0) {
        setMeetingMinutes(minData);
      } else {
        setMeetingMinutes(MOCK_MINUTES.filter(min => min.tenant_id === currentTenant.id));
      }

    } catch (err) {
      console.warn('Erro ao conectar ao Supabase, carregando modo demonstração local.', err);
      // Fallback geral
      setDepartments(MOCK_DEPARTMENTS.filter(d => d.tenant_id === currentTenant.id).map(d => ({
        ...d,
        manager_name: MOCK_PROFILES.find(p => p.id === d.manager_id)?.name || 'Sem responsável'
      })));
      setIndicators(MOCK_INDICATORS.filter(i => i.tenant_id === currentTenant.id));
      setActionPlans(MOCK_ACTION_PLANS.filter(ap => ap.tenant_id === currentTenant.id).map(p => ({
        ...p,
        responsible_name: MOCK_PROFILES.find(ap => ap.id === p.responsible_id)?.name || 'Não atribuído',
        approver_name: MOCK_PROFILES.find(ap => ap.id === p.approver_id)?.name || 'Não atribuído'
      })));
      setMeetings(MOCK_MEETINGS.filter(m => m.tenant_id === currentTenant.id));
      setMeetingMinutes(MOCK_MINUTES.filter(min => min.tenant_id === currentTenant.id));
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar sessão do usuário e escutar mudanças
  useEffect(() => {
    let activeSubscription: any = null;

    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleSessionChange(session);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          await handleSessionChange(session);
        });
        activeSubscription = subscription;
      } catch (err) {
        console.error('Erro ao inicializar autenticação:', err);
        // Fallback para demonstração local em caso de erro na rede ou chaves
        setCurrentProfile(MOCK_PROFILES[1]); // Lucas
        setCurrentTenantState(MOCK_TENANTS[0]); // Senda
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (activeSubscription) activeSubscription.unsubscribe();
    };
  }, []);

  const handleSessionChange = async (session: any) => {
    if (session?.user) {
      // Carregar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Erro ao carregar perfil do usuário:', profileError);
        // Tentar fallback se for erro do Supabase
        setCurrentProfile({
          id: session.user.id,
          tenant_id: 't-senda',
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário Senda',
          role: 'colaborador'
        });
      } else if (profile) {
        setCurrentProfile(profile);
      }

      const activeProfile = profile || { tenant_id: 't-senda' };

      // Carregar tenant correspondente
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', activeProfile.tenant_id)
        .single();

      if (tenantError) {
        console.error('Erro ao carregar tenant:', tenantError);
        setCurrentTenantState(MOCK_TENANTS[0]);
      } else if (tenant) {
        setCurrentTenantState(tenant);
        
        // Carregar tenants disponíveis
        if (profile?.role === 'admin' || profile?.role === 'consultor') {
          const { data: allTenants } = await supabase.from('tenants').select('*');
          if (allTenants && allTenants.length > 0) {
            setTenants(allTenants);
          } else {
            setTenants([tenant]);
          }
        } else {
          setTenants([tenant]);
        }
      }
    } else {
      setCurrentProfile(null);
      setCurrentTenantState(null);
      setLoading(false);
    }
  };

  // Recarregar dados quando mudar o tenant ativo
  useEffect(() => {
    if (currentTenant) {
      refreshData();
    }
  }, [currentTenant]);

  const setCurrentTenant = (tenant: Tenant) => {
    setCurrentTenantState(tenant);
  };

  // CRUD Departamentos
  const createDepartment = async (dept: Partial<Department>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newDept = {
      tenant_id: currentTenant.id,
      name: dept.name || 'Novo Setor',
      parent_id: dept.parent_id || null,
      manager_id: dept.manager_id || null,
      code: dept.code || ''
    };

    try {
      const { error } = await supabase.from('departments').insert([newDept]);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao criar departamento no Supabase:', err);
      // Fallback local se estiver sem banco
      const managerName = profiles.find(p => p.id === newDept.manager_id)?.name || 'Sem responsável';
      setDepartments(prev => [...prev, { ...newDept, id: `d-${Math.random().toString(36).substr(2, 9)}`, manager_name: managerName }]);
      return true;
    }
  };

  const updateDepartment = async (id: string, dept: Partial<Department>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: dept.name,
          parent_id: dept.parent_id,
          manager_id: dept.manager_id,
          code: dept.code
        })
        .eq('id', id);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar departamento no Supabase:', err);
      // Fallback local
      setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...dept, manager_name: profiles.find(p => p.id === dept.manager_id)?.name || d.manager_name } : d));
      return true;
    }
  };

  const deleteDepartment = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao excluir departamento no Supabase:', err);
      setDepartments(prev => prev.filter(d => d.id !== id));
      return true;
    }
  };

  // CRUD Indicadores
  const createIndicator = async (ind: Partial<Indicator>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newInd = {
      tenant_id: currentTenant.id,
      department_id: ind.department_id || null,
      name: ind.name || 'Novo Indicador',
      description: ind.description || '',
      unit: ind.unit || '%',
      target: ind.target || 0,
      year: ind.year || 2026,
      measurements: ind.measurements || []
    };

    try {
      const { error } = await supabase.from('indicators').insert([newInd]);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao criar indicador no Supabase:', err);
      setIndicators(prev => [...prev, { ...newInd, id: `i-${Math.random().toString(36).substr(2, 9)}` }]);
      return true;
    }
  };

  const updateIndicator = async (id: string, ind: Partial<Indicator>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('indicators')
        .update({
          name: ind.name,
          department_id: ind.department_id,
          description: ind.description,
          unit: ind.unit,
          target: ind.target,
          year: ind.year,
          measurements: ind.measurements
        })
        .eq('id', id);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar indicador no Supabase:', err);
      setIndicators(prev => prev.map(i => i.id === id ? { ...i, ...ind } : i));
      return true;
    }
  };

  const deleteIndicator = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('indicators')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao excluir indicador no Supabase:', err);
      setIndicators(prev => prev.filter(i => i.id !== id));
      return true;
    }
  };

  // CRUD Planos de Ação
  const createActionPlan = async (plan: Partial<ActionPlan>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newPlan = {
      tenant_id: currentTenant.id,
      department_id: plan.department_id || null,
      name: plan.name || 'Novo Plano de Ação',
      description: plan.description || '',
      due_date: plan.due_date || new Date().toISOString().split('T')[0],
      responsible_id: plan.responsible_id || null,
      approver_id: plan.approver_id || null,
      status: plan.status || 'pendente',
      progress: plan.progress || 0
    };

    try {
      const { error } = await supabase.from('action_plans').insert([newPlan]);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao criar plano de ação no Supabase:', err);
      const respName = profiles.find(p => p.id === newPlan.responsible_id)?.name || 'Não atribuído';
      const appName = profiles.find(p => p.id === newPlan.approver_id)?.name || 'Não atribuído';
      setActionPlans(prev => [...prev, { ...newPlan, id: `ap-${Math.random().toString(36).substr(2, 9)}`, responsible_name: respName, approver_name: appName }]);
      return true;
    }
  };

  const updateActionPlan = async (id: string, plan: Partial<ActionPlan>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('action_plans')
        .update({
          name: plan.name,
          description: plan.description,
          due_date: plan.due_date,
          responsible_id: plan.responsible_id,
          approver_id: plan.approver_id,
          department_id: plan.department_id,
          status: plan.status,
          progress: plan.progress
        })
        .eq('id', id);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar plano de ação no Supabase:', err);
      setActionPlans(prev => prev.map(p => p.id === id ? { 
        ...p, 
        ...plan, 
        responsible_name: profiles.find(pr => pr.id === plan.responsible_id)?.name || p.responsible_name,
        approver_name: profiles.find(pr => pr.id === plan.approver_id)?.name || p.approver_name
      } : p));
      return true;
    }
  };

  const deleteActionPlan = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('action_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao excluir plano de ação no Supabase:', err);
      setActionPlans(prev => prev.filter(p => p.id !== id));
      return true;
    }
  };

  const createMeeting = async (meet: Partial<Meeting>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newMeet = {
      tenant_id: currentTenant.id,
      title: meet.title || 'Nova Reunião',
      description: meet.description || '',
      start_time: meet.start_time || new Date().toISOString(),
      end_time: meet.end_time || new Date(Date.now() + 3600000).toISOString(),
      department_id: meet.department_id || null,
      participants: meet.participants || []
    };

    try {
      const { error } = await supabase.from('meetings').insert([newMeet]);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao criar reunião no Supabase:', err);
      setMeetings(prev => [...prev, { ...newMeet, id: `m-${Math.random().toString(36).substr(2, 9)}` }]);
      return true;
    }
  };

  const createMeetingMinute = async (minute: Partial<MeetingMinute>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newMin = {
      tenant_id: currentTenant.id,
      meeting_id: minute.meeting_id || null,
      title: minute.title || 'Nova Ata',
      content: minute.content || '',
      summary: minute.summary || '',
      created_at: minute.created_at || new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('meeting_minutes').insert([newMin]);
      if (error) throw error;
      await refreshData();
      return true;
    } catch (err) {
      console.error('Erro ao criar ata no Supabase:', err);
      setMeetingMinutes(prev => [...prev, { ...newMin, id: `min-${Math.random().toString(36).substr(2, 9)}` }]);
      return true;
    }
  };

  const updateActionPlanStatus = async (id: string, status: ActionPlan['status'], progress: number): Promise<boolean> => {
    return updateActionPlan(id, { status, progress });
  };

  const updateTenantCulture = async (culture: { mission?: string; vision?: string; values?: string; purpose?: string }): Promise<boolean> => {
    if (!currentTenant) return false;
    const updatedTenant = { ...currentTenant, ...culture };

    try {
      const { error } = await supabase
        .from('tenants')
        .update(culture)
        .eq('id', currentTenant.id);
      if (error) throw error;
      setCurrentTenantState(updatedTenant);
      setTenants(prev => prev.map(t => t.id === currentTenant.id ? updatedTenant : t));
      return true;
    } catch (err) {
      console.error('Erro ao atualizar cultura do tenant no Supabase:', err);
      setCurrentTenantState(updatedTenant);
      setTenants(prev => prev.map(t => t.id === currentTenant.id ? updatedTenant : t));
      return true;
    }
  };

  return (
    <AppContext.Provider value={{
      loading,
      tenants,
      currentTenant,
      setCurrentTenant,
      profiles,
      currentProfile,
      departments,
      indicators,
      actionPlans,
      meetings,
      meetingMinutes,
      refreshData,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      createIndicator,
      updateIndicator,
      deleteIndicator,
      createActionPlan,
      updateActionPlan,
      deleteActionPlan,
      createMeeting,
      createMeetingMinute,
      updateActionPlanStatus,
      updateTenantCulture
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
