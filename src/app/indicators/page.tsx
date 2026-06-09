'use client';

import React, { useState } from 'react';
import { useApp, Indicator } from '../../context/AppContext';
import { SmartInput } from '../../components/SmartInput';
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  Plus,
  Percent,
  Calendar,
  Filter,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function IndicatorsPage() {
  const { indicators, departments, createIndicator } = useApp();
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [searchText, setSearchText] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Callback ao criar indicador via voz ou texto (IA)
  const handleAISuccess = async (result: any) => {
    if (result.action === 'create' && result.data) {
      const { name, department_id, target, unit, year } = result.data;
      
      const success = await createIndicator({
        name,
        department_id,
        target: Number(target),
        unit,
        year: Number(year) || 2026,
        measurements: [] // Inicia vazio
      });

      if (success) {
        setAiFeedback(result.explanation || `Indicador ${name} criado com sucesso!`);
        setTimeout(() => setAiFeedback(null), 5000);
      }
    }
  };

  const suggestions = [
    'Cadastrar meta de faturamento de R$ 300.000 para o setor de Finanças',
    'Adicionar indicador de NPS de 85% para o Comercial em 2026',
    'Criar meta de 98% de uptime para a TI'
  ];

  // Filtros de dados
  const filteredIndicators = indicators.filter(ind => {
    const matchesDept = filterDept === 'all' || ind.department_id === filterDept;
    const matchesYear = ind.year === filterYear;
    const matchesSearch = ind.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesDept && matchesYear && matchesSearch;
  });

  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Formatar dados do histórico mensal de medições para o Recharts
  const formatChartData = (measurements: { month: number; value: number }[]) => {
    return Array.from({ length: 5 }).map((_, index) => {
      const month = index + 1;
      const measure = measurements.find(m => m.month === month);
      return {
        name: monthLabels[index],
        Valor: measure ? measure.value : 0
      };
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Indicadores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acompanhamento e evolução de metas empresariais por departamento.</p>
        </div>
      </div>

      {/* Input de IA Contextual */}
      <SmartInput
        context="indicators"
        placeholder="Adicione um indicador por voz ou texto... (ex: 'Adicionar indicador de Faturamento de R$ 250.000 para o Financeiro')"
        onSuccess={handleAISuccess}
        existingData={{ departments }}
        suggestions={suggestions}
      />

      {/* Feedback de IA */}
      {aiFeedback && (
        <div className="bg-[#C5A85A]/10 border border-[#C5A85A]/35 text-[#C5A85A] px-4 py-3 rounded-md flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <Sparkles className="w-4 h-4 fill-[#C5A85A]/20" />
          <span>IA: {aiFeedback}</span>
        </div>
      )}

      {/* Filtros de Visualização */}
      <div className="bg-white dark:bg-[#1E2538] p-5 rounded-lg border border-slate-200/60 dark:border-slate-850 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-semibold self-start md:self-auto">
          <Filter className="w-4 h-4 text-[#C5A85A]" />
          Filtros de Busca
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:flex-1 md:justify-end">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
          />

          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
          >
            <option value="all">Todos os setores</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
          >
            <option value={2026}>Ano: 2026</option>
            <option value={2027}>Ano: 2027</option>
          </select>
        </div>
      </div>

      {/* Grid de Indicadores com Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredIndicators.length > 0 ? (
          filteredIndicators.map((ind) => {
            const chartData = formatChartData(ind.measurements);
            const currentVal = ind.measurements.length > 0 ? ind.measurements[ind.measurements.length - 1].value : null;
            const targetMet = currentVal !== null && currentVal >= ind.target;
            const deptName = departments.find(d => d.id === ind.department_id)?.name || 'Geral';

            return (
              <div 
                key={ind.id}
                className="bg-white dark:bg-[#1E2538] rounded-lg p-6 border border-slate-200/60 dark:border-slate-850 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                        {deptName}
                      </span>
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base mt-2">{ind.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 min-h-[32px]">{ind.description || 'Sem descrição'}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Meta {ind.year}</p>
                      <p className="text-lg font-black text-[#C5A85A]">
                        {ind.unit === 'R$' ? 'R$ ' : ''}
                        {ind.target.toLocaleString('pt-BR')}
                        {ind.unit === '%' ? '%' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Resultados Rápidos */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#161B29]/65 p-3 rounded-md border border-slate-100 dark:border-slate-800/80 mb-6">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Medição Recente</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {currentVal !== null ? (
                          <>
                            {ind.unit === 'R$' ? 'R$ ' : ''}
                            {currentVal.toLocaleString('pt-BR')}
                            {ind.unit === '%' ? '%' : ''}
                          </>
                        ) : 'Sem medição'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Atingimento</span>
                      <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${targetMet ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {currentVal !== null ? (
                          <>
                            {targetMet ? <CheckCircle className="w-3.5 h-3.5 fill-emerald-500/10" /> : <TrendingUp className="w-3.5 h-3.5" />}
                            {Math.round((currentVal / ind.target) * 100)}% da meta
                          </>
                        ) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Gráfico Linear Individual do Indicador */}
                  <div className="h-[150px] w-full mt-2">
                    {ind.measurements.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/50" />
                          <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1E2538', 
                              borderColor: '#334155', 
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '11px',
                              padding: '5px 10px'
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Valor" 
                            stroke="#C5A85A" 
                            strokeWidth={2} 
                            dot={{ fill: '#C5A85A', strokeWidth: 1 }}
                            activeDot={{ r: 5 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 bg-slate-50 dark:bg-transparent rounded-lg border border-dashed border-slate-200 dark:border-slate-850">
                        Adicione a primeira medição mensal para gerar o gráfico.
                      </div>
                    )}
                  </div>
                </div>

                {/* Ação para Adicionar Medição (Mock) */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Ano Fiscal: {ind.year}</span>
                  <button
                    onClick={() => alert('Para inserir medições reais de cada mês, fale com a IA ou use as configurações do indicador.')}
                    className="text-xs font-semibold text-slate-500 hover:text-[#C5A85A] flex items-center gap-1 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Adicionar Medição
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-[#1E2538] rounded-lg border border-dashed border-slate-350 dark:border-slate-800 text-slate-400 text-sm">
            Nenhum indicador encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}
