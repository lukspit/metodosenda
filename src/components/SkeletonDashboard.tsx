'use client';

import React from 'react';

/**
 * SkeletonDashboard - Layout skeleton premium que reflete exatamente
 * a estrutura real do Dashboard para uma transição suave de carregamento.
 * Usa uma animação de shimmer personalizada para dar vida ao loading.
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-fadeIn">


      {/* Cabeçalho Skeleton */}
      <div>
        <div className="skeleton-pulse h-7 w-36 rounded-md" />
        <div className="skeleton-pulse h-4 w-80 rounded-md mt-2" />
      </div>

      {/* Grid de Métricas (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60 flex items-center justify-between"
          >
            <div className="space-y-3 flex-1">
              <div className="skeleton-pulse h-3 w-24 rounded" />
              <div className="skeleton-pulse h-7 w-20 rounded" />
              <div className="skeleton-pulse h-2 w-full rounded-full" />
            </div>
            <div className="skeleton-pulse w-12 h-12 rounded-md ml-4 shrink-0" />
          </div>
        ))}
      </div>

      {/* Seções Horizontais: Senda AI Insights + Gráfico de Indicadores */}
      <div className="flex flex-col gap-6">
        {/* Card de IA Skeleton - Largura Inteira */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="skeleton-pulse h-4 w-32 rounded" />
              <div className="skeleton-pulse h-7 w-7 rounded-lg" />
            </div>
            <div className="space-y-3 py-4">
              <div className="skeleton-pulse h-4 w-3/4 rounded" />
              <div className="skeleton-pulse h-3 w-full rounded" />
              <div className="skeleton-pulse h-3 w-5/6 rounded" />
              <div className="skeleton-pulse h-3 w-2/3 rounded" />
              <div className="skeleton-pulse h-3 w-4/5 rounded" />
              <div className="skeleton-pulse h-3 w-1/2 rounded" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-150">
            <div className="skeleton-pulse h-3 w-48 rounded" />
          </div>
        </div>

        {/* Gráfico Skeleton - Largura Inteira */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="skeleton-pulse h-5 w-56 rounded" />
              <div className="skeleton-pulse h-3 w-72 rounded mt-2" />
            </div>
            <div className="skeleton-pulse h-6 w-24 rounded-full" />
          </div>
          <div className="h-[320px] w-full pt-4 flex items-end gap-3 px-4">
            {/* Barras simulando o gráfico de área */}
            {[60, 45, 75, 55, 80, 40, 70, 50, 65, 85, 48, 72].map((h, i) => (
              <div
                key={i}
                className="skeleton-pulse rounded-t-sm flex-1"
                style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Planos de Ação Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="skeleton-pulse h-5 w-56 rounded" />
            <div className="skeleton-pulse h-3 w-48 rounded mt-2" />
          </div>
          <div className="skeleton-pulse h-4 w-32 rounded" />
        </div>

        {/* Header da tabela */}
        <div className="bg-slate-50 rounded-lg px-6 py-3 flex gap-6 mb-2">
          <div className="skeleton-pulse h-3 w-32 rounded" />
          <div className="skeleton-pulse h-3 w-16 rounded" />
          <div className="skeleton-pulse h-3 w-24 rounded" />
          <div className="skeleton-pulse h-3 w-20 rounded" />
          <div className="skeleton-pulse h-3 w-16 rounded" />
        </div>

        {/* Linhas da tabela */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="px-6 py-4 flex items-center gap-6 border-b border-slate-100"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-pulse h-4 w-48 rounded" />
              <div className="skeleton-pulse h-3 w-64 rounded" />
            </div>
            <div className="skeleton-pulse h-4 w-20 rounded" />
            <div className="skeleton-pulse h-4 w-24 rounded" />
            <div className="flex items-center gap-2">
              <div className="skeleton-pulse h-1.5 w-24 rounded-full" />
              <div className="skeleton-pulse h-3 w-8 rounded" />
            </div>
            <div className="skeleton-pulse h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
