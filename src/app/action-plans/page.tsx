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
  ChevronDown
} from 'lucide-react';

export default function ActionPlansPage() {
  const { actionPlans, profiles, departments, createActionPlan, updateActionPlanStatus } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResp, setFilterResp] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Callback ao criar plano via IA
  const handleAISuccess = async (result: any) => {
    if (result.action === 'create' && result.data) {
      const { name, description, due_date, responsible_id, approver_id, department_id } = result.data;
      
      const success = await createActionPlan({
        name,
        description,
        due_date,
        responsible_id,
        approver_id,
        department_id,
        status: 'pendente',
        progress: 0
      });

      if (success) {
        setAiFeedback(result.explanation || `Plano de ação ${name} criado com sucesso!`);
        setTimeout(() => setAiFeedback(null), 5000);
      }
    }
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
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900';
      case 'em_andamento':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900';
      case 'atrasado':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900';
      default:
        return 'bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Planos de Ação</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Controle e andamento das metas, responsáveis e prazos estabelecidos.</p>
      </div>

      {/* Input de IA Contextual */}
      <SmartInput
        context="action_plans"
        placeholder="Escreva ou fale o plano de ação... (ex: 'Adicionar plano para Fabricio ajustar as metas de vendas até sexta-feira')"
        onSuccess={handleAISuccess}
        existingData={{ departments, profiles }}
        suggestions={suggestions}
      />

      {/* Feedback de IA */}
      {aiFeedback && (
        <div className="bg-[#C5A85A]/10 border border-[#C5A85A]/35 text-[#C5A85A] px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <Sparkles className="w-4 h-4 fill-[#C5A85A]/20" />
          <span>IA: {aiFeedback}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-[#1E2538] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Filtrar por nome ou descrição..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A85A] w-full md:w-64"
        />

        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
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
            className="bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
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
                className="bg-white dark:bg-[#1E2538] rounded-2xl p-6 border border-slate-200/60 dark:border-slate-850 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all duration-200"
              >
                {/* Info Geral */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      {deptName}
                    </span>
                    <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(plan.status)}`}>
                      {plan.status === 'em_andamento' ? 'Em andamento' : plan.status === 'concluido' ? 'Concluído' : plan.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-snug">{plan.name}</h3>
                  <p className="text-xs text-slate-400 font-light max-w-2xl">{plan.description || 'Sem descrição'}</p>
                </div>

                {/* Datas e Pessoas */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs shrink-0 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <CalendarDays className="w-4 h-4 text-[#C5A85A]" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Prazo</p>
                      <p className="font-semibold">{new Date(plan.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <User className="w-4 h-4 text-[#C5A85A]" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Responsável</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{plan.responsible_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 col-span-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px]">Aprovador: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{approver}</strong></span>
                  </div>
                </div>

                {/* Slider de Progresso Interativo */}
                <div className="space-y-1 w-full md:w-48 shrink-0">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">Progresso</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200">{plan.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={plan.progress}
                    onChange={(e) => handleProgressChange(plan.id, Number(e.target.value), plan.status)}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#C5A85A]"
                  />
                  
                  {/* Atalhos Rápidos */}
                  <div className="flex justify-between pt-1">
                    <button
                      onClick={() => handleStatusClick(plan.id, 'em_andamento')}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                        plan.status === 'em_andamento' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Iniciar
                    </button>
                    <button
                      onClick={() => handleStatusClick(plan.id, 'concluido')}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 ${
                        plan.status === 'concluido' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
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
          <div className="text-center py-12 bg-white dark:bg-[#1E2538] rounded-2xl border border-dashed border-slate-350 dark:border-slate-800 text-slate-400 text-sm">
            Nenhum plano de ação ativo encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
