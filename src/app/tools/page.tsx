'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Briefcase, 
  FileText, 
  Calculator, 
  Sparkles, 
  ArrowLeft, 
  Loader2, 
  Copy, 
  Check, 
  ShieldAlert, 
  HelpCircle,
  FileCheck2,
  DollarSign,
  TrendingUp,
  Percent,
  Compass,
  Trash2,
  Paperclip,
  CheckCircle2
} from 'lucide-react';

// Parser simples de Markdown para HTML premium e seguro
const parseMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  let inList = false;
  const htmlLines: string[] = [];
  
  lines.forEach(line => {
    let processedLine = line.trim();
    
    // Ignorar linhas vazias ou adicionar espaçamento
    if (!processedLine) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push('<div class="h-2"></div>');
      return;
    }
    
    // H2
    if (processedLine.startsWith('## ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const titleText = processedLine.replace(/^## /, '');
      
      // Estilização condicional de cor baseada no título
      let colorClass = 'text-[#C5A85A]';
      if (titleText.toLowerCase().includes('risco') || titleText.toLowerCase().includes('atenção')) {
        colorClass = 'text-rose-500';
      } else if (titleText.toLowerCase().includes('sugestão') || titleText.toLowerCase().includes('melhoria')) {
        colorClass = 'text-emerald-500';
      }
      
      htmlLines.push(`<h2 class="text-sm font-extrabold ${colorClass} mt-5 mb-2 border-b border-slate-800/60 pb-1 uppercase tracking-wider">${titleText}</h2>`);
      return;
    }
    
    // H3
    if (processedLine.startsWith('### ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const titleText = processedLine.replace(/^### /, '');
      htmlLines.push(`<h3 class="text-xs font-bold text-slate-200 mt-3 mb-1.5">${titleText}</h3>`);
      return;
    }
    
    // Itens de lista
    const listMatch = processedLine.match(/^[\-\*]\s+(.*)/);
    if (listMatch) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc pl-4 space-y-1.5 my-2">');
        inList = true;
      }
      let itemText = listMatch[1];
      itemText = itemText
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100 font-bold">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em class="text-slate-350 italic">$1</em>');
      
      htmlLines.push(`<li class="text-xs text-slate-300 leading-relaxed">${itemText}</li>`);
      return;
    }
    
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
    
    // Blocos de código
    if (processedLine.startsWith('```')) {
      return; // Ignora tags de bloco de código no parser simples, apenas envolve com blocos estéticos
    }
    
    // Parágrafo comum
    processedLine = processedLine
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100 font-bold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="text-slate-350 italic">$1</em>');
    
    htmlLines.push(`<p class="text-xs text-slate-300 leading-relaxed mb-2">${processedLine}</p>`);
  });
  
  if (inList) {
    htmlLines.push('</ul>');
  }
  
  return htmlLines.join('\n');
};

export default function ToolsPage() {
  const { currentTenant } = useApp();
  const [activeTool, setActiveTool] = useState<'selection' | 'reviewer' | 'generator' | 'financial'>('selection');

  // Estados do Revisor de Documentos
  const [reviewDocType, setReviewDocType] = useState('Contrato de Prestação de Serviços');
  const [reviewText, setReviewText] = useState('');
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Estados adicionais do Revisor (Upload de arquivos)
  const [attachedFileName, setAttachedFileName] = useState('');
  const [extractingFile, setExtractingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Estados do Gerador de Minutas
  const [genTemplateType, setGenTemplateType] = useState('Contrato de Prestação de Serviços (PJ)');
  const [genParties, setGenParties] = useState({
    contractorName: currentTenant?.name || '',
    contractorDoc: '',
    contractedName: '',
    contractedDoc: '',
    serviceDesc: '',
    priceValue: '',
    paymentTerms: '',
    durationMonths: '12',
    confidentialPurpose: 'Proteção de segredos industriais e know-how de negócios',
    // Novos campos jurídicos avançados
    jurisdictionForo: '',
    terminationPenalty: '',
    intellectualProperty: 'Do Contratante',
    exclusivityTerms: 'Sem Exclusividade'
  });
  const [genResult, setGenResult] = useState<string | null>(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estados do Simulador de Break-Even
  const [finFixedCosts, setFinFixedCosts] = useState<number | ''>('');
  const [finContribMargin, setFinContribMargin] = useState<number | ''>('');
  const [finRevenue, setFinRevenue] = useState<number | ''>('');
  const [finSector, setFinSector] = useState('Serviços');
  const [finResultAi, setFinResultAi] = useState<string | null>(null);
  const [loadingFin, setLoadingFin] = useState(false);

  // Seletor de modo do Simulador
  const [simulMode, setSimulMode] = useState<'simplified' | 'detailed'>('simplified');

  // Custos Fixos Detalhado
  const [fixedSalaries, setFixedSalaries] = useState<number | ''>('');
  const [fixedRent, setFixedRent] = useState<number | ''>('');
  const [fixedSoftware, setFixedSoftware] = useState<number | ''>('');
  const [fixedOperational, setFixedOperational] = useState<number | ''>('');

  // Margem de Contribuição Detalhada
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [taxPercent, setTaxPercent] = useState<number | ''>('');
  const [commissionPercent, setCommissionPercent] = useState<number | ''>('');
  const [directUnitCost, setDirectUnitCost] = useState<number | ''>('');

  // Cálculo dinâmico dos Custos Fixos Totais
  const calculatedFixedCosts = useMemo(() => {
    if (simulMode === 'simplified') {
      return finFixedCosts === '' ? 0 : finFixedCosts;
    }
    return (
      (typeof fixedSalaries === 'number' ? fixedSalaries : 0) +
      (typeof fixedRent === 'number' ? fixedRent : 0) +
      (typeof fixedSoftware === 'number' ? fixedSoftware : 0) +
      (typeof fixedOperational === 'number' ? fixedOperational : 0)
    );
  }, [simulMode, finFixedCosts, fixedSalaries, fixedRent, fixedSoftware, fixedOperational]);

  // Cálculo dinâmico da Margem de Contribuição %
  const calculatedContribMargin = useMemo(() => {
    if (simulMode === 'simplified') {
      return finContribMargin === '' ? 0 : finContribMargin;
    }
    if (typeof unitPrice !== 'number' || unitPrice <= 0) {
      return 0;
    }
    const taxesVal = (typeof taxPercent === 'number' ? taxPercent : 0) / 100 * unitPrice;
    const commissionsVal = (typeof commissionPercent === 'number' ? commissionPercent : 0) / 100 * unitPrice;
    const directCostsVal = typeof directUnitCost === 'number' ? directUnitCost : 0;
    
    const totalVarCosts = taxesVal + commissionsVal + directCostsVal;
    const marginAmount = unitPrice - totalVarCosts;
    return Math.max(0, Math.min(100, Math.round((marginAmount / unitPrice) * 100)));
  }, [simulMode, finContribMargin, unitPrice, taxPercent, commissionPercent, directUnitCost]);

  // Cálculos matemáticos locais do Break-Even
  const calculatedMetrics = useMemo(() => {
    const fixed = calculatedFixedCosts;
    const margin = calculatedContribMargin;
    
    if (fixed <= 0 || margin <= 0) {
      return null;
    }
    
    const breakEven = Math.round(fixed / (margin / 100));
    let safetyMargin = 0;
    
    if (typeof finRevenue === 'number' && finRevenue > 0) {
      safetyMargin = Math.round(((finRevenue - breakEven) / finRevenue) * 100);
    }
    
    return {
      breakEvenPoint: breakEven,
      marginOfSafety: safetyMargin
    };
  }, [calculatedFixedCosts, calculatedContribMargin, finRevenue]);

  // Função para executar a chamada de IA genérica
  const callAiTool = async (toolName: string, payloadData: any) => {
    const response = await fetch('/api/ai/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: toolName,
        payload: payloadData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao processar requisição com a IA.');
    }

    const data = await response.json();
    return data.result;
  };

  // Executar Revisor
  const handleRunReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setLoadingReview(true);
    setReviewResult(null);

    try {
      const resultText = await callAiTool('reviewer', {
        documentText: reviewText,
        documentType: reviewDocType,
        tenantInfo: {
          name: currentTenant?.name || 'Senda Cliente',
          sector: 'Consultoria'
        }
      });
      setReviewResult(parseMarkdownToHtml(resultText));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao revisar documento.');
    } finally {
      setLoadingReview(false);
    }
  };

  // Manipulador de upload de arquivo do Revisor
  const handleReviewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setAttachedFileName(file.name);
    setReviewText('');

    // Verificar formato
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setFileError('Formato de arquivo inválido. Formatos suportados: PDF, PNG, JPG, JPEG, TXT e CSV.');
      setAttachedFileName('');
      return;
    }

    if (fileExt === '.txt' || fileExt === '.csv') {
      setExtractingFile(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setReviewText(text);
        setExtractingFile(false);
      };
      reader.onerror = () => {
        setFileError('Erro ao ler o arquivo de texto.');
        setExtractingFile(false);
      };
      reader.readAsText(file);
    } else {
      // PDF ou Imagem -> Envia para API de extração via IA
      setExtractingFile(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const response = await fetch('/api/ai/extract-document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              filename: file.name,
              mimeType: file.type
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Erro na extração de texto por IA.');
          }

          const result = await response.json();
          setReviewText(result.text || 'Nenhum texto extraído.');
        } catch (err: any) {
          console.error(err);
          setFileError(err.message || 'Ocorreu um erro ao extrair o texto com IA.');
          setAttachedFileName('');
        } finally {
          setExtractingFile(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReviewAttachment = () => {
    setAttachedFileName('');
    setReviewText('');
    setFileError(null);
  };

  // Executar Gerador
  const handleRunGenerator = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGen(true);
    setGenResult(null);

    try {
      const resultText = await callAiTool('generator', {
        templateType: genTemplateType,
        partiesInfo: genParties,
        tenantInfo: {
          name: currentTenant?.name || 'Senda Cliente',
          purpose: currentTenant?.purpose || ''
        }
      });
      setGenResult(resultText); // Mantém em Markdown para facilitar a cópia formatada
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao gerar minuta.');
    } finally {
      setLoadingGen(false);
    }
  };

  // Executar Análise Financeira com IA
  const handleRunFinancialAnalysis = async () => {
    if (!calculatedMetrics || typeof finRevenue !== 'number') return;

    setLoadingFin(true);
    setFinResultAi(null);

    try {
      const resultText = await callAiTool('financial_analysis', {
        fixedCosts: calculatedFixedCosts,
        contributionMargin: calculatedContribMargin,
        revenue: finRevenue,
        breakEvenPoint: calculatedMetrics.breakEvenPoint,
        marginOfSafety: calculatedMetrics.marginOfSafety,
        sector: finSector,
        simulMode: simulMode,
        fixedCostsDetail: simulMode === 'detailed' ? {
          salaries: fixedSalaries,
          rent: fixedRent,
          software: fixedSoftware,
          operational: fixedOperational
        } : null,
        marginDetail: simulMode === 'detailed' ? {
          unitPrice,
          taxPercent,
          commissionPercent,
          directUnitCost
        } : null,
        tenantInfo: {
          name: currentTenant?.name || 'Senda Cliente'
        }
      });
      setFinResultAi(parseMarkdownToHtml(resultText));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao gerar parecer financeiro.');
    } finally {
      setLoadingFin(false);
    }
  };

  // Copiar minuta para clipboard
  const copyToClipboard = () => {
    if (!genResult) return;
    navigator.clipboard.writeText(genResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. SELEÇÃO DE FERRAMENTAS */}
      {activeTool === 'selection' && (
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#C5A85A]" />
              Ferramentas Estratégicas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Utilitários corporativos práticos e geradores assistidos por inteligência artificial para o seu negócio.
            </p>
          </div>

          {/* Cards de Escolha */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Card 1: Revisor */}
            <div 
              onClick={() => setActiveTool('reviewer')}
              className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#C5A85A]/10 text-[#C5A85A] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Revisor de Documentos</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-light">
                    Faça upload ou cole contratos, NDAs ou propostas e deixe a IA auditar riscos, sugerir correções e emitir pareceres estratégicos.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-xs font-bold text-[#C5A85A] flex items-center gap-1">
                Abrir Ferramenta →
              </div>
            </div>

            {/* Card 2: Gerador */}
            <div 
              onClick={() => setActiveTool('generator')}
              className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Gerador de Minutas</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-light">
                    Crie propostas de contratos PJ, freelancers, termos de confidencialidade ou SaaS sob medida em segundos.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-xs font-bold text-indigo-500 flex items-center gap-1">
                Abrir Ferramenta →
              </div>
            </div>

            {/* Card 3: Break-Even */}
            <div 
              onClick={() => setActiveTool('financial')}
              className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-555 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Simulador de Break-Even</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-light">
                    Simule ponto de equilíbrio operacional, calcule margens passo a passo e receba análises estratégicas para seu setor.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-xs font-bold text-emerald-555 flex items-center gap-1">
                Abrir Ferramenta →
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. INTERFACE: REVISOR DE DOCUMENTOS */}
      {activeTool === 'reviewer' && (
        <div className="space-y-6">
          {/* Botão Voltar */}
          <button 
            onClick={() => { setActiveTool('selection'); setReviewResult(null); setReviewText(''); setAttachedFileName(''); setFileError(null); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Ferramentas
          </button>

          {/* Cabeçalho */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-[#C5A85A]" />
              Revisor Inteligente de Documentos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Nossa IA audita riscos contratuais, sinaliza ambiguidades e sugere redações para proteção da sua empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lado Esquerdo: Formulário (5 Colunas) */}
            <form onSubmit={handleRunReviewer} className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Tipo de Documento</label>
                <select
                  value={reviewDocType}
                  onChange={e => setReviewDocType(e.target.value)}
                  className="w-full bg-slate-50 text-base md:text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                >
                  <option value="Contrato de Prestação de Serviços">Contrato de Prestação de Serviços (Geral)</option>
                  <option value="Acordo de Confidencialidade (NDA)">Acordo de Confidencialidade (NDA)</option>
                  <option value="Proposta Comercial de Vendas">Proposta Comercial</option>
                  <option value="Contrato de Aluguel ou Locação">Contrato de Locação</option>
                  <option value="Contrato de Trabalho / Contratação (CLT ou PJ)">Contrato de Trabalho (CLT ou PJ)</option>
                  <option value="Acordo de Sócios (Vesting / Partnership)">Acordo de Sócios (Vesting/Partnership)</option>
                  <option value="Termos de Uso e Política de Privacidade">Termos de Uso e Políticas (Plataformas/SaaS)</option>
                  <option value="Contrato de Compra e Venda de Quotas/Ativos">Contrato de Compra e Venda de Quotas/Ativos</option>
                  <option value="Acordo de Parceria Comercial (Joint Venture)">Acordo de Parceria Comercial (Joint Venture)</option>
                  <option value="Outro Documento de Gestão">Outro Documento Corporativo</option>
                </select>
              </div>

              {/* Área de Anexo/Upload */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Importar Arquivo (Opcional)</label>
                  {attachedFileName && (
                    <button
                      type="button"
                      onClick={handleRemoveReviewAttachment}
                      className="text-[9px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover arquivo
                    </button>
                  )}
                </div>

                {!attachedFileName ? (
                  <div>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#C5A85A] bg-slate-50/20 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-50">
                      <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-600">Clique para anexar arquivo</p>
                        <p className="text-[8px] text-slate-405 font-light">PDF, Imagem (PNG/JPG), TXT ou CSV</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                        className="hidden"
                        onChange={handleReviewFileUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#C5A85A]/10 flex items-center justify-center text-[#C5A85A] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="leading-tight min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 truncate">{attachedFileName}</p>
                        {extractingFile ? (
                          <p className="text-[9px] text-[#C5A85A] font-bold animate-pulse flex items-center gap-1 mt-0.5">
                            <Loader2 className="w-3 h-3 animate-spin" /> IA extraindo texto...
                          </p>
                        ) : (
                          <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" /> Texto extraído!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {fileError && <p className="text-[9px] text-rose-500 font-bold">{fileError}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Conteúdo do Documento *</label>
                <textarea
                  required
                  rows={10}
                  value={reviewText}
                  disabled={extractingFile}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Arraste um documento acima ou digite/cole o texto contratual aqui..."
                  className="w-full bg-slate-50 text-base md:text-xs text-slate-700 border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loadingReview || extractingFile || !reviewText.trim()}
                className="w-full bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-bold py-2.5 rounded-md shadow transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                {loadingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5A85A]" />
                    Analisando Cláusulas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5A85A]" />
                    Analisar Documento
                  </>
                )}
              </button>
            </form>

            {/* Lado Direito: Resultados (7 Colunas) */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#1E2538] to-[#111622] text-white rounded-xl p-6 border border-slate-800 shadow-xl min-h-[420px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C5A85A] rounded-full blur-[70px] opacity-10 pointer-events-none" />

              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 text-[10px] text-[#C5A85A] font-bold uppercase tracking-wider border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Resultado do Diagnóstico Senda AI</span>
                </div>

                {loadingReview ? (
                  <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 text-[#C5A85A] animate-spin" />
                    <p className="text-xs animate-pulse">Lendo contrato e cruzando com riscos de mercado...</p>
                  </div>
                ) : reviewResult ? (
                  <div 
                    className="space-y-4 max-h-[450px] overflow-y-auto pr-1 text-slate-300 animate-fadeIn"
                    dangerouslySetInnerHTML={{ __html: reviewResult }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-28 text-slate-500 text-center gap-2">
                    <FileText className="w-10 h-10 text-slate-700" />
                    <p className="text-xs max-w-[240px]">Envie um arquivo ou cole o texto no painel lateral para a auditoria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERFACE: GERADOR DE MINUTAS */}
      {activeTool === 'generator' && (
        <div className="space-y-6">
          {/* Botão Voltar */}
          <button 
            onClick={() => { setActiveTool('selection'); setGenResult(null); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Ferramentas
          </button>

          {/* Cabeçalho */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-indigo-500" />
              Gerador de Minutas Contratuais
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gere documentos jurídicos essenciais parametrizados sob medida para os direitos da sua empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lado Esquerdo: Formulário (5 Colunas) */}
            <form onSubmit={handleRunGenerator} className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Modelo de Contrato</label>
                <select
                  value={genTemplateType}
                  onChange={e => setGenTemplateType(e.target.value)}
                  className="w-full bg-slate-50 text-base md:text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                >
                  <option value="Contrato de Prestação de Serviços (PJ)">Contrato de Prestação de Serviços (PJ)</option>
                  <option value="Contrato de Trabalho Freelancer (PF)">Contrato de Trabalho Freelancer (PF)</option>
                  <option value="Contrato de Licenciamento de Software / SaaS">Contrato de Licenciamento de Software / SaaS</option>
                  <option value="Contrato de Prestação de Serviços de Marketing / Tráfego Pago">Contrato de Serviços de Marketing / Tráfego</option>
                  <option value="Acordo de Confidencialidade (NDA)">Acordo de Confidencialidade (NDA)</option>
                  <option value="Acordo de Vesting de Participação Societária">Acordo de Vesting Societário</option>
                  <option value="Termo de Parceria e Cooperação Mútua">Termo de Parceria e Cooperação</option>
                  <option value="Termo de Distrato Contratual">Termo de Distrato Contratual</option>
                </select>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informações das Partes</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Nome do Contratante (Sua Empresa)</label>
                    <input
                      type="text"
                      required
                      value={genParties.contractorName}
                      onChange={e => setGenParties(prev => ({ ...prev, contractorName: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">CNPJ do Contratante</label>
                    <input
                      type="text"
                      placeholder="Ex: 00.000.000/0001-00"
                      value={genParties.contractorDoc}
                      onChange={e => setGenParties(prev => ({ ...prev, contractorDoc: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Nome da Segunda Parte *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nome ou Razão Social"
                      value={genParties.contractedName}
                      onChange={e => setGenParties(prev => ({ ...prev, contractedName: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">CPF/CNPJ Segunda Parte</label>
                    <input
                      type="text"
                      placeholder="CPF ou CNPJ"
                      value={genParties.contractedDoc}
                      onChange={e => setGenParties(prev => ({ ...prev, contractedDoc: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                </div>

                {/* Campos condicionais baseados no modelo */}
                {!genTemplateType.includes('NDA') && !genTemplateType.includes('Vesting') && !genTemplateType.includes('Distrato') ? (
                  <>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Descrição do Escopo / Atividades *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Desenvolvimento de software e suporte em TI"
                        value={genParties.serviceDesc}
                        onChange={e => setGenParties(prev => ({ ...prev, serviceDesc: e.target.value }))}
                        className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Valor do Contrato (R$) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 5.000,00"
                          value={genParties.priceValue}
                          onChange={e => setGenParties(prev => ({ ...prev, priceValue: e.target.value }))}
                          className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Vigência (Meses) *</label>
                        <input
                          type="number"
                          required
                          value={genParties.durationMonths}
                          onChange={e => setGenParties(prev => ({ ...prev, durationMonths: e.target.value }))}
                          className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Condição de Pagamento</label>
                      <input
                        type="text"
                        placeholder="Ex: Mensal todo dia 10, depósito bancário"
                        value={genParties.paymentTerms}
                        onChange={e => setGenParties(prev => ({ ...prev, paymentTerms: e.target.value }))}
                        className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                      />
                    </div>
                  </>
                ) : genTemplateType.includes('NDA') ? (
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Objetivo do Compartilhamento de Informações</label>
                    <textarea
                      rows={3}
                      value={genParties.confidentialPurpose}
                      onChange={e => setGenParties(prev => ({ ...prev, confidentialPurpose: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                    />
                  </div>
                ) : genTemplateType.includes('Vesting') ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Percentual de Equity Alvo (%)</label>
                      <input
                        type="text"
                        placeholder="Ex: 5%"
                        value={genParties.priceValue}
                        onChange={e => setGenParties(prev => ({ ...prev, priceValue: e.target.value }))}
                        className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Prazo de Cliff (Meses)</label>
                      <input
                        type="number"
                        placeholder="Ex: 12"
                        value={genParties.durationMonths}
                        onChange={e => setGenParties(prev => ({ ...prev, durationMonths: e.target.value }))}
                        className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Motivo Resumido do Distrato Contratual</label>
                    <input
                      type="text"
                      placeholder="Ex: Conclusão amigável dos serviços contratados"
                      value={genParties.serviceDesc}
                      onChange={e => setGenParties(prev => ({ ...prev, serviceDesc: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                )}
              </div>

              {/* Informações Avançadas */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configurações Avançadas (Opcional)</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Foro de Eleição (Cidade/UF)</label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo/SP"
                      value={genParties.jurisdictionForo}
                      onChange={e => setGenParties(prev => ({ ...prev, jurisdictionForo: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Multa por Rescisão</label>
                    <input
                      type="text"
                      placeholder="Ex: 3 parcelas mensais"
                      value={genParties.terminationPenalty}
                      onChange={e => setGenParties(prev => ({ ...prev, terminationPenalty: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Propriedade Intelectual</label>
                    <select
                      value={genParties.intellectualProperty}
                      onChange={e => setGenParties(prev => ({ ...prev, intellectualProperty: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    >
                      <option value="Do Contratante">Do Contratante (Sua Empresa)</option>
                      <option value="Do Contratado">Do Contratado</option>
                      <option value="Compartilhada">Compartilhada / Licenciamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Cláusula de Exclusividade</label>
                    <select
                      value={genParties.exclusivityTerms}
                      onChange={e => setGenParties(prev => ({ ...prev, exclusivityTerms: e.target.value }))}
                      className="w-full bg-slate-50 text-base md:text-[11px] text-slate-700 border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    >
                      <option value="Sem Exclusividade">Sem Exclusividade Comercial</option>
                      <option value="Exclusividade do Contratado">Exclusividade do Contratado</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingGen || !genParties.contractedName.trim()}
                className="w-full bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-bold py-2.5 rounded-md shadow transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                {loadingGen ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5A85A]" />
                    Redigindo Minuta com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5A85A]" />
                    Gerar Minuta
                  </>
                )}
              </button>
            </form>

            {/* Lado Direito: Resultados (7 Colunas) */}
            <div className="lg:col-span-7 bg-[#1E2538] text-white rounded-xl border border-slate-800 shadow-xl min-h-[450px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C5A85A] rounded-full blur-[70px] opacity-10 pointer-events-none" />

              <div className="p-6 space-y-4 text-left flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-[10px] text-[#C5A85A] font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Minuta Gerada (Markdown)</span>
                  </div>

                  {genResult && (
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white px-2.5 py-1.5 rounded text-[10px] font-bold transition-all active:scale-95 border border-slate-700 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                  )}
                </div>

                {loadingGen ? (
                  <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400 flex-1">
                    <Loader2 className="w-8 h-8 text-[#C5A85A] animate-spin" />
                    <p className="text-xs animate-pulse">Estruturando objeto de contrato e cláusulas sob medida...</p>
                  </div>
                ) : genResult ? (
                  <div className="flex-1 max-h-[450px] overflow-y-auto pr-1 bg-[#161B29]/65 p-4 rounded border border-slate-800 text-xs font-mono whitespace-pre-line text-slate-300 leading-relaxed select-all animate-fadeIn">
                    {genResult}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-28 text-slate-500 text-center gap-2 flex-1">
                    <FileText className="w-10 h-10 text-slate-700" />
                    <p className="text-xs max-w-[240px]">Preencha os dados contratuais à esquerda para que a IA redija a minuta jurídica.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. INTERFACE: SIMULADOR DE BREAK-EVEN */}
      {activeTool === 'financial' && (
        <div className="space-y-6">
          {/* Botão Voltar */}
          <button 
            onClick={() => { 
              setActiveTool('selection'); 
              setFinFixedCosts(''); 
              setFinContribMargin(''); 
              setFinRevenue(''); 
              setFinResultAi(null);
              setFixedSalaries('');
              setFixedRent('');
              setFixedSoftware('');
              setFixedOperational('');
              setUnitPrice('');
              setTaxPercent('');
              setCommissionPercent('');
              setDirectUnitCost('');
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Ferramentas
          </button>

          {/* Cabeçalho */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-555" />
              Simulador Financeiro de Ponto de Equilíbrio
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Avalie o faturamento mínimo necessário para cobrir os custos e simule a sua margem de segurança operacional.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lado Esquerdo: Formulário (5 Colunas) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-4 text-left">
              
              {/* Toggle de Modo */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg mb-2">
                <button
                  type="button"
                  onClick={() => setSimulMode('simplified')}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    simulMode === 'simplified' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Modo Simplificado
                </button>
                <button
                  type="button"
                  onClick={() => setSimulMode('detailed')}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    simulMode === 'detailed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Assistente Detalhado
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Setor de Atuação</label>
                  <select
                    value={finSector}
                    onChange={e => setFinSector(e.target.value)}
                    className="w-full bg-slate-50 text-base md:text-xs text-slate-700 border border-slate-200 rounded-md py-2 px-3 focus:outline-none"
                  >
                    <option value="Serviços">Serviços</option>
                    <option value="Varejo / Comércio">Varejo / Comércio</option>
                    <option value="Indústria">Indústria</option>
                    <option value="Tecnologia (SaaS / Assinatura)">Tecnologia / SaaS</option>
                    <option value="Outros">Outro Segmento</option>
                  </select>
                </div>

                {/* 1. MODO SIMPLIFICADO */}
                {simulMode === 'simplified' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                        Custos Fixos Mensais (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                        <input
                          type="number"
                          required
                          value={finFixedCosts}
                          onChange={e => setFinFixedCosts(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ex: 25000"
                          className="w-full bg-slate-50 text-base md:text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400">Total de salários, aluguel, sistemas, luz, etc.</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                        Margem de Contribuição Média (%) *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">%</span>
                        <input
                          type="number"
                          required
                          max="100"
                          min="1"
                          value={finContribMargin}
                          onChange={e => setFinContribMargin(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ex: 40"
                          className="w-full bg-slate-50 text-base md:text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400">Faturamento menos custos variáveis (impostos, comissão, fornecedor).</span>
                    </div>
                  </>
                ) : (
                  /* 2. MODO DETALHADO (ASSISTENTE) */
                  <div className="space-y-4 animate-fadeIn border-t border-slate-100 pt-3">
                    
                    {/* Bloco Custos Fixos Detalhados */}
                    <div className="space-y-2.5 bg-slate-50/65 p-3 rounded-lg border border-slate-200/50">
                      <h4 className="text-[9px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-rose-455 rounded-full inline-block"></span>
                        Custos Fixos Detalhados (Mensal)
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Salários & Pro-Labore</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={fixedSalaries}
                            onChange={e => setFixedSalaries(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Aluguel & Contas</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={fixedRent}
                            onChange={e => setFixedRent(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Ferramentas & Software</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={fixedSoftware}
                            onChange={e => setFixedSoftware(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Outras Despesas</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={fixedOperational}
                            onChange={e => setFixedOperational(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 pt-1 border-t border-slate-200/50 flex justify-between">
                        <span>Custo Fixo Total Calculado:</span>
                        <span className="text-slate-800">R$ {calculatedFixedCosts.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Bloco Margem de Contribuição Detalhada */}
                    <div className="space-y-2.5 bg-slate-50/65 p-3 rounded-lg border border-slate-200/50">
                      <h4 className="text-[9px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                        Cálculo de Margem de Contribuição
                      </h4>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Preço Médio de Venda (R$) *</label>
                          <input
                            type="number"
                            placeholder="Ex: 500"
                            value={unitPrice}
                            onChange={e => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Imposto %</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={taxPercent}
                              onChange={e => setTaxPercent(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Comissão %</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={commissionPercent}
                              onChange={e => setCommissionPercent(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-405 font-bold block mb-0.5">Custo Direto R$</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={directUnitCost}
                              onChange={e => setDirectUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-white text-[11px] text-slate-750 border border-slate-200 rounded p-1.5 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[9px] font-bold text-slate-500 pt-1 border-t border-slate-200/50 flex justify-between">
                        <span>Margem de Contribuição %:</span>
                        <span className="text-slate-800">{calculatedContribMargin}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                    Faturamento Mensal Atual (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      value={finRevenue}
                      onChange={e => setFinRevenue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 80000"
                      className="w-full bg-slate-50 text-base md:text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">Usado para calcular a sua margem de segurança operacional.</span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Resultados Matemáticos + Parecer IA (7 Colunas) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Painel de Indicadores Calculados */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm text-left animate-fadeIn">
                <h3 className="font-extrabold text-slate-855 text-xs uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                  Indicadores de Equilíbrio
                </h3>

                {calculatedMetrics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Card 1: Ponto de Equilíbrio */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Faturamento Mínimo (Break-Even)</span>
                        <span className="text-base font-black text-slate-850">
                          R$ {calculatedMetrics.breakEvenPoint.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded bg-[#C5A85A]/10 text-[#C5A85A] flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Card 2: Margem de Segurança */}
                    {typeof finRevenue === 'number' && finRevenue > 0 ? (
                      <div className={`p-4 rounded-lg border flex items-center justify-between ${
                        calculatedMetrics.marginOfSafety >= 20 
                          ? 'bg-emerald-50 border-emerald-100' 
                          : calculatedMetrics.marginOfSafety > 0 
                            ? 'bg-amber-50 border-amber-100' 
                            : 'bg-rose-50 border-rose-100'
                      }`}>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Margem de Segurança</span>
                          <span className={`text-base font-black ${
                            calculatedMetrics.marginOfSafety >= 20 
                              ? 'text-emerald-600' 
                              : calculatedMetrics.marginOfSafety > 0 
                                ? 'text-amber-600' 
                                : 'text-rose-500'
                          }`}>
                            {calculatedMetrics.marginOfSafety}%
                          </span>
                        </div>
                        <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
                          calculatedMetrics.marginOfSafety >= 20 
                            ? 'bg-emerald-100 text-emerald-500' 
                            : calculatedMetrics.marginOfSafety > 0 
                              ? 'bg-amber-100 text-amber-500' 
                              : 'bg-rose-100 text-rose-500'
                        }`}>
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 text-xs italic text-center">
                        Insira o Faturamento Atual para calcular a Margem de Segurança
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-450 italic">
                    Preencha os Custos e a Margem ao lado para iniciar a simulação.
                  </div>
                )}

                {/* Botão de Análise de IA */}
                {calculatedMetrics && (
                  <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleRunFinancialAnalysis}
                      disabled={loadingFin}
                      className="bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-40 font-semibold px-4 py-2 rounded-md shadow flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                    >
                      {loadingFin ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Processando Parecer...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white/90" />
                          Obter Parecer Consultivo IA
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Caixa de Diagnóstico da IA */}
              {(loadingFin || finResultAi) && (
                <div className="bg-gradient-to-br from-[#1E2538] to-[#111622] text-white rounded-xl p-6 border border-slate-800 shadow-xl text-left relative overflow-hidden animate-fadeIn">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C5A85A] rounded-full blur-[70px] opacity-10 pointer-events-none" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] text-[#C5A85A] font-bold uppercase tracking-wider border-b border-slate-800 pb-3">
                      <Sparkles className="w-4 h-4" />
                      <span>Diagnóstico Financeiro Senda AI</span>
                    </div>

                    {loadingFin ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                        <Loader2 className="w-6 h-6 text-[#C5A85A] animate-spin" />
                        <p className="text-xs animate-pulse">Avaliando estrutura de gastos e precificação...</p>
                      </div>
                    ) : (
                      <div 
                        className="space-y-4 text-slate-300"
                        dangerouslySetInnerHTML={{ __html: finResultAi || '' }}
                      />
                    )}
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
