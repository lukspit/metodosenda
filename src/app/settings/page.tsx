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
  Briefcase,
  X,
  Loader2,
  Lock,
  Mail,
  User
} from 'lucide-react';

export default function SettingsPage() {
  const { currentTenant, updateTenantCulture, profiles, currentProfile, departments, refreshData } = useApp();

  // Estados dos inputs de Cultura
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [values, setValues] = useState('');
  const [purpose, setPurpose] = useState('');

  // Estados do Modal de Cadastro de Usuário
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'consultor' | 'colaborador'>('colaborador');
  const [inviteDeptId, setInviteDeptId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

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

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword || !currentTenant) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          password: invitePassword,
          role: inviteRole,
          department_id: inviteDeptId || null,
          tenant_id: currentTenant.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar novo membro.');
      }

      await refreshData();
      setIsInviteModalOpen(false);
      
      // Limpar campos
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('colaborador');
      setInviteDeptId('');
      
      alert(`Membro ${inviteName} cadastrado com sucesso!`);
    } catch (err: any) {
      console.error(err);
      setInviteError(err.message || 'Erro de rede ou permissão.');
    } finally {
      setInviteLoading(false);
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
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Negócio (Visão de Negócio)</label>
                <textarea
                  value={vision}
                  onChange={e => setVision(e.target.value)}
                  rows={3}
                  placeholder="Ex: Consultoria em Gestão Estratégica..."
                  className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
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
                className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
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
                className="w-full bg-slate-50 text-sm text-slate-700 border border-slate-200 px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#1E2538] hover:bg-[#2c3752] text-white font-semibold px-6 py-2.5 rounded-md flex items-center gap-2 shadow-md transition-all active:scale-95 text-xs border border-slate-700"
              >
                <Save className="w-4 h-4 text-[#C5A85A]" /> Salvar Cultura
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
              {(currentProfile?.role === 'admin' || currentProfile?.role === 'consultor') && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="p-1.5 bg-[#C5A85A]/10 text-[#C5A85A] hover:bg-[#C5A85A] hover:text-white rounded-lg transition-colors"
                  title="Convidar Membro"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
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
                        {profile.name ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
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

      {/* Modal Premium de Convite de Membro da Equipe */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Cadastrar Novo Membro
                </h3>
              </div>
              <button 
                onClick={() => { setIsInviteModalOpen(false); setInviteError(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleInviteUser} className="p-6 space-y-4 text-left">
              {inviteError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-md text-xs font-semibold">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                  Endereço de E-mail *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="nome@empresa.com"
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                  Senha Provisória *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                    Papel / Permissão
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="consultor">Consultor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                    Setor de Atuação
                  </label>
                  <select
                    value={inviteDeptId}
                    onChange={e => setInviteDeptId(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-750 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="">Geral / Sem setor</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsInviteModalOpen(false); setInviteError(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteName.trim() || !inviteEmail.trim() || !invitePassword}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors flex items-center gap-1.5 text-xs"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
                      Cadastrando...
                    </>
                  ) : (
                    'Salvar Membro'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
