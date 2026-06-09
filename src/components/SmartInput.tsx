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
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' } | null>(null);
  
  const recognitionRef = useRef<any>(null);

  // Limpar microfone no desmontar do componente
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'pt-BR';

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
        setStatusMessage(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        const errType = event.error;
        if (errType === 'not-allowed') {
          setError('Permissão do microfone negada. Ative a permissão de áudio nas configurações do seu navegador ou do sistema operacional (macOS).');
        } else if (errType === 'no-speech') {
          setError('Nenhuma fala detectada. Clique no microfone e tente falar novamente.');
        } else if (errType === 'audio-capture') {
          setError('Microfone não detectado ou ocupado por outro aplicativo. Verifique se o seu microfone está conectado e livre.');
        } else if (errType === 'network') {
          setError('Falha de rede. O reconhecimento de voz exige conexão com a internet para funcionar.');
        } else if (errType === 'aborted') {
          setError('O reconhecimento de voz foi abortado. Tente novamente.');
        } else {
          setError(`Erro no microfone (${errType}). Verifique as permissões de áudio do seu sistema.`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error('Erro ao iniciar reconhecimento de voz:', err);
      setError('Erro ao iniciar o microfone. Tente novamente.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
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
            onClick={toggleListening}
            className={`p-2 rounded-full transition-all duration-200 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isListening ? 'Parar de ouvir' : 'Falar comando'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Enviar */}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !text.trim()}
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

      {/* Ouvindo você */}
      {isListening && (
        <p className="text-[10px] text-red-500 mt-2 font-bold flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Ouvindo... Fale o seu comando.
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
