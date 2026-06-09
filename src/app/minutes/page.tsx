'use client';

import React, { useState } from 'react';
import { useApp, MeetingMinute, ActionPlan } from '../../context/AppContext';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Calendar, 
  Clock, 
  Send,
  Loader2,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function MinutesPage() {
  const { meetingMinutes, profiles, departments, createMeetingMinute, createActionPlan } = useApp();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);

  // Estados de processamento da IA
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [extractedPlans, setExtractedPlans] = useState<any[]>([]);
  const [plansImported, setPlansImported] = useState(false);

  // Enviar ata para análise da IA
  const handleAnalyzeWithAI = async (minute: MeetingMinute) => {
    setAnalyzing(true);
    setAiSummary(null);
    setExtractedPlans([]);
    setPlansImported(false);
    setSelectedMinute(minute);

    try {
      const response = await fetch('/api/ai/analyze-minutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: minute.content,
          existingData: {
            departments,
            profiles
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar ata');
      }

      const result = await response.json();
      setAiSummary(result.summary);
      setExtractedPlans(result.action_plans || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar ata com a IA. Exibindo resumo alternativo.');
      setAiSummary('### Resumo Offline\nNão foi possível conectar com o OpenRouter para gerar o resumo dinâmico.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Cadastrar nova ata
  const handleSaveMinute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const success = await createMeetingMinute({
      title: newTitle,
      content: newContent
    });

    if (success) {
      setNewTitle('');
      setNewContent('');
      alert('Ata salva com sucesso! Você pode agora clicar em "Analisar com IA" na barra lateral.');
    }
  };

  // Importar planos de ação extraídos pela IA
  const handleImportPlans = async () => {
    if (extractedPlans.length === 0) return;

    let importCount = 0;
    for (const plan of extractedPlans) {
      await createActionPlan({
        name: plan.name,
        description: plan.description || `Extraído automaticamente da ata: ${selectedMinute?.title}`,
        due_date: plan.due_date || new Date(Date.now() + 604800000).toISOString().split('T')[0], // + 7 dias
        responsible_id: plan.responsible_id,
        approver_id: plan.approver_id,
        department_id: plan.department_id,
        status: 'pendente',
        progress: 0
      });
      importCount++;
    }

    setPlansImported(true);
    alert(`${importCount} planos de ação cadastrados no sistema com sucesso!`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Atas de Reunião</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Escreva atas, gere resumos executivos e extraia planos de ação automaticamente usando IA.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Redigir Ata & Lista de Atas (7 Colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Escrever Nova Ata */}
          <div className="bg-white dark:bg-[#1E2538] rounded-lg p-6 border border-slate-200/60 dark:border-slate-850 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#C5A85A]" />
              Nova Ata de Reunião
            </h3>

            <form onSubmit={handleSaveMinute} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Título da Reunião</label>
                <input
                  type="text"
                  placeholder="Ex: Alinhamento Estratégico Mensal - Junho/2026"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Discussões e Decisões (Conteúdo)</label>
                <textarea
                  placeholder="Escreva tudo o que foi decidido. Ex: 'Gessica deve pagar as contas até segunda-feira... Fabricio atualizará o script comercial até 25/06 com validação do Paulo...'"
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-50 dark:bg-[#1A2332] text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-40 font-semibold px-5 py-2.5 rounded-md flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
                >
                  <Send className="w-4 h-4" /> Salvar Ata
                </button>
              </div>
            </form>
          </div>

          {/* Histórico de Atas */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest text-slate-400">Atas Registradas</h3>
            
            {meetingMinutes.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {meetingMinutes.map((minute) => (
                  <div 
                    key={minute.id}
                    className="bg-white dark:bg-[#1E2538] rounded-md p-4 border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#C5A85A]/10 text-[#C5A85A] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{minute.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Cadastrado em: {new Date(minute.created_at).toLocaleDateString('pt-BR')} às {new Date(minute.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAnalyzeWithAI(minute)}
                      className="text-xs bg-[#C5A85A]/10 hover:bg-[#C5A85A] hover:text-white border border-[#C5A85A]/25 text-[#C5A85A] font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Analisar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Nenhuma ata registrada ainda.</p>
            )}
          </div>

        </div>

        {/* Lado Direito: Resultados da Análise de IA (5 Colunas) */}
        <div className="lg:col-span-5">
          <div className="bg-gradient-to-br from-[#1E2538] to-[#111622] text-white rounded-lg p-6 border border-slate-800 shadow-xl min-h-[400px] flex flex-col justify-between relative overflow-hidden sticky top-6">
            
            {/* Brilho da IA */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C5A85A] rounded-full blur-[70px] opacity-10 pointer-events-none" />

            <div className="space-y-6">
              {/* Cabeçalho */}
              <div className="flex items-center gap-2 text-xs text-[#C5A85A] font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Painel Consultivo Senda AI</span>
              </div>

              {/* Estado do Painel */}
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
                  <Loader2 className="w-8 h-8 text-[#C5A85A] animate-spin" />
                  <p className="text-xs animate-pulse text-center">Processando ata e extraindo ações...</p>
                </div>
              ) : aiSummary ? (
                // Exibir Resumo e Ações
                <div className="space-y-6">
                  {/* Resumo */}
                  <div className="border-b border-slate-800 pb-5">
                    <h4 className="text-[10px] text-[#C5A85A] uppercase font-bold tracking-widest mb-2">Resumo Executivo</h4>
                    <div 
                      className="text-xs text-slate-300 space-y-1 prose prose-invert leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: aiSummary
                          .replace(/\n/g, '<br />')
                          .replace(/### (.*)/g, '<h4 class="text-xs font-bold text-white mt-3 mb-1">$1</h4>')
                          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </div>

                  {/* Planos Extraídos */}
                  <div>
                    <h4 className="text-[10px] text-[#C5A85A] uppercase font-bold tracking-widest mb-3">Planos de Ação Extraídos ({extractedPlans.length})</h4>
                    
                    {extractedPlans.length > 0 ? (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                        {extractedPlans.map((plan, idx) => {
                          const resp = profiles.find(p => p.id === plan.responsible_id)?.name || 'Sem responsável';
                          const dept = departments.find(d => d.id === plan.department_id)?.name || 'Geral';
                          
                          return (
                            <div key={idx} className="bg-slate-800/40 border border-slate-700/40 rounded-md p-3 space-y-1">
                              <h5 className="text-xs font-bold text-white leading-tight">{plan.name}</h5>
                              <p className="text-[10px] text-slate-400 font-light">{plan.description}</p>
                              <div className="flex justify-between text-[9px] text-[#C5A85A] font-medium pt-1">
                                <span>Resp: {resp} ({dept})</span>
                                <span>Prazo: {plan.due_date ? new Date(plan.due_date).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Nenhum plano de ação detectado no texto.</p>
                    )}
                  </div>
                </div>
              ) : (
                // Estado Inicial (Vazio)
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3 text-center">
                  <FileText className="w-10 h-10 text-slate-700" />
                  <p className="text-xs max-w-[200px]">Selecione uma ata à esquerda e clique em <strong>"Analisar"</strong> para começar.</p>
                </div>
              )}
            </div>

            {/* Ação: Salvar Planos de Ação extraídos */}
            {aiSummary && extractedPlans.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={handleImportPlans}
                  disabled={plansImported}
                  className={`w-full py-2.5 rounded-md text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${
                    plansImported
                      ? 'bg-emerald-500 text-white cursor-default'
                      : 'bg-[#C5A85A] hover:bg-[#B3964C] text-white'
                  }`}
                >
                  {plansImported ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Planos Importados!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-white/10" /> Salvar {extractedPlans.length} Planos no Sistema
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
