import { useEffect, useMemo } from "react";
import dagre from "dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Clock, Flag, GitBranch, Headphones, MessageSquare, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildReactFlowGraph,
  type FlowBuilderBlockDraft,
  type FlowBuilderBlockTone,
  type FlowGraphNodeData,
} from "@/services/flow-editor";

type FlowBlockNodeData = FlowGraphNodeData & { isSelected: boolean };
type FlowBlockNode = Node<FlowBlockNodeData, "flowBlock">;

const TONE: Record<
  FlowBuilderBlockTone,
  { accent: string; soft: string; ring: string; icon: typeof Play; label: string }
> = {
  start: { accent: "#10b981", soft: "#ecfdf5", ring: "#a7f3d0", icon: Play, label: "Início" },
  action: { accent: "#6366f1", soft: "#eef2ff", ring: "#c7d2fe", icon: MessageSquare, label: "Ação" },
  wait: { accent: "#f59e0b", soft: "#fffbeb", ring: "#fde68a", icon: Clock, label: "Espera" },
  decision: { accent: "#8b5cf6", soft: "#f5f3ff", ring: "#ddd6fe", icon: GitBranch, label: "Decisão" },
  handoff: { accent: "#f43f5e", soft: "#fff1f2", ring: "#fecdd3", icon: Headphones, label: "Humano" },
  end: { accent: "#64748b", soft: "#f8fafc", ring: "#cbd5e1", icon: Flag, label: "Fim" },
};

const NODE_WIDTH = 248;
const BASE_HEIGHT = 104;
const PORTS_HEIGHT = 56;

function nodeDimensions(data: FlowGraphNodeData) {
  const count = data.branchHandles.length;
  const width = count > 2 ? Math.min(620, 216 + count * 78) : NODE_WIDTH;
  const height = count > 0 ? BASE_HEIGHT + PORTS_HEIGHT : BASE_HEIGHT;
  return { width, height };
}

function FlowBlockNode({ data }: NodeProps<FlowBlockNode>) {
  const tone = TONE[data.tone] ?? TONE.action;
  const Icon = tone.icon;
  const ports = data.branchHandles;

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white text-left shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] transition-shadow",
        data.isSelected ? "border-transparent shadow-[0_18px_44px_-20px_rgba(99,102,241,0.55)]" : "border-slate-200",
      )}
      style={{
        width: nodeDimensions(data).width,
        outline: data.isSelected ? `2px solid ${tone.accent}` : "none",
        outlineOffset: 2,
      }}
    >
      {/* faixa de tom no topo */}
      <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: tone.accent }} />

      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="!h-2.5 !w-2.5 !border-2 !border-white"
        style={{ background: tone.accent }}
      />

      <div className="px-3.5 py-3">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: tone.soft, color: tone.accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: tone.accent }}>
            {data.typeLabel}
          </span>
          <span className="ml-auto text-[10px] font-medium text-slate-300">#{data.position}</span>
        </div>
        <p className="line-clamp-1 text-sm font-semibold text-slate-800">{data.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{data.summary}</p>
      </div>

      {ports.length > 0 ? (
        <div className="flex items-end justify-around gap-1 border-t border-slate-100 px-2 pb-3 pt-2">
          {ports.map((port) => (
            <div key={port.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              <span
                className="max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: tone.soft, color: tone.accent }}
                title={port.label}
              >
                {port.label}
              </span>
              <Handle
                type="source"
                position={Position.Bottom}
                id={port.id}
                className="!h-2.5 !w-2.5 !border-2 !border-white"
                style={{ background: tone.accent, bottom: -14, left: "50%", transform: "translateX(-50%)" }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          className="!h-2.5 !w-2.5 !border-2 !border-white"
          style={{ background: tone.accent }}
        />
      )}

      {/* handle "out" sempre presente (fallback/padrão) mesmo em nós de decisão */}
      {ports.length > 0 ? (
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          className="!h-2 !w-2 !border-2 !border-white !opacity-60"
          style={{ background: "#94a3b8", left: "calc(100% - 14px)" }}
        />
      ) : null}
    </div>
  );
}

const nodeTypes = { flowBlock: FlowBlockNode };

function edgeColor(relationship: string) {
  if (relationship === "decision" || relationship === "branch") {
    return "#8b5cf6";
  }
  if (relationship === "fallback") {
    return "#94a3b8";
  }
  return "#cbd5e1";
}

function layoutGraph(blocks: FlowBuilderBlockDraft[], selectedBlockId: string | null) {
  const { nodes, edges } = buildReactFlowGraph(blocks);

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "TB", nodesep: 56, ranksep: 84, marginx: 32, marginy: 32 });
  graph.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const { width, height } = nodeDimensions(node);
    graph.setNode(node.id, { width, height });
  });
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const rfNodes: FlowBlockNode[] = nodes.map((node) => {
    const layout = graph.node(node.id);
    const { width, height } = nodeDimensions(node);
    return {
      id: node.id,
      type: "flowBlock",
      position: { x: (layout?.x ?? 0) - width / 2, y: (layout?.y ?? 0) - height / 2 },
      data: { ...node, isSelected: node.id === selectedBlockId },
    };
  });

  const rfEdges: Edge[] = edges.map((edge) => {
    const color = edgeColor(edge.relationship);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: "in",
      label: edge.label || undefined,
      type: "smoothstep",
      animated: edge.relationship === "decision" || edge.relationship === "branch",
      style: {
        stroke: color,
        strokeWidth: 2,
        strokeDasharray: edge.relationship === "fallback" ? "5 4" : undefined,
      },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: color },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.92 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 6,
    };
  });

  return { rfNodes, rfEdges };
}

export type FlowGraphCanvasProps = {
  blocks: FlowBuilderBlockDraft[];
  selectedBlockId: string | null;
  onSelectBlock: (clientId: string | null) => void;
  className?: string;
};

function FlowGraphCanvasInner({ blocks, selectedBlockId, onSelectBlock, className }: FlowGraphCanvasProps) {
  // chave estável: recomputa o layout só quando a ESTRUTURA muda (id/tipo/posição/config), não a seleção.
  const structureKey = useMemo(
    () => JSON.stringify(blocks.map((block) => [block.clientId, block.type, block.position, block.config])),
    [blocks],
  );

  const { rfNodes, rfEdges } = useMemo(
    () => layoutGraph(blocks, selectedBlockId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structureKey],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowBlockNode>(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(rfEdges);

  // re-seed quando a estrutura muda
  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  // reflete seleção sem refazer layout
  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({ ...node, data: { ...node.data, isSelected: node.id === selectedBlockId } })),
    );
  }, [selectedBlockId, setNodes]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {blocks.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <GitBranch className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Seu fluxo está em branco</p>
          <p className="max-w-xs text-xs text-slate-400">
            Adicione blocos pela barra acima. Em blocos de decisão você pode criar até 8 caminhos.
          </p>
        </div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectBlock(node.id)}
        onPaneClick={() => onSelectBlock(null)}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
        minZoom={0.25}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} className="!rounded-xl !border !border-slate-200 !shadow-sm" />
        <MiniMap
          pannable
          zoomable
          className="!rounded-xl !border !border-slate-200 !bg-white"
          nodeColor={(node) => {
            const tone = (node.data as FlowBlockNodeData | undefined)?.tone;
            return tone ? TONE[tone].accent : "#cbd5e1";
          }}
          nodeStrokeWidth={0}
          maskColor="rgba(241,245,249,0.6)"
        />
      </ReactFlow>
    </div>
  );
}

export function FlowGraphCanvas(props: FlowGraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowGraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
