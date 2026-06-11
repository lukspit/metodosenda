'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp, MeetingMinute, MeetingMinuteForwarding, MeetingMinuteDefinition } from '../../context/AppContext';
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
  AlertCircle,
  Printer,
  ArrowLeft,
  Search,
  Filter,
  Play,
  RotateCw,
  Check,
  Edit,
  User,
  Tag,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function MinutesPage() {
  const { 
    meetingMinutes, 
    profiles, 
    departments, 
    createMeetingMinute, 
    updateMeetingMinute 
  } = useApp();

  // Ata selecionada (se null, exibe listagem geral)
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);
  
  // Aba ativa na tela de detalhes
  const [activeTab, setActiveTab] = useState<'forwardings' | 'definitions' | 'dados'>('forwardings');

  // Estados de Filtro da Listagem Geral
  const [filterTitle, setFilterTitle] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Estados de Filtro da Aba Encaminhamentos
  const [filterFwdInserted, setFilterFwdInserted] = useState('');
  const [filterFwdText, setFilterFwdText] = useState('');
  const [filterFwdResponsible, setFilterFwdResponsible] = useState('');
  const [filterFwdDueDate, setFilterFwdDueDate] = useState('');
  const [filterFwdStatus, setFilterFwdStatus] = useState('');

  // Estados de Filtro da Aba Definições
  const [filterDefInserted, setFilterDefInserted] = useState('');
  const [filterDefText, setFilterDefText] = useState('');

  // Estados do Modal de Nova Ata
  const [isNewMinuteModalOpen, setIsNewMinuteModalOpen] = useState(false);
  const [newMinuteTitle, setNewMinuteTitle] = useState('');
  const [newMinuteDate, setNewMinuteDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMinuteDescription, setNewMinuteDescription] = useState('');

  // Estados do Modal de Encaminhamento (Adição / Edição)
  const [isFwdModalOpen, setIsFwdModalOpen] = useState(false);
  const [editingFwd, setEditingFwd] = useState<MeetingMinuteForwarding | null>(null);
  const [fwdDescription, setFwdDescription] = useState('');
  const [fwdModule, setFwdModule] = useState('');
  const [fwdPriority, setFwdPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [fwdResponsibleId, setFwdResponsibleId] = useState('');
  const [fwdResponsibleName, setFwdResponsibleName] = useState('');
  const [fwdDueDate, setFwdDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [fwdStatus, setFwdStatus] = useState<'PENDENTE' | 'ANDAMENTO' | 'CONCLUIDO'>('ANDAMENTO');

  // Estados do Modal de Definição (Adição / Edição)
  const [isDefModalOpen, setIsDefModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<MeetingMinuteDefinition | null>(null);
  const [defDescription, setDefDescription] = useState('');
  const [defInsertedAt, setDefInsertedAt] = useState(new Date().toISOString().split('T')[0]);

  // Estados da Aba Dados (Edição síncrona da Ata)
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrintDescription, setEditPrintDescription] = useState(false);

  // Estados do Painel Senda AI Lateral
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [extractedPlans, setExtractedPlans] = useState<any[]>([]);
  const [plansImported, setPlansImported] = useState(false);

  // Estados para Gravação de Voz (Ditado)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados de Upload de Arquivo no Painel da IA
  const [extractingFile, setExtractingFile] = useState(false);
  const [extractedFileText, setExtractedFileText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  // Mensagem de Feedback (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Monitorar duração da gravação de voz
  useEffect(() => {
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

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
    };
  }, []);

  // Sincronizar dados da ata na aba Dados
  useEffect(() => {
    if (selectedMinute) {
      setEditTitle(selectedMinute.title);
      setEditDescription(selectedMinute.description || '');
      setEditPrintDescription(selectedMinute.print_description || false);
      setPlansImported(false);
    }
  }, [selectedMinute]);

  // Função para formatar a data ex: 18/01/2019
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      // Ajustar fuso horário local para evitar problemas de timezone
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return localDate.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Gravação de voz
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
                setAiInputText(prev => prev ? prev + '\n' + result.text : result.text);
                showToast('Áudio transcrito com sucesso!');
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

  // Upload de arquivo para extração de texto
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setAttachedFileName(file.name);
    setExtractedFileText('');

    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setFileError('Formato inválido. Suporta PDF, PNG, JPG, JPEG, TXT e CSV.');
      setAttachedFileName('');
      return;
    }

    if (fileExt === '.txt' || fileExt === '.csv') {
      setExtractingFile(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setExtractedFileText(text);
        setExtractingFile(false);
        showToast('Texto extraído com sucesso!');
      };
      reader.onerror = () => {
        setFileError('Erro ao ler arquivo.');
        setExtractingFile(false);
      };
      reader.readAsText(file);
    } else {
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
            throw new Error(errData.error || 'Erro na extração de texto.');
          }

          const result = await response.json();
          setExtractedFileText(result.text || '');
          showToast('Documento lido por IA com sucesso!');
        } catch (err: any) {
          console.error(err);
          setFileError(err.message || 'Erro ao extrair texto.');
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

  // Enviar texto para análise da IA
  const handleAnalyzeWithAI = async () => {
    const rawContent = aiInputText + (extractedFileText ? `\n\n[Texto do Arquivo Anexo]: ${extractedFileText}` : '');
    if (!rawContent.trim()) {
      alert('Digite, grave algo ou anexe um documento para que a IA possa analisar.');
      return;
    }

    setAnalyzing(true);
    setAiSummary(null);
    setExtractedPlans([]);
    setPlansImported(false);

    try {
      const response = await fetch('/api/ai/analyze-minutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: rawContent,
          existingData: {
            departments,
            profiles
          }
        }),
      });

      if (!response.ok) throw new Error('Falha no processamento da IA');

      const result = await response.json();
      setAiSummary(result.summary);
      setExtractedPlans(result.action_plans || []);
      showToast('Ata analisada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar ata com a IA.');
      setAiSummary('### Resumo Executivo\nNão foi possível obter resposta da IA.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Importar planos sugeridos pela IA como encaminhamentos da ata atual
  const handleImportPlansToMinute = () => {
    if (!selectedMinute || extractedPlans.length === 0) return;

    const newForwardings: MeetingMinuteForwarding[] = extractedPlans.map(plan => {
      const resp = profiles.find(p => p.id === plan.responsible_id);
      
      const dept = departments.find(d => d.id === plan.department_id);
      const moduleTag = dept ? dept.name.replace(/^\d+-/, '').toUpperCase() : 'GERAL';
      
      return {
        id: `fwd-${Math.random().toString(36).substring(2, 11)}`,
        inserted_at: new Date().toISOString().split('T')[0],
        description: `[${moduleTag}] ${plan.name}${plan.description ? ' - ' + plan.description : ''} #MEDIA#`,
        module_tag: moduleTag,
        priority_tag: 'MEDIA',
        responsible_id: plan.responsible_id || null,
        responsible_name: resp ? resp.name : 'Não atribuído',
        due_date: plan.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ANDAMENTO'
      };
    });

    const updatedMinute = {
      ...selectedMinute,
      forwardings: [...(selectedMinute.forwardings || []), ...newForwardings]
    };
    
    setSelectedMinute(updatedMinute);
    updateMeetingMinute(selectedMinute.id, updatedMinute);
    setPlansImported(true);
    showToast(`${newForwardings.length} encaminhamentos importados! Lembre-se de salvar a ata.`);
  };

  // Cadastrar nova ata
  const handleCreateMinute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMinuteTitle.trim()) return;

    // Criar com dados v2 básicos
    const success = await createMeetingMinute({
      title: newMinuteTitle,
      created_at: new Date(newMinuteDate).toISOString(),
      content: '', // Iniciará como ata v2 vazia
      description: newMinuteDescription,
      print_description: false,
      forwardings: [],
      definitions: []
    });

    if (success) {
      setNewMinuteTitle('');
      setNewMinuteDescription('');
      setIsNewMinuteModalOpen(false);
      showToast('Ata adicionada com sucesso!');
      
      // Obter ata recém-criada e abrir detalhes dela
      // Como o refreshData recarrega o estado local, buscamos o item recém adicionado
      setTimeout(() => {
        // Encontrar a ata mais recente cadastrada com aquele título
        const sortedMinutes = [...meetingMinutes].sort((a, b) => b.created_at.localeCompare(a.created_at));
        const matched = sortedMinutes.find(m => m.title === newMinuteTitle) || sortedMinutes[0];
        if (matched) {
          setSelectedMinute(matched);
          setActiveTab('dados'); // Abre na aba de dados para preenchimento
        }
      }, 500);
    }
  };

  // Salvar aba de Dados (Nome da Ata e Descrição)
  const handleSaveDadosAta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinute || !editTitle.trim()) return;

    // Fechamento otimista do modal / indicação rápida de salvamento
    const updated: MeetingMinute = {
      ...selectedMinute,
      title: editTitle,
      description: editDescription,
      print_description: editPrintDescription
    };

    const success = await updateMeetingMinute(selectedMinute.id, updated);
    if (success) {
      setSelectedMinute(updated);
      showToast('Dados salvos com sucesso!');
    } else {
      alert('Erro ao salvar os dados.');
    }
  };

  // Cadastrar ou Editar Encaminhamento
  const handleSaveForwarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinute || !fwdDescription.trim()) return;

    const resp = profiles.find(p => p.id === fwdResponsibleId);
    const responsibleName = resp ? resp.name : (fwdResponsibleName || 'Não atribuído');

    // Monta a string no formato: [MÓDULO] Descrição #PRIORIDADE#
    const cleanDesc = fwdDescription.replace(/^\[.*?\]\s*/, '').replace(/\s*#.*?#$/, '');
    const moduleTagUpper = fwdModule.trim().toUpperCase() || 'GERAL';
    const formattedDescription = `[${moduleTagUpper}] ${cleanDesc} #${fwdPriority}#`;

    let updatedFwds: MeetingMinuteForwarding[] = [...(selectedMinute.forwardings || [])];

    if (editingFwd) {
      // Editar existente
      updatedFwds = updatedFwds.map(f => f.id === editingFwd.id ? {
        ...f,
        description: formattedDescription,
        module_tag: moduleTagUpper,
        priority_tag: fwdPriority,
        responsible_id: fwdResponsibleId || null,
        responsible_name: responsibleName,
        due_date: fwdDueDate,
        status: fwdStatus
      } : f);
    } else {
      // Criar novo
      const newFwd: MeetingMinuteForwarding = {
        id: `fwd-${Math.random().toString(36).substring(2, 11)}`,
        inserted_at: new Date().toISOString().split('T')[0],
        description: formattedDescription,
        module_tag: moduleTagUpper,
        priority_tag: fwdPriority,
        responsible_id: fwdResponsibleId || null,
        responsible_name: responsibleName,
        due_date: fwdDueDate,
        status: fwdStatus
      };
      updatedFwds.push(newFwd);
    }

    const updatedMinute: MeetingMinute = {
      ...selectedMinute,
      forwardings: updatedFwds
    };

    // Atualização otimista local
    setSelectedMinute(updatedMinute);
    
    // Persiste no Supabase
    const success = await updateMeetingMinute(selectedMinute.id, updatedMinute);
    if (success) {
      setIsFwdModalOpen(false);
      setEditingFwd(null);
      resetFwdForm();
      showToast(editingFwd ? 'Encaminhamento atualizado!' : 'Encaminhamento adicionado!');
    }
  };

  const resetFwdForm = () => {
    setFwdDescription('');
    setFwdModule('');
    setFwdPriority('MEDIA');
    setFwdResponsibleId('');
    setFwdResponsibleName('');
    setFwdDueDate(new Date().toISOString().split('T')[0]);
    setFwdStatus('ANDAMENTO');
  };

  const handleOpenEditFwd = (fwd: MeetingMinuteForwarding) => {
    setEditingFwd(fwd);
    
    // Fazer parse da descrição para os campos do modal
    const matchModule = fwd.description.match(/^\[(.*?)\]/);
    const matchPriority = fwd.description.match(/#(BAIXA|MEDIA|ALTA)#$/);
    
    const cleanDesc = fwd.description.replace(/^\[.*?\]\s*/, '').replace(/\s*#.*?#$/, '');
    
    setFwdDescription(cleanDesc);
    setFwdModule(matchModule ? matchModule[1] : (fwd.module_tag || ''));
    setFwdPriority(matchPriority ? (matchPriority[1] as any) : (fwd.priority_tag || 'MEDIA'));
    setFwdResponsibleId(fwd.responsible_id || '');
    setFwdResponsibleName(fwd.responsible_name || '');
    setFwdDueDate(fwd.due_date);
    setFwdStatus(fwd.status);
    
    setIsFwdModalOpen(true);
  };

  const handleDeleteFwd = async (fwdId: string) => {
    if (!selectedMinute || !confirm('Deseja realmente excluir este encaminhamento?')) return;

    const updatedFwds = (selectedMinute.forwardings || []).filter(f => f.id !== fwdId);
    const updatedMinute = {
      ...selectedMinute,
      forwardings: updatedFwds
    };

    setSelectedMinute(updatedMinute);
    const success = await updateMeetingMinute(selectedMinute.id, updatedMinute);
    if (success) {
      showToast('Encaminhamento excluído!');
    }
  };

  const handleToggleFwdStatus = async (fwd: MeetingMinuteForwarding) => {
    if (!selectedMinute) return;

    // Alterna status ciclicamente: PENDENTE -> ANDAMENTO -> CONCLUIDO -> PENDENTE
    const nextStatusMap: Record<typeof fwd.status, typeof fwd.status> = {
      'PENDENTE': 'ANDAMENTO',
      'ANDAMENTO': 'CONCLUIDO',
      'CONCLUIDO': 'PENDENTE'
    };
    const nextStatus = nextStatusMap[fwd.status] || 'ANDAMENTO';

    const updatedFwds = (selectedMinute.forwardings || []).map(f => f.id === fwd.id ? {
      ...f,
      status: nextStatus
    } : f);

    const updatedMinute = {
      ...selectedMinute,
      forwardings: updatedFwds
    };

    setSelectedMinute(updatedMinute);
    const success = await updateMeetingMinute(selectedMinute.id, updatedMinute);
    if (success) {
      showToast(`Status alterado para ${nextStatus}`);
    }
  };

  // Cadastrar ou Editar Definição
  const handleSaveDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinute || !defDescription.trim()) return;

    let updatedDefs: MeetingMinuteDefinition[] = [...(selectedMinute.definitions || [])];

    if (editingDef) {
      updatedDefs = updatedDefs.map(d => d.id === editingDef.id ? {
        ...d,
        description: defDescription,
        inserted_at: defInsertedAt
      } : d);
    } else {
      const newDef: MeetingMinuteDefinition = {
        id: `def-${Math.random().toString(36).substring(2, 11)}`,
        inserted_at: defInsertedAt,
        description: defDescription
      };
      updatedDefs.push(newDef);
    }

    const updatedMinute: MeetingMinute = {
      ...selectedMinute,
      definitions: updatedDefs
    };

    setSelectedMinute(updatedMinute);
    const success = await updateMeetingMinute(selectedMinute.id, updatedMinute);
    if (success) {
      setIsDefModalOpen(false);
      setEditingDef(null);
      setDefDescription('');
      setDefInsertedAt(new Date().toISOString().split('T')[0]);
      showToast(editingDef ? 'Definição atualizada!' : 'Definição cadastrada!');
    }
  };

  const handleOpenEditDef = (def: MeetingMinuteDefinition) => {
    setEditingDef(def);
    setDefDescription(def.description);
    setDefInsertedAt(def.inserted_at || new Date().toISOString().split('T')[0]);
    setIsDefModalOpen(true);
  };

  const handleDeleteDef = async (defId: string) => {
    if (!selectedMinute || !confirm('Deseja realmente excluir esta definição?')) return;

    const updatedDefs = (selectedMinute.definitions || []).filter(d => d.id !== defId);
    const updatedMinute = {
      ...selectedMinute,
      definitions: updatedDefs
    };

    setSelectedMinute(updatedMinute);
    const success = await updateMeetingMinute(selectedMinute.id, updatedMinute);
    if (success) {
      showToast('Definição excluída!');
    }
  };

  // Executar Impressão
  const handlePrint = () => {
    window.print();
  };

  // ---- FILTROS DA UI ----

  // Filtro de atas gerais
  const filteredMinutes = meetingMinutes.filter(min => {
    const matchTitle = min.title.toLowerCase().includes(filterTitle.toLowerCase());
    const matchDate = filterDate ? min.created_at.startsWith(filterDate) : true;
    return matchTitle && matchDate;
  });

  // Filtro de encaminhamentos
  const filteredForwardings = selectedMinute?.forwardings?.filter(fwd => {
    const matchInserted = filterFwdInserted ? fwd.inserted_at.includes(filterFwdInserted) : true;
    const matchText = filterFwdText ? fwd.description.toLowerCase().includes(filterFwdText.toLowerCase()) : true;
    const matchResponsible = filterFwdResponsible ? fwd.responsible_name.toLowerCase().includes(filterFwdResponsible.toLowerCase()) : true;
    const matchDueDate = filterFwdDueDate ? fwd.due_date.includes(filterFwdDueDate) : true;
    const matchStatus = filterFwdStatus ? fwd.status === filterFwdStatus : true;
    return matchInserted && matchText && matchResponsible && matchDueDate && matchStatus;
  }) || [];

  // Filtro de definições
  const filteredDefinitions = selectedMinute?.definitions?.filter(def => {
    const matchInserted = filterDefInserted ? def.inserted_at.includes(filterDefInserted) : true;
    const matchText = filterDefText ? def.description.toLowerCase().includes(filterDefText.toLowerCase()) : true;
    return matchInserted && matchText;
  }) || [];

  // Verificar se o prazo venceu
  const isOverdue = (dueDateStr: string, status: string) => {
    if (status === 'CONCLUIDO') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return dueDateStr < todayStr;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#1E2538] text-white border border-[#C5A85A] px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-[#C5A85A]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO (Oculta na tela) */}
      <div id="print-area" className="hidden print:block p-8 bg-white text-slate-800 leading-relaxed">
        <div className="border-b-2 border-slate-300 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">Ata de Reunião</h1>
            <p className="text-xs text-slate-500 mt-1">Método Senda Consultoria Estratégica</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{selectedMinute ? formatDateString(selectedMinute.created_at) : ''}</p>
            <p className="text-[10px] text-slate-500">Documento de Registro Oficial</p>
          </div>
        </div>

        {selectedMinute && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{selectedMinute.title}</h2>
            </div>

            {/* Descrição geral se autorizado */}
            {selectedMinute.print_description && selectedMinute.description && (
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Descrição Geral</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedMinute.description}</p>
              </div>
            )}

            {/* Definições */}
            {selectedMinute.definitions && selectedMinute.definitions.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase tracking-wider">
                  Definições & Decisões Registradas
                </h3>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-650 font-semibold bg-slate-50">
                      <th className="py-2 px-3 w-32">Data</th>
                      <th className="py-2 px-3">Definição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMinute.definitions.map((def) => (
                      <tr key={def.id} className="border-b border-slate-200">
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-xs">{formatDateString(def.inserted_at)}</td>
                        <td className="py-2.5 px-3 text-slate-800 text-xs whitespace-pre-wrap">{def.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Encaminhamentos */}
            {selectedMinute.forwardings && selectedMinute.forwardings.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase tracking-wider">
                  Encaminhamentos & Tarefas
                </h3>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-650 font-semibold bg-slate-50">
                      <th className="py-2 px-3 w-28">Data</th>
                      <th className="py-2 px-3">Encaminhamento</th>
                      <th className="py-2 px-3 w-36">Responsável</th>
                      <th className="py-2 px-3 w-28">Prazo</th>
                      <th className="py-2 px-3 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMinute.forwardings.map((fwd) => (
                      <tr key={fwd.id} className="border-b border-slate-200">
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-xs">{formatDateString(fwd.inserted_at)}</td>
                        <td className="py-2.5 px-3 text-slate-800 text-xs font-medium">{fwd.description}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs">{fwd.responsible_name}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs font-mono">{formatDateString(fwd.due_date)}</td>
                        <td className="py-2.5 px-3 text-slate-700 text-xs font-semibold">{fwd.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RENDERIZAÇÃO EM TELA SCREEN (Padrão) */}
      <div className="print:hidden space-y-6">
        
        {/* ==================== TELA 1: LISTAGEM GERAL DE ATAS ==================== */}
        {!selectedMinute ? (
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <FileSpreadsheet className="w-7 h-7 text-[#C5A85A]" />
                  Atas de Reunião
                </h1>
                <p className="text-sm text-slate-500 mt-1">Gerencie atas oficiais, registre deliberações, organize encaminhamentos e aproveite o suporte de IA.</p>
              </div>
              <button
                onClick={() => setIsNewMinuteModalOpen(true)}
                className="bg-[#C5A85A] hover:bg-[#B3964C] text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 text-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar Ata
              </button>
            </div>

            {/* Tabela de Atas (Print 1) */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  Total <strong className="text-slate-700">{filteredMinutes.length}</strong> itens.
                </span>
                <div className="flex gap-2">
                  <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Limpar Filtros" onClick={() => { setFilterTitle(''); setFilterDate(''); }}>
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    {/* Títulos das Colunas */}
                    <tr className="bg-[#C5A85A] text-white font-semibold text-xs border-b border-slate-350">
                      <th className="py-3 px-4 w-2/3">Nome da Ata</th>
                      <th className="py-3 px-4 w-1/4">Data</th>
                      <th className="py-3 px-4 text-center w-1/12">Ações</th>
                    </tr>
                    {/* Linha de Filtros Inline (Print 1) */}
                    <tr className="bg-[#EAEAEA] border-b border-slate-200">
                      <th className="py-2 px-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Filtrar por Nome da Ata"
                            value={filterTitle}
                            onChange={(e) => setFilterTitle(e.target.value)}
                            className="w-full bg-white text-xs text-slate-700 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                          />
                        </div>
                      </th>
                      <th className="py-2 px-3" colSpan={2}>
                        <div className="relative flex items-center">
                          <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full bg-white text-xs text-slate-700 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMinutes.length > 0 ? (
                      filteredMinutes.map((minute) => (
                        <tr 
                          key={minute.id}
                          onClick={() => setSelectedMinute(minute)}
                          className="border-b border-slate-200 hover:bg-slate-55/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {minute.title}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">
                            {formatDateString(minute.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMinute(minute);
                              }}
                              className="text-[#C5A85A] hover:underline text-xs font-semibold"
                            >
                              Visualizar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400 italic bg-slate-50/50">
                          Nenhuma ata correspondente encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          
          // ==================== TELA 2: VISUALIZAÇÃO DE DETALHES DE ATA ====================
          <div className="space-y-6">
            
            {/* Cabeçalho da Ata */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button
                onClick={() => setSelectedMinute(null)}
                className="group flex items-center gap-2 text-slate-650 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#C5A85A] transition-transform group-hover:-translate-x-1" />
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  {selectedMinute.title}
                </h1>
              </button>

              <div className="flex gap-2 shrink-0">
                {/* Botão para abrir o assistente de IA */}
                <button
                  onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 ${
                    isAiPanelOpen
                      ? 'bg-gradient-to-r from-[#1E2538] to-[#111622] text-[#C5A85A] border border-[#C5A85A]/30'
                      : 'bg-[#C5A85A]/10 hover:bg-[#C5A85A]/20 border border-[#C5A85A]/35 text-[#C5A85A]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Senda AI</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-xs"
                >
                  <Printer className="w-4 h-4 text-[#C5A85A]" /> Imprimir
                </button>
              </div>
            </div>

            {/* Layout com Painel Lateral de IA Opcional */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Painel Central das Tabelas / Dados (7 ou 12 Colunas) */}
              <div className={`${isAiPanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
                
                {/* Abas Horizontais (Print 2, 3, 4) */}
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveTab('forwardings')}
                    className={`px-4 py-2 rounded-md font-semibold text-xs tracking-wide transition-all ${
                      activeTab === 'forwardings'
                        ? 'bg-slate-100 text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Encaminhamentos
                  </button>
                  <button
                    onClick={() => setActiveTab('definitions')}
                    className={`px-4 py-2 rounded-md font-semibold text-xs tracking-wide transition-all ${
                      activeTab === 'definitions'
                        ? 'bg-slate-100 text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Definições
                  </button>
                  <button
                    onClick={() => setActiveTab('dados')}
                    className={`px-4 py-2 rounded-md font-semibold text-xs tracking-wide transition-all ${
                      activeTab === 'dados'
                        ? 'bg-slate-100 text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Dados
                  </button>
                </div>

                {/* Conteúdo da Aba Ativa */}
                {activeTab === 'forwardings' && (
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                    
                    {/* Cabeçalho da Tabela */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-500">
                          Total <strong className="text-slate-700">{filteredForwardings.length}</strong> itens.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          resetFwdForm();
                          setEditingFwd(null);
                          setIsFwdModalOpen(true);
                        }}
                        className="bg-[#C5A85A] hover:bg-[#B3964C] text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Encaminhamento
                      </button>
                    </div>

                    {/* Tabela de Encaminhamentos (Print 2) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          {/* Títulos das Colunas */}
                          <tr className="bg-[#C5A85A] text-white font-semibold text-xs border-b border-slate-350">
                            <th className="py-2.5 px-3 w-28">Inserido</th>
                            <th className="py-2.5 px-3">Encaminhamentos</th>
                            <th className="py-2.5 px-3 w-40">Responsável</th>
                            <th className="py-2.5 px-3 w-32">Prazo</th>
                            <th className="py-2.5 px-3 w-28">Status</th>
                            <th className="py-2.5 px-3 text-center w-24">Ações</th>
                          </tr>
                          {/* Filtros Inline */}
                          <tr className="bg-[#EAEAEA] border-b border-slate-200">
                            <th className="py-1.5 px-2">
                              <input
                                type="text"
                                placeholder="Filtra..."
                                value={filterFwdInserted}
                                onChange={(e) => setFilterFwdInserted(e.target.value)}
                                className="w-full bg-white text-[11px] text-slate-700 border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              />
                            </th>
                            <th className="py-1.5 px-2">
                              <input
                                type="text"
                                placeholder="Filtrar por Encaminhamentos"
                                value={filterFwdText}
                                onChange={(e) => setFilterFwdText(e.target.value)}
                                className="w-full bg-white text-[11px] text-slate-700 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              />
                            </th>
                            <th className="py-1.5 px-2">
                              <input
                                type="text"
                                placeholder="Filtrar por..."
                                value={filterFwdResponsible}
                                onChange={(e) => setFilterFwdResponsible(e.target.value)}
                                className="w-full bg-white text-[11px] text-slate-700 border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              />
                            </th>
                            <th className="py-1.5 px-2">
                              <input
                                type="text"
                                placeholder="Filtrar..."
                                value={filterFwdDueDate}
                                onChange={(e) => setFilterFwdDueDate(e.target.value)}
                                className="w-full bg-white text-[11px] text-slate-700 border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              />
                            </th>
                            <th className="py-1.5 px-2">
                              <select
                                value={filterFwdStatus}
                                onChange={(e) => setFilterFwdStatus(e.target.value)}
                                className="w-full bg-white text-[11px] text-slate-700 border border-slate-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              >
                                <option value="">Todos</option>
                                <option value="PENDENTE">Pendente</option>
                                <option value="ANDAMENTO">Andamento</option>
                                <option value="CONCLUIDO">Concluído</option>
                              </select>
                            </th>
                            <th className="py-1.5 px-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredForwardings.length > 0 ? (
                            filteredForwardings.map((fwd) => {
                              const overdue = isOverdue(fwd.due_date, fwd.status);
                              
                              return (
                                <tr key={fwd.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                                  {/* Inserido */}
                                  <td className="py-3 px-3 text-xs text-slate-500 font-mono">
                                    {formatDateString(fwd.inserted_at)}
                                  </td>
                                  
                                  {/* Encaminhamento */}
                                  <td className="py-3 px-3 text-xs font-medium text-slate-800">
                                    {fwd.description}
                                  </td>
                                  
                                  {/* Responsável */}
                                  <td className="py-3 px-3 text-xs text-slate-650">
                                    {fwd.responsible_name}
                                  </td>
                                  
                                  {/* Prazo */}
                                  <td className="py-3 px-3 text-xs">
                                    {overdue ? (
                                      <div className="bg-red-600 text-white font-bold text-center py-1 rounded px-2 font-mono shadow-sm shadow-red-100">
                                        {formatDateString(fwd.due_date)}
                                      </div>
                                    ) : (
                                      <span className="font-mono text-slate-600 pl-2">
                                        {formatDateString(fwd.due_date)}
                                      </span>
                                    )}
                                  </td>
                                  
                                  {/* Status */}
                                  <td className="py-3 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleFwdStatus(fwd)}
                                      className="p-1 rounded-md transition-all hover:scale-105 active:scale-95"
                                      title={`Status atual: ${fwd.status}. Clique para alterar.`}
                                    >
                                      {fwd.status === 'CONCLUIDO' ? (
                                        <div className="w-7 h-7 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center font-bold text-[10px]" title="Concluído">
                                          <Check className="w-3.5 h-3.5" />
                                        </div>
                                      ) : fwd.status === 'ANDAMENTO' ? (
                                        <div className="w-7 h-7 bg-blue-50 text-blue-600 border border-blue-200 rounded-full flex items-center justify-center font-bold text-[10px]" title="Em Andamento">
                                          <RotateCw className="w-3 h-3 animate-spin" />
                                        </div>
                                      ) : (
                                        <div className="w-7 h-7 bg-slate-100 text-slate-600 hover:bg-[#C5A85A]/10 hover:text-[#C5A85A] border border-slate-200 rounded-full flex items-center justify-center" title="Pendente">
                                          <Play className="w-3.5 h-3.5 fill-[#C5A85A]/10" />
                                        </div>
                                      )}
                                    </button>
                                  </td>
                                  
                                  {/* Ações */}
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex justify-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditFwd(fwd)}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                        title="Editar"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteFwd(fwd.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 italic bg-slate-50/50">
                                Nenhum encaminhamento cadastrado ou filtrado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'definitions' && (
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                    
                    {/* Cabeçalho da Tabela */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-500">
                          Total <strong className="text-slate-700">{filteredDefinitions.length}</strong> itens.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingDef(null);
                          setDefDescription('');
                          setDefInsertedAt(new Date().toISOString().split('T')[0]);
                          setIsDefModalOpen(true);
                        }}
                        className="bg-[#C5A85A] hover:bg-[#B3964C] text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Definição
                      </button>
                    </div>

                    {/* Tabela de Definições (Print 3) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          {/* Títulos das Colunas */}
                          <tr className="bg-[#C5A85A] text-white font-semibold text-xs border-b border-slate-350">
                            <th className="py-2.5 px-4 w-32">Inserido</th>
                            <th className="py-2.5 px-4">Definição</th>
                            <th className="py-2.5 px-4 text-center w-24">Ações</th>
                          </tr>
                          {/* Filtros Inline */}
                          <tr className="bg-[#EAEAEA] border-b border-slate-200">
                            <th className="py-1.5 px-3">
                              <input
                                type="text"
                                placeholder="Filtra..."
                                value={filterDefInserted}
                                onChange={(e) => setFilterDefInserted(e.target.value)}
                                className="w-full bg-white text-[11px] text-slate-700 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              />
                            </th>
                            <th className="py-1.5 px-3">
                              <input
                                type="text"
                                placeholder="Filtrar por Definição"
                                value={filterDefText}
                                onChange={(e) => setFilterDefText(e.target.value)}
                                className="w-full bg-white text-[11px] text-slate-700 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                              />
                            </th>
                            <th className="py-1.5 px-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDefinitions.length > 0 ? (
                            filteredDefinitions.map((def) => (
                              <tr key={def.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                                  {formatDateString(def.inserted_at)}
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                                  {def.description}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex justify-center gap-1">
                                    <button
                                      onClick={() => handleOpenEditDef(def)}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDef(def.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-slate-400 italic bg-slate-50/50">
                                Nenhuma definição cadastrada ou filtrada.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'dados' && (
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                    {/* Formulário de Dados (Print 4) */}
                    <form onSubmit={handleSaveDadosAta} className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Nome da Ata
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-50 text-sm text-slate-850 border border-slate-250 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Descrição Geral da Ata
                        </label>
                        <textarea
                          rows={12}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Digite considerações gerais, participantes presentes ou pauta discutida de forma ampla."
                          className="w-full bg-slate-50 text-sm text-slate-850 border border-slate-250 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A] resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="print_description"
                          checked={editPrintDescription}
                          onChange={(e) => setEditPrintDescription(e.target.checked)}
                          className="w-4 h-4 rounded text-[#C5A85A] border-slate-300 focus:ring-[#C5A85A]"
                        />
                        <label htmlFor="print_description" className="text-sm text-slate-700 font-medium select-none cursor-pointer">
                          Imprimir descrição
                        </label>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                          type="submit"
                          className="bg-[#C5A85A] hover:bg-[#B3964C] text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
                        >
                          <Send className="w-4 h-4" /> Salvar Ata
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* ==================== PAINEL CONSULTIVO SENDA AI (LADO DIREITO - COLAPSÁVEL) ==================== */}
              {isAiPanelOpen && (
                <div className="lg:col-span-4 bg-gradient-to-br from-[#1E2538] to-[#111622] text-white rounded-lg p-6 border border-slate-800 shadow-xl space-y-6 lg:sticky lg:top-6 animate-slideIn">
                  
                  {/* Brilho Decorativo */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C5A85A] rounded-full blur-[70px] opacity-10 pointer-events-none" />

                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#C5A85A] font-bold uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Painel Consultivo Senda AI</span>
                    </div>
                    <button 
                      onClick={() => setIsAiPanelOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Ocultar
                    </button>
                  </div>

                  {/* Entrada do Usuário */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Redigir Conteúdo ou Transcrição
                      </label>
                      
                      {/* Ditado por Voz */}
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={transcribing}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-bold transition-all border ${
                          isRecording
                            ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {transcribing ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Processando...</span>
                          </>
                        ) : isRecording ? (
                          <>
                            <MicOff className="w-2.5 h-2.5" />
                            <span>Gravar ({formatDuration(recordingDuration)})</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-2.5 h-2.5 text-[#C5A85A]" />
                            <span>Gravar Fala</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={aiInputText}
                      onChange={(e) => setAiInputText(e.target.value)}
                      placeholder="Escreva livremente notas da reunião ou transcreva sua fala. A IA irá converter isso em encaminhamentos com responsáveis e prazos."
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-md p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                    />

                    {/* Área de Upload / Anexos */}
                    <div className="border border-dashed border-slate-700 rounded-md p-3 bg-slate-800/30 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-[#C5A85A]" />
                          Anexo de Documento (PDF/TXT)
                        </span>
                        {attachedFileName && (
                          <button
                            type="button"
                            onClick={handleRemoveAttachment}
                            className="text-rose-400 hover:underline flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-0.5" /> Remover
                          </button>
                        )}
                      </div>

                      {!attachedFileName ? (
                        <label className="flex flex-col items-center justify-center border border-dashed border-slate-700 hover:border-[#C5A85A] bg-slate-800/40 rounded p-3 cursor-pointer transition-colors">
                          <Paperclip className="w-4 h-4 text-slate-500 mb-1" />
                          <span className="text-[9px] text-slate-400 font-bold">Anexar documento</span>
                          <span className="text-[8px] text-slate-500">PDF, TXT, CSV ou Imagem</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded p-2 flex items-center justify-between gap-2">
                          <div className="leading-tight truncate">
                            <span className="text-[10px] font-bold text-slate-350 block truncate">{attachedFileName}</span>
                            {extractingFile ? (
                              <span className="text-[8px] text-[#C5A85A] font-bold animate-pulse flex items-center gap-1">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Lendo texto...
                              </span>
                            ) : (
                              <span className="text-[8px] text-emerald-400 font-medium flex items-center gap-0.5">
                                <Check className="w-3 h-3 text-emerald-400" /> Carregado
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {fileError && (
                        <div className="text-[9px] text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{fileError}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAnalyzeWithAI}
                      disabled={analyzing || transcribing || extractingFile || (!aiInputText.trim() && !extractedFileText)}
                      className="w-full bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-40 font-bold py-2 rounded text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analisando com IA...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Analisar Ata</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Resultados da IA */}
                  {aiSummary && (
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      {/* Resumo Executivo */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-[#C5A85A] font-bold uppercase tracking-widest">Resumo da IA</h4>
                        <div 
                          className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-md max-h-[160px] overflow-y-auto"
                          dangerouslySetInnerHTML={{ 
                            __html: aiSummary
                              .replace(/\n/g, '<br />')
                              .replace(/### (.*)/g, '<h4 class="text-xs font-bold text-white mt-3 mb-1">$1</h4>')
                              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                          }}
                        />
                        {/* Botão rápido para copiar o resumo para a descrição geral da ata */}
                        <button
                          onClick={() => {
                            setEditDescription(prev => prev ? prev + '\n\n' + aiSummary.replace(/<br \/>/g, '\n').replace(/<\/?[^>]+(>|$)/g, "") : aiSummary.replace(/<br \/>/g, '\n').replace(/<\/?[^>]+(>|$)/g, ""));
                            setActiveTab('dados');
                            showToast('Resumo copiado para a descrição da ata!');
                          }}
                          className="text-[9px] text-[#C5A85A] hover:underline font-bold flex items-center gap-0.5 mt-1"
                        >
                          <FileText className="w-3 h-3" /> Usar este resumo na descrição geral
                        </button>
                      </div>

                      {/* Encaminhamentos Sugeridos */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-[#C5A85A] font-bold uppercase tracking-widest">
                          Encaminhamentos Identificados ({extractedPlans.length})
                        </h4>
                        
                        {extractedPlans.length > 0 ? (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {extractedPlans.map((plan, idx) => {
                              const resp = profiles.find(p => p.id === plan.responsible_id)?.name || 'Sem responsável';
                              const dept = departments.find(d => d.id === plan.department_id)?.name || 'Geral';
                              
                              return (
                                <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded p-2.5 space-y-1">
                                  <h5 className="text-[11px] font-bold text-white leading-tight">{plan.name}</h5>
                                  {plan.description && <p className="text-[9px] text-slate-400 font-light leading-snug">{plan.description}</p>}
                                  <div className="flex justify-between items-center text-[8px] text-[#C5A85A] font-medium pt-1 border-t border-slate-700/50 mt-1">
                                    <span>Resp: {resp}</span>
                                    <span>Prazo: {plan.due_date ? formatDateString(plan.due_date) : 'Sem prazo'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">Nenhuma ação identificada.</p>
                        )}
                      </div>

                      {/* Ação de Importar */}
                      {extractedPlans.length > 0 && (
                        <button
                          onClick={handleImportPlansToMinute}
                          disabled={plansImported}
                          className={`w-full py-2 rounded font-bold text-xs transition-all flex items-center justify-center gap-1 shadow ${
                            plansImported
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-white hover:bg-slate-100 text-slate-900'
                          }`}
                        >
                          {plansImported ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Encaminhamentos Importados!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Inserir no Quadro de Encaminhamentos</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Estado Vazio */}
                  {!aiSummary && !analyzing && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3 text-center">
                      <FileText className="w-8 h-8 text-slate-750" />
                      <p className="text-[10px] max-w-[180px]">
                        Redija tópicos da reunião ou use o gravador e clique em <strong>"Analisar"</strong> para extrair tarefas com IA.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAIS DE CADASTRO / EDIÇÃO ==================== */}

      {/* 1. Modal de Adicionar Ata (Nome e Data) */}
      {isNewMinuteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="bg-[#C5A85A] px-4 py-3 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" /> Adicionar Nova Ata
              </h3>
              <button 
                onClick={() => setIsNewMinuteModalOpen(false)}
                className="text-white hover:text-slate-100 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateMinute} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nome da Ata
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alinhamento e Planejamento Semanal"
                  value={newMinuteTitle}
                  onChange={(e) => setNewMinuteTitle(e.target.value)}
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Data da Reunião
                </label>
                <input
                  type="date"
                  value={newMinuteDate}
                  onChange={(e) => setNewMinuteDate(e.target.value)}
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Descrição / Pauta Inicial (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Resumo inicial sobre o escopo ou participantes presentes."
                  value={newMinuteDescription}
                  onChange={(e) => setNewMinuteDescription(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMinuteModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-semibold px-4 py-2 rounded-md text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newMinuteTitle.trim()}
                  className="bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-55 font-semibold px-4 py-2 rounded-md text-xs shadow-sm transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal de Cadastro/Edição de Encaminhamento */}
      {isFwdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-[#C5A85A] px-4 py-3 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 
                {editingFwd ? 'Editar Encaminhamento' : 'Adicionar Encaminhamento'}
              </h3>
              <button 
                onClick={() => {
                  setIsFwdModalOpen(false);
                  setEditingFwd(null);
                  resetFwdForm();
                }}
                className="text-white hover:text-slate-100 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveForwarding} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Descrição */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Tarefa / Descrição do Encaminhamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Criar ambiente de controle de ações deletadas em Atas..."
                    value={fwdDescription}
                    onChange={(e) => setFwdDescription(e.target.value)}
                    className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    required
                    autoFocus
                  />
                </div>

                {/* Módulo / Setor */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#C5A85A]" /> Módulo / Área
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ADMIN, FIN, MKT"
                    value={fwdModule}
                    onChange={(e) => setFwdModule(e.target.value)}
                    className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    required
                  />
                </div>

                {/* Prioridade */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Prioridade
                  </label>
                  <select
                    value={fwdPriority}
                    onChange={(e) => setFwdPriority(e.target.value as any)}
                    className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>

                {/* Responsável (Seletor de Perfis do Tenant) */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#C5A85A]" /> Responsável
                  </label>
                  <select
                    value={fwdResponsibleId}
                    onChange={(e) => {
                      setFwdResponsibleId(e.target.value);
                      if (e.target.value === '') {
                        setFwdResponsibleName('');
                      }
                    }}
                    className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  >
                    <option value="">Digitar outro nome...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Campo de Responsável Manual (Se não vinculado) */}
                {fwdResponsibleId === '' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Nome do Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Solano"
                      value={fwdResponsibleName}
                      onChange={(e) => setFwdResponsibleName(e.target.value)}
                      className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                      required={fwdResponsibleId === ''}
                    />
                  </div>
                )}

                {/* Prazo */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Prazo Limite
                  </label>
                  <input
                    type="date"
                    value={fwdDueDate}
                    onChange={(e) => setFwdDueDate(e.target.value)}
                    className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={fwdStatus}
                    onChange={(e) => setFwdStatus(e.target.value as any)}
                    className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsFwdModalOpen(false);
                    setEditingFwd(null);
                    resetFwdForm();
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-semibold px-4 py-2 rounded-md text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!fwdDescription.trim() || !fwdModule.trim()}
                  className="bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-55 font-semibold px-4 py-2 rounded-md text-xs shadow-sm transition-all"
                >
                  {editingFwd ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal de Cadastro/Edição de Definição */}
      {isDefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="bg-[#C5A85A] px-4 py-3 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> 
                {editingDef ? 'Editar Definição' : 'Adicionar Definição'}
              </h3>
              <button 
                onClick={() => {
                  setIsDefModalOpen(false);
                  setEditingDef(null);
                  setDefDescription('');
                }}
                className="text-white hover:text-slate-100 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveDefinition} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Data de Inserção
                </label>
                <input
                  type="date"
                  value={defInsertedAt}
                  onChange={(e) => setDefInsertedAt(e.target.value)}
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Definição / Decisão Registrada
                </label>
                <textarea
                  rows={5}
                  placeholder="Ex: Ficou definido que a reestruturação da área comercial será adiada para o Q3 de 2026..."
                  value={defDescription}
                  onChange={(e) => setDefDescription(e.target.value)}
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-250 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDefModalOpen(false);
                    setEditingDef(null);
                    setDefDescription('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-semibold px-4 py-2 rounded-md text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!defDescription.trim()}
                  className="bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-55 font-semibold px-4 py-2 rounded-md text-xs shadow-sm transition-all"
                >
                  {editingDef ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
