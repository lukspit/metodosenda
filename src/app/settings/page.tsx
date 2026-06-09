'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Heart, 
  Users, 
  Layers, 
  Save, 
  Compass, 
  UserPlus,
  Shield,
  Briefcase
} from 'lucide-react';

export default function SettingsPage() {
  const { currentTenant, updateTenantCulture, profiles, departments } = useApp();

  // Estados dos inputs de Cultura
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [values, setValues] = useState('');
  const [purpose, setPurpose] = useState('');

  // Carregar dados iniciais da cultura do tenant ativo
  useEffect(() => {
    if (currentTenant) {
      setMission(currentTenant.mission || '');
      setVision(currentTenant.vision || '');
      setValues(currentTenant.values || '');
      setPurpose(currentTenant.purpose || '');
    }
  }, [currentTenant]);

  const handleSaveCulture = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateTenantCulture({
      mission,
      vision,
      values,
      purpose
    });
    if (success) {
      alert('Cultura organizacional atualizada com sucesso! Verifique clicando no botão "Cultura Organizacional" no topo.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Configurações</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie a identidade corporativa da empresa, usuários ativos e permissões de acesso.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Gestão da Identidade e Cultura (8 Colunas) */}
        <div className="lg:col-span-8 bg-white rounded-lg p-6 border border-slate-200/60 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-850 text-base mb-2 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#C5A85A]" />
            Identidade Estratégica (Cultura)
          </h3>

          <form onSubmit={handleSaveCulture} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Missão da Empresa</label>
                <textarea
                  value={mission}
                  onChange={e => setMission(e.target.value)}
                  rows={3}
                  placeholder="Ex: Contribuir para a evolução das empresas..."
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Negócio (Visão de Negócio)</label>
                <textarea
                  value={vision}
                  onChange={e => setVision(e.target.value)}
                  rows={3}
                  placeholder="Ex: Consultoria em Gestão Estratégica..."
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A] resize-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Propósito (Onde queremos chegar)</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Ex: Ser a maior empresa de consultoria estratégica do país..."
                className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Valores (Filosofia Corporativa - Um por linha)</label>
              <textarea
                value={values}
                onChange={e => setValues(e.target.value)}
                rows={5}
                placeholder="Ex:
Ética acima de tudo
Foco estrito em resultado
Agilidade e capricho"
                className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C5A85A] resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#C5A85A] hover:bg-[#B3964C] text-white font-semibold px-6 py-2.5 rounded-md flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
              >
                <Save className="w-4 h-4" /> Salvar Cultura
              </button>
            </div>
          </form>
        </div>

        {/* Lado Direito: Equipe e Papéis (4 Colunas) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Listagem de Membros da Equipe */}
          <div className="bg-white rounded-lg p-6 border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-850 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C5A85A]" />
                Membros da Equipe ({profiles.length})
              </h3>
              <button
                onClick={() => alert('Para adicionar novos membros à equipe, o administrador pode convidá-los por e-mail na versão completa de produção.')}
                className="p-1.5 bg-[#C5A85A]/10 text-[#C5A85A] hover:bg-[#C5A85A] hover:text-white rounded-lg transition-colors"
                title="Convidar Membro"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Listagem de Usuários */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {profiles.map((profile) => {
                const dept = departments.find(d => d.id === profile.department_id)?.name || 'Geral';
                
                return (
                  <div 
                    key={profile.id}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                        {profile.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-850 truncate">{profile.name}</h4>
                        <p className="text-[10px] text-slate-450 truncate">{profile.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide inline-block ${
                        profile.role === 'admin' 
                          ? 'bg-rose-500/10 text-rose-500' 
                          : profile.role === 'consultor'
                            ? 'bg-[#C5A85A]/10 text-[#C5A85A]'
                            : 'bg-slate-200 text-slate-500'
                      }`}>
                        {profile.role}
                      </span>
                      <p className="text-[8px] text-slate-400 font-semibold mt-0.5">{dept}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permissões do Sistema */}
          <div className="bg-white rounded-lg p-6 border border-slate-200/60 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-850 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C5A85A]" />
              Funções de Acesso
            </h3>
            
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <p><strong>Admin:</strong> Acesso total às configurações, orçamentos, organograma e exclusão de dados.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A85A] mt-1.5 shrink-0" />
                <p><strong>Consultor:</strong> Visualiza múltiplos tenants de clientes da consultoria Senda e ajuda a guiar o preenchimento.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <p><strong>Colaborador:</strong> Acesso focado no preenchimento de metas de indicadores do seu setor e progresso dos planos de ação.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
