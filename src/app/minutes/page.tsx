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
  FileSpreadsheet,
  Mic,
  MicOff,
  Paperclip,
  Trash2,
  AlertCircle
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

  // Estados para Gravação de Voz (Ditado)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Estados de Upload de Arquivo
  const [extractingFile, setExtractingFile] = useState(false);
  const [extractedFileText, setExtractedFileText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  // Monitorar duração da gravação
  React.useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setFileError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || mediaRecorder.mimeType });
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result as string;
              const response = await fetch('/api/ai/transcribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  audio: base64Data,
                  mimeType: mimeType || mediaRecorder.mimeType,
                }),
              });

              if (!response.ok) throw new Error('Erro na transcrição');

              const result = await response.json();
              if (result.text && result.text.trim()) {
                setNewContent(prev => prev ? prev + '\n' + result.text : result.text);
              }
            } catch (err) {
              console.error(err);
              alert('Erro ao transcrever ditado de voz.');
            } finally {
              setTranscribing(false);
            }
          };
        } catch (err) {
          console.error(err);
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('Não foi possível acessar seu microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setAttachedFileName(file.name);
    setExtractedFileText('');

    // Verificar formato
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setFileError('Formato de arquivo inválido. Formatos suportados: PDF, PNG, JPG, JPEG, TXT e CSV.');
      setAttachedFileName('');
      return;
    }

    // Leitura local para arquivos do tipo texto
    if (fileExt === '.txt' || fileExt === '.csv') {
      setExtractingFile(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setExtractedFileText(text);
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
          setExtractedFileText(result.text || 'Nenhum texto extraído.');
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

  const handleRemoveAttachment = () => {
    setAttachedFileName('');
    setExtractedFileText('');
    setFileError(null);
  };

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

    let finalContent = newContent;
    if (extractedFileText) {
      finalContent += `\n\n--- [CONTEÚDO DO DOCUMENTO ANEXADO: ${attachedFileName}] ---\n${extractedFileText}`;
    }

    const success = await createMeetingMinute({
      title: newTitle,
      content: finalContent
    });

    if (success) {
      setNewTitle('');
      setNewContent('');
      setAttachedFileName('');
      setExtractedFileText('');
      setFileError(null);
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
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Atas de Reunião</h1>
        <p className="text-sm text-slate-500 mt-1">Escreva atas, gere resumos executivos e extraia planos de ação automaticamente usando IA.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Redigir Ata & Lista de Atas (7 Colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Escrever Nova Ata */}
          <div className="bg-white rounded-lg p-6 border border-slate-200/60 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
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
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Discussões e Decisões (Conteúdo)
                  </label>
                  
                  {/* Botão de Ditado por Voz */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={transcribing}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${
                      isRecording
                        ? 'bg-rose-500 border-rose-500 text-white animate-pulse shadow-md shadow-rose-200'
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                    }`}
                    title={isRecording ? 'Parar gravação' : 'Gravar por Voz (Ditado)'}
                  >
                    {transcribing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-[#C5A85A]" />
                        <span>Transcrevendo...</span>
                      </>
                    ) : isRecording ? (
                      <>
                        <MicOff className="w-3 h-3" />
                        <span>Parar ({formatDuration(recordingDuration)})</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3 text-[#C5A85A]" />
                        <span>Gravar Fala</span>
                      </>
                    )}
                  </button>
                </div>
                
                <textarea
                  placeholder="Escreva tudo o que foi decidido. Ex: 'Gessica deve pagar as contas até segunda-feira... Fabricio atualizará o script comercial até 25/06 com validação do Paulo...'"
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={6}
                  disabled={transcribing}
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A] resize-none"
                />
              </div>

              {/* Área de Anexo de Documento */}
              <div className="border border-dashed border-slate-200 rounded-md p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-[#C5A85A]" />
                    Anexo de Documento de Contexto
                  </span>
                  
                  {attachedFileName && !extractingFile && (
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover anexo
                    </button>
                  )}
                </div>

                {!attachedFileName ? (
                  <div>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 hover:border-[#C5A85A] bg-white rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-50/30">
                      <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <Paperclip className="w-5 h-5 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-650">Clique para anexar arquivo</p>
                        <p className="text-[8px] text-slate-400 font-light">PDF, Imagem, TXT ou CSV (Max 10MB)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#C5A85A]/10 flex items-center justify-center text-[#C5A85A] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="leading-tight min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 truncate">{attachedFileName}</p>
                        {extractingFile ? (
                          <p className="text-[9px] text-[#C5A85A] font-bold animate-pulse flex items-center gap-1 mt-0.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extraindo texto com IA...
                          </p>
                        ) : (
                          <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Texto extraído com sucesso!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {fileError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded text-[10px] font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newContent.trim() || extractingFile || transcribing || isRecording}
                  className="bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-40 font-semibold px-5 py-2.5 rounded-md flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
                >
                  <Send className="w-4 h-4" /> Salvar Ata
                </button>
              </div>
            </form>
          </div>

          {/* Histórico de Atas */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest text-slate-400">Atas Registradas</h3>
            
            {meetingMinutes.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {meetingMinutes.map((minute) => (
                  <div 
                    key={minute.id}
                    className="bg-white rounded-md p-4 border border-slate-200/50 shadow-sm flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#C5A85A]/10 text-[#C5A85A] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{minute.title}</h4>
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
