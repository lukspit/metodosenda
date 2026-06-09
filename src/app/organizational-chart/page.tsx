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

// 1. Componente Customizado para os Nós do Organograma
const CustomNode: React.FC<NodeProps> = ({ data }) => {
  const isRoot = !!data.isRoot;
  const managerName = (data.managerName as string) || '';
  const deptName = (data.label as string) || '';
  const onEdit = (data as any).onEdit as (() => void) | undefined;
  const onDelete = (data as any).onDelete as (() => void) | undefined;

  return (
    <div className={`min-w-[190px] rounded-md shadow-lg border bg-white transition-all hover:scale-105 duration-200 overflow-hidden ${
      isRoot 
        ? 'border-2 border-[#C5A85A] ring-2 ring-[#C5A85A]/20' 
        : 'border-slate-200'
    }`}>
      {/* Alça superior para conexão (entrada) se não for o nó raiz */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#C5A85A] !w-2 h-2 !border-none"
        />
      )}

      {/* Cabeçalho do Bloco */}
      <div className={`px-4 py-2 flex items-center justify-between gap-2 border-b ${
        isRoot 
          ? 'bg-[#1E2538] text-white border-[#C5A85A]/30' 
          : 'bg-slate-50 text-slate-850 border-slate-100'
      }`}>
        <span className="font-bold text-xs truncate max-w-[100px] uppercase tracking-wider">{deptName}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
            className={`p-1 rounded hover:bg-slate-200/50 transition-colors ${isRoot ? 'hover:bg-slate-700/50 text-[#C5A85A]' : 'text-slate-500 hover:text-slate-800'}`}
            title="Editar setor"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          {!isRoot && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
              className="p-1 rounded hover:bg-rose-500/20 text-rose-500 transition-colors"
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
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#C5A85A] !w-2 h-2 !border-none"
      />
    </div>
  );
};

export default function OrganizationalChart() {
  const { 
    departments, 
    profiles, 
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

  // Campos do Formulário do Modal
  const [deptName, setDeptName] = useState('');
  const [deptManagerId, setDeptManagerId] = useState('');
  const [deptParentId, setDeptParentId] = useState('');

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
        setSelectedDept(null);
        setIsModalOpen(true);
      }

      connectingNodeId.current = null;
    },
    [setDeptParentId, setDeptName, setDeptManagerId, setSelectedDept, setIsModalOpen]
  );

  // Mapeamento dos tipos personalizados de nós no React Flow
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Handlers de Clique
  const handleEditClick = (dept: Department) => {
    setSelectedDept(dept);
    setDeptName(dept.name);
    setDeptManagerId(dept.manager_id || '');
    setDeptParentId(dept.parent_id || '');
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedDept(null);
    setDeptName('');
    setDeptManagerId('');
    
    // Tenta sugerir o primeiro setor como pai
    const root = departments.find(d => d.parent_id === null) || departments[0];
    setDeptParentId(root ? root.id : '');
    
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o setor "${name}"? Todos os subsetores e planos de ação associados a ele perderão o vínculo.`);
    if (confirm) {
      await deleteDepartment(id);
    }
  };

  // Salvar Form (Criar ou Editar)
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    setModalLoading(true);
    let success = false;

    if (selectedDept) {
      // Editar
      success = await updateDepartment(selectedDept.id, {
        name: deptName,
        manager_id: deptManagerId || null,
        parent_id: deptParentId || null
      });
    } else {
      // Criar
      success = await createDepartment({
        name: deptName,
        manager_id: deptManagerId || null,
        parent_id: deptParentId || null
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

  // Algoritmo simples de árvore para posicionar os nós
  const buildHierarchy = useCallback(() => {
    if (departments.length === 0) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Encontrar o nó raiz (geralmente sem parent_id)
    const root = departments.find(d => d.parent_id === null) || departments[0];

    // Mapeamento de parent -> children
    const parentToChildren: Record<string, Department[]> = {};
    departments.forEach(d => {
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
  }, [departments, setNodes, setEdges]);

  // Atualizar organograma quando os dados dos setores mudarem
  useEffect(() => {
    buildHierarchy();
  }, [departments, buildHierarchy]);

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

      const success = await createDepartment({
        name,
        parent_id,
        manager_id: managerId,
        manager_name: manager_name || undefined
      });

      return success;
    }
    return false;
  };

  // Filtrar lista de setores para pai: não pode ser ele mesmo!
  const parentOptions = useMemo(() => {
    if (!selectedDept) return departments;
    return departments.filter(d => d.id !== selectedDept.id);
  }, [departments, selectedDept]);

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
            <span>Total de Setores: <strong>{departments.length}</strong></span>
          </div>
          
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
          placeholder="Crie ou modifique setores por voz ou texto... (ex: 'Adicionar departamento de Marketing abaixo de Comercial')"
          onSuccess={handleAISuccess}
          existingData={departments}
          suggestions={suggestions}
        />
      </div>



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
