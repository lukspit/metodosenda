'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function Dashboard() {
  const { currentTenant, indicators, actionPlans, loading } = useApp();
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

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
      setAiInsight(getStaticDiagnostic());
    }
  }, [currentTenant, actionPlans]);

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
          indicators,
          actionPlans,
          tenantName: currentTenant.name
        }),
      });

      if (!response.ok) throw new Error('Erro ao gerar insights');
      
      const data = await response.json();
      if (data.insight) {
        // Formatar quebras de linha para HTML simples para renderizar bonito
        const formattedInsight = data.insight
          .replace(/\n/g, '<br />')
          .replace(/### (.*)/g, '<h3 class="text-sm font-bold text-[#C5A85A] mt-3 mb-2">$1</h3>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        setAiInsight(formattedInsight);
      }
    } catch (err) {
      console.error(err);
      setAiInsight(getStaticDiagnostic() + '<p class="text-red-500 text-xs mt-2">Nota: Não foi possível atualizar os dados em tempo real pela IA. Exibindo diagnóstico offline.</p>');
    } finally {
      setLoadingInsight(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-[#C5A85A] animate-spin" />
      </div>
    );
  }

  // Cálculos rápidos de métricas
  const totalPlans = actionPlans.length;
  const completedPlans = actionPlans.filter(p => p.status === 'concluido').length;
  const delayedPlans = actionPlans.filter(p => p.status === 'atrasado').length;
  const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  // Mapeamento de meses para o gráfico
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Preparar dados do gráfico unificado de indicadores
  const chartData = Array.from({ length: 5 }).map((_, index) => {
    const monthIndex = index; // Jan a Mai
    const dataObj: any = { name: monthNames[monthIndex] };
    
    indicators.forEach(ind => {
      const measurement = ind.measurements.find(m => m.month === monthIndex + 1);
      if (measurement) {
        // Simplificar valores monetários para exibir no gráfico
        dataObj[ind.name] = ind.unit === 'R$' ? measurement.value / 1000 : measurement.value;
      }
    });
    
    return dataObj;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acompanhamento estratégico e recomendações de Inteligência Artificial.</p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Conclusão de Planos */}
        <div className="bg-white dark:bg-[#1E2538] rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-850 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planos de Ação</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-baseline gap-2">
              {completionRate}%
              <span className="text-xs font-normal text-slate-400">({completedPlans}/{totalPlans} concluídos)</span>
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Planos Atrasados */}
        <div className="bg-white dark:bg-[#1E2538] rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-850 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planos Atrasados</p>
            <h3 className={`text-2xl font-extrabold ${delayedPlans > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
              {delayedPlans}
            </h3>
            <p className="text-xs text-slate-400">Ações com prazo vencido</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            delayedPlans > 0 
              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500' 
              : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Status dos Indicadores */}
        <div className="bg-white dark:bg-[#1E2538] rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-850 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atingimento de Metas</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-baseline gap-2">
              {indicators.length > 0 ? '82%' : '0%'}
              <span className="text-xs font-normal text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +2.4%
              </span>
            </h3>
            <p className="text-xs text-slate-400">Média em relação às metas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid Principal (Gráfico + IA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Evolução de Indicadores */}
        <div className="bg-white dark:bg-[#1E2538] rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-850 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Evolução dos Indicadores Chave</h3>
              <p className="text-xs text-slate-400 mt-0.5">Acompanhamento dos valores medidos nos últimos meses.</p>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full font-medium">Valores em Meta</span>
          </div>

          <div className="h-[280px] w-full pt-4">
            {indicators.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5A85A" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#C5A85A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E2538', 
                      borderColor: '#334155', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                  />
                  {indicators.map((ind, index) => (
                    <Area 
                      key={ind.id}
                      type="monotone" 
                      dataKey={ind.name} 
                      stroke={index === 0 ? '#C5A85A' : index === 1 ? '#10B981' : '#3B82F6'} 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorInd)" 
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Nenhum indicador cadastrado para esta empresa.
              </div>
            )}
          </div>
        </div>

        {/* Diagnóstico por IA (Senda AI) */}
        <div className="bg-gradient-to-br from-[#1E2538] to-[#111622] text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
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
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
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
                className="prose prose-invert max-w-none prose-sm leading-relaxed text-slate-300"
                dangerouslySetInnerHTML={{ __html: aiInsight }}
              />
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-[10px] text-slate-500">Os insights são baseados no método estratégico da Senda Consultoria.</p>
          </div>
        </div>

      </div>

      {/* Planos de Ação Recentes */}
      <div className="bg-white dark:bg-[#1E2538] rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-850">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Ações Críticas sob Acompanhamento</h3>
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
          {actionPlans.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">Nome da Ação</th>
                  <th scope="col" className="px-6 py-3">Prazo</th>
                  <th scope="col" className="px-6 py-3">Responsável</th>
                  <th scope="col" className="px-6 py-3">Progresso</th>
                  <th scope="col" className="px-6 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {actionPlans
                  .filter(p => p.status !== 'concluido' && p.status !== 'cancelado')
                  .slice(0, 4)
                  .map((plan) => (
                    <tr key={plan.id} className="bg-white dark:bg-transparent border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                        {plan.name}
                        <p className="text-xs font-normal text-slate-400 mt-0.5 line-clamp-1">{plan.description}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <CalendarDays className="w-3.5 h-3.5 text-[#C5A85A]" />
                          {new Date(plan.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                        {plan.responsible_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#C5A85A] h-full rounded-full" style={{ width: `${plan.progress}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-500">{plan.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          plan.status === 'atrasado' 
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' 
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
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
