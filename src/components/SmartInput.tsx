'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, HelpCircle } from 'lucide-react';

interface SmartInputProps {
  context: 'departments' | 'indicators' | 'action_plans' | 'meetings';
  placeholder: string;
  onSuccess: (data: any) => void;
  existingData: any;
  suggestions: string[];
}

export const SmartInput: React.FC<SmartInputProps> = ({
  context,
  placeholder,
  onSuccess,
  existingData,
  suggestions,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Inicializar o reconhecimento de voz do navegador (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false; // Parar automaticamente quando o usuário terminar de falar
      rec.interimResults = false;
      rec.lang = 'pt-BR'; // Português do Brasil

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed') {
          setError('Permissão de microfone negada. Ative nas configurações do navegador.');
        } else {
          setError('Não consegui te ouvir direito. Tente novamente.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      recognitionRef.current.start();
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

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
        setError('Não entendi muito bem. Diga de outra forma ou use uma das sugestões abaixo.');
      } else {
        setText(''); // Limpa o input
        onSuccess(result); // Passa o JSON interpretado para o pai
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao motor de IA.');
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
          className="flex-1 bg-white text-slate-800 placeholder-slate-400 rounded-lg py-3 pl-4 pr-24 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C5A85A] focus:border-transparent resize-none min-h-[50px] shadow-inner transition-all duration-200"
        />

        {/* Botões do lado direito */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {/* Ajuda */}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            title="Dicas de comando"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

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
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Enviar */}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !text.trim()}
            className="p-2 bg-[#C5A85A] hover:bg-[#B3964C] text-white disabled:opacity-40 rounded-full shadow-md transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mensagens de feedback */}
      {isListening && (
        <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
          Ouvindo você... Fale agora.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-2 font-medium">
          {error}
        </p>
      )}

      {/* Dicas e Sugestões */}
      {(showHelp || text.length === 0) && (
        <div className="mt-3 border-t border-slate-100 pt-3 transition-all duration-300">
          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
            ✨ Sugestões de comandos (clique para usar):
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setText(suggestion)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200/50 transition-all active:scale-95 text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
