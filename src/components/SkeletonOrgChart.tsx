'use client';

import React from 'react';

/**
 * SkeletonOrgChart - Layout skeleton interno que simula nós de organograma
 * com linhas de conexão enquanto os dados carregam do Supabase.
 * Renderizado DENTRO do container do painel existente.
 */
export function SkeletonOrgChart() {
  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(
            90deg,
            rgba(226, 232, 240, 0.6) 25%,
            rgba(241, 245, 249, 0.9) 37%,
            rgba(226, 232, 240, 0.6) 63%
          );
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Simulação de nós do organograma */}
      <div className="w-full h-full flex flex-col items-center justify-center gap-8 py-12">
        {/* Nó Raiz */}
        <div className="relative">
          <div className="skeleton-pulse w-52 h-20 rounded-md border-2 border-slate-200" />
          {/* Linha vertical descendo */}
          <div className="absolute left-1/2 -translate-x-[1px] bottom-0 translate-y-full w-[2px] h-8 bg-slate-200" />
        </div>

        {/* Linha horizontal de conexão */}
        <div className="relative w-[500px] max-w-[80%]">
          <div className="w-full h-[2px] bg-slate-200" />
          {/* Linhas verticais descendo da horizontal */}
          <div className="absolute left-[15%] top-0 w-[2px] h-6 bg-slate-200" />
          <div className="absolute left-1/2 -translate-x-[1px] top-0 w-[2px] h-6 bg-slate-200" />
          <div className="absolute right-[15%] top-0 w-[2px] h-6 bg-slate-200" />
        </div>

        {/* Nós Filhos (3 nós) */}
        <div className="flex gap-8 flex-wrap justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <div className="skeleton-pulse w-48 h-[72px] rounded-md border border-slate-200 flex flex-col items-start p-3 gap-2">
                <div className="h-3 w-28 rounded" style={{ background: 'rgba(197, 168, 90, 0.2)' }} />
                <div className="h-3 w-20 rounded" style={{ background: 'rgba(148, 163, 184, 0.25)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Texto elegante de carregamento */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C5A85A] animate-pulse" />
          <span className="text-xs text-slate-400 font-medium animate-pulse">
            Carregando estrutura organizacional...
          </span>
        </div>
      </div>
    </>
  );
}
