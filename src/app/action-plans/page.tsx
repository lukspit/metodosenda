'use client';

import React, { useState } from 'react';
import { useApp, ActionPlan, ActionPlanObjective, ActionPlanAction } from '../../context/AppContext';
import { SmartInput } from '../../components/SmartInput';
import { 
  Target, 
  Sparkles, 
  CalendarDays, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  DollarSign,
  FolderOpen,
  ClipboardList
} from 'lucide-react';

export default function ActionPlansPage() {
  const { 
    actionPlans, 
    profiles, 
    departments, 
    createActionPlan, 
    updateActionPlan, 
    deleteActionPlan,
    updateActionPlanStatus 
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResp, setFilterResp] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');

  // Plano de Ação ativo/selecionado para visualização de objetivos
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // Controle de accordions abertos (objetivos)
  const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Campos do Formulário do Plano
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planDueDate, setPlanDueDate] = useState('');
  const [planRespId, setPlanRespId] = useState('');
  const [planApprId, setPlanApprId] = useState('');
  const [planDeptId, setPlanDeptId] = useState('');
  const [planStatus, setPlanStatus] = useState<ActionPlan['status']>('pendente');
  const [planProgress, setPlanProgress] = useState(0);

  // Modal de Objetivo
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<ActionPlanObjective | null>(null);
  const [objName, setObjName] = useState('');
  const [objDueDate, setObjDueDate] = useState('');
  const [objRespId, setObjRespId] = useState('');

  // Modal de Ação
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionPlanAction | null>(null);
  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null);
  const [actName, setActName] = useState('');
  const [actDueDate, setActDueDate] = useState('');
  const [actRespId, setActRespId] = useState('');
  const [actCost, setActCost] = useState<number>(0);
  const [actStatus, setActStatus] = useState<'OK' | 'ANDAMENTO'>('ANDAMENTO');

  // Callback ao criar plano via IA
  const handleAISuccess = async (result: any): Promise<boolean> => {
    if (result.action === 'create' && result.data) {
      const { name, description, due_date, responsible_id, approver_id, department_id } = result.data;
      
      const success = await createActionPlan({
        name,
        description,
        due_date,
        responsible_id: responsible_id || null,
        approver_id: approver_id || null,
        department_id: department_id || null,
        status: 'pendente',
        progress: 0,
        objectives: []
      });

      return success;
    }
    return false;
  };

  // Funções de Cálculo Auxiliares
  const calculateObjectiveProgress = (objective: ActionPlanObjective): number => {
    if (!objective.actions || objective.actions.length === 0) {
      return objective.status === 'OK' ? 100 : 0;
    }
    const completedActions = objective.actions.filter(a => a.status === 'OK').length;
    return Math.round((completedActions / objective.actions.length) * 100);
  };

  const calculatePlanProgress = (objectives: ActionPlanObjective[]): number => {
    if (!objectives || objectives.length === 0) {
      return 0;
    }
    const sumProgress = objectives.reduce((sum, obj) => {
      return sum + calculateObjectiveProgress(obj);
    }, 0);
    return Math.round(sumProgress / objectives.length);
  };

  const getPlanStatusFromProgress = (progress: number, dueDate: string): ActionPlan['status'] => {
    if (progress === 100) return 'concluido';
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) return 'atrasado';
    if (progress > 0) return 'em_andamento';
    return 'pendente';
  };

  // Resumo financeiro e progresso do Plano
  const getPlanSummary = (plan: ActionPlan) => {
    const objectives = plan.objectives || [];
    const totalObjectives = objectives.length;
    
    let totalActions = 0;
    let completedActions = 0;
    let totalCost = 0;

    objectives.forEach(obj => {
      const actions = obj.actions || [];
      totalActions += actions.length;
      completedActions += actions.filter(a => a.status === 'OK').length;
      totalCost += actions.reduce((sum, act) => sum + (act.cost || 0), 0);
    });

    const isCalculated = totalObjectives > 0;
    const progressVal = isCalculated ? calculatePlanProgress(objectives) : plan.progress;
    const computedStatus = isCalculated ? getPlanStatusFromProgress(progressVal, plan.due_date) : plan.status;

    return {
      totalObjectives,
      totalActions,
      completedActions,
      totalCost,
      progressVal,
      computedStatus,
      isCalculated
    };
  };

  // Resumo financeiro do Objetivo
  const getObjectiveSummary = (objective: ActionPlanObjective) => {
    const actions = objective.actions || [];
    const totalActions = actions.length;
    const completedActions = actions.filter(a => a.status === 'OK').length;
    const totalCost = actions.reduce((sum, act) => sum + (act.cost || 0), 0);
    const progressVal = calculateObjectiveProgress(objective);

    return {
      totalActions,
      completedActions,
      totalCost,
      progressVal
    };
  };

  // Atualizar progresso manual (somente se não tiver objetivos)
  const handleProgressChange = (id: string, progress: number, currentStatus: ActionPlan['status']) => {
    let newStatus = currentStatus;
    if (progress === 100) {
      newStatus = 'concluido';
    } else if (progress > 0 && currentStatus === 'pendente') {
      newStatus = 'em_andamento';
    }
    updateActionPlanStatus(id, newStatus, progress);
  };

  // Atualizar status diretamente (somente se não tiver objetivos)
  const handleStatusClick = (id: string, status: ActionPlan['status']) => {
    const progress = status === 'concluido' ? 100 : status === 'pendente' ? 0 : 50;
    updateActionPlanStatus(id, status, progress);
  };

  // Handlers do Modal do Plano de Ação
  const handleCreateClick = () => {
    setSelectedPlan(null);
    setPlanName('');
    setPlanDescription('');
    setPlanDueDate(new Date().toISOString().split('T')[0]);
    setPlanRespId('');
    setPlanApprId('');
    setPlanDeptId('');
    setPlanStatus('pendente');
    setPlanProgress(0);
    setIsModalOpen(true);
  };

  const handleEditClick = (plan: ActionPlan) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setPlanDueDate(plan.due_date);
    setPlanRespId(plan.responsible_id || '');
    setPlanApprId(plan.approver_id || '');
    setPlanDeptId(plan.department_id || '');
    setPlanStatus(plan.status);
    setPlanProgress(plan.progress);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o plano de ação "${name}"?`);
    if (confirm) {
      const success = await deleteActionPlan(id);
      if (success && activePlanId === id) {
        setActivePlanId(null);
      }
    }
  };

  // Salvar Plano de Ação
  const handleSaveActionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planDueDate) return;

    setModalLoading(true);
    let success = false;

    if (selectedPlan) {
      const dataPayload = {
        name: planName,
        description: planDescription,
        due_date: planDueDate,
        responsible_id: planRespId || null,
        approver_id: planApprId || null,
        department_id: planDeptId || null,
        status: planStatus,
        progress: planProgress,
        objectives: selectedPlan.objectives || []
      };
      success = await updateActionPlan(selectedPlan.id, dataPayload);
    } else {
      const dataPayload = {
        name: planName,
        description: planDescription,
        due_date: planDueDate,
        responsible_id: planRespId || null,
        approver_id: planApprId || null,
        department_id: planDeptId || null,
        status: 'pendente' as const,
        progress: 0,
        objectives: []
      };
      success = await createActionPlan(dataPayload);
    }

    setModalLoading(false);
    if (success) {
      setIsModalOpen(false);
      setSelectedPlan(null);
    } else {
      alert('Erro ao salvar o plano de ação.');
    }
  };

  // Persistir Objetivos / Ações no Supabase
  const handleUpdateObjectives = async (planId: string, updatedObjectives: ActionPlanObjective[]) => {
    const originalPlan = actionPlans.find(p => p.id === planId);
    if (!originalPlan) return;

    const progress = calculatePlanProgress(updatedObjectives);
    const status = getPlanStatusFromProgress(progress, originalPlan.due_date);

    const success = await updateActionPlan(planId, {
      objectives: updatedObjectives,
      progress,
      status
    });

    if (!success) {
      alert('Erro ao atualizar no banco de dados.');
    }
  };

  // Modal Objetivo
  const handleCreateObjectiveClick = () => {
    setSelectedObjective(null);
    setObjName('');
    setObjDueDate(new Date().toISOString().split('T')[0]);
    setObjRespId('');
    setIsObjectiveModalOpen(true);
  };

  const handleEditObjectiveClick = (objective: ActionPlanObjective) => {
    setSelectedObjective(objective);
    setObjName(objective.name);
    setObjDueDate(objective.due_date);
    setObjRespId(objective.responsible_id || '');
    setIsObjectiveModalOpen(true);
  };

  const handleDeleteObjectiveClick = async (objectiveId: string, name: string) => {
    if (!activePlanId) return;
    const confirm = window.confirm(`Tem certeza que deseja excluir o objetivo "${name}" e todas as suas ações?`);
    if (!confirm) return;

    const activePlan = actionPlans.find(p => p.id === activePlanId);
    if (!activePlan) return;

    const currentObjectives = activePlan.objectives || [];
    const updatedObjectives = currentObjectives.filter(obj => obj.id !== objectiveId);

    await handleUpdateObjectives(activePlanId, updatedObjectives);
  };

  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlanId || !objName.trim() || !objDueDate) return;

    const activePlan = actionPlans.find(p => p.id === activePlanId);
    if (!activePlan) return;

    const currentObjectives = activePlan.objectives || [];
    let updatedObjectives: ActionPlanObjective[];

    if (selectedObjective) {
      updatedObjectives = currentObjectives.map(obj => {
        if (obj.id === selectedObjective.id) {
          return {
            ...obj,
            name: objName,
            due_date: objDueDate,
            responsible_id: objRespId || null,
          };
        }
        return obj;
      });
    } else {
      const newObjective: ActionPlanObjective = {
        id: `obj-${Date.now()}`,
        name: objName,
        due_date: objDueDate,
        responsible_id: objRespId || null,
        status: 'ANDAMENTO',
        actions: []
      };
      updatedObjectives = [...currentObjectives, newObjective];
    }

    await handleUpdateObjectives(activePlanId, updatedObjectives);
    setIsObjectiveModalOpen(false);
    setSelectedObjective(null);
  };

  // Modal Ação
  const handleCreateActionClick = (objectiveId: string) => {
    setActiveObjectiveId(objectiveId);
    setSelectedAction(null);
    setActName('');
    setActDueDate(new Date().toISOString().split('T')[0]);
    setActRespId('');
    setActCost(0);
    setActStatus('ANDAMENTO');
    setIsActionModalOpen(true);
  };

  const handleEditActionClick = (objectiveId: string, action: ActionPlanAction) => {
    setActiveObjectiveId(objectiveId);
    setSelectedAction(action);
    setActName(action.name);
    setActDueDate(action.due_date);
    setActRespId(action.responsible_id || '');
    setActCost(action.cost);
    setActStatus(action.status);
    setIsActionModalOpen(true);
  };

  const handleDeleteActionClick = async (objectiveId: string, actionId: string, name: string) => {
    if (!activePlanId) return;
    const confirm = window.confirm(`Tem certeza que deseja excluir a ação "${name}"?`);
    if (!confirm) return;

    const activePlan = actionPlans.find(p => p.id === activePlanId);
    if (!activePlan) return;

    const currentObjectives = activePlan.objectives || [];
    const updatedObjectives = currentObjectives.map(obj => {
      if (obj.id === objectiveId) {
        const updatedActions = obj.actions.filter(act => act.id !== actionId);
        const completedActions = updatedActions.filter(a => a.status === 'OK').length;
        const allCompleted = completedActions === updatedActions.length && updatedActions.length > 0;
        const status: 'OK' | 'ANDAMENTO' = allCompleted ? 'OK' : 'ANDAMENTO';

        return {
          ...obj,
          actions: updatedActions,
          status
        };
      }
      return obj;
    });

    await handleUpdateObjectives(activePlanId, updatedObjectives);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlanId || !activeObjectiveId || !actName.trim() || !actDueDate) return;

    const activePlan = actionPlans.find(p => p.id === activePlanId);
    if (!activePlan) return;

    const currentObjectives = activePlan.objectives || [];
    const updatedObjectives = currentObjectives.map(obj => {
      if (obj.id === activeObjectiveId) {
        let updatedActions: ActionPlanAction[];
        if (selectedAction) {
          updatedActions = obj.actions.map(act => {
            if (act.id === selectedAction.id) {
              return {
                ...act,
                name: actName,
                due_date: actDueDate,
                responsible_id: actRespId || null,
                cost: Number(actCost),
                status: actStatus
              };
            }
            return act;
          });
        } else {
          const newAction: ActionPlanAction = {
            id: `act-${Date.now()}`,
            name: actName,
            due_date: actDueDate,
            responsible_id: actRespId || null,
            cost: Number(actCost),
            status: actStatus
          };
          updatedActions = [...obj.actions, newAction];
        }

        const completedActions = updatedActions.filter(a => a.status === 'OK').length;
        const allCompleted = completedActions === updatedActions.length && updatedActions.length > 0;
        const status: 'OK' | 'ANDAMENTO' = allCompleted ? 'OK' : 'ANDAMENTO';

        return {
          ...obj,
          actions: updatedActions,
          status
        };
      }
      return obj;
    });

    await handleUpdateObjectives(activePlanId, updatedObjectives);
    setIsActionModalOpen(false);
    setSelectedAction(null);
  };

  // Alternar conclusão rápida da ação
  const handleToggleActionStatus = async (objectiveId: string, actionId: string) => {
    if (!activePlanId) return;

    const activePlan = actionPlans.find(p => p.id === activePlanId);
    if (!activePlan) return;

    const currentObjectives = activePlan.objectives || [];
    const updatedObjectives = currentObjectives.map(obj => {
      if (obj.id === objectiveId) {
        const updatedActions = obj.actions.map(act => {
          if (act.id === actionId) {
            return {
              ...act,
              status: (act.status === 'OK' ? 'ANDAMENTO' : 'OK') as 'OK' | 'ANDAMENTO'
            };
          }
          return act;
        });

        const completedActions = updatedActions.filter(a => a.status === 'OK').length;
        const allCompleted = completedActions === updatedActions.length && updatedActions.length > 0;
        const status: 'OK' | 'ANDAMENTO' = allCompleted ? 'OK' : 'ANDAMENTO';

        return {
          ...obj,
          actions: updatedActions,
          status
        };
      }
      return obj;
    });

    await handleUpdateObjectives(activePlanId, updatedObjectives);
  };

  const toggleObjectiveExpand = (id: string) => {
    setExpandedObjectives(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtros
  const filteredPlans = actionPlans.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesResp = filterResp === 'all' || p.responsible_id === filterResp;
    const matchesSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesResp && matchesSearch;
  });

  const getStatusStyle = (status: ActionPlan['status']) => {
    switch(status) {
      case 'concluido':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'em_andamento':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'atrasado':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getObjectiveStatusStyle = (status: 'OK' | 'ANDAMENTO', hasAtraso: boolean = false) => {
    if (status === 'OK') {
      return 'bg-emerald-50 text-emerald-600 border-emerald-150';
    }
    if (hasAtraso) {
      return 'bg-rose-50 text-rose-600 border-rose-150';
    }
    return 'bg-blue-50 text-blue-600 border-blue-150';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const selectedActivePlan = actionPlans.find(p => p.id === activePlanId);
  const activePlanSummary = selectedActivePlan ? getPlanSummary(selectedActivePlan) : null;

  const suggestions = [
    'Criar plano para Fabricio revisar roteiro comercial até sexta-feira com aprovação de Paulo',
    'Adicionar ação para Ieda corrigir bug do banco de dados até dia 20 de Junho',
    'Adicionar plano para Gessica consolidar contas mensais até segunda-feira'
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      
      {!selectedActivePlan ? (
        // ================= TELA 1: LISTAGEM DE PLANOS DE AÇÃO =================
        <>
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Planos de Ação</h1>
              <p className="text-sm text-slate-500 mt-1">Controle e andamento das metas, objetivos e ações estratégicas.</p>
            </div>

            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 bg-[#1E2538] hover:bg-[#2c3752] text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow self-start sm:self-auto transition-colors"
            >
              <Plus className="w-4 h-4 text-[#C5A85A]" />
              Novo Plano de Ação
            </button>
          </div>

          {/* Input de IA Contextual */}
          <SmartInput
            context="action_plans"
            placeholder="Escreva ou fale o plano de ação... (ex: 'Adicionar plano para Fabricio ajustar as metas de vendas até sexta-feira')"
            onSuccess={handleAISuccess}
            existingData={{ departments, profiles }}
            suggestions={suggestions}
          />

          {/* Filtros */}
          <div className="bg-white p-5 rounded-lg border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Filtrar por nome ou descrição..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="bg-slate-50 text-xs text-slate-700 border border-slate-200 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] w-full md:w-64"
            />

            <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-50 text-xs text-slate-750 border border-slate-200 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="atrasado">Atrasado</option>
              </select>

              <select
                value={filterResp}
                onChange={e => setFilterResp(e.target.value)}
                className="bg-slate-50 text-xs text-slate-755 border border-slate-200 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
              >
                <option value="all">Qualquer Responsável</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de Planos de Ação */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => {
                const deptName = departments.find(d => d.id === plan.department_id)?.name || 'Geral';
                const { 
                  totalObjectives, 
                  totalCost, 
                  progressVal, 
                  computedStatus, 
                  isCalculated 
                } = getPlanSummary(plan);
                
                const responsible = profiles.find(p => p.id === plan.responsible_id)?.name || 'Sem responsável';

                return (
                  <div 
                    key={plan.id}
                    onClick={() => setActivePlanId(plan.id)}
                    className="bg-white rounded-lg p-4 md:p-5 border border-slate-200/60 shadow-sm cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md hover:border-[#C5A85A]/50 transition-all duration-200 relative group border-l-4 border-l-transparent"
                  >
                    {/* Botões Rápidos de Editar/Excluir */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/95 p-1 rounded border border-slate-100 shadow-sm" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditClick(plan)}
                        className="p-1 rounded hover:bg-slate-150 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Editar Plano de Ação"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(plan.id, plan.name)}
                        className="p-1 rounded hover:bg-rose-50 text-rose-500 transition-colors"
                        title="Excluir Plano de Ação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Info Geral */}
                    <div className="flex-1 space-y-2 pr-12">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {deptName}
                        </span>
                        <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(computedStatus)}`}>
                          {computedStatus === 'em_andamento' ? 'Em andamento' : computedStatus === 'concluido' ? 'Concluído' : computedStatus === 'atrasado' ? 'Atrasado' : 'Pendente'}
                        </span>
                        {totalObjectives > 0 && (
                          <span className="text-[9px] bg-[#C5A85A]/10 text-[#a3863d] px-2 py-0.5 rounded font-bold">
                            {totalObjectives} {totalObjectives === 1 ? 'Objetivo' : 'Objetivos'}
                          </span>
                        )}
                        {totalCost > 0 && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                            Custo: {formatCurrency(totalCost)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-850 text-base leading-tight group-hover:text-[#1E2538] transition-colors">{plan.name}</h3>
                      <p className="text-xs text-slate-400 font-light max-w-2xl">{plan.description || 'Sem descrição'}</p>
                    </div>

                    {/* Datas e Pessoas */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs shrink-0 w-full md:w-auto" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <CalendarDays className="w-4 h-4 text-[#C5A85A]" />
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Prazo</p>
                          <p className="font-semibold text-slate-750">
                            {plan.due_date ? new Date(plan.due_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem data'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="w-4 h-4 text-[#C5A85A]" />
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Responsável</p>
                          <p className="font-semibold text-slate-700 max-w-[120px] truncate">{responsible}</p>
                        </div>
                      </div>
                    </div>

                    {/* Slider de Progresso Interativo / Fixo */}
                    <div className="space-y-1 w-full md:w-48 shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Progresso</span>
                        <span className="font-bold text-[#1E2538]">{progressVal}%</span>
                      </div>
                      
                      {isCalculated ? (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-[#C5A85A] rounded-full transition-all duration-300"
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                      ) : (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={progressVal}
                          onChange={(e) => handleProgressChange(plan.id, Number(e.target.value), plan.status)}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C5A85A]"
                        />
                      )}

                      <div className="flex justify-between items-center pt-0.5">
                        {isCalculated ? (
                          <span className="text-[9px] text-slate-400 italic">Progresso automático</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStatusClick(plan.id, 'em_andamento')}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                                plan.status === 'em_andamento' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              Iniciar
                            </button>
                            <button
                              onClick={() => handleStatusClick(plan.id, 'concluido')}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 ${
                                plan.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" /> Concluir
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm shadow-sm">
                Nenhum plano de ação encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </>
      ) : (
        // ================= TELA 2: OBJETIVOS E AÇÕES DETALHADOS =================
        <div className="space-y-6 animate-fadeIn">
          {/* Cabeçalho Especial de Voltar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <button
              onClick={() => setActivePlanId(null)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-md shadow-sm transition-colors self-start font-semibold"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              Voltar para todos os planos
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditClick(selectedActivePlan)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Plano
              </button>
              <button
                onClick={handleCreateObjectiveClick}
                className="flex items-center gap-1.5 bg-[#C5A85A] hover:bg-[#a3863d] text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Objetivo
              </button>
            </div>
          </div>

          {/* Card Resumo do Plano de Ação Selecionado */}
          <div className="bg-white rounded-lg border border-slate-200/60 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {departments.find(d => d.id === selectedActivePlan.department_id)?.name || 'Geral'}
                  </span>
                  <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(activePlanSummary?.computedStatus || 'pendente')}`}>
                    {activePlanSummary?.computedStatus === 'em_andamento' ? 'Em andamento' : activePlanSummary?.computedStatus === 'concluido' ? 'Concluído' : activePlanSummary?.computedStatus === 'atrasado' ? 'Atrasado' : 'Pendente'}
                  </span>
                  <span className="text-[9px] bg-[#C5A85A]/10 text-[#a3863d] px-2 py-0.5 rounded font-bold">
                    {activePlanSummary?.totalObjectives || 0} {(activePlanSummary?.totalObjectives || 0) === 1 ? 'Objetivo' : 'Objetivos'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-855 leading-tight">{selectedActivePlan.name}</h2>
                <p className="text-xs text-slate-400 font-light">{selectedActivePlan.description || 'Sem descrição'}</p>
              </div>

              {/* Informações consolidadas */}
              <div className="flex flex-wrap gap-4 text-xs shrink-0 bg-slate-50/70 p-4 rounded-lg border border-slate-100">
                <div className="text-left">
                  <p className="text-[7px] uppercase font-bold text-slate-400">Responsável</p>
                  <p className="font-semibold text-slate-700 truncate max-w-[120px]">
                    {profiles.find(p => p.id === selectedActivePlan.responsible_id)?.name || 'Sem responsável'}
                  </p>
                </div>
                <div className="text-left border-l border-slate-200 pl-3">
                  <p className="text-[7px] uppercase font-bold text-slate-400">Aprovador</p>
                  <p className="font-semibold text-slate-700 truncate max-w-[120px]">
                    {profiles.find(p => p.id === selectedActivePlan.approver_id)?.name || 'Sem aprovador'}
                  </p>
                </div>
                <div className="text-left border-l border-slate-200 pl-3">
                  <p className="text-[7px] uppercase font-bold text-slate-400">Custo Total</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(activePlanSummary?.totalCost || 0)}</p>
                </div>
                <div className="text-left border-l border-slate-200 pl-3">
                  <p className="text-[7px] uppercase font-bold text-slate-400">Progresso Geral</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-800">{activePlanSummary?.progressVal || 0}%</span>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C5A85A] rounded-full" style={{ width: `${activePlanSummary?.progressVal || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Painel do Plano de Ação Selecionado: Objetivos (Nível 2) e Ações (Nível 3) */}
          <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Target className="w-5 h-5 text-[#C5A85A]" />
              <h3 className="text-base font-bold text-slate-850">Objetivos e Plano Tático</h3>
            </div>

            {/* Objetivos */}
            <div className="space-y-4">
              {selectedActivePlan.objectives && selectedActivePlan.objectives.length > 0 ? (
                selectedActivePlan.objectives.map((objective) => {
                  const isExpanded = !!expandedObjectives[objective.id];
                  const { totalActions, completedActions, totalCost, progressVal } = getObjectiveSummary(objective);
                  
                  const today = new Date().toISOString().split('T')[0];
                  const isAtrasado = objective.status !== 'OK' && objective.due_date < today;
                  
                  const objResponsible = profiles.find(p => p.id === objective.responsible_id)?.name || 'Sem responsável';

                  return (
                    <div 
                      key={objective.id} 
                      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50 shadow-sm"
                    >
                      {/* Cabeçalho do Objetivo (Accordion Trigger) */}
                      <div 
                        onClick={() => toggleObjectiveExpand(objective.id)}
                        className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/30 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-800 truncate">{objective.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`px-2 py-0.2 border text-[8px] font-extrabold uppercase rounded ${getObjectiveStatusStyle(objective.status, isAtrasado)}`}>
                                {objective.status === 'OK' ? 'OK' : isAtrasado ? 'Atrasado' : 'Em Andamento'}
                              </span>
                              {totalActions > 0 && (
                                <span className="text-[9px] text-slate-500 font-medium">
                                  {completedActions}/{totalActions} ações ({progressVal}%)
                                </span>
                              )}
                              {totalCost > 0 && (
                                <span className="text-[9px] text-emerald-700 font-bold">
                                  {formatCurrency(totalCost)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Datas, Responsáveis e Controles */}
                        <div className="flex items-center gap-4 shrink-0 self-end md:self-auto text-xs" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-4 text-slate-500 text-xs">
                            <div className="text-right">
                              <p className="text-[7px] uppercase font-bold text-slate-400">Prazo Limite</p>
                              <p className="font-semibold text-slate-650">
                                {objective.due_date ? new Date(objective.due_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem data'}
                              </p>
                            </div>
                            <div className="text-right border-l border-slate-200 pl-3">
                              <p className="text-[7px] uppercase font-bold text-slate-400">Responsável</p>
                              <p className="font-semibold text-slate-700 truncate max-w-[100px]">{objResponsible}</p>
                            </div>
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                            <button
                              onClick={() => handleEditObjectiveClick(objective)}
                              className="p-1 rounded text-slate-450 hover:text-slate-800 hover:bg-slate-100 transition-all"
                              title="Editar Objetivo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteObjectiveClick(objective.id, objective.name)}
                              className="p-1 rounded text-rose-450 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              title="Excluir Objetivo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do Objetivo: Lista de Ações (Accordion Content) */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-xs">
                              <thead>
                                <tr className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                  <th className="py-2 px-3 text-left w-12">Status</th>
                                  <th className="py-2 px-3 text-left">Ação</th>
                                  <th className="py-2 px-3 text-left">Responsável</th>
                                  <th className="py-2 px-3 text-left">Prazo</th>
                                  <th className="py-2 px-3 text-right">Custo</th>
                                  <th className="py-2 px-3 text-right w-20">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                {objective.actions && objective.actions.length > 0 ? (
                                  objective.actions.map((action) => {
                                    const actResponsible = profiles.find(p => p.id === action.responsible_id)?.name || 'Sem responsável';
                                    const isActAtrasada = action.status !== 'OK' && action.due_date < today;

                                    return (
                                      <tr key={action.id} className="hover:bg-slate-50/60 transition-colors">
                                        {/* Status Rápido Checkbox */}
                                        <td className="py-2.5 px-3">
                                          <button
                                            onClick={() => handleToggleActionStatus(objective.id, action.id)}
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                              action.status === 'OK'
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200'
                                                : 'bg-white border-slate-300 hover:border-[#C5A85A] text-transparent'
                                            }`}
                                            title={action.status === 'OK' ? 'Marcar em Andamento' : 'Marcar Concluído'}
                                          >
                                            <Check className="w-3 h-3 text-white" />
                                          </button>
                                        </td>

                                        {/* Nome da Ação */}
                                        <td className="py-2.5 px-3">
                                          <span className={`font-semibold text-slate-800 ${
                                            action.status === 'OK' ? 'line-through text-slate-400 font-normal' : ''
                                          }`}>
                                            {action.name}
                                          </span>
                                          {isActAtrasada && (
                                            <span className="ml-2 text-[8px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.2 rounded font-bold uppercase">
                                              Atrasada
                                            </span>
                                          )}
                                        </td>

                                        {/* Responsável */}
                                        <td className="py-2.5 px-3 text-slate-550">
                                          {actResponsible}
                                        </td>

                                        {/* Prazo */}
                                        <td className="py-2.5 px-3 text-slate-550 font-medium">
                                          {action.due_date ? new Date(action.due_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem data'}
                                        </td>

                                        {/* Custo */}
                                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                          {action.cost > 0 ? formatCurrency(action.cost) : 'R$ 0,00'}
                                        </td>

                                        {/* Ações na Linha */}
                                        <td className="py-2.5 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <button
                                              onClick={() => handleEditActionClick(objective.id, action)}
                                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
                                              title="Editar Ação"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteActionClick(objective.id, action.id, action.name)}
                                              className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                              title="Excluir Ação"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="py-4 text-center text-slate-400 text-[11px] bg-white italic">
                                      Nenhuma ação vinculada a este objetivo.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Botão de Adicionar Ação dentro do objetivo */}
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleCreateActionClick(objective.id)}
                              className="flex items-center gap-1 text-[10px] text-[#C5A85A] hover:text-[#a3863d] font-bold py-1 px-2.5 rounded hover:bg-white border border-[#C5A85A]/20 transition-all shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                              Nova Ação
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 bg-slate-50/30">
                  <FolderOpen className="w-8 h-8 mx-auto text-slate-350 mb-2" />
                  <p className="text-sm font-semibold">Sem objetivos cadastrados</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Este plano de ação não possui objetivos estruturados. Adicione o primeiro objetivo para gerenciar suas ações.
                  </p>
                  <button
                    onClick={handleCreateObjectiveClick}
                    className="mt-4 inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-[#C5A85A] border border-slate-200 hover:border-[#C5A85A]/45 text-xs font-bold px-3 py-1.5 rounded-md shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Objetivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Plano de Ação (Nível 1) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  {selectedPlan ? 'Editar Plano de Ação' : 'Novo Plano de Ação'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedPlan(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActionPlan} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Título do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="Nome do plano de ação comercial, operacional..."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  value={planDescription}
                  onChange={e => setPlanDescription(e.target.value)}
                  placeholder="Finalidade geral do plano..."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2 px-3 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Prazo final *
                  </label>
                  <input
                    type="date"
                    required
                    value={planDueDate}
                    onChange={e => setPlanDueDate(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Setor Vinculado
                  </label>
                  <select
                    value={planDeptId}
                    onChange={e => setPlanDeptId(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="">Geral / Sem setor</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Responsável
                  </label>
                  <select
                    value={planRespId}
                    onChange={e => setPlanRespId(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="">Selecione o responsável</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Aprovador
                  </label>
                  <select
                    value={planApprId}
                    onChange={e => setPlanApprId(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="">Selecione o aprovador</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPlan && !(selectedPlan.objectives && selectedPlan.objectives.length > 0) && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                      Status da Ação
                    </label>
                    <select
                      value={planStatus}
                      onChange={e => setPlanStatus(e.target.value as ActionPlan['status'])}
                      className="w-full bg-white text-xs text-slate-750 border border-slate-200 rounded py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                      Progresso: {planProgress}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={planProgress}
                      onChange={e => setPlanProgress(Number(e.target.value))}
                      className="w-full mt-2 appearance-none h-1 bg-slate-250 rounded cursor-pointer accent-[#C5A85A]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSelectedPlan(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !planName.trim() || !planDueDate}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors flex items-center gap-1.5 text-xs"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Plano'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Objetivo (Nível 2) */}
      {isObjectiveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white font-sans">
                  {selectedObjective ? 'Editar Objetivo' : 'Novo Objetivo'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsObjectiveModalOpen(false); setSelectedObjective(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveObjective} className="p-6 space-y-4 text-left font-sans">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Título do Objetivo *
                </label>
                <input
                  type="text"
                  required
                  value={objName}
                  onChange={e => setObjName(e.target.value)}
                  placeholder="Ex: Implantar a etapa 1 - Diagnóstico..."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Prazo limite *
                  </label>
                  <input
                    type="date"
                    required
                    value={objDueDate}
                    onChange={e => setObjDueDate(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Responsável
                  </label>
                  <select
                    value={objRespId}
                    onChange={e => setObjRespId(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="">Selecione o responsável</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsObjectiveModalOpen(false); setSelectedObjective(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!objName.trim() || !objDueDate}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors text-xs"
                >
                  Salvar Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Ação (Nível 3) */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  {selectedAction ? 'Editar Ação' : 'Nova Ação'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsActionModalOpen(false); setSelectedAction(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Título da Ação *
                </label>
                <input
                  type="text"
                  required
                  value={actName}
                  onChange={e => setActName(e.target.value)}
                  placeholder="Ex: Treinar gestores no sistema..."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Prazo final *
                  </label>
                  <input
                    type="date"
                    required
                    value={actDueDate}
                    onChange={e => setActDueDate(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Responsável
                  </label>
                  <select
                    value={actRespId}
                    onChange={e => setActRespId(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="">Selecione o responsável</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Custo estimado (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={actCost === 0 ? '' : actCost}
                      onChange={e => setActCost(Number(e.target.value))}
                      placeholder="0,00"
                      className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-7 pr-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Status da Ação
                  </label>
                  <select
                    value={actStatus}
                    onChange={e => setActStatus(e.target.value as 'OK' | 'ANDAMENTO')}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="ANDAMENTO">Em Andamento</option>
                    <option value="OK">Concluída (OK)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsActionModalOpen(false); setSelectedAction(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!actName.trim() || !actDueDate}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors text-xs"
                >
                  Salvar Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
