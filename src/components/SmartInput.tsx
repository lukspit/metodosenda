'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';

interface SmartInputProps {
  context: 'departments' | 'indicators' | 'action_plans' | 'meetings';
  placeholder: string;
  onSuccess: (data: any) => Promise<boolean | void> | boolean | void;
  existingData: any;
  suggestions?: string[];
}

export const SmartInput: React.FC<SmartInputProps> = ({
  context,
  placeholder,
  onSuccess,
  existingData,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Monitorar duração da gravação
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
      setError(null);
      setStatusMessage(null);

      // Solicitar permissão de áudio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detectar formato suportado
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4'; // Fallback para Safari no iOS/macOS
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Deixar o navegador escolher
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
        setStatusMessage({
          text: 'Transcrevendo sua voz com inteligência artificial...',
          type: 'info'
        });

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || mediaRecorder.mimeType });
          
          // Parar tracks para desligar a luz do microfone
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          // Converter para Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result as string;

              // Enviar para API local de transcrição
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

              if (!response.ok) {
                const errJson = await response.json();
                throw new Error(errJson.error || 'Erro na transcrição de áudio');
              }

              const result = await response.json();

              if (result.text && result.text.trim()) {
                setText(prev => prev ? prev + ' ' + result.text : result.text);
                setStatusMessage(null);
              } else {
                setError('Nenhum texto pôde ser detectado no áudio. Tente falar mais perto do microfone.');
                setStatusMessage(null);
              }
            } catch (err: any) {
              console.error('Erro ao chamar API de transcrição:', err);
              setError(err.message || 'Erro de comunicação ao transcrever o áudio.');
              setStatusMessage(null);
            } finally {
              setTranscribing(false);
            }
          };
        } catch (err: any) {
          console.error('Erro ao ler áudio gravado:', err);
          setError('Falha ao processar o áudio gravado.');
          setTranscribing(false);
          setStatusMessage(null);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Erro ao iniciar gravação:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permissão do microfone negada. Permita o uso do áudio nas configurações do seu navegador ou sistema operacional (macOS) e tente novamente.');
      } else {
        setError('Não foi possível acessar seu microfone. Verifique suas conexões de áudio.');
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setStatusMessage({
      text: 'Estou analisando seu comando e gerando os dados...',
      type: 'info'
    });

    try {
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          context,
          existingData,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar comando da IA');
      }

      const result = await response.json();

      if (result.action === 'unknown') {
        setError('Não entendi muito bem. Diga de outra forma ou digite o comando manualmente.');
        setStatusMessage(null);
      } else {
        // Atualiza a mensagem de status com a intenção da IA
        setStatusMessage({
          text: `Interpretado: ${result.explanation || 'Executando comando no banco...'}`,
          type: 'info'
        });

        // Chama o callback da página pai (que faz a gravação no Supabase)
        const isSuccess = await onSuccess(result);

        if (isSuccess !== false) {
          setStatusMessage({
            text: `Pronto! Finalizado e criado com sucesso. (${result.explanation || 'Comando executado'})`,
            type: 'success'
          });
          setText(''); // Limpa o input do texto no sucesso

          // Remove a mensagem de sucesso depois de 6 segundos
          setTimeout(() => {
            setStatusMessage(null);
          }, 6000);
        } else {
          setError('O comando foi interpretado, mas ocorreu um erro ao gravar as informações no Supabase.');
          setStatusMessage(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao motor de IA.');
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-[#1E2538]/5 border border-slate-200 rounded-md p-4 shadow-sm backdrop-blur-md transition-all duration-300">
      
      {/* Barra de input */}
      <div className="relative flex items-center gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={loading}
          className="flex-1 bg-white text-slate-800 placeholder-slate-400 rounded-lg py-3 pl-4 pr-16 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A] resize-none min-h-[50px] shadow-inner transition-all duration-200 text-xs"
        />

        {/* Botões do lado direito */}
        <div className="absolute right-2 flex items-center gap-1">
          {/* Microfone */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading || transcribing}
            className={`p-2 rounded-full transition-all duration-200 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40'
            }`}
            title={isRecording ? 'Parar gravação e transcrever' : transcribing ? 'Transcrevendo...' : 'Falar comando'}
          >
            {transcribing ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#C5A85A]" />
            ) : isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Enviar */}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !text.trim() || isRecording || transcribing}
            className="p-2 bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 rounded-full shadow transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#C5A85A]" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Gravando áudio */}
      {isRecording && (
        <p className="text-[10px] text-rose-500 mt-2 font-bold flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
          Gravando áudio ({formatDuration(recordingDuration)})... Fale o seu comando e clique no botão de parar para transcrever.
        </p>
      )}

      {/* Transcrevendo áudio */}
      {transcribing && (
        <p className="text-[10px] text-slate-500 mt-2 font-semibold flex items-center gap-1.5 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
          Transcrevendo sua voz... Aguarde um instante.
        </p>
      )}

      {/* Erro de feedback */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-md text-xs font-semibold mt-3 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status da IA (Processamento ou Sucesso) */}
      {statusMessage && (
        <div className={`px-4 py-3 rounded-md text-xs font-semibold mt-3 flex items-center gap-2.5 animate-fadeIn border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-150 text-emerald-600'
            : 'bg-[#C5A85A]/10 border-[#C5A85A]/25 text-[#C5A85A]'
        }`}>
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 fill-[#C5A85A]/20 animate-pulse shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

    </div>
  );
};
