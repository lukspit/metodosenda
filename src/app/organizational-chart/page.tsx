'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp, Department } from '../../context/AppContext';
import { SmartInput } from '../../components/SmartInput';
import { SkeletonOrgChart } from '../../components/SkeletonOrgChart';
import { 
  Compass, 
  Plus, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Sparkles,
  GitPullRequest,
  User,
  Info,
  Edit2,
  X,
  Loader2
} from 'lucide-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  MarkerType,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 1. Paleta de cores premium para os setores
const PALETTE_COLORS = [
  { hex: '', name: 'Padrão (Slate)' },
  { hex: '#1E2538', name: 'Azul Senda' },
  { hex: '#C5A85A', name: 'Dourado Senda' },
  { hex: '#3B82F6', name: 'Azul Comercial' },
  { hex: '#10B981', name: 'Verde' },
  { hex: '#EF4444', name: 'Vermelho' },
  { hex: '#F59E0B', name: 'Laranja' },
  { hex: '#8B5CF6', name: 'Roxo' },
  { hex: '#EC4899', name: 'Rosa' },
  { hex: '#14B8A6', name: 'Teal' },
  { hex: '#6B7280', name: 'Cinza' }
];

// 2. Componente Customizado para os Nós do Organograma
const CustomNode: React.FC<NodeProps> = ({ data }) => {
  const isRoot = !!data.isRoot;
  const managerName = (data.managerName as string) || '';
  const deptName = (data.label as string) || '';
  const color = (data as any).color as string || '';
  const onEdit = (data as any).onEdit as (() => void) | undefined;
  const onDelete = (data as any).onDelete as (() => void) | undefined;

  return (
    <div 
      className={`min-w-[190px] rounded-md shadow-lg border bg-white transition-all hover:scale-105 duration-200 overflow-hidden ${
        isRoot 
          ? 'border-2 ring-2 ring-[#C5A85A]/20' 
          : ''
      }`}
      style={{
        borderColor: color || (isRoot ? '#C5A85A' : '#E2E8F0')
      }}
    >
      {/* Alça superior para conexão (entrada) se não for o nó raiz */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#C5A85A] !w-2 h-2 !border-none"
        />
      )}

      {/* Cabeçalho do Bloco */}
      <div 
        className={`px-4 py-2 flex items-center justify-between gap-2 border-b ${
          isRoot ? 'text-white' : 'text-slate-850'
        }`}
        style={{
          backgroundColor: color || (isRoot ? '#1E2538' : '#F8FAFC'),
          borderColor: color ? `${color}33` : (isRoot ? '#C5A85A33' : '#F1F5F9'),
          color: color ? '#FFFFFF' : (isRoot ? '#FFFFFF' : '#1E2538')
        }}
      >
        <span className="font-bold text-xs truncate max-w-[100px] uppercase tracking-wider">{deptName}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
            className={`p-1 rounded hover:bg-slate-250/30 transition-colors ${
              color ? 'text-white/80 hover:text-white' : (isRoot ? 'hover:bg-slate-700/50 text-[#C5A85A]' : 'text-slate-500 hover:text-slate-850')
            }`}
            title="Editar setor"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          {!isRoot && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
              className={`p-1 rounded transition-colors ${
                color ? 'text-white/80 hover:text-white hover:bg-rose-500/30' : 'hover:bg-rose-500/20 text-rose-500'
              }`}
              title="Excluir setor"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Corpo do Bloco (Responsável) */}
      <div className="px-4 py-3 bg-white flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="leading-tight">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Responsável</p>
          <p className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">
            {managerName || 'Não atribuído'}
          </p>
        </div>
      </div>

      {/* Alça inferior para conexão (saída) */}
    </div>
  );
};

export default function OrganizationalChart() {
  const { 
    departments, 
    profiles, 
    currentTenant,
    createDepartment, 
    updateDepartment, 
    deleteDepartment, 
    refreshData,
    loading 
  } = useApp();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Modo Simulação
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationDepartments, setSimulationDepartments] = useState<Department[]>([]);

  // Campos do Formulário do Modal
  const [deptName, setDeptName] = useState('');
  const [deptManagerId, setDeptManagerId] = useState('');
  const [deptParentId, setDeptParentId] = useState('');
  const [deptColor, setDeptColor] = useState('');

  // Computa a lista ativa de departamentos com base no modo
  const activeDepartments = useMemo(() => {
    return isSimulationMode ? simulationDepartments : departments;
  }, [isSimulationMode, simulationDepartments, departments]);

  const connectingNodeId = useRef<string | null>(null);

  const onConnectStart = useCallback((_: any, { nodeId }: any) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd = useCallback(
    (event: any) => {
      if (!connectingNodeId.current) return;

      const targetIsPane = event.target.closest('.react-flow__pane');

      if (targetIsPane) {
        // Define o pai como o nó de onde a conexão foi puxada
        setDeptParentId(connectingNodeId.current);
        setDeptName('');
        setDeptManagerId('');
        setDeptColor('');
        setSelectedDept(null);
        setIsModalOpen(true);
      }

      connectingNodeId.current = null;
    },
    [setDeptParentId, setDeptName, setDeptManagerId, setDeptColor, setSelectedDept, setIsModalOpen]
  );

  // Mapeamento dos tipos personalizados de nós no React Flow
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Handlers de Clique
  const handleEditClick = (dept: Department) => {
    setSelectedDept(dept);
    setDeptName(dept.name);
    setDeptManagerId(dept.manager_id || '');
    setDeptParentId(dept.parent_id || '');
    setDeptColor(dept.code || '');
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedDept(null);
    setDeptName('');
    setDeptManagerId('');
    setDeptColor('');
    
    // Tenta sugerir o primeiro setor como pai
    const root = activeDepartments.find(d => d.parent_id === null) || activeDepartments[0];
    setDeptParentId(root ? root.id : '');
    
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o setor "${name}"? Todos os subsetores e planos de ação associados a ele perderão o vínculo.`);
    if (!confirm) return;

    if (isSimulationMode) {
      setSimulationDepartments(prev => 
        prev.filter(d => d.id !== id).map(d => d.parent_id === id ? { ...d, parent_id: null } : d)
      );
      return;
    }

    await deleteDepartment(id);
  };

  // Salvar Form (Criar ou Editar)
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    if (isSimulationMode) {
      if (selectedDept) {
        setSimulationDepartments(prev => 
          prev.map(d => d.id === selectedDept.id ? {
            ...d,
            name: deptName,
            manager_id: deptManagerId || null,
            parent_id: deptParentId || null,
            code: deptColor,
            manager_name: profiles.find(p => p.id === deptManagerId)?.name || 'Sem responsável'
          } : d)
        );
      } else {
        const tempId = `sim-${Math.random().toString(36).substring(2, 11)}`;
        const managerName = profiles.find(p => p.id === deptManagerId)?.name || 'Sem responsável';
        const newSimDept: Department = {
          id: tempId,
          tenant_id: currentTenant?.id || '',
          name: deptName,
          parent_id: deptParentId || null,
          manager_id: deptManagerId || null,
          code: deptColor,
          manager_name: managerName
        };
        setSimulationDepartments(prev => [...prev, newSimDept]);
      }
      setIsModalOpen(false);
      setSelectedDept(null);
      return;
    }

    setModalLoading(true);
    let success: any = false;

    if (selectedDept) {
      // Editar
      success = await updateDepartment(selectedDept.id, {
        name: deptName,
        manager_id: deptManagerId || null,
        parent_id: deptParentId || null,
        code: deptColor
      });
    } else {
      // Criar
      success = await createDepartment({
        name: deptName,
        manager_id: deptManagerId || null,
        parent_id: deptParentId || null,
        code: deptColor
      });
    }

    setModalLoading(false);
    if (success) {
      setIsModalOpen(false);
      setSelectedDept(null);
    } else {
      alert('Ocorreu um erro ao salvar o departamento. Tente novamente.');
    }
  };

  // Ativa a Simulação
  const handleStartSimulation = () => {
    setSimulationDepartments(JSON.parse(JSON.stringify(departments)));
    setIsSimulationMode(true);
  };

  // Cancela / Descarta Simulação
  const handleDiscardSimulation = () => {
    const confirm = window.confirm("Tem certeza que deseja descartar todas as alterações simuladas?");
    if (confirm) {
      setIsSimulationMode(false);
      setSimulationDepartments([]);
    }
  };

  // Salva Simulação em Lote
  const handleApplySimulation = async () => {
    const confirm = window.confirm("Deseja aplicar todas as alterações simuladas no organograma real da empresa?");
    if (!confirm) return;

    setModalLoading(true);
    try {
      // 1. Identificar exclusões
      const toDelete = departments.filter(d => !simulationDepartments.some(sd => sd.id === d.id));
      for (const d of toDelete) {
        await deleteDepartment(d.id);
      }

      // 2. Identificar edições (existentes que mudaram)
      const toUpdate = simulationDepartments.filter(sd => !sd.id.startsWith('sim-'));
      for (const sd of toUpdate) {
        const original = departments.find(d => d.id === sd.id);
        if (original && (
          original.name !== sd.name || 
          original.parent_id !== sd.parent_id || 
          original.manager_id !== sd.manager_id || 
          original.code !== sd.code
        )) {
          await updateDepartment(sd.id, {
            name: sd.name,
            parent_id: sd.parent_id,
            manager_id: sd.manager_id,
            code: sd.code
          });
        }
      }

      // 3. Identificar criações (novos começam com 'sim-')
      const toCreate = simulationDepartments.filter(sd => sd.id.startsWith('sim-'));
      const simToRealIdMap: Record<string, string> = {};

      let remainingToCreate = [...toCreate];
      let iterations = 0;
      const maxIterations = remainingToCreate.length * 2;

      while (remainingToCreate.length > 0 && iterations < maxIterations) {
        const nextBatch = remainingToCreate.filter(sd => {
          return !sd.parent_id || !sd.parent_id.startsWith('sim-') || !!simToRealIdMap[sd.parent_id];
        });

        if (nextBatch.length === 0) {
          // Criar sem parent_id para evitar ciclo
          for (const sd of remainingToCreate) {
            const realId = await createDepartment({
              name: sd.name,
              parent_id: null,
              manager_id: sd.manager_id,
              code: sd.code
            });
            if (realId) {
              simToRealIdMap[sd.id] = realId;
            }
          }
          break;
        }

        for (const sd of nextBatch) {
          let realParentId = sd.parent_id;
          if (sd.parent_id && sd.parent_id.startsWith('sim-')) {
            realParentId = simToRealIdMap[sd.parent_id] || null;
          }

          const realId = await createDepartment({
            name: sd.name,
            parent_id: realParentId,
            manager_id: sd.manager_id,
            code: sd.code
          });
          if (realId) {
            simToRealIdMap[sd.id] = realId;
          }
        }

        remainingToCreate = remainingToCreate.filter(sd => !nextBatch.includes(sd));
        iterations++;
      }

      alert("Simulação aplicada com sucesso no banco de dados!");
      setIsSimulationMode(false);
      await refreshData();
    } catch (e) {
      console.error(e);
      alert("Ocorreu um erro ao salvar o organograma simulado.");
    } finally {
      setModalLoading(false);
    }
  };

  // Algoritmo simples de árvore para posicionar os nós
  const buildHierarchy = useCallback(() => {
    if (activeDepartments.length === 0) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Encontrar o nó raiz (geralmente sem parent_id)
    const root = activeDepartments.find(d => d.parent_id === null) || activeDepartments[0];

    // Mapeamento de parent -> children
    const parentToChildren: Record<string, Department[]> = {};
    activeDepartments.forEach(d => {
      if (d.parent_id) {
        if (!parentToChildren[d.parent_id]) {
          parentToChildren[d.parent_id] = [];
        }
        parentToChildren[d.parent_id].push(d);
      }
    });

    // Função recursiva para calcular posições
    const processNode = (dept: Department, x: number, y: number, siblingWidth: number) => {
      const isRoot = dept.id === root.id;
      
      // Adicionar nó
      newNodes.push({
        id: dept.id,
        type: 'custom',
        position: { x, y },
        data: { 
          label: dept.name, 
          managerName: dept.manager_name || 'Sem gestor',
          isRoot,
          color: dept.code,
          onEdit: () => handleEditClick(dept),
          onDelete: () => handleDeleteClick(dept.id, dept.name)
        },
      });

      // Adicionar conexões e processar filhos
      const children = parentToChildren[dept.id] || [];
      if (children.length > 0) {
        const totalChildrenWidth = (children.length - 1) * siblingWidth;
        const startX = x - totalChildrenWidth / 2;

        children.forEach((child, index) => {
          const childX = startX + index * siblingWidth;
          const childY = y + 150; // Distância vertical entre níveis

          // Conectar pai -> filho com estilo refinado dourado
          newEdges.push({
            id: `e-${dept.id}-${child.id}`,
            source: dept.id,
            target: child.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#C5A85A', strokeWidth: 1.5, opacity: 0.8 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: '#C5A85A',
            },
          });

          processNode(child, childX, childY, siblingWidth * 0.7);
        });
      }
    };

    // Iniciar cálculo a partir da raiz com espaçamento horizontal de 300px entre irmãos
    processNode(root, 0, 0, 320);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [activeDepartments, setNodes, setEdges]);

  // Atualizar organograma quando os dados dos setores mudarem
  useEffect(() => {
    buildHierarchy();
  }, [activeDepartments, buildHierarchy]);

  // Callback de sucesso da IA no SmartInput
  const handleAISuccess = async (result: any): Promise<boolean> => {
    if (result.action === 'create' && result.data) {
      const { name, parent_id, manager_name } = result.data;
      
      // Tenta achar ID do gestor se especificado por nome
      let managerId = null;
      if (manager_name) {
        const foundProfile = profiles.find(p => 
          p.name.toLowerCase().includes(manager_name.toLowerCase())
        );
        if (foundProfile) {
          managerId = foundProfile.id;
        }
      }

      if (isSimulationMode) {
        const tempId = `sim-${Math.random().toString(36).substring(2, 11)}`;
        const newSimDept: Department = {
          id: tempId,
          tenant_id: currentTenant?.id || '',
          name,
          parent_id: parent_id || null,
          manager_id: managerId,
          code: '',
          manager_name: manager_name || 'Sem responsável'
        };
        setSimulationDepartments(prev => [...prev, newSimDept]);
        return true;
      }

      const success = await createDepartment({
        name,
        parent_id,
        manager_id: managerId,
        manager_name: manager_name || undefined
      });

      return !!success;
    }
    return false;
  };

  // Filtrar lista de setores para pai: não pode ser ele mesmo!
  const parentOptions = useMemo(() => {
    if (!selectedDept) return activeDepartments;
    return activeDepartments.filter(d => d.id !== selectedDept.id);
  }, [activeDepartments, selectedDept]);

  const suggestions = [
    'Criar o setor de Suporte abaixo de TI liderado pelo João',
    'Adicionar departamento de Marketing abaixo do Comercial',
    'Adicionar setor de Recursos Humanos liderado por Gessica'
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)] animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Estrutura Organizacional</h1>
          <p className="text-sm text-slate-500 mt-1">Organograma completo dos setores e responsáveis hierárquicos.</p>
        </div>

        {/* Informações Rápidas & Botão Novo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-100 text-slate-650 px-4 py-2 rounded-md border border-slate-200/40">
            <GitPullRequest className="w-4 h-4 text-[#C5A85A]" />
            <span>Total de Setores: <strong>{activeDepartments.length}</strong></span>
          </div>

          {!isSimulationMode ? (
            <button
              onClick={handleStartSimulation}
              className="flex items-center gap-2 bg-[#C5A85A]/10 hover:bg-[#C5A85A]/20 text-[#C5A85A] text-xs font-semibold px-4 py-2 rounded-md transition-colors border border-[#C5A85A]/30"
            >
              <Sparkles className="w-4 h-4 text-[#C5A85A]" />
              Simular Alterações
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleApplySimulation}
                className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#0e9f6e] text-white text-xs font-semibold px-3 py-2 rounded-md shadow transition-colors"
                disabled={modalLoading}
              >
                Aplicar Simulação
              </button>
              <button
                onClick={handleDiscardSimulation}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-750 text-white text-xs font-semibold px-3 py-2 rounded-md shadow transition-colors"
                disabled={modalLoading}
              >
                Descartar
              </button>
            </div>
          )}
          
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-[#1E2538] hover:bg-[#2c3752] text-white text-xs font-semibold px-4 py-2 rounded-md shadow transition-colors"
          >
            <Plus className="w-4 h-4 text-[#C5A85A]" />
            Novo Setor
          </button>
        </div>
      </div>

      {/* Caixa de Entrada Assistida por IA */}
      <div className="shrink-0">
        <SmartInput
          context="departments"
          placeholder={isSimulationMode ? "Adicione setores na simulação por IA... (ex: 'Adicionar Marketing abaixo do Comercial')" : "Crie ou modifique setores por voz ou texto... (ex: 'Adicionar departamento de Marketing abaixo de Comercial')"}
          onSuccess={handleAISuccess}
          existingData={activeDepartments}
          suggestions={suggestions}
        />
      </div>

      {/* Banner Informativo do Modo Simulação */}
      {isSimulationMode && (
        <div className="bg-[#C5A85A]/15 border border-[#C5A85A]/45 rounded-lg px-4 py-3 text-xs text-slate-800 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A85A] animate-pulse" />
            <div>
              <span className="font-bold text-[#C5A85A] uppercase tracking-wider block text-[10px]">Modo de Simulação Ativo</span>
              <span className="text-[11px] text-slate-600 font-medium">As alterações feitas agora rodam apenas na memória local. Clique em &quot;Aplicar Simulação&quot; no canto superior para salvá-las definitivamente.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tela do Organograma (React Flow) */}
      <div className="flex-1 bg-white border border-slate-200/60 rounded-lg overflow-hidden shadow-sm relative min-h-[350px]">
        
        {/* Banner informativo de navegação no organograma */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-medium shadow-md">
          <Info className="w-3.5 h-3.5 text-[#C5A85A]" />
          Pince a tela ou use scroll para Zoom, e arraste para navegar.
        </div>

        {loading ? (
          <SkeletonOrgChart />
        ) : departments.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.3}
            maxZoom={1.5}
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#94A3B8" gap={16} size={1} />
            <Controls className="!bg-white dark:!bg-[#1E2538] !border-slate-200 dark:!border-slate-800 !shadow-md !rounded-lg" />
            <MiniMap 
              nodeColor={() => '#C5A85A'} 
              maskColor="rgba(241, 245, 249, 0.4)"
              className="!bg-white dark:!bg-[#1E2538] !border-slate-250 dark:!border-slate-800 !rounded-lg !shadow-md hidden md:block" 
            />
          </ReactFlow>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Nenhum departamento cadastrado. Crie um setor raiz usando o botão &quot;+ Novo Setor&quot;.
          </div>
        )}
      </div>

      {/* Modal Premium de Edição / Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E2538] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-[#C5A85A]" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  {selectedDept ? 'Editar Departamento' : 'Novo Departamento'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedDept(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Nome do Setor *
                </label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  placeholder="Ex: Comercial, Marketing, Suporte"
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                  Gestor Responsável
                </label>
                <select
                  value={deptManagerId}
                  onChange={e => setDeptManagerId(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                >
                  <option value="">Nenhum gestor selecionado</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Só exibe setor pai se não for o nó raiz */}
              {(!selectedDept || selectedDept.parent_id !== null) && departments.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Setor Pai (Superior Hierárquico)
                  </label>
                  <select
                    value={deptParentId}
                    onChange={e => setDeptParentId(e.target.value)}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#C5A85A] focus:border-[#C5A85A]"
                  >
                    <option value="">Sem hierarquia superior (Será Raiz)</option>
                    {parentOptions.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Define qual setor está acima deste no organograma.
                  </p>
                </div>
              )}

              {/* Seletor Cromático do Setor */}
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">
                  Cor de Destaque do Setor
                </label>
                <div className="flex flex-wrap gap-2 items-center mb-1">
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setDeptColor(c.hex)}
                      className={`w-6 h-6 rounded-full border transition-all relative ${
                        deptColor === c.hex 
                          ? 'ring-2 ring-offset-2 ring-[#C5A85A] scale-110' 
                          : 'border-slate-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex || '#F8FAFC' }}
                      title={c.name}
                    >
                      {c.hex === '' && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold">×</span>
                      )}
                    </button>
                  ))}
                  
                  {/* Seletor Personalizado */}
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                    <input
                      type="color"
                      value={deptColor.startsWith('#') ? deptColor : '#3B82F6'}
                      onChange={e => setDeptColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-200 p-0"
                      title="Cor personalizada"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Custom</span>
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSelectedDept(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !deptName.trim()}
                  className="bg-[#1E2538] hover:bg-[#2c3752] text-white disabled:opacity-40 font-semibold py-2 px-5 rounded-md shadow transition-colors flex items-center gap-1.5 text-xs"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A85A]" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
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
