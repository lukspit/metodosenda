'use client';

import React from 'react';

/**
 * Skeleton para a página de Planos de Ação
 */
export function SkeletonActionPlans() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton-pulse h-7 w-48 rounded-md" />
          <div className="skeleton-pulse h-4 w-80 rounded-md mt-2" />
        </div>
        <div className="skeleton-pulse h-10 w-36 rounded-lg" />
      </div>

      {/* Caixa de estatísticas/cards rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-slate-200/60 space-y-2">
            <div className="skeleton-pulse h-3 w-16 rounded" />
            <div className="skeleton-pulse h-6 w-10 rounded" />
          </div>
        ))}
      </div>

      {/* Tabela de Planos de Ação */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra de controle */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div className="skeleton-pulse h-4 w-32 rounded" />
          <div className="skeleton-pulse h-8 w-24 rounded" />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#C5A85A]/10 border-b border-slate-250">
                <th className="py-3 px-4 w-1/3"><div className="skeleton-pulse h-3 w-28 rounded" /></th>
                <th className="py-3 px-4 w-1/6"><div className="skeleton-pulse h-3 w-16 rounded" /></th>
                <th className="py-3 px-4 w-1/6"><div className="skeleton-pulse h-3 w-20 rounded" /></th>
                <th className="py-3 px-4 w-1/6"><div className="skeleton-pulse h-3 w-20 rounded" /></th>
                <th className="py-3 px-4 w-1/12"><div className="skeleton-pulse h-3 w-12 rounded" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-4 px-4 space-y-1.5">
                    <div className="skeleton-pulse h-4 w-40 rounded" />
                    <div className="skeleton-pulse h-3 w-64 rounded" />
                  </td>
                  <td className="py-4 px-4"><div className="skeleton-pulse h-4 w-24 rounded" /></td>
                  <td className="py-4 px-4"><div className="skeleton-pulse h-4 w-20 rounded" /></td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="skeleton-pulse h-1.5 w-20 rounded-full" />
                      <div className="skeleton-pulse h-3 w-6 rounded" />
                    </div>
                  </td>
                  <td className="py-4 px-4"><div className="skeleton-pulse h-6 w-16 rounded-full" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para a página de Atas de Reunião
 */
export function SkeletonMinutes() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton-pulse h-7 w-40 rounded-md" />
          <div className="skeleton-pulse h-4 w-96 rounded-md mt-2" />
        </div>
        <div className="skeleton-pulse h-10 w-36 rounded-lg" />
      </div>

      {/* Tabela de Atas */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra de controle */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between">
          <div className="skeleton-pulse h-4 w-24 rounded" />
          <div className="skeleton-pulse h-4 w-12 rounded" />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#C5A85A] py-3 border-b border-slate-350">
                <th className="py-3 px-4 w-2/3"><div className="skeleton-pulse h-4.5 w-28 rounded opacity-50" /></th>
                <th className="py-3 px-4 w-1/4"><div className="skeleton-pulse h-4.5 w-16 rounded opacity-50" /></th>
                <th className="py-3 px-4 text-center w-1/12"><div className="skeleton-pulse h-4.5 w-10 rounded opacity-50" /></th>
              </tr>
              {/* Filtros */}
              <tr className="bg-[#EAEAEA] border-b border-slate-200">
                <th className="py-2 px-3"><div className="skeleton-pulse h-7 w-full rounded" /></th>
                <th className="py-2 px-3" colSpan={2}><div className="skeleton-pulse h-7 w-full rounded" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-4.5 px-4"><div className="skeleton-pulse h-4.5 w-60 rounded" /></td>
                  <td className="py-4.5 px-4"><div className="skeleton-pulse h-4 w-28 rounded" /></td>
                  <td className="py-4.5 px-4 text-center"><div className="skeleton-pulse h-4 w-16 rounded mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para a página de Indicadores
 */
export function SkeletonIndicators() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton-pulse h-7 w-48 rounded-md" />
          <div className="skeleton-pulse h-4 w-80 rounded-md mt-2" />
        </div>
        <div className="skeleton-pulse h-10 w-36 rounded-lg" />
      </div>

      {/* Grid de Filtros */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200/60 flex flex-wrap gap-4 items-center">
        <div className="skeleton-pulse h-9 w-40 rounded" />
        <div className="skeleton-pulse h-9 w-48 rounded" />
        <div className="skeleton-pulse h-9 w-24 rounded" />
      </div>

      {/* Grid de Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg p-5 shadow-sm border border-slate-200/60 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="skeleton-pulse h-4 w-36 rounded" />
                <div className="skeleton-pulse h-3 w-48 rounded" />
              </div>
              <div className="skeleton-pulse h-5 w-12 rounded" />
            </div>

            {/* Simulação de Mini Gráfico / Progresso */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <div className="skeleton-pulse h-3 w-16 rounded" />
                <div className="skeleton-pulse h-3 w-20 rounded" />
              </div>
              <div className="skeleton-pulse h-2 w-full rounded-full" />
            </div>

            {/* Simulação de Valores Mensais */}
            <div className="flex gap-2 justify-between border-t border-slate-100 pt-3">
              {[1, 2, 3, 4, 5].map((m) => (
                <div key={m} className="text-center space-y-1">
                  <div className="skeleton-pulse h-2.5 w-6 rounded" />
                  <div className="skeleton-pulse h-3 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
