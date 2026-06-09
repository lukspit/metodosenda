'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
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
  Award, 
  Users, 
  Layers,
  ChevronUp,
  LogOut,
  Briefcase
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTenant, tenants, setCurrentTenant, currentProfile } = useApp();
  const [showCulture, setShowCulture] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);


  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Estrutura organizacional', path: '/organizational-chart', icon: GitBranch },
    { name: 'Indicadores', path: '/indicators', icon: BarChart3 },
    { name: 'Planos de ação', path: '/action-plans', icon: Target },
    { name: 'Atas', path: '/minutes', icon: FileText },
    { name: 'Agenda', path: '/calendar', icon: Calendar },
    { name: 'Ferramentas', path: '/tools', icon: Briefcase },
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
      
      {/* 1. Sidebar Lateral (Apenas Desktop) */}
      <aside className={`hidden md:flex bg-[#1E2538] text-slate-300 flex-col justify-between shrink-0 shadow-xl border-r border-slate-800 transition-all duration-300 ${
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

            {/* Botão de Sair */}
            <button
              onClick={handleLogout}
              title={!isSidebarOpen ? 'Sair' : undefined}
              className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 group hover:bg-rose-500/10 hover:text-rose-500 ${
                isSidebarOpen ? 'gap-3 px-3 py-2.5 justify-start' : 'p-3 justify-center'
              }`}
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-transform duration-200 group-hover:scale-110" />
              {isSidebarOpen && <span className="truncate animate-fadeIn">Sair</span>}
            </button>
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
        <header className="h-16 bg-[#1E2538] text-slate-300 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-10 shadow-sm shrink-0">
          
          <div className="flex items-center gap-4">
            {/* Hambúrguer sidebar (Apenas Desktop) */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-all active:scale-95 hidden md:block"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Cultura Organizacional retrátil (Apenas Desktop) */}
            <button
              onClick={() => setShowCulture(!showCulture)}
              className={`items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border hidden md:flex ${
                showCulture 
                  ? 'bg-[#C5A85A] border-[#C5A85A] text-[#1E2538] shadow-md' 
                  : 'bg-[#C5A85A]/10 border-[#C5A85A]/20 text-[#C5A85A] hover:bg-[#C5A85A]/20'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Cultura Organizacional
              {showCulture ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Logo Senda Simplificado (Apenas Mobile) */}
            <div className="flex items-center gap-2 md:hidden">
              <img 
                src="/logo_transparent.png" 
                className="h-6 w-auto object-contain" 
                alt="Logo Senda" 
              />
              <span className="font-extrabold text-white text-sm tracking-wider">MÉTODO <span className="text-[#C5A85A] text-[10px] font-semibold tracking-widest uppercase">Senda</span></span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            
            {/* Seletor de Tenant (Apenas Desktop) */}
            <div className="relative hidden md:block">
              {tenants && tenants.length > 1 ? (
                <button
                  onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                  className="flex items-center gap-2 bg-slate-800/40 border border-slate-700 px-4 py-1.5 rounded-lg text-sm text-slate-200 font-medium hover:bg-slate-800/80 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#C5A85A]" />
                  {currentTenant?.name || 'Carregando...'}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-800/10 border border-slate-800/30 px-4 py-1.5 rounded-lg text-sm text-slate-400 font-medium select-none">
                  <Layers className="w-4 h-4 text-slate-500" />
                  {currentTenant?.name || 'Carregando...'}
                </div>
              )}

              {tenants && tenants.length > 1 && showTenantDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1E2538] border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                  <p className="text-[10px] text-slate-450 font-bold tracking-wider uppercase px-3 py-1.5">Mudar Empresa</p>
                  {(tenants || []).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTenant(t);
                        setShowTenantDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 flex items-center justify-between cursor-pointer ${
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

            {/* Tela cheia (Apenas Desktop/Tablet) */}
            <button 
              onClick={toggleFullscreen}
              className="text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
              title="Tela Cheia"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Usuário Logado */}
            <div 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setShowMoreMenu(true);
                }
              }}
              className="flex items-center gap-3 md:border-l border-slate-800 md:pl-4 cursor-pointer md:cursor-default"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-500">Consultor Ativo</p>
                <p className="text-sm font-semibold text-slate-100">{currentProfile?.name || 'Senda User'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border-2 border-[#C5A85A] shadow-sm">
                {currentProfile?.name ? currentProfile.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
              </div>
            </div>

          </div>
        </header>

        {/* 3. Painel Expansível de Cultura (Apenas Desktop) */}
        {showCulture && currentTenant && (
          <div className="hidden md:grid bg-[#1E2538] text-white border-b border-slate-800 px-8 py-6 z-20 shadow-inner grid-cols-1 md:grid-cols-4 gap-6 animate-fadeIn transition-all duration-300">
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
                <Award className="w-4 h-4" /> Valores
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

        {/* 4. Corpo da Página com Rolagem Responsiva */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
            {children}
          </div>
        </main>

      </div>

      {/* 5. Bottom Navigation Bar (Apenas Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1E2538] border-t border-slate-800 flex items-center justify-around px-2 z-30 shadow-2xl backdrop-blur-md bg-opacity-95 pb-safe">
        {/* Dashboard */}
        <Link 
          href="/dashboard"
          onClick={() => setShowMoreMenu(false)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
            pathname === '/dashboard' ? 'text-[#C5A85A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Painel</span>
        </Link>

        {/* Indicadores */}
        <Link 
          href="/indicators"
          onClick={() => setShowMoreMenu(false)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
            pathname === '/indicators' ? 'text-[#C5A85A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-1">Metas</span>
        </Link>

        {/* Planos de Ação */}
        <Link 
          href="/action-plans"
          onClick={() => setShowMoreMenu(false)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
            pathname === '/action-plans' ? 'text-[#C5A85A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] mt-1">Ações</span>
        </Link>

        {/* Agenda */}
        <Link 
          href="/calendar"
          onClick={() => setShowMoreMenu(false)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
            pathname === '/calendar' ? 'text-[#C5A85A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1">Agenda</span>
        </Link>

        {/* Botão Mais */}
        <button 
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
            showMoreMenu ? 'text-[#C5A85A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex gap-1 justify-center items-center h-5">
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          </div>
          <span className="text-[10px] mt-1">Mais</span>
        </button>
      </div>

      {/* 6. Bottom Sheet Menu "Mais" (Apenas Mobile) */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-45 flex flex-col justify-end">
          {/* Overlay escuro de fundo com fade-in */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Menu Deslizante com slide-up */}
          <div className="relative bg-[#1E2538] border-t border-slate-800 rounded-t-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto z-50 animate-slideUp shadow-2xl pb-10">
            {/* Barra superior de arraste / feedback visual */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-2 mb-4 cursor-pointer" onClick={() => setShowMoreMenu(false)} />

            {/* Perfil do Usuário */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border-2 border-[#C5A85A] shadow-sm">
                {currentProfile?.name ? currentProfile.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
              </div>
              <div>
                <p className="text-xs text-[#C5A85A] font-semibold uppercase tracking-wider">Consultor Ativo</p>
                <p className="text-base font-bold text-slate-100">{currentProfile?.name || 'Senda User'}</p>
              </div>
            </div>

            {/* Menus Secundários */}
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/organizational-chart"
                onClick={() => setShowMoreMenu(false)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  pathname === '/organizational-chart' 
                    ? 'border-[#C5A85A] text-[#C5A85A] bg-[#C5A85A]/5' 
                    : 'border-slate-800 text-slate-300 bg-[#161B29]/50 hover:bg-slate-800'
                }`}
              >
                <GitBranch className="w-5 h-5 mb-1" />
                <span className="text-[10px] text-center font-medium truncate w-full">Organograma</span>
              </Link>

              <Link
                href="/minutes"
                onClick={() => setShowMoreMenu(false)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  pathname === '/minutes' 
                    ? 'border-[#C5A85A] text-[#C5A85A] bg-[#C5A85A]/5' 
                    : 'border-slate-800 text-slate-300 bg-[#161B29]/50 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-[10px] text-center font-medium truncate w-full">Atas</span>
              </Link>

              <Link
                href="/tools"
                onClick={() => setShowMoreMenu(false)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  pathname === '/tools' 
                    ? 'border-[#C5A85A] text-[#C5A85A] bg-[#C5A85A]/5' 
                    : 'border-slate-800 text-slate-300 bg-[#161B29]/50 hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-5 h-5 mb-1" />
                <span className="text-[10px] text-center font-medium truncate w-full">Ferramentas</span>
              </Link>
            </div>

            {/* Seletor de Tenant no Mobile */}
            {tenants && tenants.length > 0 && (
              <div className="bg-[#161B29]/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#C5A85A]" /> Empresa / Contexto
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTenant(t);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        currentTenant?.id === t.id 
                          ? 'text-[#C5A85A] font-semibold bg-[#C5A85A]/10 border border-[#C5A85A]/30' 
                          : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      {currentTenant?.id === t.id && <div className="w-1.5 h-1.5 rounded-full bg-[#C5A85A]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cultura Organizacional colapsável no Mobile */}
            {currentTenant && (
              <div className="bg-[#161B29]/40 border border-slate-800/80 rounded-xl p-4">
                <details className="group">
                  <summary className="list-none flex items-center justify-between cursor-pointer select-none">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#C5A85A]" /> Cultura Organizacional
                    </h4>
                    <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 grid grid-cols-1 gap-3.5 text-xs border-t border-slate-800/60 pt-3 animate-fadeIn">
                    <div>
                      <span className="font-bold text-[#C5A85A] block mb-1">Missão</span>
                      <p className="text-slate-300 leading-relaxed font-light">{currentTenant.mission || 'Não cadastrado'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#C5A85A] block mb-1">Negócio</span>
                      <p className="text-slate-300 leading-relaxed font-light">{currentTenant.vision || 'Não cadastrado'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#C5A85A] block mb-1">Valores</span>
                      <p className="text-slate-300 leading-relaxed font-light whitespace-pre-line">{currentTenant.values || 'Não cadastrado'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#C5A85A] block mb-1">Propósito</span>
                      <p className="text-slate-300 leading-relaxed font-light">{currentTenant.purpose || 'Não cadastrado'}</p>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Ações Administrativas e Logout */}
            <div className="border-t border-slate-800 pt-4 space-y-2.5">
              <Link
                href="/settings"
                onClick={() => setShowMoreMenu(false)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
                  pathname === '/settings' 
                    ? 'border-[#C5A85A]/30 text-[#C5A85A] bg-[#C5A85A]/5' 
                    : 'border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Settings className="w-5 h-5 text-slate-400" />
                Configurações da Plataforma
              </Link>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold border border-rose-500/20 text-rose-450 bg-rose-500/5 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 text-rose-500" />
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

