'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Redireciona para o dashboard após login de sucesso
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6] flex flex-col md:flex-row font-sans overflow-hidden relative">
      
      {/* Elemento decorativo de fundo: curvas douradas Senda */}
      <div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-10 overflow-hidden hidden md:block">
        <svg className="absolute -bottom-10 -left-20 w-[120%] h-[80%] text-[#C5A85A] opacity-[0.16]" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,700 C300,600 700,720 1100,450 C1300,315 1500,400 1700,320" stroke="currentColor" strokeWidth="2.5" />
          <path d="M-100,730 C350,620 750,690 1150,420 C1320,295 1480,370 1700,290" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
          <path d="M-100,670 C250,570 650,750 1050,480 C1250,335 1450,430 1700,350" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Coluna da Esquerda: Área de Login */}
      <div className="w-full md:w-[42%] lg:w-[36%] flex items-center justify-center p-6 md:p-12 z-20 relative bg-transparent">
        
        {/* Card de Login que "invade" a imagem à direita no desktop */}
        <div className="w-full max-w-md bg-white border border-slate-200/50 rounded-xl shadow-2xl p-6 md:p-8 space-y-6 md:translate-x-12 lg:translate-x-20 transition-all duration-300 relative hover:shadow-slate-350/30">
          
          {/* Logo transparente */}
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <img src="/logo_transparent.png" className="w-44 h-auto object-contain" alt="Senda Consultoria Estratégica" />
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-rose-50 border border-rose-250 text-rose-600 px-4 py-3 rounded-md flex items-center gap-2 text-xs font-semibold animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com"
                  disabled={loading}
                  className="w-full bg-slate-50 text-xs text-slate-705 border border-slate-200 rounded-md py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-slate-50 text-xs text-slate-705 border border-slate-200 rounded-md py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>
            </div>

            {/* Checkbox "Me lembre" & Link "Esqueci minha senha" */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 border-slate-250 rounded text-[#C5A85A] focus:ring-[#C5A85A] focus:ring-offset-0 focus:outline-none accent-[#C5A85A]"
                />
                Me lembre
              </label>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  alert('Para redefinir sua senha, por favor entre em contato com o administrador da consultoria.');
                }}
                className="hover:text-[#C5A85A] transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-bold py-2.5 rounded-md shadow transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5A85A]" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Coluna da Direita: Imagem de fundo com frase de Vicente Falconi */}
      <div className="hidden md:block md:w-[58%] lg:w-[64%] relative z-20 overflow-hidden">
        <div 
          className="absolute inset-y-0 right-0 w-[100vh] bg-contain bg-right bg-no-repeat"
          style={{ 
            backgroundImage: `url('/login_bg.webp')`,
            maskImage: 'linear-gradient(to right, transparent, black 90px)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 90px)'
          }}
        />
      </div>
    </div>
  );
}
