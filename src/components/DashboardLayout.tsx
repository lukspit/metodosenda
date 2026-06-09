'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  GitBranch, 
  BarChart3, 
  Target, 
  FileText, 
  Calendar, 
  Settings, 
  ChevronDown, 
  Maximize2, 
  Compass, 
  Heart, 
  Users, 
  Layers,
  ChevronUp
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { currentTenant, tenants, setCurrentTenant, currentProfile } = useApp();
  const [showCulture, setShowCulture] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Estrutura organizacional', path: '/organizational-chart', icon: GitBranch },
    { name: 'Indicadores', path: '/indicators', icon: BarChart3 },
    { name: 'Planos de ação', path: '/action-plans', icon: Target },
    { name: 'Atas', path: '/minutes', icon: FileText },
    { name: 'Agenda', path: '/calendar', icon: Calendar },
  ];

  const secondaryMenuItems = [
    { name: 'Configurações', path: '/settings', icon: Settings },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans transition-colors duration-300">
      
      {/* 1. Sidebar Lateral */}
      <aside className={`bg-[#1E2538] text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800 transition-all duration-300 ${
        isSidebarOpen ? 'w-[260px]' : 'w-[75px]'
      }`}>
        <div>
          {/* Logo Senda */}
          <div className={`h-16 flex items-center border-b border-slate-800 bg-[#161B29] transition-all duration-300 ${
            isSidebarOpen ? 'gap-3 px-5 justify-start' : 'px-0 justify-center'
          }`}>
            <img 
              src="/logo.png" 
              className="h-4 w-auto object-contain shrink-0 transition-all duration-300" 
              alt="Logo Senda" 
            />
            {isSidebarOpen && (
              <div className="animate-fadeIn">
                <span className="font-extrabold text-white text-lg tracking-wider">MÉTODO</span>
                <span className="text-[#C5A85A] text-xs font-semibold block -mt-1.5 tracking-widest uppercase">Senda</span>
              </div>
            )}
          </div>


          {/* Menu Principal */}
          <nav className="mt-6 px-3 space-y-1">
            <p className={`text-[10px] font-bold text-slate-500 tracking-widest uppercase px-3 mb-2 ${
              isSidebarOpen ? 'block' : 'hidden'
            }`}>
              Menu
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={!isSidebarOpen ? item.name : undefined}
                  className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isSidebarOpen ? 'gap-3 px-3 py-2.5 justify-start' : 'p-3 justify-center'
                  } ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#C5A85A]/20 to-[#C5A85A]/5 text-[#C5A85A] border-l-4 border-[#C5A85A]' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-[#C5A85A]' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  {isSidebarOpen && <span className="truncate animate-fadeIn">{item.name}</span>}
                </Link>
              );
            })}

            <p className={`text-[10px] font-bold text-slate-500 tracking-widest uppercase px-3 mt-6 mb-2 ${
              isSidebarOpen ? 'block' : 'hidden'
            }`}>
              Secundário
            </p>
            {secondaryMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={!isSidebarOpen ? item.name : undefined}
                  className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isSidebarOpen ? 'gap-3 px-3 py-2.5 justify-start' : 'p-3 justify-center'
                  } ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#C5A85A]/20 to-[#C5A85A]/5 text-[#C5A85A] border-l-4 border-[#C5A85A]' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-[#C5A85A]' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  {isSidebarOpen && <span className="truncate animate-fadeIn">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Informações da Versão e Rodapé */}
        <div className={`p-4 border-t border-slate-800 bg-[#161B29] text-center text-xs text-slate-500 transition-all duration-300 ${
          isSidebarOpen ? 'block' : 'px-1 py-3'
        }`}>
          {isSidebarOpen ? (
            <>
              <p>© {new Date().getFullYear()} Senda Core v2.0</p>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">IA INTEGRADA</span>
            </>
          ) : (
            <span className="text-[10px] bg-slate-800 text-[#C5A85A] px-1.5 py-0.5 rounded font-mono font-bold">S2.0</span>
          )}
        </div>
      </aside>


      {/* 2. Área do Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Cabeçalho Superior (Header) */}
        <header className="h-16 bg-[#1E2538] text-slate-300 border-b border-slate-800 flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
          
          <div className="flex items-center gap-4">
            {/* Hambúrguer sidebar */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Cultura Organizacional retrátil */}
            <button
              onClick={() => setShowCulture(!showCulture)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                showCulture 
                  ? 'bg-[#C5A85A] border-[#C5A85A] text-[#1E2538] shadow-md' 
                  : 'bg-[#C5A85A]/10 border-[#C5A85A]/20 text-[#C5A85A] hover:bg-[#C5A85A]/20'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showCulture ? 'fill-[#1E2538]' : ''}`} />
              Cultura Organizacional
              {showCulture ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-6">
            
            {/* Seletor de Tenant */}
            <div className="relative">
              <button
                onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                className="flex items-center gap-2 bg-slate-800/40 border border-slate-700 px-4 py-1.5 rounded-lg text-sm text-slate-200 font-medium hover:bg-slate-800/80 transition-all"
              >
                <Layers className="w-4 h-4 text-[#C5A85A]" />
                {currentTenant?.name || 'Carregando...'}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showTenantDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1E2538] border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                  <p className="text-[10px] text-slate-450 font-bold tracking-wider uppercase px-3 py-1.5">Mudar Empresa</p>
                  {tenants.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTenant(t);
                        setShowTenantDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 flex items-center justify-between ${
                        currentTenant?.id === t.id ? 'text-[#C5A85A] font-semibold bg-[#C5A85A]/5' : 'text-slate-350'
                      }`}
                    >
                      {t.name}
                      {currentTenant?.id === t.id && <div className="w-1.5 h-1.5 rounded-full bg-[#C5A85A]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tela cheia */}
            <button 
              onClick={toggleFullscreen}
              className="text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
              title="Tela Cheia"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Usuário Logado */}
            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-500">Consultor Ativo</p>
                <p className="text-sm font-semibold text-slate-100">{currentProfile?.name || 'Senda User'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border-2 border-[#C5A85A] shadow-sm">
                {currentProfile?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'}
              </div>
            </div>

          </div>
        </header>

        {/* 3. Painel Expansível de Cultura */}
        {showCulture && currentTenant && (
          <div className="bg-[#1E2538] text-white border-b border-slate-800 px-8 py-6 z-20 shadow-inner grid grid-cols-1 md:grid-cols-4 gap-6 animate-fadeIn transition-all duration-300">
            <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/50">
              <h4 className="text-xs font-bold text-[#C5A85A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> Missão
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                {currentTenant.mission || 'Não cadastrado'}
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/50">
              <h4 className="text-xs font-bold text-[#C5A85A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Negócio
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                {currentTenant.vision || 'Não cadastrado'}
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/50">
              <h4 className="text-xs font-bold text-[#C5A85A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Heart className="w-4 h-4" /> Valores
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-light whitespace-pre-line">
                {currentTenant.values || 'Não cadastrado'}
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-md p-4 border border-slate-700/50">
              <h4 className="text-xs font-bold text-[#C5A85A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Propósito
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                {currentTenant.purpose || 'Não cadastrado'}
              </p>
            </div>
          </div>
        )}

        {/* 4. Corpo da Página com Rolagem */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};
