'use client';

import React, { useState, useMemo } from 'react';
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
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Loader2,
  Check
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
  const { 
    indicators, 
    departments, 
    createIndicator, 
    updateIndicator, 
    deleteIndicator 
  } = useApp();
  
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [searchText, setSearchText] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMeasurementsModalOpen, setIsMeasurementsModalOpen] = useState(false);
  const [selectedInd, setSelectedInd] = useState<Indicator | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Campos do Formulário do Indicador
  const [indName, setIndName] = useState('');
  const [indDeptId, setIndDeptId] = useState('');
  const [indDescription, setIndDescription] = useState('');
  const [indUnit, setIndUnit] = useState<Indicator['unit']>('%');
  const [indTarget, setIndTarget] = useState('');
  const [indYear, setIndYear] = useState('2026');

  // Campos para Medições Mensais (Janeiro a Dezembro)
  const [monthlyValues, setMonthlyValues] = useState<Record<number, string>>({});

  const monthLabels = [
    { num: 1, label: 'Janeiro' },
    { num: 2, label: 'Fevereiro' },
    { num: 3, label: 'Março' },
    { num: 4, label: 'Abril' },
    { num: 5, label: 'Maio' },
    { num: 6, label: 'Junho' },
    { num: 7, label: 'Julho' },
    { num: 8, label: 'Agosto' },
    { num: 9, label: 'Setembro' },
    { num: 10, label: 'Outubro' },
    { num: 11, label: 'Novembro' },
    { num: 12, label: 'Dezembro' }
  ];

  // Função robusta para limpar formatos de número (como 'R$ 300.000,00' ou '85%') e retornar float puro
  const cleanNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let str = String(val).trim();
    // Limpa símbolos e espaços
    str = str.replace(/[R$\s%]/g, '');
    
    // Tratamento de formato brasileiro
    if (str.includes('.') && str.includes(',')) {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else if (str.includes(',')) {
      str = str.replace(/,/g, '.');
    } else if (str.includes('.')) {
      // Se contiver ponto, verifica se é milhar ou decimal
      const parts = str.split('.');
      if (parts.length > 2 || parts[parts.length - 1].length > 2) {
        str = str.replace(/\./g, '');
      }
    }
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  };

  // Callback ao criar indicador via voz ou texto (IA)
  const handleAISuccess = async (result: any) => {
    if (result.action === 'create' && result.data) {
      const { name, department_id, target, unit, year } = result.data;
      
      const success = await createIndicator({
        name,
        department_id: department_id || null,
        target: cleanNumber(target),
        unit: (unit as Indicator['unit']) || '%',
        year: Number(year) || 2026,
        measurements: []
      });

      if (success) {
        setAiFeedback(result.explanation || `Indicador ${name} criado com sucesso!`);
        setTimeout(() => setAiFeedback(null), 5000);
      }
    }
  };

  // Handlers do Modal de Cadastro
  const handleCreateClick = () => {
    setSelectedInd(null);
    setIndName('');
    setIndDeptId('');
    setIndDescription('');
    setIndUnit('%');
    setIndTarget('');
    setIndYear('2026');
    setIsModalOpen(true);
  };

  const handleEditClick = (ind: Indicator) => {
    setSelectedInd(ind);
    setIndName(ind.name);
    setIndDeptId(ind.department_id || '');
    setIndDescription(ind.description || '');
    setIndUnit(ind.unit);
    setIndTarget(ind.target.toString());
    setIndYear(ind.year.toString());
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o indicador "${name}"?`);
    if (confirm) {
      const success = await deleteIndicator(id);
      if (success) {
        setAiFeedback(`Indicador "${name}" excluído com sucesso.`);
        setTimeout(() => setAiFeedback(null), 5000);
      }
    }
  };

  // Handler do Modal de Medições
  const handleOpenMeasurements = (ind: Indicator) => {
    setSelectedInd(ind);
    
    // Inicializar os inputs com as medições existentes
    const values: Record<number, string> = {};
    monthLabels.forEach(m => {
      const match = ind.measurements.find(meas => meas.month === m.num);
      values[m.num] = match ? match.value.toString() : '';
    });
    setMonthlyValues(values);
    setIsMeasurementsModalOpen(true);
  };

  // Salvar Cadastro Geral
  const handleSaveIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indName.trim() || !indTarget.trim()) return;

    setModalLoading(true);
    let success = false;

    const dataPayload = {
      name: indName,
      department_id: indDeptId || null,
      description: indDescription,
      unit: indUnit,
      target: cleanNumber(indTarget),
      year: Number(indYear) || 2026
    };

    if (selectedInd) {
      success = await updateIndicator(selectedInd.id, dataPayload);
    } else {
      success = await createIndicator({
        ...dataPayload,
        measurements: []
      });
    }

    setModalLoading(false);
    if (success) {
      setIsModalOpen(false);
      setSelectedInd(null);
      setAiFeedback(selectedInd ? 'Indicador atualizado com sucesso!' : 'Novo indicador cadastrado com sucesso!');
      setTimeout(() => setAiFeedback(null), 5000);
    } else {
      alert('Erro ao salvar o indicador.');
    }
  };

  // Salvar Lançamento de Medições
  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInd) return;

    setModalLoading(true);

    // Converte os inputs preenchidos em array de measurements
    const measurementsArr: { month: number; value: number }[] = [];
    monthLabels.forEach(m => {
      const valStr = monthlyValues[m.num];
      if (valStr !== undefined && valStr.trim() !== '') {
        measurementsArr.push({
          month: m.num,
          value: cleanNumber(valStr)
        });
      }
    });

    // Ordena por mês
    measurementsArr.sort((a, b) => a.month - b.month);

    const success = await updateIndicator(selectedInd.id, {
      measurements: measurementsArr
    });

    setModalLoading(false);
    if (success) {
      setIsMeasurementsModalOpen(false);
      setSelectedInd(null);
      setAiFeedback('Medições atualizadas com sucesso!');
      setTimeout(() => setAiFeedback(null), 5000);
    } else {
      alert('Erro ao atualizar as medições.');
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

  const shortMonthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Formatar dados para o Recharts dinamicamente com base nas medições salvas
  const formatChartData = (measurements: { month: number; value: number }[]) => {
    // Determinar até qual mês temos medição para limitar o gráfico e não ficar com linha reta em 0
    const maxMonth = measurements.length > 0 ? Math.max(...measurements.map(m => m.month)) : 0;
    const limitMonths = Math.max(maxMonth, 5); // exibe pelo menos até Maio por padrão
    
    return Array.from({ length: limitMonths }).map((_, index) => {
      const month = index + 1;
      const measure = measurements.find(m => m.month === month);
      return {
        name: shortMonthLabels[index],
        Valor: measure ? measure.value : 0
      };
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Indicadores</h1>
          <p className="text-sm text-slate-500 mt-1">Acompanhamento e evolução de metas empresariais por departamento.</p>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 bg-[#1E2538] hover:bg-[#2c3752] text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4 text-[#C5A85A]" />
          Novo Indicador
        </button>
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
          <Sparkles className="w-4 h-4 fill-[#C5A85A]/20 animate-pulse" />
          <span>Feedback: {aiFeedback}</span>
        </div>
      )}

      {/* Filtros de Visualização */}
      <div className="bg-white p-5 rounded-lg border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold self-start md:self-auto">
          <Filter className="w-4 h-4 text-[#C5A85A]" />
          Filtros de Busca
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:flex-1 md:justify-end">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="bg-slate-50 text-xs text-slate-700 border border-slate-200 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
          />

          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="bg-slate-50 text-xs text-slate-750 border border-slate-200 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
          >
            <option value="all">Todos os setores</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="bg-slate-50 text-xs text-slate-750 border border-slate-200 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
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
                className="bg-white rounded-lg p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 relative group"
              >
                {/* Botões rápidos de Editar/Excluir no hover do card */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-md shadow border border-slate-100">
                  <button
                    onClick={() => handleEditClick(ind)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Editar Indicador"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(ind.id, ind.name)}
                    className="p-1 rounded hover:bg-rose-50 text-rose-500 transition-colors"
                    title="Excluir Indicador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start mb-4 pr-12">
                    <div>
                      <span className="text-[10px] bg-slate-100 text-slate-550 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                        {deptName}
                      </span>
                      <h3 className="font-extrabold text-slate-800 text-base mt-2">{ind.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 min-h-[32px]">{ind.description || 'Sem descrição'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-450 uppercase tracking-widest font-bold">Meta {ind.year}</p>
                      <p className="text-lg font-black text-[#C5A85A]">
                        {ind.unit === 'R$' ? 'R$ ' : ''}
                        {ind.target.toLocaleString('pt-BR')}
                        {ind.unit === '%' ? '%' : ` ${ind.unit}`}
                      </p>
                    </div>
                  </div>

                  {/* Resultados Rápidos */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-md border border-slate-100 mb-6">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Medição Recente</span>
                      <span className="text-sm font-bold text-slate-855">
                        {currentVal !== null ? (
                          <>
                            {ind.unit === 'R$' ? 'R$ ' : ''}
                            {currentVal.toLocaleString('pt-BR')}
                            {ind.unit === '%' ? '%' : ` ${ind.unit}`}
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
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
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
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Adicione a primeira medição mensal para gerar o gráfico.
                      </div>
                    )}
                  </div>
                </div>

                {/* Ação para Adicionar Medição */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Ano Fiscal: {ind.year}</span>
                  <button
                    onClick={() => handleOpenMeasurements(ind)}
                    className="text-xs font-semibold text-slate-600 hover:text-[#C5A85A] flex items-center gap-1 transition-colors bg-slate-50 px-3 py-1.5 rounded border border-slate-200/50 hover:bg-slate-100/50"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#C5A85A]" /> Lançar Resultados
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 bg-white rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm">
            Nenhum indicador encontrado com os filtros atuais.
          </div>
        )}
      </div>

      {/* 1. Modal de Cadastro / Edição Geral */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  {selectedInd ? 'Editar Indicador' : 'Novo Indicador'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedInd(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIndicator} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Nome do Indicador *
                </label>
                <input
                  type="text"
                  required
                  value={indName}
                  onChange={e => setIndName(e.target.value)}
                  placeholder="Ex: NPS Geral, Faturamento, Retenção"
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Departamento Vinculado
                </label>
                <select
                  value={indDeptId}
                  onChange={e => setIndDeptId(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                >
                  <option value="">Geral / Sem setor específico</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Descrição / Objetivo
                </label>
                <textarea
                  value={indDescription}
                  onChange={e => setIndDescription(e.target.value)}
                  placeholder="Breve resumo da finalidade deste indicador..."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2 px-3 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Meta Numérica *
                  </label>
                  <input
                    type="text"
                    required
                    value={indTarget}
                    onChange={e => setIndTarget(e.target.value)}
                    placeholder="Ex: 85, 250000"
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Unidade
                  </label>
                  <select
                    value={indUnit}
                    onChange={e => setIndUnit(e.target.value as Indicator['unit'])}
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="%">%</option>
                    <option value="R$">R$</option>
                    <option value="qtd">Qtd</option>
                    <option value="horas">Horas</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Ano Fiscal
                </label>
                <select
                  value={indYear}
                  onChange={e => setIndYear(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSelectedInd(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !indName.trim() || !indTarget.trim()}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors flex items-center gap-1.5 text-xs"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Indicador'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Premium para Lançar Medições Mensais */}
      {isMeasurementsModalOpen && selectedInd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Lançar Resultados Mensais
                </h3>
                <p className="text-[10px] text-slate-350 uppercase tracking-widest mt-0.5">
                  Indicador: <strong className="text-white">{selectedInd.name}</strong> ({selectedInd.year})
                </p>
              </div>
              <button 
                onClick={() => { setIsMeasurementsModalOpen(false); setSelectedInd(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurements} className="p-6 space-y-6 text-left">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Defina o valor numérico realizado em cada mês. Deixe em branco os meses que ainda não ocorreram.
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Meta Definida</span>
                  <span className="text-sm font-extrabold text-[#C5A85A]">
                    {selectedInd.unit === 'R$' ? 'R$ ' : ''}
                    {selectedInd.target.toLocaleString('pt-BR')}
                    {selectedInd.unit === '%' ? '%' : ` ${selectedInd.unit}`}
                  </span>
                </div>
              </div>

              {/* Grid 2 colunas para os 12 meses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {monthLabels.map(m => (
                  <div key={m.num} className="flex items-center justify-between gap-3 bg-white p-2 border border-slate-100 rounded-md shadow-sm">
                    <span className="text-xs font-bold text-slate-600 w-24">
                      {m.label}
                    </span>
                    <div className="relative flex-1">
                      {selectedInd.unit === 'R$' && (
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] text-slate-400 font-bold">R$</span>
                      )}
                      <input
                        type="text"
                        value={monthlyValues[m.num] || ''}
                        onChange={e => setMonthlyValues(prev => ({ ...prev, [m.num]: e.target.value }))}
                        placeholder="Não medido"
                        className={`w-full bg-slate-50/60 text-xs text-slate-700 border border-slate-200 rounded py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A] ${
                          selectedInd.unit === 'R$' ? 'pl-8' : ''
                        }`}
                      />
                      {selectedInd.unit === '%' && (
                        <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[10px] text-slate-450 font-bold">%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsMeasurementsModalOpen(false); setSelectedInd(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors flex items-center gap-1.5 text-xs"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
                      Gravando...
                    </>
                  ) : (
                    'Salvar Medições'
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
