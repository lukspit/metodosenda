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
  User,
  Trash2,
  Plus
} from 'lucide-react';

interface InitialMember {
  name: string;
  email: string;
  role: 'admin' | 'consultor' | 'colaborador';
  password: string;
}

export default function SettingsPage() {
  const { 
    currentTenant, 
    updateTenantCulture, 
    profiles, 
    currentProfile, 
    departments, 
    refreshData,
    tenants,
    createTenant,
    associateConsultant,
    dissociateConsultant,
    fetchAssociatedConsultants
  } = useApp();

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

  // Estados para Gestão de Empresas (Senda Admin)
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantMission, setTenantMission] = useState('');
  const [tenantVision, setTenantVision] = useState('');
  const [tenantValues, setTenantValues] = useState('');
  const [tenantPurpose, setTenantPurpose] = useState('');
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);

  // Estados para membros iniciais no cadastro de empresa
  const [initialMembers, setInitialMembers] = useState<InitialMember[]>([
    { name: '', email: '', role: 'admin', password: '' }
  ]);
  const [memberCreationProgress, setMemberCreationProgress] = useState<string | null>(null);

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedTenantForAccess, setSelectedTenantForAccess] = useState<any | null>(null);
  const [associatedConsultants, setAssociatedConsultants] = useState<string[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

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

  const isSendaAdmin = currentProfile?.role === 'admin' && (currentProfile.tenant_id === 't-senda' || currentTenant?.name === 'Senda Consultoria');

  const handleAddMember = () => {
    setInitialMembers(prev => [...prev, { name: '', email: '', role: 'colaborador', password: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    if (index === 0) return; // Não pode remover o admin obrigatório
    setInitialMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof InitialMember, value: string) => {
    setInitialMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) return;

    // Validar que o admin obrigatório está preenchido
    const adminMember = initialMembers[0];
    if (!adminMember.name.trim() || !adminMember.email.trim() || !adminMember.password || adminMember.password.length < 6) {
      setTenantError('Preencha os dados do Administrador da empresa (nome, email e senha com mín. 6 caracteres).');
      return;
    }

    // Validar membros adicionais preenchidos
    for (let i = 1; i < initialMembers.length; i++) {
      const m = initialMembers[i];
      if (!m.name.trim() || !m.email.trim() || !m.password || m.password.length < 6) {
        setTenantError(`Preencha todos os campos do membro #${i + 1} (nome, email e senha com mín. 6 caracteres).`);
        return;
      }
    }

    setTenantLoading(true);
    setTenantError(null);
    setMemberCreationProgress(null);

    // 1. Criar a empresa
    const createdTenant = await createTenant({
      name: tenantName,
      mission: tenantMission,
      vision: tenantVision,
      values: tenantValues,
      purpose: tenantPurpose
    });

    if (!createdTenant) {
      setTenantLoading(false);
      setTenantError('Erro ao cadastrar a empresa cliente no banco de dados.');
      return;
    }

    // 2. Criar os membros encadeados
    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < initialMembers.length; i++) {
      const member = initialMembers[i];
      setMemberCreationProgress(`Criando usuário ${i + 1} de ${initialMembers.length}...`);
      
      try {
        const res = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: member.name,
            email: member.email,
            password: member.password,
            role: member.role,
            department_id: null,
            tenant_id: createdTenant.id
          })
        });

        const data = await res.json();
        if (!res.ok) {
          errors.push(`${member.email}: ${data.error}`);
        } else {
          createdCount++;
        }
      } catch (err: any) {
        errors.push(`${member.email}: ${err.message || 'Erro de rede'}`);
      }
    }

    setTenantLoading(false);
    setMemberCreationProgress(null);

    if (errors.length > 0) {
      setTenantError(`Empresa criada, mas houve erros em ${errors.length} usuário(s):\n${errors.join('\n')}`);
    } else {
      setIsCreateTenantModalOpen(false);
      setTenantName('');
      setTenantMission('');
      setTenantVision('');
      setTenantValues('');
      setTenantPurpose('');
      setInitialMembers([{ name: '', email: '', role: 'admin', password: '' }]);
      alert(`Empresa "${tenantName}" criada com sucesso!\n${createdCount} usuário(s) cadastrado(s).`);
      await refreshData();
    }
  };

  const handleOpenAccessModal = async (tenant: any) => {
    setSelectedTenantForAccess(tenant);
    setAccessLoading(true);
    const ids = await fetchAssociatedConsultants(tenant.id);
    setAssociatedConsultants(ids);
    setAccessLoading(false);
    setIsAccessModalOpen(true);
  };

  const handleToggleAccess = async (consultantId: string) => {
    if (!selectedTenantForAccess) return;
    const isAssociated = associatedConsultants.includes(consultantId);
    
    if (isAssociated) {
      const success = await dissociateConsultant(consultantId, selectedTenantForAccess.id);
      if (success) {
        setAssociatedConsultants(prev => prev.filter(id => id !== consultantId));
      }
    } else {
      const success = await associateConsultant(consultantId, selectedTenantForAccess.id);
      if (success) {
        setAssociatedConsultants(prev => [...prev, consultantId]);
      }
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
        <div className="lg:col-span-8 bg-white rounded-lg p-4 md:p-6 border border-slate-200/60 shadow-sm space-y-6">
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
          <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200/60 shadow-sm space-y-4">
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

          {/* Card de Empresas Clientes (Apenas Senda Admin) */}
          {isSendaAdmin && (
            <div className="bg-white rounded-lg p-6 border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-850 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#C5A85A]" />
                  Empresas Clientes (Consultoria)
                </h3>
                <button
                  onClick={() => setIsCreateTenantModalOpen(true)}
                  className="p-1.5 bg-[#C5A85A]/10 text-[#C5A85A] hover:bg-[#C5A85A] hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Cadastrar Nova Empresa"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Listagem de Clientes */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {tenants.filter(t => t.name !== 'Senda Consultoria' && t.id !== 't-senda').length > 0 ? (
                  tenants
                    .filter(t => t.name !== 'Senda Consultoria' && t.id !== 't-senda')
                    .map((t) => (
                      <div 
                        key={t.id}
                        className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-md"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-850 truncate">{t.name}</h4>
                          <p className="text-[9px] text-slate-400 truncate">Propósito: {t.purpose || 'Sem propósito definido'}</p>
                        </div>

                        <button
                          onClick={() => handleOpenAccessModal(t)}
                          className="px-2.5 py-1.5 bg-[#1E2538] hover:bg-[#2c3752] text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Shield className="w-3 h-3 text-[#C5A85A]" />
                          Acessos
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhuma empresa cliente cadastrada.</p>
                )}
              </div>
            </div>
          )}

          {/* Permissões do Sistema */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200/60 shadow-sm space-y-3">
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
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
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

      {/* Modal Premium de Cadastro de Empresa Cliente */}
      {isCreateTenantModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Cadastrar Empresa Cliente
                </h3>
              </div>
              <button 
                onClick={() => { setIsCreateTenantModalOpen(false); setTenantError(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4 text-left">
              {tenantError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-md text-xs font-semibold">
                  {tenantError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  placeholder="Ex: Indústrias Metalúrgicas S.A."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                    Missão
                  </label>
                  <textarea
                    value={tenantMission}
                    onChange={e => setTenantMission(e.target.value)}
                    rows={3}
                    placeholder="A razão de existir da empresa..."
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                    Visão de Negócio
                  </label>
                  <textarea
                    value={tenantVision}
                    onChange={e => setTenantVision(e.target.value)}
                    rows={3}
                    placeholder="Onde a empresa quer estar no futuro..."
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                  Propósito
                </label>
                <input
                  type="text"
                  value={tenantPurpose}
                  onChange={e => setTenantPurpose(e.target.value)}
                  placeholder="O impacto que a empresa quer causar..."
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">
                  Valores (Um por linha)
                </label>
                <textarea
                  value={tenantValues}
                  onChange={e => setTenantValues(e.target.value)}
                  rows={4}
                  placeholder="Ex:&#10;Ética&#10;Qualidade&#10;Resultado"
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                />
              </div>

              {/* Seção de Usuários Iniciais da Empresa */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#C5A85A]" />
                    Usuários Iniciais da Empresa
                  </h4>
                </div>

                {initialMembers.map((member, index) => (
                  <div key={index} className={`p-3.5 rounded-lg border space-y-3 ${index === 0 ? 'border-[#C5A85A]/30 bg-[#C5A85A]/5' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                        index === 0 ? 'bg-[#C5A85A]/20 text-[#C5A85A]' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {index === 0 ? '★ Administrador (Obrigatório)' : `Membro #${index + 1}`}
                      </span>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remover membro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Nome *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                            <User className="w-3 h-3" />
                          </span>
                          <input
                            type="text"
                            required
                            value={member.name}
                            onChange={e => handleMemberChange(index, 'name', e.target.value)}
                            placeholder="Nome completo"
                            className="w-full bg-white text-[11px] text-slate-700 border border-slate-200 rounded py-2 pl-7 pr-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Email *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                            <Mail className="w-3 h-3" />
                          </span>
                          <input
                            type="email"
                            required
                            value={member.email}
                            onChange={e => handleMemberChange(index, 'email', e.target.value)}
                            placeholder="email@empresa.com"
                            className="w-full bg-white text-[11px] text-slate-700 border border-slate-200 rounded py-2 pl-7 pr-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Senha *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                            <Lock className="w-3 h-3" />
                          </span>
                          <input
                            type="password"
                            required
                            value={member.password}
                            onChange={e => handleMemberChange(index, 'password', e.target.value)}
                            placeholder="Mín. 6 caracteres"
                            className="w-full bg-white text-[11px] text-slate-700 border border-slate-200 rounded py-2 pl-7 pr-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Cargo</label>
                        <select
                          value={member.role}
                          onChange={e => handleMemberChange(index, 'role', e.target.value)}
                          disabled={index === 0}
                          className={`w-full text-[11px] border border-slate-200 rounded py-2 px-2 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] ${index === 0 ? 'bg-[#C5A85A]/10 text-[#C5A85A] font-bold cursor-not-allowed' : 'bg-white text-slate-700'}`}
                        >
                          <option value="admin">Administrador</option>
                          <option value="consultor">Consultor</option>
                          <option value="colaborador">Colaborador</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-[#C5A85A] text-slate-400 hover:text-[#C5A85A] rounded-lg transition-all flex items-center justify-center gap-1.5 text-[11px] font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Membro da Equipe
                </button>
              </div>

              {/* Status de Progresso */}
              {memberCreationProgress && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 px-4 py-2.5 rounded-md text-xs font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {memberCreationProgress}
                </div>
              )}

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsCreateTenantModalOpen(false); setTenantError(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tenantLoading || !tenantName.trim()}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  {tenantLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Empresa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Premium de Gerenciamento de Acessos */}
      {isAccessModalOpen && selectedTenantForAccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Acessos: {selectedTenantForAccess.name}
                </h3>
              </div>
              <button 
                onClick={() => { setIsAccessModalOpen(false); setSelectedTenantForAccess(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed text-left">
                Selecione quais consultores e administradores da **Senda Consultoria** terão acesso para visualizar e gerenciar os dados desta empresa.
              </p>

              {accessLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C5A85A]" />
                  <span className="text-xs text-slate-400">Carregando permissões...</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {profiles.filter(p => p.role === 'consultor' || p.role === 'admin').length > 0 ? (
                    profiles
                      .filter(p => p.role === 'consultor' || p.role === 'admin')
                      .map((consultant) => {
                        const isAssociated = associatedConsultants.includes(consultant.id);
                        const isOriginalSendaAdmin = consultant.role === 'admin' && consultant.tenant_id === 't-senda';
                        
                        return (
                          <label 
                            key={consultant.id} 
                            className={`flex items-center justify-between p-3 border rounded-lg transition-all select-none cursor-pointer ${
                              isAssociated 
                                ? 'border-[#C5A85A] bg-[#C5A85A]/5' 
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isAssociated || isOriginalSendaAdmin}
                                disabled={isOriginalSendaAdmin}
                                onChange={() => handleToggleAccess(consultant.id)}
                                className="w-4 h-4 border-slate-300 rounded text-[#C5A85A] focus:ring-[#C5A85A] accent-[#C5A85A]"
                              />
                              <div className="text-left">
                                <p className="text-xs font-bold text-slate-800">{consultant.name}</p>
                                <p className="text-[10px] text-slate-450">{consultant.email}</p>
                              </div>
                            </div>
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide inline-block ${
                                consultant.role === 'admin' 
                                  ? 'bg-rose-500/10 text-rose-500' 
                                  : 'bg-[#C5A85A]/10 text-[#C5A85A]'
                              }`}>
                                {consultant.role}
                              </span>
                            </div>
                          </label>
                        );
                      })
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhum consultor disponível.</p>
                  )}
                </div>
              )}

              {/* Botão de Fechar */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAccessModalOpen(false); setSelectedTenantForAccess(null); }}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white font-semibold py-2 px-6 rounded-md shadow transition-colors text-xs cursor-pointer"
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
