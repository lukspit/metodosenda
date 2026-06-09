'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp, Department } from '../../context/AppContext';
import { SmartInput } from '../../components/SmartInput';
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
  Info
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


  return (
    <div className={`min-w-[190px] rounded-xl shadow-lg border bg-white dark:bg-[#1E2538] transition-all hover:scale-105 duration-200 overflow-hidden ${
      isRoot 
        ? 'border-2 border-[#C5A85A] ring-2 ring-[#C5A85A]/20' 
        : 'border-slate-200 dark:border-slate-800'
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
          ? 'bg-[#1E2538] text-white border-[#C5A85A]/30 dark:bg-[#161B29]' 
          : 'bg-slate-50 dark:bg-[#161B29]/60 text-slate-850 dark:text-slate-200 border-slate-100 dark:border-slate-800'
      }`}>
        <span className="font-bold text-xs truncate max-w-[140px] uppercase tracking-wider">{deptName}</span>
        {isRoot && <Compass className="w-3.5 h-3.5 text-[#C5A85A] shrink-0" />}
      </div>

      {/* Corpo do Bloco (Responsável) */}
      <div className="px-4 py-3 bg-white dark:bg-[#1E2538] flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="leading-tight">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Responsável</p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
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
  const { departments, profiles, createDepartment, refreshData } = useApp();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Mapeamento dos tipos personalizados de nós no React Flow
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

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
          isRoot
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
  const handleAISuccess = async (result: any) => {
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

      if (success) {
        setAiFeedback(result.explanation || `Setor ${name} criado com sucesso!`);
        setTimeout(() => setAiFeedback(null), 6000);
      }
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Estrutura Organizacional</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Organograma completo dos setores e responsáveis hierárquicos.</p>
        </div>

        {/* Informações Rápidas */}
        <div className="flex items-center gap-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-355 px-4 py-2 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
          <GitPullRequest className="w-4 h-4 text-[#C5A85A]" />
          <span>Total de Setores: <strong>{departments.length}</strong></span>
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

      {/* Feedback de IA */}
      {aiFeedback && (
        <div className="bg-[#C5A85A]/10 border border-[#C5A85A]/35 text-[#C5A85A] px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shrink-0 animate-fadeIn">
          <Sparkles className="w-4 h-4 fill-[#C5A85A]/20" />
          <span>IA: {aiFeedback}</span>
        </div>
      )}

      {/* Tela do Organograma (React Flow) */}
      <div className="flex-1 bg-white dark:bg-[#161B29] border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm relative min-h-[350px]">
        
        {/* Banner informativo de navegação no organograma */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-medium shadow-md">
          <Info className="w-3.5 h-3.5 text-[#C5A85A]" />
          Use o scroll do mouse para Zoom, ou arraste a tela para navegar.
        </div>

        {departments.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
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
            Nenhum departamento cadastrado. Crie um setor raiz usando a barra de IA acima.
          </div>
        )}
      </div>
    </div>
  );
}
