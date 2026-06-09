'use client';

import React, { useState } from 'react';
import { useApp, ActionPlan } from '../../context/AppContext';
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
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2
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


  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Campos do Formulário
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planDueDate, setPlanDueDate] = useState('');
  const [planRespId, setPlanRespId] = useState('');
  const [planApprId, setPlanApprId] = useState('');
  const [planDeptId, setPlanDeptId] = useState('');
  const [planStatus, setPlanStatus] = useState<ActionPlan['status']>('pendente');
  const [planProgress, setPlanProgress] = useState(0);

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
        progress: 0
      });

      return success;
    }
    return false;
  };

  // Atualizar progresso localmente
  const handleProgressChange = (id: string, progress: number, currentStatus: ActionPlan['status']) => {
    let newStatus = currentStatus;
    if (progress === 100) {
      newStatus = 'concluido';
    } else if (progress > 0 && currentStatus === 'pendente') {
      newStatus = 'em_andamento';
    }
    updateActionPlanStatus(id, newStatus, progress);
  };

  // Atualizar status diretamente
  const handleStatusClick = (id: string, status: ActionPlan['status']) => {
    const progress = status === 'concluido' ? 100 : status === 'pendente' ? 0 : 50;
    updateActionPlanStatus(id, status, progress);
  };

  // Handlers do Modal
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
      await deleteActionPlan(id);
    }
  };

  // Salvar Formulário
  const handleSaveActionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planDueDate) return;

    setModalLoading(true);
    let success = false;

    const dataPayload = {
      name: planName,
      description: planDescription,
      due_date: planDueDate,
      responsible_id: planRespId || null,
      approver_id: planApprId || null,
      department_id: planDeptId || null,
      status: planStatus,
      progress: planProgress
    };

    if (selectedPlan) {
      success = await updateActionPlan(selectedPlan.id, dataPayload);
    } else {
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

  const suggestions = [
    'Criar plano para Fabricio revisar roteiro comercial até sexta-feira com aprovação de Paulo',
    'Adicionar ação para Ieda corrigir bug do banco de dados até dia 20 de Junho',
    'Adicionar plano para Gessica consolidar contas mensais até segunda-feira'
  ];

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Planos de Ação</h1>
          <p className="text-sm text-slate-500 mt-1">Controle e andamento das metas, responsáveis e prazos estabelecidos.</p>
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

      {/* Grid/Lista dos Planos de Ação */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => {
            const deptName = departments.find(d => d.id === plan.department_id)?.name || 'Geral';
            const approver = profiles.find(p => p.id === plan.approver_id)?.name || 'Sem aprovador';

            return (
              <div 
                key={plan.id}
                className="bg-white rounded-lg p-4 md:p-6 border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all duration-200 relative group"
              >
                {/* Botões Rápidos de Editar/Excluir */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded border border-slate-100 shadow-sm">
                  <button
                    onClick={() => handleEditClick(plan)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
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
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      {deptName}
                    </span>
                    <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(plan.status)}`}>
                      {plan.status === 'em_andamento' ? 'Em andamento' : plan.status === 'concluido' ? 'Concluído' : plan.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base leading-snug">{plan.name}</h3>
                  <p className="text-xs text-slate-400 font-light max-w-2xl">{plan.description || 'Sem descrição'}</p>
                </div>

                {/* Datas e Pessoas */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs shrink-0 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CalendarDays className="w-4 h-4 text-[#C5A85A]" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Prazo</p>
                      <p className="font-semibold">
                        {plan.due_date ? new Date(plan.due_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem data'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <User className="w-4 h-4 text-[#C5A85A]" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Responsável</p>
                      <p className="font-semibold text-slate-700">{plan.responsible_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 col-span-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px]">Aprovador: <strong className="text-slate-600 font-semibold">{approver}</strong></span>
                  </div>
                </div>

                {/* Slider de Progresso Interativo */}
                <div className="space-y-1 w-full md:w-48 shrink-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">Progresso</span>
                    <span className="font-bold text-slate-750">{plan.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={plan.progress}
                    onChange={(e) => handleProgressChange(plan.id, Number(e.target.value), plan.status)}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C5A85A]"
                  />
                  
                  {/* Atalhos Rápidos */}
                  <div className="flex justify-between pt-1">
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
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-350 text-slate-400 text-sm">
            Nenhum plano de ação ativo encontrado.
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Plano de Ação */}
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
                  Título da Ação *
                </label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="O que precisa ser feito..."
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
                  placeholder="Detalhamento das etapas de execução (opcional)..."
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

              {selectedPlan && (
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
    </div>
  );
}
