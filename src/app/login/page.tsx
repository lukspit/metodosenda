'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Compass, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xl p-8 space-y-6">
        
        {/* Logo & Cabeçalho */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-lg bg-[#1E2538] flex items-center justify-center shadow-md">
            <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo Senda" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">MÉTODO SENDA</h2>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Senda Core v2.0</p>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-rose-50 border border-rose-250 text-rose-600 px-4 py-3 rounded-md flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Endereço de E-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                disabled={loading}
                className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Senha de Acesso</label>
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
                className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2.5 rounded-md shadow transition-all duration-200 flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A85A]" />
                Autenticando...
              </>
            ) : (
              'Entrar na Plataforma'
            )}
          </button>
        </form>

        {/* Rodapé informativo */}
        <div className="text-center pt-4 border-t border-slate-100 text-[10px] text-slate-450 leading-relaxed">
          <p>Seus dados de acesso são gerenciados pela consultoria.</p>
          <p>Caso tenha esquecido sua senha, solicite um reset ao administrador.</p>
        </div>

      </div>
    </div>
  );
}
