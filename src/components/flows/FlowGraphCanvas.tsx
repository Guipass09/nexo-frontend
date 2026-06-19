import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import dagre from "dagre";
import {
  Background,
  BackgroundVariant,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Clock,
  Flag,
  GitBranch,
  Headphones,
  Maximize2,
  MessageSquare,
  MoveHorizontal,
  MoveVertical,
  Play,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildReactFlowGraph,
  type FlowBuilderBlockDraft,
  type FlowBuilderBlockTone,
  type FlowGraphNodeData,
} from "@/services/flow-editor";

type LayoutDirection = "TB" | "LR";

type FlowBlockNodeData = FlowGraphNodeData & { isSelected: boolean; direction: LayoutDirection };
type FlowBlockNode = Node<FlowBlockNodeData, "flowBlock">;

const TONE: Record<
  FlowBuilderBlockTone,
  { accent: string; soft: string; icon: typeof Play }
> = {
  start: { accent: "#10b981", soft: "#ecfdf5", icon: Play },
  action: { accent: "#6366f1", soft: "#eef2ff", icon: MessageSquare },
  wait: { accent: "#f59e0b", soft: "#fffbeb", icon: Clock },
  decision: { accent: "#8b5cf6", soft: "#f5f3ff", icon: GitBranch },
  handoff: { accent: "#f43f5e", soft: "#fff1f2", icon: Headphones },
  end: { accent: "#64748b", soft: "#f8fafc", icon: Flag },
};

const NODE_WIDTH = 256;

function nodeDimensions(data: Pick<FlowGraphNodeData, "branchHandles">, direction: LayoutDirection) {
  const count = data.branchHandles.length;
  if (direction === "LR") {
    return { width: NODE_WIDTH, height: count > 0 ? Math.max(120, 84 + count * 30) : 104 };
  }
  const width = count > 2 ? Math.min(640, 224 + count * 76) : NODE_WIDTH;
  return { width, height: count > 0 ? 162 : 104 };
}

function FlowBlockNode({ data }: NodeProps<FlowBlockNode>) {
  const tone = TONE[data.tone] ?? TONE.action;
  const Icon = tone.icon;
  const ports = data.branchHandles;
  const horizontal = data.direction === "LR";
  const hasOutput = !["end", "handoff_human", "human"].includes(data.blockType);

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white text-left transition-shadow",
        data.isSelected
          ? "border-transparent shadow-[0_20px_48px_-20px_rgba(99,102,241,0.6)]"
          : "border-slate-200 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] hover:shadow-[0_16px_38px_-20px_rgba(15,23,42,0.4)]",
      )}
      style={{
        width: nodeDimensions(data, data.direction).width,
        outline: data.isSelected ? `2px solid ${tone.accent}` : "none",
        outlineOffset: 2,
      }}
    >
      <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: tone.accent }} />

      <Handle
        type="target"
        position={horizontal ? Position.Left : Position.Top}
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
        <div
          className={cn(
            "gap-1 border-t border-slate-100",
            horizontal ? "flex flex-col px-3 py-2" : "flex flex-wrap items-center justify-center px-2 pb-2.5 pt-2",
          )}
        >
          {ports.map((port) => (
            <span
              key={port.id}
              className="max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: tone.soft, color: tone.accent }}
              title={port.label}
            >
              {port.label}
            </span>
          ))}
        </div>
      ) : null}

      {hasOutput ? (
        <Handle
          type="source"
          position={horizontal ? Position.Right : Position.Bottom}
          id="out"
          className="!h-3 !w-3 !border-2 !border-white !shadow-sm"
          style={{ background: tone.accent }}
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

function layoutGraph(blocks: FlowBuilderBlockDraft[], selectedBlockId: string | null, direction: LayoutDirection) {
  const { nodes, edges } = buildReactFlowGraph(blocks);

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: direction,
    nodesep: direction === "LR" ? 36 : 70,
    ranksep: direction === "LR" ? 120 : 110,
    marginx: 36,
    marginy: 36,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const { width, height } = nodeDimensions(node, direction);
    graph.setNode(node.id, { width, height });
  });
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const rfNodes: FlowBlockNode[] = nodes.map((node) => {
    const layout = graph.node(node.id);
    const { width, height } = nodeDimensions(node, direction);
    return {
      id: node.id,
      type: "flowBlock",
      position: { x: (layout?.x ?? 0) - width / 2, y: (layout?.y ?? 0) - height / 2 },
      data: { ...node, isSelected: node.id === selectedBlockId, direction },
    };
  });

  const rfEdges: Edge[] = edges.map((edge) => {
    const color = edgeColor(edge.relationship);
    const isBranch = edge.relationship === "decision" || edge.relationship === "branch";
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: "in",
      label: edge.label || undefined,
      type: "smoothstep",
      style: {
        stroke: color,
        strokeWidth: isBranch ? 2 : 1.75,
        strokeDasharray: edge.relationship === "fallback" ? "5 4" : undefined,
      },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: color },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
      labelBgPadding: [5, 2] as [number, number],
      labelBgBorderRadius: 8,
    };
  });

  return { rfNodes, rfEdges };
}

export type FlowGraphCanvasProps = {
  blocks: FlowBuilderBlockDraft[];
  selectedBlockId: string | null;
  onSelectBlock: (clientId: string | null) => void;
  onConnectBlocks?: (sourceClientId: string, targetClientId: string) => void;
  className?: string;
};

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
    >
      {children}
    </button>
  );
}

function FlowGraphCanvasInner({ blocks, selectedBlockId, onSelectBlock, onConnectBlocks, className }: FlowGraphCanvasProps) {
  const [direction, setDirection] = useState<LayoutDirection>("TB");
  const reactFlow = useReactFlow();

  const structureKey = useMemo(
    () => JSON.stringify(blocks.map((block) => [block.clientId, block.type, block.position, block.config])),
    [blocks],
  );

  const { rfNodes, rfEdges } = useMemo(
    () => layoutGraph(blocks, selectedBlockId, direction),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structureKey, direction],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowBlockNode>(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(rfEdges);

  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
    // re-enquadra após relayout
    const timer = window.setTimeout(() => reactFlow.fitView({ padding: 0.22, duration: 400, maxZoom: 1.1 }), 60);
    return () => window.clearTimeout(timer);
  }, [rfNodes, rfEdges, setNodes, setEdges, reactFlow]);

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({ ...node, data: { ...node.data, isSelected: node.id === selectedBlockId } })),
    );
  }, [selectedBlockId, setNodes]);

  const focusNode = useCallback(
    (id: string) => {
      onSelectBlock(id);
      window.setTimeout(() => reactFlow.fitView({ nodes: [{ id }], duration: 450, maxZoom: 1.15, padding: 0.6 }), 0);
    },
    [onSelectBlock, reactFlow],
  );

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
        onNodeClick={(_, node) => focusNode(node.id)}
        onPaneClick={() => onSelectBlock(null)}
        onConnect={(connection) => {
          if (connection.source && connection.target && connection.source !== connection.target) {
            onConnectBlocks?.(connection.source, connection.target);
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 1.1 }}
        minZoom={0.2}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={Boolean(onConnectBlocks)}
        defaultEdgeOptions={{ type: "smoothstep" }}
        className="[&_.react-flow__attribution]:hidden"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#dbe2ec" />

        <Panel position="top-right" className="!m-3 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
          <ToolbarButton
            label={direction === "TB" ? "Mudar para horizontal" : "Mudar para vertical"}
            onClick={() => setDirection((value) => (value === "TB" ? "LR" : "TB"))}
          >
            {direction === "TB" ? <MoveHorizontal className="h-4 w-4" /> : <MoveVertical className="h-4 w-4" />}
          </ToolbarButton>
          <span className="mx-0.5 h-5 w-px bg-slate-200" />
          <ToolbarButton label="Diminuir zoom" onClick={() => reactFlow.zoomOut({ duration: 200 })}>
            <ZoomOut className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Aumentar zoom" onClick={() => reactFlow.zoomIn({ duration: 200 })}>
            <ZoomIn className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Ajustar à tela" onClick={() => reactFlow.fitView({ padding: 0.22, duration: 400 })}>
            <Maximize2 className="h-4 w-4" />
          </ToolbarButton>
        </Panel>

        {onConnectBlocks ? (
          <Panel position="bottom-center" className="!mb-3 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[11px] text-slate-500 shadow-sm backdrop-blur">
            Arraste do ponto na base de um bloco até outro para criar um caminho
          </Panel>
        ) : null}

        <MiniMap
          pannable
          zoomable
          className="!rounded-xl !border !border-slate-200 !bg-white"
          nodeColor={(node) => {
            const tone = (node.data as FlowBlockNodeData | undefined)?.tone;
            return tone ? TONE[tone].accent : "#cbd5e1";
          }}
          nodeStrokeWidth={0}
          maskColor="rgba(241,245,249,0.65)"
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
