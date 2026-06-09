'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useApp, Indicator, evaluateFormula, IndicatorVariable, IndicatorMeasurement } from '../../context/AppContext';
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
  Check,
  FileSpreadsheet,
  Upload,
  Info,
  HelpCircle,
  Activity,
  Calculator,
  Layers,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  AreaChart,
  Area,
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

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMeasurementsModalOpen, setIsMeasurementsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedInd, setSelectedInd] = useState<Indicator | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Feedbacks de Sucesso
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Campos do Formulário do Indicador
  const [indName, setIndName] = useState('');
  const [indDeptId, setIndDeptId] = useState('');
  const [indDescription, setIndDescription] = useState('');
  const [indUnit, setIndUnit] = useState<Indicator['unit']>('%');
  const [indCustomUnit, setIndCustomUnit] = useState('');
  const [indTarget, setIndTarget] = useState('');
  const [indYear, setIndYear] = useState('2026');
  const [indChartType, setIndChartType] = useState<Required<Indicator>['chart_type']>('line');
  const [indIndicatorType, setIndIndicatorType] = useState<Required<Indicator>['indicator_type']>('simple');
  const [indVariables, setIndVariables] = useState<IndicatorVariable[]>([]);
  const [indFormula, setIndFormula] = useState('');
  const [indAccumulationType, setIndAccumulationType] = useState<'sum' | 'latest' | 'avg'>('latest');

  // Campos para Medições Mensais (Janeiro a Dezembro)
  const [monthlyValues, setMonthlyValues] = useState<Record<number, string>>({});
  // Variáveis mensais para indicadores calculados: { [mês]: { [var_id]: valor } }
  const [monthlyVariableValues, setMonthlyVariableValues] = useState<Record<number, Record<string, string>>>({});

  // Estados para Importação CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvMappingMode, setCsvMappingMode] = useState<'create' | 'update'>('create');
  const [csvSelectedIndId, setCsvSelectedIndId] = useState<string>('');
  const [csvColumnMapping, setCsvColumnMapping] = useState<Record<string, string>>({});
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvStep, setCsvStep] = useState<number>(1); // 1: Upload, 2: Mapeamento, 3: Prévia/Confirmação

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

  const formulasPredefinidas = [
    { name: 'Nenhuma / Fórmula Customizada', value: '' },
    { name: 'Margem / Lucratividade: ((A - B) / A) * 100', value: '((A - B) / A) * 100', desc: 'A: Faturamento, B: Custos. Retorna Margem em %.' },
    { name: 'Conversão / Porcentagem: (A / B) * 100', value: '(A / B) * 100', desc: 'A: Sucessos, B: Total. Retorna taxa de atingimento/conversão.' },
    { name: 'Divisão Simples: A / B', value: 'A / B', desc: 'Divide variável A pela variável B.' },
    { name: 'Soma Simples: A + B', value: 'A + B', desc: 'Soma das variáveis A e B.' },
    { name: 'Subtração Simples: A - B', value: 'A - B', desc: 'Diferença entre variável A e B (ex: Lucro Líquido).' },
    { name: 'Multiplicação: A * B', value: 'A * B', desc: 'Multiplica variável A por B.' }
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
      const parts = str.split('.');
      if (parts.length > 2 || parts[parts.length - 1].length > 2) {
        str = str.replace(/\./g, '');
      }
    }
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  };

  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  // Callback ao criar indicador via voz ou texto (IA)
  const handleAISuccess = async (result: any): Promise<boolean> => {
    if (result.action === 'create' && result.data) {
      const { 
        name, 
        department_id, 
        target, 
        unit, 
        year,
        chart_type,
        indicator_type,
        variables,
        formula,
        custom_unit
      } = result.data;
      
      const defaultAccum = (unit === 'R$' || unit === 'qtd' || unit === 'horas') ? 'sum' : 'latest';
      const success = await createIndicator({
        name,
        department_id: department_id || null,
        target: cleanNumber(target),
        unit: (unit as Indicator['unit']) || '%',
        year: Number(year) || 2026,
        chart_type: chart_type || 'line',
        indicator_type: indicator_type || 'simple',
        accumulation_type: defaultAccum,
        variables: variables || [],
        formula: formula || '',
        custom_unit: custom_unit || '',
        measurements: []
      });

      if (success) {
        triggerToast(`Indicador "${name}" criado com sucesso via IA!`);
      }
      return success;
    }
    return false;
  };

  // Handlers do Modal de Cadastro
  const handleCreateClick = () => {
    setSelectedInd(null);
    setIndName('');
    setIndDeptId('');
    setIndDescription('');
    setIndUnit('%');
    setIndCustomUnit('');
    setIndTarget('');
    setIndYear('2026');
    setIndChartType('line');
    setIndIndicatorType('simple');
    setIndAccumulationType('latest');
    setIndVariables([]);
    setIndFormula('');
    setIsModalOpen(true);
  };

  const handleEditClick = (ind: Indicator) => {
    setSelectedInd(ind);
    setIndName(ind.name);
    setIndDeptId(ind.department_id || '');
    setIndDescription(ind.description || '');
    setIndUnit(ind.unit);
    setIndCustomUnit(ind.custom_unit || '');
    setIndTarget(ind.target.toString());
    setIndYear(ind.year.toString());
    setIndChartType(ind.chart_type || 'line');
    setIndIndicatorType(ind.indicator_type || 'simple');
    const defaultAccum = (ind.unit === 'R$' || ind.unit === 'qtd' || ind.unit === 'horas') ? 'sum' : 'latest';
    setIndAccumulationType(ind.accumulation_type || defaultAccum);
    setIndVariables(ind.variables || []);
    setIndFormula(ind.formula || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o indicador "${name}"?`);
    if (confirm) {
      const success = await deleteIndicator(id);
      if (success) {
        triggerToast(`Indicador "${name}" excluído com sucesso.`);
      }
    }
  };

  // Gerenciador de Variáveis no Cadastro
  const handleAddVariable = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const nextId = letters[indVariables.length] || `V${indVariables.length + 1}`;
    const newVar: IndicatorVariable = {
      id: nextId,
      name: '',
      unit: 'R$'
    };
    setIndVariables([...indVariables, newVar]);
  };

  const handleRemoveVariable = (index: number) => {
    const updated = indVariables.filter((_, i) => i !== index);
    // Reordenar IDs para manter A, B, C...
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const reordered = updated.map((v, i) => ({
      ...v,
      id: letters[i] || `V${i + 1}`
    }));
    setIndVariables(reordered);
  };

  const handleVariableChange = (index: number, key: keyof IndicatorVariable, value: string) => {
    const updated = [...indVariables];
    updated[index] = { ...updated[index], [key]: value };
    setIndVariables(updated);
  };

  // Handler do Modal de Medições
  const handleOpenMeasurements = (ind: Indicator) => {
    setSelectedInd(ind);
    
    // Inicializar os inputs com as medições existentes
    const values: Record<number, string> = {};
    const varValues: Record<number, Record<string, string>> = {};

    monthLabels.forEach(m => {
      const match = ind.measurements.find(meas => meas.month === m.num);
      values[m.num] = match && match.value !== undefined ? match.value.toString() : '';
      
      const vVals: Record<string, string> = {};
      if (ind.variables) {
        ind.variables.forEach(v => {
          vVals[v.id] = match && match.variable_values && match.variable_values[v.id] !== undefined
            ? match.variable_values[v.id].toString()
            : '';
        });
      }
      varValues[m.num] = vVals;
    });

    setMonthlyValues(values);
    setMonthlyVariableValues(varValues);
    setIsMeasurementsModalOpen(true);
  };

  // Salvar Cadastro Geral
  const handleSaveIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indName.trim() || !indTarget.trim()) return;

    setModalLoading(true);
    let success = false;

    // Se escolher unidade customizada, o unit físico é 'outros'
    const finalUnit = indUnit === 'outros' ? 'outros' : indUnit;

    const dataPayload: Partial<Indicator> = {
      name: indName,
      department_id: indDeptId || null,
      description: indDescription,
      unit: finalUnit as Indicator['unit'],
      custom_unit: indUnit === 'outros' ? indCustomUnit : '',
      target: cleanNumber(indTarget),
      year: Number(indYear) || 2026,
      chart_type: indChartType,
      indicator_type: indIndicatorType,
      accumulation_type: indAccumulationType,
      variables: indIndicatorType === 'calculated' ? indVariables : [],
      formula: indIndicatorType === 'calculated' ? indFormula : ''
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
      triggerToast(`Indicador "${indName}" salvo com sucesso!`);
    } else {
      alert('Erro ao salvar o indicador.');
    }
  };

  // Salvar Lançamento de Medições
  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInd) return;

    setModalLoading(true);

    const measurementsArr: IndicatorMeasurement[] = [];

    monthLabels.forEach(m => {
      if (selectedInd.indicator_type === 'calculated') {
        const vValsStr = monthlyVariableValues[m.num] || {};
        const vValsNum: Record<string, number> = {};
        
        // Verifica se pelo menos uma variável foi preenchida para salvar este mês
        let hasData = false;
        if (selectedInd.variables) {
          selectedInd.variables.forEach(v => {
            if (vValsStr[v.id] !== undefined && vValsStr[v.id].trim() !== '') {
              vValsNum[v.id] = cleanNumber(vValsStr[v.id]);
              hasData = true;
            }
          });
        }

        if (hasData) {
          // Calcula o valor final no frontend para persistir e renderizar rápido em outros lugares
          const computedValue = evaluateFormula(selectedInd.formula || '', vValsNum);
          measurementsArr.push({
            month: m.num,
            value: Number(computedValue.toFixed(2)),
            variable_values: vValsNum
          });
        }
      } else {
        const valStr = monthlyValues[m.num];
        if (valStr !== undefined && valStr.trim() !== '') {
          measurementsArr.push({
            month: m.num,
            value: cleanNumber(valStr)
          });
        }
      }
    });

    measurementsArr.sort((a, b) => a.month - b.month);

    const success = await updateIndicator(selectedInd.id, {
      measurements: measurementsArr
    });

    setModalLoading(false);
    if (success) {
      setIsMeasurementsModalOpen(false);
      setSelectedInd(null);
      triggerToast('Resultados mensais gravados e atualizados!');
    } else {
      alert('Erro ao atualizar as medições.');
    }
  };

  // Lógica de cálculo dinâmico para preenchimento de indicador calculado
  const getComputedMonthValue = (monthNum: number, currentFormula: string, variablesList: IndicatorVariable[]) => {
    const vValsStr = monthlyVariableValues[monthNum] || {};
    const vValsNum: Record<string, number> = {};
    let allVariablesHaveValue = true;
    
    variablesList.forEach(v => {
      if (vValsStr[v.id] === undefined || vValsStr[v.id].trim() === '') {
        allVariablesHaveValue = false;
      }
      vValsNum[v.id] = cleanNumber(vValsStr[v.id]);
    });

    if (!allVariablesHaveValue) return null;
    return evaluateFormula(currentFormula, vValsNum);
  };

  // --- LÓGICA DE UPLOAD/IMPORTAÇÃO CSV ---
  
  const getMonthNumber = (val: string): number => {
    const cleanVal = val.toLowerCase().trim();
    if (!isNaN(Number(cleanVal))) {
      const num = Number(cleanVal);
      if (num >= 1 && num <= 12) return num;
    }
    const monthMap: Record<string, number> = {
      'jan': 1, 'janeiro': 1, 'january': 1,
      'fev': 2, 'fevereiro': 2, 'february': 2, 'feb': 2,
      'mar': 3, 'março': 3, 'marco': 3, 'march': 3,
      'abr': 4, 'abril': 4, 'april': 4, 'apr': 4,
      'mai': 5, 'maio': 5, 'may': 5,
      'jun': 6, 'junho': 6, 'june': 6,
      'jul': 7, 'julho': 7, 'july': 7,
      'ago': 8, 'agosto': 8, 'august': 8, 'aug': 8,
      'set': 9, 'setembro': 9, 'september': 9, 'sep': 9,
      'out': 10, 'outubro': 10, 'october': 10, 'oct': 10,
      'nov': 11, 'novembro': 11, 'november': 11,
      'dez': 12, 'dezembro': 12, 'december': 12, 'dec': 12
    };
    return monthMap[cleanVal] || 0;
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCsvError('Não foi possível ler o arquivo.');
        return;
      }
      
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        setCsvError('O arquivo CSV está vazio.');
        return;
      }
      
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map(line => {
        const cols = line.split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
        const obj: any = {};
        headers.forEach((h, index) => {
          obj[h] = cols[index] || '';
        });
        return obj;
      });

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Mapeamento padrão do Mês
      const mapping: Record<string, string> = {};
      const monthCol = headers.find(h => {
        const hl = h.toLowerCase();
        return hl.includes('mes') || hl.includes('mês') || hl.includes('month');
      });
      if (monthCol) {
        mapping['month'] = monthCol;
      }
      setCsvColumnMapping(mapping);
      setCsvStep(2);
    };
    reader.readAsText(file);
  };

  const handleCsvConfirmImport = async () => {
    if (!csvColumnMapping['month']) {
      alert('Selecione a coluna que corresponde ao Mês.');
      return;
    }

    setModalLoading(true);

    try {
      if (csvMappingMode === 'create') {
        // Criar múltiplos indicadores simples a partir de colunas
        const monthCol = csvColumnMapping['month'];
        const indicatorCols = csvHeaders.filter(h => h !== monthCol);

        let createdCount = 0;
        for (const colName of indicatorCols) {
          const measurements: IndicatorMeasurement[] = [];
          
          csvRows.forEach(row => {
            const mVal = getMonthNumber(row[monthCol]);
            const valStr = row[colName];
            if (mVal >= 1 && mVal <= 12 && valStr !== undefined && valStr.trim() !== '') {
              measurements.push({
                month: mVal,
                value: cleanNumber(valStr)
              });
            }
          });

          if (measurements.length > 0) {
            measurements.sort((a, b) => a.month - b.month);
            // Calcula um target fictício ou médio apenas para não quebrar a validação
            const avgVal = measurements.reduce((acc, curr) => acc + (curr.value || 0), 0) / measurements.length;
            const target = Number((avgVal * 1.1).toFixed(0)); // target = média + 10%

            await createIndicator({
              name: colName,
              department_id: null,
              description: `Importado via planilha CSV.`,
              unit: '%',
              target: target || 100,
              year: filterYear,
              chart_type: 'line',
              indicator_type: 'simple',
              variables: [],
              measurements
            });
            createdCount++;
          }
        }
        triggerToast(`${createdCount} indicadores criados via importação!`);
      } else {
        // Atualizar indicador existente com mapeamento de colunas do CSV
        const targetInd = indicators.find(i => i.id === csvSelectedIndId);
        if (!targetInd) {
          alert('Selecione o indicador que deseja atualizar.');
          setModalLoading(false);
          return;
        }

        const monthCol = csvColumnMapping['month'];
        const measurements: IndicatorMeasurement[] = [];

        csvRows.forEach(row => {
          const mVal = getMonthNumber(row[monthCol]);
          if (mVal < 1 || mVal > 12) return;

          if (targetInd.indicator_type === 'calculated') {
            const vVals: Record<string, number> = {};
            let hasData = false;

            if (targetInd.variables) {
              targetInd.variables.forEach(v => {
                const mappedCol = csvColumnMapping[v.id];
                if (mappedCol && row[mappedCol] !== undefined && row[mappedCol].trim() !== '') {
                  vVals[v.id] = cleanNumber(row[mappedCol]);
                  hasData = true;
                }
              });
            }

            if (hasData) {
              const compVal = evaluateFormula(targetInd.formula || '', vVals);
              measurements.push({
                month: mVal,
                value: Number(compVal.toFixed(2)),
                variable_values: vVals
              });
            }
          } else {
            const mappedCol = csvColumnMapping['value'];
            if (mappedCol && row[mappedCol] !== undefined && row[mappedCol].trim() !== '') {
              measurements.push({
                month: mVal,
                value: cleanNumber(row[mappedCol])
              });
            }
          }
        });

        if (measurements.length > 0) {
          measurements.sort((a, b) => a.month - b.month);
          await updateIndicator(targetInd.id, {
            measurements
          });
          triggerToast(`Indicador "${targetInd.name}" atualizado via importação!`);
        } else {
          alert('Nenhum dado válido pôde ser importado.');
        }
      }

      setIsCsvModalOpen(false);
      resetCsvState();
    } catch (err) {
      console.error(err);
      alert('Erro ao processar importação.');
    } finally {
      setModalLoading(false);
    }
  };

  const resetCsvState = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvSelectedIndId('');
    setCsvColumnMapping({});
    setCsvError(null);
    setCsvStep(1);
  };

  const downloadSampleCsv = () => {
    let headers = 'Mês, Faturamento, Custos, NPS\n';
    let row1 = 'Janeiro, 210000, 180000, 80\n';
    let row2 = 'Fevereiro, 240000, 200000, 82\n';
    let row3 = 'Março, 255000, 200000, 86\n';
    
    const blob = new Blob([headers + row1 + row2 + row3], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'exemplo_indicadores_senda.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERS DE GRÁFICOS DINÂMICOS DO RECHARTS ---
  const formatChartData = (measurements: IndicatorMeasurement[]) => {
    const maxMonth = measurements.length > 0 ? Math.max(...measurements.map(m => m.month)) : 0;
    const limitMonths = Math.max(maxMonth, 5);
    const shortMonthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return Array.from({ length: limitMonths }).map((_, index) => {
      const month = index + 1;
      const measure = measurements.find(m => m.month === month);
      return {
        name: shortMonthLabels[index],
        Valor: measure && measure.value !== undefined ? measure.value : 0
      };
    });
  };

  const renderIndicatorChart = (ind: Indicator) => {
    const chartData = formatChartData(ind.measurements);
    const chartType = ind.chart_type || 'line';

    if (ind.measurements.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-[11px] text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 p-4 min-h-[150px]">
          <Info className="w-5 h-5 text-slate-300 mb-1.5" />
          Nenhum dado mensal lançado neste ano.
          <button 
            onClick={() => handleOpenMeasurements(ind)}
            className="text-[#C5A85A] hover:underline font-bold mt-1 text-[10px]"
          >
            Lançar Resultados
          </button>
        </div>
      );
    }

    return (
      <div className="h-[160px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${ind.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C5A85A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C5A85A" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area 
                type="monotone" 
                dataKey="Valor" 
                stroke="#C5A85A" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill={`url(#grad-${ind.id})`}
                dot={{ fill: '#C5A85A', strokeWidth: 1 }}
              />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
              <Bar 
                dataKey="Valor" 
                fill="#C5A85A" 
                radius={[3, 3, 0, 0]} 
                maxBarSize={30}
              />
            </BarChart>
          ) : (
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
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  // Suggestions AI
  const suggestions = [
    'Cadastrar meta de faturamento de R$ 300.000 para o setor de Finanças',
    'Adicionar indicador de NPS de 85% para o Comercial em 2026',
    'Criar indicador calculado Margem de Lucro com Faturamento Bruto e Custos Operacionais'
  ];

  // Filtros de dados
  const filteredIndicators = indicators.filter(ind => {
    const matchesDept = filterDept === 'all' || ind.department_id === filterDept;
    const matchesYear = ind.year === filterYear;
    const matchesSearch = ind.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesDept && matchesYear && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12 relative">
      
      {/* Toast de Sucesso customizado para feedback de IA e salvamento */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-sans text-xs px-4 py-3 rounded-md shadow-lg border border-emerald-500/30 flex items-center gap-2 animate-scaleUp">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#C5A85A]" />
            Indicadores Estratégicos (KPIs)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Acompanhamento avançado, variáveis e fórmulas de gestão corporativa da Senda.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-[#1E2538] border border-slate-250 text-xs font-semibold px-4 py-2.5 rounded-md shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#C5A85A]" />
            Importar CSV
          </button>

          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-[#1E2538] hover:bg-[#2c3752] text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow transition-colors"
          >
            <Plus className="w-4 h-4 text-[#C5A85A]" />
            Novo Indicador
          </button>
        </div>
      </div>

      {/* Input de IA Contextual */}
      <SmartInput
        context="indicators"
        placeholder="Adicione um indicador por voz ou texto... (ex: 'Criar indicador calculado Margem com variáveis Faturamento e Custo')"
        onSuccess={handleAISuccess}
        existingData={{ departments }}
        suggestions={suggestions}
      />

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
            className="bg-slate-50 text-xs text-slate-750 border border-slate-200 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredIndicators.length > 0 ? (
          filteredIndicators.map((ind) => {
            const measurements = ind.measurements || [];
            const hasData = measurements.length > 0;
            const accumulationType = ind.accumulation_type || 'latest';
            
            let displayValue = 0;
            let label = 'Medição Recente';
            
            if (accumulationType === 'sum') {
              label = 'Total Acumulado';
              displayValue = measurements.reduce((acc, m) => acc + (typeof m.value === 'number' ? m.value : 0), 0);
            } else if (accumulationType === 'avg') {
              label = 'Média Período';
              const validMeas = measurements.filter(m => typeof m.value === 'number');
              const sum = validMeas.reduce((acc, m) => acc + (m.value || 0), 0);
              displayValue = validMeas.length > 0 ? (sum / validMeas.length) : 0;
            } else {
              label = 'Medição Recente';
              const lastMeas = measurements.length > 0 ? measurements[measurements.length - 1] : null;
              displayValue = (lastMeas && typeof lastMeas.value === 'number') ? lastMeas.value : 0;
            }
            
            const currentVal = hasData ? displayValue : null;
            const targetMet = currentVal !== null && currentVal >= ind.target;
            const deptName = departments.find(d => d.id === ind.department_id)?.name || 'Geral';
            
            const displayUnit = ind.unit === 'outros' ? (ind.custom_unit || 'unidades') : ind.unit;

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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-550 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          {deptName}
                        </span>
                        {ind.indicator_type === 'calculated' && (
                          <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 border border-amber-200/30">
                            <Calculator className="w-2.5 h-2.5" /> Calculado
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-base mt-2">{ind.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 min-h-[32px]">{ind.description || 'Sem descrição'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Meta {ind.year}</p>
                      <p className="text-lg font-black text-[#C5A85A]">
                        {displayUnit === 'R$' ? 'R$ ' : ''}
                        {ind.target.toLocaleString('pt-BR')}
                        {displayUnit !== 'R$' && ` ${displayUnit}`}
                      </p>
                    </div>
                  </div>

                  {/* Resultados Rápidos */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-md border border-slate-100 mb-6">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">{label}</span>
                      <span className="text-sm font-bold text-slate-800">
                        {currentVal !== null ? (
                          <>
                            {displayUnit === 'R$' ? 'R$ ' : ''}
                            {currentVal.toLocaleString('pt-BR', { maximumFractionDigits: displayUnit === '%' ? 1 : 0 })}
                            {displayUnit !== 'R$' && ` ${displayUnit}`}
                          </>
                        ) : 'Sem medição'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Atingimento</span>
                      <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${targetMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {currentVal !== null ? (
                          <>
                            {targetMet ? <CheckCircle className="w-3.5 h-3.5 fill-emerald-500/10" /> : <TrendingUp className="w-3.5 h-3.5" />}
                            {Math.round((currentVal / ind.target) * 100)}% da meta
                          </>
                        ) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Gráfico do Indicador com base na escolha do usuário */}
                  <div className="mt-2">
                    {renderIndicatorChart(ind)}
                  </div>
                </div>

                {/* Ações adicionais do Indicador */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Ano Fiscal: {ind.year}
                    {ind.chart_type && (
                      <span className="capitalize ml-1">• Gráfico: {ind.chart_type}</span>
                    )}
                  </div>
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

      {/* 1. MODAL DE CADASTRO / EDIÇÃO DE INDICADORES (WIZARD) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  {selectedInd ? 'Editar Indicador' : 'Novo Indicador Corporativo'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedInd(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIndicator} className="p-6 space-y-5 text-left">
              
              {/* Seleção do Tipo de Indicador */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setIndIndicatorType('simple')}
                  className={`py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    indIndicatorType === 'simple' 
                      ? 'bg-[#1E2538] text-white shadow-sm' 
                      : 'text-slate-550 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Simples (Valor Direto)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIndIndicatorType('calculated');
                    if (indVariables.length === 0) {
                      setIndVariables([
                        { id: 'A', name: 'Variável A', unit: 'R$' },
                        { id: 'B', name: 'Variável B', unit: 'R$' }
                      ]);
                    }
                  }}
                  className={`py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    indIndicatorType === 'calculated' 
                      ? 'bg-[#1E2538] text-white shadow-sm' 
                      : 'text-slate-550 hover:bg-slate-50'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Calculado (Por Fórmula)
                </button>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Nome do Indicador *
                  </label>
                  <input
                    type="text"
                    required
                    value={indName}
                    onChange={e => setIndName(e.target.value)}
                    placeholder="Ex: Lucratividade, Faturamento, NPS"
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Setor Vinculado
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
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Descrição / Objetivo
                </label>
                <textarea
                  value={indDescription}
                  onChange={e => setIndDescription(e.target.value)}
                  placeholder="Explique a finalidade estratégica deste indicador..."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2 px-3 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              {/* Seção dinâmica de variáveis e fórmula se for calculado */}
              {indIndicatorType === 'calculated' && (
                <div className="border border-amber-200/50 bg-amber-50/20 p-4 rounded-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Layers className="w-4 h-4 text-[#C5A85A]" />
                      Configuração de Variáveis
                    </span>
                    <button
                      type="button"
                      onClick={handleAddVariable}
                      className="text-[10px] font-bold bg-[#1E2538] hover:bg-[#2c3752] text-white px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-[#C5A85A]" /> Adicionar Variável
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {indVariables.map((v, index) => (
                      <div key={v.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                        <span className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-650 text-xs font-bold rounded">
                          {v.id}
                        </span>
                        
                        <input
                          type="text"
                          required
                          value={v.name}
                          onChange={e => handleVariableChange(index, 'name', e.target.value)}
                          placeholder="Nome (ex: Faturamento)"
                          className="flex-1 bg-slate-50 text-[11px] text-slate-700 border border-slate-200 rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                        />

                        <select
                          value={v.unit}
                          onChange={e => handleVariableChange(index, 'unit', e.target.value)}
                          className="bg-slate-50 text-[11px] text-slate-750 border border-slate-200 rounded py-1 px-1.5 focus:outline-none"
                        >
                          <option value="R$">R$</option>
                          <option value="%">%</option>
                          <option value="qtd">Qtd</option>
                          <option value="horas">Horas</option>
                          <option value="outros">Outro</option>
                        </select>

                        {indVariables.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(index)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Fórmula */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                        Fórmula Matemática *
                      </label>
                      
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            setIndFormula(e.target.value);
                          }
                        }}
                        className="bg-white text-[10px] font-bold text-slate-600 border border-slate-200 px-2 py-0.5 rounded focus:outline-none"
                      >
                        <option value="">-- Carregar Fórmula Exemplo --</option>
                        {formulasPredefinidas.slice(1).map((f, i) => (
                          <option key={i} value={f.value}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={indFormula}
                        onChange={e => setIndFormula(e.target.value)}
                        placeholder="Ex: ((A - B) / A) * 100"
                        className="flex-1 bg-white font-mono text-xs text-slate-750 border border-slate-200 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] uppercase"
                      />
                      <div className="text-[10px] text-slate-400 bg-slate-100 p-2 rounded border font-sans">
                        Use as letras <strong>{indVariables.map(v => v.id).join(', ')}</strong> e operadores <strong>+, -, *, /, (, )</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configurações de Meta, Unidade e Gráficos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Unidade
                  </label>
                  <select
                    value={indUnit}
                    onChange={e => {
                      const val = e.target.value as Indicator['unit'];
                      setIndUnit(val);
                      const defaultAccum = (val === 'R$' || val === 'qtd' || val === 'horas') ? 'sum' : 'latest';
                      setIndAccumulationType(defaultAccum);
                    }}
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none"
                  >
                    <option value="%">%</option>
                    <option value="R$">R$</option>
                    <option value="qtd">Qtd</option>
                    <option value="horas">Horas</option>
                    <option value="outros">Customizado</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Ano Fiscal
                  </label>
                  <select
                    value={indYear}
                    onChange={e => setIndYear(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Cálculo de Atingimento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">
                  Cálculo do Progresso (Atingimento da Meta Anual)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIndAccumulationType('sum')}
                    className={`py-2.5 px-3 border rounded-md transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer ${
                      indAccumulationType === 'sum' 
                        ? 'border-[#C5A85A] bg-[#C5A85A]/5 text-slate-800 font-bold ring-1 ring-[#C5A85A]' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-[11px] font-bold">Acumulado (Soma)</span>
                    <span className="text-[9px] text-slate-400 font-normal leading-tight">Soma os meses (Faturamento)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIndAccumulationType('latest')}
                    className={`py-2.5 px-3 border rounded-md transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer ${
                      indAccumulationType === 'latest' 
                        ? 'border-[#C5A85A] bg-[#C5A85A]/5 text-slate-800 font-bold ring-1 ring-[#C5A85A]' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-[11px] font-bold">Último Lançamento</span>
                    <span className="text-[9px] text-slate-400 font-normal leading-tight">Mês mais recente (NPS, Headcount)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIndAccumulationType('avg')}
                    className={`py-2.5 px-3 border rounded-md transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer ${
                      indAccumulationType === 'avg' 
                        ? 'border-[#C5A85A] bg-[#C5A85A]/5 text-slate-800 font-bold ring-1 ring-[#C5A85A]' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-[11px] font-bold">Média do Período</span>
                    <span className="text-[9px] text-slate-400 font-normal leading-tight">Média aritmética (Margem %)</span>
                  </button>
                </div>
              </div>

              {/* Se escolher customizado, exibe input extra */}
              {indUnit === 'outros' && (
                <div className="animate-scaleUp">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Escreva a Unidade Customizada *
                  </label>
                  <input
                    type="text"
                    required
                    value={indCustomUnit}
                    onChange={e => setIndCustomUnit(e.target.value)}
                    placeholder="Ex: clientes, leads, contratos"
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  />
                </div>
              )}

              {/* Tipo de Visualização Gráfica */}
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">
                  Estilo de Gráfico no Card
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setIndChartType('line')}
                    className={`py-2 px-3 border text-xs font-bold rounded-md transition-all flex flex-col items-center gap-1 ${
                      indChartType === 'line' 
                        ? 'border-[#C5A85A] bg-[#C5A85A]/5 text-[#1E2538]' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-[#C5A85A]" />
                    Linha
                  </button>

                  <button
                    type="button"
                    onClick={() => setIndChartType('bar')}
                    className={`py-2 px-3 border text-xs font-bold rounded-md transition-all flex flex-col items-center gap-1 ${
                      indChartType === 'bar' 
                        ? 'border-[#C5A85A] bg-[#C5A85A]/5 text-[#1E2538]' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-[#C5A85A]" />
                    Barras
                  </button>

                  <button
                    type="button"
                    onClick={() => setIndChartType('area')}
                    className={`py-2 px-3 border text-xs font-bold rounded-md transition-all flex flex-col items-center gap-1 ${
                      indChartType === 'area' 
                        ? 'border-[#C5A85A] bg-[#C5A85A]/5 text-[#1E2538]' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-[#C5A85A]" />
                    Área
                  </button>
                </div>
              </div>

              {/* Botões de Ação */}
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

      {/* 2. MODAL DE LANÇAMENTO DE MEDIÇÕES MENSAIS */}
      {isMeasurementsModalOpen && selectedInd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Lançar Resultados Mensais
                </h3>
                <p className="text-[10px] text-slate-350 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  Indicador: <strong className="text-white">{selectedInd.name}</strong> 
                  {selectedInd.indicator_type === 'calculated' && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 rounded font-bold">Calculado</span>
                  )}
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
              <div className="bg-slate-50 p-4 rounded-md border border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 pr-4">
                  {selectedInd.indicator_type === 'calculated' 
                    ? 'Insira os valores mensais de cada variável de base. O resultado do KPI é gerado na hora.'
                    : 'Preencha o realizado de cada mês. Deixe em branco os meses sem apuração.'}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Meta do KPI</span>
                  <span className="text-sm font-extrabold text-[#C5A85A]">
                    {selectedInd.unit === 'R$' ? 'R$ ' : ''}
                    {selectedInd.target.toLocaleString('pt-BR')}
                    {selectedInd.unit !== 'R$' && ` ${selectedInd.unit === 'outros' ? (selectedInd.custom_unit || '') : selectedInd.unit}`}
                  </span>
                </div>
              </div>

              {/* Lista dos 12 meses */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {monthLabels.map(m => {
                  const calculatedResult = selectedInd.indicator_type === 'calculated'
                    ? getComputedMonthValue(m.num, selectedInd.formula || '', selectedInd.variables || [])
                    : null;

                  return (
                    <div 
                      key={m.num} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-100 rounded-md shadow-sm hover:border-slate-200 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-700 w-24">
                        {m.label}
                      </span>

                      {selectedInd.indicator_type === 'calculated' ? (
                        /* Campo de Variáveis em Linha */
                        <div className="flex-1 flex flex-wrap gap-2 items-center justify-end">
                          {selectedInd.variables?.map(v => (
                            <div key={v.id} className="relative w-28">
                              <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[9px] text-slate-400 font-bold uppercase">
                                {v.id}:
                              </span>
                              <input
                                type="text"
                                value={(monthlyVariableValues[m.num] && monthlyVariableValues[m.num][v.id]) || ''}
                                onChange={e => {
                                  const updated = { ...(monthlyVariableValues[m.num] || {}) };
                                  updated[v.id] = e.target.value;
                                  setMonthlyVariableValues(prev => ({
                                    ...prev,
                                    [m.num]: updated
                                  }));
                                }}
                                placeholder={v.unit}
                                className="w-full bg-slate-50 text-[10px] text-slate-700 border border-slate-200 rounded py-1 pl-6 pr-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              />
                            </div>
                          ))}

                          {/* Preview do resultado calculado */}
                          <div className="w-20 text-right font-sans">
                            <span className="text-[8px] text-slate-400 block uppercase font-bold">KPI Calc.</span>
                            <span className={`text-xs font-extrabold ${calculatedResult !== null ? 'text-slate-800' : 'text-slate-350'}`}>
                              {calculatedResult !== null ? (
                                <>
                                  {Number(calculatedResult).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                  {selectedInd.unit === '%' ? '%' : ''}
                                </>
                              ) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Campo manual direto */
                        <div className="relative w-36">
                          {selectedInd.unit === 'R$' && (
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] text-slate-450 font-bold">R$</span>
                          )}
                          <input
                            type="text"
                            value={monthlyValues[m.num] || ''}
                            onChange={e => setMonthlyValues(prev => ({ ...prev, [m.num]: e.target.value }))}
                            placeholder="Não apurado"
                            className={`w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] ${
                              selectedInd.unit === 'R$' ? 'pl-8' : ''
                            }`}
                          />
                          {selectedInd.unit === '%' && (
                            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[10px] text-slate-450 font-bold">%</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botões de Salvar */}
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
                      Salvando...
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

      {/* 3. MODAL DE IMPORTAÇÃO DE PLANILHA CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto font-sans animate-scaleUp">
            
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Assistente de Importação CSV
                </h3>
              </div>
              <button 
                onClick={() => { setIsCsvModalOpen(false); resetCsvState(); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-left">
              
              {/* Progresso do Wizard */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    csvStep >= 1 ? 'bg-[#1E2538] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>1</span>
                  <span className="text-xs font-semibold text-slate-700">Arquivo</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-100 flex-1 mx-2" />
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    csvStep >= 2 ? 'bg-[#1E2538] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>2</span>
                  <span className="text-xs font-semibold text-slate-700">Mapeamento</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-100 flex-1 mx-2" />
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    csvStep >= 3 ? 'bg-[#1E2538] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>3</span>
                  <span className="text-xs font-semibold text-slate-700">Importar</span>
                </div>
              </div>

              {/* PASSO 1: UPLOAD DO ARQUIVO */}
              {csvStep === 1 && (
                <div className="space-y-4">
                  <div className="border border-dashed border-slate-350/70 hover:border-[#C5A85A] rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors bg-slate-50 cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-[#C5A85A] mb-3" />
                    <span className="text-xs font-bold text-slate-700 block">Clique ou arraste seu arquivo CSV</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Formato suportado: .csv delimitado por vírgula ou ponto-e-vírgula</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleCsvFileChange} 
                      accept=".csv" 
                      className="hidden" 
                    />
                  </div>

                  <div className="bg-slate-100 p-4 rounded-md flex items-start gap-3">
                    <Info className="w-4 h-4 text-[#C5A85A] shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700">Dica de Layout:</p>
                      <p>O CSV deve conter uma coluna para identificar os meses (ex: Janeiro, 1, Jan) e outras colunas com os valores correspondentes.</p>
                      <button 
                        onClick={downloadSampleCsv} 
                        className="text-[#C5A85A] hover:underline font-bold mt-1 block"
                      >
                        Clique aqui para baixar um modelo CSV
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 2: CONFIGURAÇÃO DE MAPEAMENTO */}
              {csvStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                      Qual é o modo de importação?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setCsvMappingMode('create');
                          setCsvColumnMapping({});
                        }}
                        className={`p-3 border rounded-md text-left transition-all flex flex-col gap-1 ${
                          csvMappingMode === 'create'
                            ? 'border-[#C5A85A] bg-[#C5A85A]/5'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold text-[#1E2538] flex items-center gap-1">
                          <PlusCircle className="w-4 h-4 text-[#C5A85A]" /> Criar Novos Indicadores
                        </span>
                        <span className="text-[10px] text-slate-400">Cada coluna de dados do CSV virará um novo indicador simples.</span>
                      </button>

                      <button
                        onClick={() => {
                          setCsvMappingMode('update');
                          setCsvColumnMapping({});
                        }}
                        className={`p-3 border rounded-md text-left transition-all flex flex-col gap-1 ${
                          csvMappingMode === 'update'
                            ? 'border-[#C5A85A] bg-[#C5A85A]/5'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold text-[#1E2538] flex items-center gap-1">
                          <Layers className="w-4 h-4 text-[#C5A85A]" /> Atualizar Existente
                        </span>
                        <span className="text-[10px] text-slate-400">Alimentar dados de um indicador (simples ou calculado) cadastrado.</span>
                      </button>
                    </div>
                  </div>

                  {/* Seleção de Mês e Indicador Alvo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                        Coluna de Mês no CSV *
                      </label>
                      <select
                        value={csvColumnMapping['month'] || ''}
                        onChange={e => setCsvColumnMapping(prev => ({ ...prev, month: e.target.value }))}
                        className="w-full bg-slate-50 text-xs text-slate-705 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none"
                      >
                        <option value="">-- Selecione a coluna --</option>
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {csvMappingMode === 'update' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                          Selecione o Indicador para Alimentar *
                        </label>
                        <select
                          value={csvSelectedIndId}
                          onChange={e => {
                            setCsvSelectedIndId(e.target.value);
                            setCsvColumnMapping({ month: csvColumnMapping['month'] || '' });
                          }}
                          className="w-full bg-slate-50 text-xs text-slate-705 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none"
                        >
                          <option value="">-- Selecione o indicador --</option>
                          {indicators.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.indicator_type === 'calculated' ? 'Calculado' : 'Simples'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Mapeamento de colunas de variáveis para o modo update */}
                  {csvMappingMode === 'update' && csvSelectedIndId && (
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-100 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">
                        Associação de Variáveis do Indicador
                      </span>

                      {indicators.find(i => i.id === csvSelectedIndId)?.indicator_type === 'calculated' ? (
                        /* Mapeia cada variável do indicador calculado */
                        <div className="space-y-2">
                          {indicators.find(i => i.id === csvSelectedIndId)?.variables?.map(v => (
                            <div key={v.id} className="flex items-center gap-3 bg-white p-2 rounded border border-slate-200">
                              <span className="w-6 h-6 flex items-center justify-center bg-[#1E2538] text-[#C5A85A] text-xs font-bold rounded">
                                {v.id}
                              </span>
                              <div className="flex-1 text-left">
                                <span className="text-xs font-bold text-slate-700 block">{v.name}</span>
                                <span className="text-[9px] text-slate-400 block uppercase">Unidade: {v.unit}</span>
                              </div>
                              <select
                                value={csvColumnMapping[v.id] || ''}
                                onChange={e => setCsvColumnMapping(prev => ({ ...prev, [v.id]: e.target.value }))}
                                className="bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded py-1.5 px-2 focus:outline-none w-44"
                              >
                                <option value="">-- Coluna CSV --</option>
                                {csvHeaders.filter(h => h !== csvColumnMapping['month']).map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Mapeia a medição simples direta */
                        <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                          <span className="text-xs font-bold text-slate-700">Valor Realizado do KPI</span>
                          <select
                            value={csvColumnMapping['value'] || ''}
                            onChange={e => setCsvColumnMapping(prev => ({ ...prev, value: e.target.value }))}
                            className="bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded py-1.5 px-2 focus:outline-none w-44"
                          >
                            <option value="">-- Coluna CSV --</option>
                            {csvHeaders.filter(h => h !== csvColumnMapping['month']).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pré-visualização da planilha carregada */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                      Amostra dos Dados Carregados (5 Linhas)
                    </span>
                    <div className="overflow-x-auto border border-slate-200 rounded bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-[10px]">
                        <thead className="bg-slate-50">
                          <tr>
                            {csvHeaders.map(h => (
                              <th key={h} className="px-3 py-1.5 text-left text-slate-500 font-bold uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {csvRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              {csvHeaders.map(h => (
                                <td key={h} className="px-3 py-1.5 text-slate-600 font-medium">{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Botões do Mapeamento */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCsvStep(1)}
                      className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvStep(3)}
                      disabled={!csvColumnMapping['month']}
                      className="bg-[#1E2538] hover:bg-[#2c3752] text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 3: CONFIRMAÇÃO FINAL */}
              {csvStep === 3 && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 border border-slate-150 rounded-lg">
                    <AlertTriangle className="w-12 h-12 text-[#C5A85A] mb-3" />
                    <h4 className="text-sm font-bold text-slate-800">Pronto para Importar!</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {csvMappingMode === 'create'
                        ? `O sistema irá analisar o CSV e criar múltiplos novos indicadores a partir de colunas. Quer continuar?`
                        : `O sistema irá aplicar as novas medições mensais ao indicador selecionado. Dados antigos serão sobrescritos.`}
                    </p>
                  </div>

                  {/* Detalhes do mapeamento final */}
                  <div className="bg-slate-100 p-4 rounded-md space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Arquivo Selecionado:</span>
                      <span className="font-bold text-slate-700">{csvFile?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mapeamento do Mês:</span>
                      <span className="font-bold text-[#C5A85A]">{csvColumnMapping['month']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quantidade de Linhas detectadas:</span>
                      <span className="font-bold text-slate-700">{csvRows.length} registros</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCsvStep(2)}
                      className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleCsvConfirmImport}
                      disabled={modalLoading}
                      className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2.5 px-6 rounded-md shadow transition-colors flex items-center gap-1.5 text-xs"
                    >
                      {modalLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
                          Processando...
                        </>
                      ) : (
                        'Iniciar Importação'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
