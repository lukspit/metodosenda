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
  createIndicator: (ind: Partial<Indicator>) => Promise<boolean>;
  createActionPlan: (plan: Partial<ActionPlan>) => Promise<boolean>;
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
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(MOCK_TENANTS[0]);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(MOCK_PROFILES[1]); // Lucas como usuário logado de demonstração

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
      // 1. Tentar carregar Departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      let loadedDepts = [];
      if (!deptError && deptData && deptData.length > 0) {
        loadedDepts = deptData.map(d => ({
          ...d,
          manager_name: profiles.find(p => p.id === d.manager_id)?.name || 'Sem responsável'
        }));
        setDepartments(loadedDepts);
      } else {
        // Fallback Mock
        const mockFilteredDepts = MOCK_DEPARTMENTS.filter(d => d.tenant_id === currentTenant.id).map(d => ({
          ...d,
          manager_name: MOCK_PROFILES.find(p => p.id === d.manager_id)?.name || 'Sem responsável'
        }));
        setDepartments(mockFilteredDepts);
        loadedDepts = mockFilteredDepts;
      }

      // 2. Tentar carregar Indicadores
      const { data: indData, error: indError } = await supabase
        .from('indicators')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (!indError && indData && indData.length > 0) {
        setIndicators(indData);
      } else {
        setIndicators(MOCK_INDICATORS.filter(i => i.tenant_id === currentTenant.id));
      }

      // 3. Tentar carregar Profiles se houver conexão
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      let activeProfiles = profiles;
      if (profData && profData.length > 0) {
        setProfiles(profData);
        activeProfiles = profData;
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
      const { data: meetData } = await supabase
        .from('meetings')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (meetData && meetData.length > 0) {
        setMeetings(meetData);
      } else {
        setMeetings(MOCK_MEETINGS.filter(m => m.tenant_id === currentTenant.id));
      }

      // 6. Atas
      const { data: minData } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (minData && minData.length > 0) {
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

  // Carregar dados no boot do app
  useEffect(() => {
    refreshData();
  }, [currentTenant]);

  const setCurrentTenant = (tenant: Tenant) => {
    setCurrentTenantState(tenant);
  };

  // Funções de Escrita no Banco (com fallback local para interações imediatas)
  const createDepartment = async (dept: Partial<Department>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newDept = {
      id: dept.id || `d-${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: currentTenant.id,
      name: dept.name || 'Novo Setor',
      parent_id: dept.parent_id || null,
      manager_id: dept.manager_id || null,
      code: dept.code || ''
    };

    try {
      const { error } = await supabase.from('departments').insert([newDept]);
      if (error) throw error;
    } catch (err) {
      console.warn('Salvando departamento localmente no modo demonstração.', err);
    }

    // Atualização local
    const managerName = profiles.find(p => p.id === newDept.manager_id)?.name || 
                        profiles.find(p => p.name?.toLowerCase().includes(dept.manager_name?.toLowerCase() || ''))?.name || 
                        dept.manager_name || 'Sem responsável';

    setDepartments(prev => [...prev, { ...newDept, manager_name: managerName }]);
    return true;
  };

  const createIndicator = async (ind: Partial<Indicator>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newInd = {
      id: ind.id || `i-${Math.random().toString(36).substr(2, 9)}`,
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
    } catch (err) {
      console.warn('Salvando indicador localmente no modo demonstração.', err);
    }

    setIndicators(prev => [...prev, newInd]);
    return true;
  };

  const createActionPlan = async (plan: Partial<ActionPlan>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newPlan = {
      id: plan.id || `ap-${Math.random().toString(36).substr(2, 9)}`,
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
    } catch (err) {
      console.warn('Salvando plano de ação localmente no modo demonstração.', err);
    }

    const respName = profiles.find(p => p.id === newPlan.responsible_id)?.name || 'Não atribuído';
    const appName = profiles.find(p => p.id === newPlan.approver_id)?.name || 'Não atribuído';

    setActionPlans(prev => [...prev, { ...newPlan, responsible_name: respName, approver_name: appName }]);
    return true;
  };

  const createMeeting = async (meet: Partial<Meeting>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newMeet = {
      id: meet.id || `m-${Math.random().toString(36).substr(2, 9)}`,
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
    } catch (err) {
      console.warn('Salvando reunião localmente no modo demonstração.', err);
    }

    setMeetings(prev => [...prev, newMeet]);
    return true;
  };

  const createMeetingMinute = async (minute: Partial<MeetingMinute>): Promise<boolean> => {
    if (!currentTenant) return false;
    const newMin = {
      id: minute.id || `min-${Math.random().toString(36).substr(2, 9)}`,
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
    } catch (err) {
      console.warn('Salvando ata localmente no modo demonstração.', err);
    }

    setMeetingMinutes(prev => [...prev, newMin]);
    return true;
  };

  const updateActionPlanStatus = async (id: string, status: ActionPlan['status'], progress: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('action_plans')
        .update({ status, progress })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Atualizando plano de ação localmente.', err);
    }

    setActionPlans(prev => prev.map(p => p.id === id ? { ...p, status, progress } : p));
    return true;
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
    } catch (err) {
      console.warn('Atualizando cultura do tenant localmente.', err);
    }

    setCurrentTenantState(updatedTenant);
    setTenants(prev => prev.map(t => t.id === currentTenant.id ? updatedTenant : t));
    return true;
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
      createIndicator,
      createActionPlan,
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
