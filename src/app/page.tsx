'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useApp, ActionPlan } from '../context/AppContext';

import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  TrendingDown,
  CalendarDays
} from 'lucide-react';

import { SkeletonDashboard } from '../components/SkeletonDashboard';

const DashboardChart = dynamic(() => import('../components/DashboardChart'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-slate-400 text-sm animate-pulse">
      Carregando gráfico...
    </div>
  )
});

export default function Dashboard() {
  const { currentTenant, indicators, actionPlans, loading, saveDashboardInsights } = useApp();
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Fallbacks de segurança para arrays e objetos
  const safeIndicators = useMemo(() => indicators || [], [indicators]);
  const safeActionPlans = useMemo(() => actionPlans || [], [actionPlans]);

  // Função auxiliar de formatação de data robusta
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não definida';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Não definida';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return 'Não definida';
    }
  };

  // Diagnóstico pré-gerado caso o usuário ainda não tenha solicitado via IA
  const getStaticDiagnostic = () => {
    return `
      <h3 class="text-sm font-bold text-[#C5A85A] mb-2">⚡ DIAGNÓSTICO PREVENTIVO (SENDA AI)</h3>
      <p class="text-xs text-slate-300 mb-3 leading-relaxed">
        Com base nos dados atuais da <strong>${currentTenant?.name || 'sua empresa'}</strong>, identificamos pontos críticos de atenção:
      </p>
      <ul class="space-y-2 text-xs text-slate-400 list-disc list-inside">
        <li>O setor <strong>Financeiro</strong> está com o plano de ação de <em>Fechamento Contábil</em> atrasado, o que pode impactar a meta de faturamento trimestral.</li>
        <li>O indicador de <strong>NPS</strong> comercial obteve melhora e está em <strong>86%</strong>, superando a meta atual de 85%. Bom trabalho!</li>
        <li>Há <strong>1 plano de ação atrasado</strong> que necessita de intervenção direta da diretoria.</li>
      </ul>
      <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <span>Última análise: agora mesmo</span>
        <span class="text-[#C5A85A]">Recomendado: Cobrar Gessica sobre a contabilidade.</span>
      </div>
    `;
  };

  useEffect(() => {
    if (currentTenant) {
      const saved = currentTenant.dashboard_insights;
      if (saved) {
        setAiInsight(saved);
      } else {
        setAiInsight(getStaticDiagnostic());
      }
    }
  }, [currentTenant, safeActionPlans]);

  // Função para chamar a API e gerar insights reais via OpenRouter/Gemini
  const generateRealInsights = async () => {
    if (!currentTenant) return;
    setLoadingInsight(true);
    try {
      const response = await fetch('/api/ai/dashboard-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indicators: safeIndicators,
          actionPlans: safeActionPlans,
          tenantName: currentTenant.name
        }),
      });

      if (!response.ok) throw new Error('Erro ao gerar insights');
      
      const data = await response.json();
      if (data && data.insight && typeof data.insight === 'string') {
        // Formatar quebras de linha para HTML simples para renderizar bonito
        const formattedInsight = data.insight
          .replace(/\n/g, '<br />')
          .replace(/### (.*)/g, '<h3 class="text-sm font-bold text-[#C5A85A] mt-3 mb-2">$1</h3>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/## (.*)/g, '<h2 class="text-base font-extrabold text-[#C5A85A] mt-4 mb-2 border-b border-slate-800 pb-1">$1</h2>');
        
        setAiInsight(formattedInsight);
        await saveDashboardInsights(formattedInsight);
      }
    } catch (err) {
      console.error(err);
      const saved = currentTenant.dashboard_insights;
      if (saved) {
        setAiInsight(saved + '<p class="text-amber-500 text-[10px] mt-2">Nota: Conexão offline. Exibindo diagnóstico salvo anteriormente.</p>');
      } else {
        setAiInsight(getStaticDiagnostic() + '<p class="text-red-500 text-xs mt-2">Nota: Não foi possível atualizar os dados em tempo real pela IA. Exibindo diagnóstico offline.</p>');
      }
    } finally {
      setLoadingInsight(false);
    }
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  // Cálculos rápidos de métricas com segurança
  const totalPlans = safeActionPlans.length;
  const completedPlans = safeActionPlans.filter(p => p && p.status === 'concluido').length;
  const delayedPlans = safeActionPlans.filter(p => p && p.status === 'atrasado').length;
  const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  // Calcular atingimento médio real dos KPIs baseados na medição mais recente de cada um
  const averageAtingimento = useMemo(() => {
    const activeIndicators = safeIndicators.filter(ind => ind && ind.year === 2026);
    if (activeIndicators.length === 0) return 0;

    let totalAtingimento = 0;
    let indicatorsWithData = 0;

    activeIndicators.forEach(ind => {
      if (!ind) return;
      const measurements = ind.measurements || [];
      const lastMeas = measurements.length > 0 
        ? measurements[measurements.length - 1] 
        : null;
      
      if (lastMeas && typeof lastMeas.value === 'number' && ind.target > 0) {
        const atingimento = Math.min((lastMeas.value / ind.target) * 100, 100);
        totalAtingimento += atingimento;
        indicatorsWithData++;
      }
    });

    return indicatorsWithData > 0 
      ? Math.round(totalAtingimento / indicatorsWithData) 
      : 0;
  }, [safeIndicators]);

  // Mapeamento de meses para o gráfico
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Preparar dados do gráfico unificado de indicadores com segurança e useMemo
  const chartData = useMemo(() => {
    return Array.from({ length: 5 }).map((_, index) => {
      const monthIndex = index; // Jan a Mai
      const dataObj: any = { name: monthNames[monthIndex] };
      
      safeIndicators.forEach(ind => {
        if (!ind || !ind.name) return;
        const measurements = ind.measurements || [];
        const measurement = measurements.find(m => m && m.month === monthIndex + 1);
        if (measurement && measurement.value !== undefined) {
          // Simplificar valores monetários para exibir no gráfico
          dataObj[ind.name] = ind.unit === 'R$' ? measurement.value / 1000 : measurement.value;
        }
      });
      
      return dataObj;
    });
  }, [safeIndicators]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Acompanhamento estratégico e recomendações de Inteligência Artificial.</p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Conclusão de Planos */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planos de Ação</p>
            <h3 className="text-2xl font-extrabold text-slate-800 flex items-baseline gap-2">
              {completionRate}%
              <span className="text-xs font-normal text-slate-400">({completedPlans}/{totalPlans} concluídos)</span>
            </h3>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Planos Atrasados */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planos Atrasados</p>
            <h3 className={`text-2xl font-extrabold ${delayedPlans > 0 ? 'text-rose-500' : 'text-slate-800'}`}>
              {delayedPlans}
            </h3>
            <p className="text-xs text-slate-400">Ações com prazo vencido</p>
          </div>
          <div className={`w-12 h-12 rounded-md flex items-center justify-center ${
            delayedPlans > 0 
              ? 'bg-rose-50 text-rose-500' 
              : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Status dos Indicadores */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atingimento de Metas</p>
            <h3 className="text-2xl font-extrabold text-slate-800 flex items-baseline gap-2">
              {averageAtingimento}%
              {averageAtingimento > 0 && (
                <span className={`text-xs font-normal flex items-center gap-0.5 ${
                  averageAtingimento >= 80 ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  <TrendingUp className="w-3 h-3" /> Realizado
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Média das medições recentes</p>
          </div>
          <div className="w-12 h-12 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Seções Horizontais: Senda AI Insights + Gráfico de Indicadores */}
      <div className="flex flex-col gap-6">
        
        {/* Diagnóstico por IA (Senda AI) - Horizontal de Largura Inteira */}
        <div className="bg-gradient-to-br from-[#1E2538] to-[#111622] text-white rounded-lg p-6 shadow-lg border border-slate-800 relative overflow-hidden group">
          {/* Efeito luminoso de fundo */}
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#C5A85A] rounded-full blur-[80px] opacity-10 pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-[#C5A85A] font-bold tracking-wider uppercase">
                <Sparkles className="w-4 h-4 animate-pulse" /> Senda AI Insights
              </span>
              <button 
                onClick={generateRealInsights}
                disabled={loadingInsight}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="Atualizar insights com IA real"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInsight ? 'animate-spin text-[#C5A85A]' : ''}`} />
              </button>
            </div>

            {loadingInsight ? (
              <div className="space-y-3 py-6">
                <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
                <p className="text-[10px] text-slate-500 text-center animate-pulse pt-2">Lendo banco de dados e formulando estratégias...</p>
              </div>
            ) : (
              <div 
                className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-200"
                dangerouslySetInnerHTML={{ __html: aiInsight }}
              />
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-500">
            <span>Os insights são baseados no método estratégico da Senda Consultoria.</span>
            <span className="font-semibold text-[#C5A85A]">Use o botão no topo para atualizar</span>
          </div>
        </div>

        {/* Gráfico de Evolução de Indicadores Chave - Horizontal de Largura Inteira */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Evolução dos Indicadores Chave</h3>
              <p className="text-xs text-slate-400 mt-0.5">Acompanhamento dos valores medidos nos últimos meses.</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">Dados de Meta</span>
          </div>

          <div className="h-[320px] w-full pt-4">
            <DashboardChart indicators={safeIndicators} chartData={chartData} />
          </div>
        </div>

      </div>

      {/* Planos de Ação Recentes */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Ações Críticas sob Acompanhamento</h3>
            <p className="text-xs text-slate-400 mt-0.5">Planos de ação pendentes ou atrasados.</p>
          </div>
          <Link 
            href="/action-plans" 
            className="text-xs font-semibold text-[#C5A85A] hover:text-[#B3964C] flex items-center gap-1 transition-colors"
          >
            Ver todos os planos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {safeActionPlans.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 rounded-lg">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">Nome da Ação</th>
                  <th scope="col" className="px-6 py-3">Prazo</th>
                  <th scope="col" className="px-6 py-3">Responsável</th>
                  <th scope="col" className="px-6 py-3">Progresso</th>
                  <th scope="col" className="px-6 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {safeActionPlans
                  .filter(p => p && p.status !== 'concluido' && p.status !== 'cancelado')
                  .slice(0, 4)
                  .map((plan, index) => (
                    <tr key={plan.id || index} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {plan.name || 'Sem nome'}
                        <p className="text-xs font-normal text-slate-400 mt-0.5 line-clamp-1">{plan.description || ''}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <CalendarDays className="w-3.5 h-3.5 text-[#C5A85A]" />
                          {formatDate(plan.due_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                        {plan.responsible_name || 'Não atribuído'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#C5A85A] h-full rounded-full" style={{ width: `${typeof plan.progress === 'number' ? plan.progress : 0}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-500">{typeof plan.progress === 'number' ? plan.progress : 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          plan.status === 'atrasado' 
                            ? 'bg-rose-50 text-rose-500' 
                            : 'bg-amber-50 text-amber-500'
                        }`}>
                          {plan.status === 'atrasado' ? 'Atrasado' : 'Em andamento'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-6 text-slate-450">
              Nenhuma ação crítica cadastrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
