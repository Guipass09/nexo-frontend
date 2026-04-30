import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  GitBranch,
  MessageSquare,
  MoreHorizontal,
  Plus,
  PlayCircle,
  Trash2,
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  buildFlowBuilderChart,
  flowBuilderBlockTypeMeta,
  flowBuilderBlockTypeOptions,
  getConditionBranchOptions,
  type FlowBuilderChart,
  type FlowBuilderBlockDraft,
  type FlowBuilderNode,
} from "@/services/flow-editor";

const CARD_WIDTH = 248;
const CARD_HEIGHT = 148;
const CANVAS_BLEED_X = 180;
const CANVAS_BLEED_Y = 140;

const iconByType: Record<string, LucideIcon> = {
  virtual_start: PlayCircle,
  start: PlayCircle,
  send_message: MessageSquare,
  send_template: Bot,
  send_media: Workflow,
  wait_for_reply: Clock3,
  condition_keyword: GitBranch,
  ai_decision: Bot,
  handoff_human: UserRound,
  end: CheckCircle2,
  message: MessageSquare,
  audio: Workflow,
  wait: Clock3,
  condition: GitBranch,
  human: UserRound,
};

const toneByType: Record<string, string> = {
  start: "border-accent/35 bg-accent/10 text-accent",
  action: "border-primary/25 bg-primary/10 text-primary",
  wait: "border-warning/30 bg-warning/10 text-warning",
  decision: "border-info/30 bg-info/10 text-info",
  handoff: "border-destructive/30 bg-destructive/10 text-destructive",
  end: "border-success/30 bg-success/10 text-success",
};

function strokeColor(kind: "start" | "action" | "wait" | "decision" | "handoff" | "end") {
  switch (kind) {
    case "start":
      return "hsl(var(--accent))";
    case "wait":
      return "hsl(var(--warning))";
    case "decision":
      return "hsl(var(--info))";
    case "handoff":
      return "hsl(var(--destructive))";
    case "end":
      return "hsl(var(--success))";
    default:
      return "hsl(var(--primary))";
  }
}

function edgeBadgeClass(kind: "sequential" | "decision" | "fallback") {
  switch (kind) {
    case "decision":
      return "border-info/30 bg-info/10 text-info";
    case "fallback":
      return "border-warning/30 bg-warning/10 text-warning";
    default:
      return "border-border bg-background/90 text-muted-foreground";
  }
}

function anchorPoint(node: FlowBuilderNode, anchor: "top" | "right" | "bottom" | "left") {
  switch (anchor) {
    case "top":
      return { x: node.x + CARD_WIDTH / 2, y: node.y };
    case "right":
      return { x: node.x + CARD_WIDTH, y: node.y + CARD_HEIGHT / 2 };
    case "left":
      return { x: node.x, y: node.y + CARD_HEIGHT / 2 };
    default:
      return { x: node.x + CARD_WIDTH / 2, y: node.y + CARD_HEIGHT };
  }
}

function controlPoint(point: { x: number; y: number }, anchor: "top" | "right" | "bottom" | "left", strength = 72) {
  switch (anchor) {
    case "top":
      return { x: point.x, y: point.y - strength };
    case "right":
      return { x: point.x + strength, y: point.y };
    case "left":
      return { x: point.x - strength, y: point.y };
    default:
      return { x: point.x, y: point.y + strength };
  }
}

function BlockMenu({
  block,
  canMoveUp,
  canMoveDown,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddAfter,
}: {
  block: FlowBuilderBlockDraft;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onAddAfter: (type: FlowBuilderBlockDraft["type"], afterBlockId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onDuplicate(block.clientId)}>
          <Copy className="mr-2 h-4 w-4" /> Duplicar bloco
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMoveUp(block.clientId)} disabled={!canMoveUp}>
          <ArrowRight className="mr-2 h-4 w-4 rotate-[-90deg]" /> Subir no fluxo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMoveDown(block.clientId)} disabled={!canMoveDown}>
          <ArrowDown className="mr-2 h-4 w-4" /> Descer no fluxo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {flowBuilderBlockTypeOptions.map((type) => (
          <DropdownMenuItem key={type} onClick={() => onAddAfter(type, block.clientId)}>
            <Plus className="mr-2 h-4 w-4" /> Inserir {flowBuilderBlockTypeMeta[type].shortLabel.toLowerCase()} depois
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(block.clientId)}>
          <Trash2 className="mr-2 h-4 w-4" /> Excluir bloco
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NodeCard({
  node,
  block,
  isSelected,
  index,
  isLast,
  onSelect,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddAfter,
  onPointerDown,
}: {
  node: FlowBuilderNode;
  block?: FlowBuilderBlockDraft;
  isSelected: boolean;
  index: number;
  isLast: boolean;
  onSelect: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onAddAfter: (type: FlowBuilderBlockDraft["type"], afterBlockId: string) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, node: FlowBuilderNode, block?: FlowBuilderBlockDraft) => void;
}) {
  const meta = flowBuilderBlockTypeMeta[node.type];
  const Icon = iconByType[node.type] ?? Workflow;
  const branches = block && (node.type === "condition_keyword" || node.type === "ai_decision")
    ? getConditionBranchOptions(block).branches.slice(0, 4)
    : [];
  const totalBranches = block && (node.type === "condition_keyword" || node.type === "ai_decision")
    ? getConditionBranchOptions(block).branches.length
    : 0;

  return (
    <button
      type="button"
      onPointerDown={(event) => onPointerDown(event, node, block)}
      onClick={() => block && onSelect(block.clientId)}
      disabled={!block}
      data-flow-node-card="true"
      className={cn(
        "absolute overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-smooth touch-none",
        isSelected && "ring-2 ring-primary/60 shadow-elegant",
        !block && "cursor-default",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-border/60 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-md border", toneByType[node.tone])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{node.title}</p>
                <p className="text-xs text-muted-foreground">{meta?.label ?? node.type}</p>
              </div>
            </div>
          </div>
          {block ? (
            <BlockMenu
              block={block}
              canMoveUp={index > 0}
              canMoveDown={!isLast}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onAddAfter={onAddAfter}
            />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col justify-between px-4 py-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-md px-2 py-0 text-[11px]">
                #{node.position || index + 1}
              </Badge>
              <Badge variant="secondary" className="rounded-md px-2 py-0 text-[11px]">
                {meta?.shortLabel ?? node.type}
              </Badge>
              {typeof node.depth === "number" ? (
                <Badge variant="outline" className="rounded-md px-2 py-0 text-[11px] text-muted-foreground">
                  nivel {node.depth + 1}
                </Badge>
              ) : null}
            </div>
            <p className="line-clamp-3 text-xs text-muted-foreground">{node.summary}</p>
          </div>
          {branches.length > 0 ? (
            <div className={cn("mt-3 grid gap-1.5", branches.length >= 2 && "grid-cols-2", branches.length === 1 && "grid-cols-1")}>
              {branches.map((branch) => (
                <span
                  key={branch.id}
                  className={cn(
                    "inline-flex min-h-8 items-center rounded-md border px-2 py-1 text-[11px]",
                    branch.direction === "left" && "justify-start border-info/30 bg-info/10 text-info",
                    branch.direction === "right" && "justify-end border-primary/25 bg-primary/10 text-primary",
                    branch.direction === "down" && "justify-center border-warning/30 bg-warning/10 text-warning",
                  )}
                >
                  {branch.label}
                </span>
              ))}
              {totalBranches > branches.length ? (
                <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-border bg-background/80 px-2 py-1 text-[11px] text-muted-foreground">
                  +{totalBranches - branches.length} caminhos
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export interface FlowCanvasProps {
  blocks: FlowBuilderBlockDraft[];
  selectedBlockId: string | null;
  className?: string;
  onSelectBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlockUp: (blockId: string) => void;
  onMoveBlockDown: (blockId: string) => void;
  onAddAfter: (type: FlowBuilderBlockDraft["type"], afterBlockId: string) => void;
  onRepositionBlock: (payload: {
    blockId: string;
    lane: number;
    depth: number;
    swapWithBlockId?: string;
    previousLane: number;
    previousDepth: number;
  }) => void;
}

export type FlowCanvasHandle = {
  focusStart: () => void;
  scrollToTop: () => void;
  scrollToLeft: () => void;
  scrollToRight: () => void;
  centerHorizontally: () => void;
  scrollToBottom: () => void;
  scrollBy: (deltaX: number, deltaY?: number) => void;
};

type DragState = {
  blockId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  originLane: number;
  originDepth: number;
  previewX: number;
  previewY: number;
  moved: boolean;
};

type PanState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
};

function findSwapTarget(
  nodes: FlowBuilderNode[],
  dragBlockId: string,
  lane: number,
  depth: number,
) {
  return nodes.find((node) => node.clientId && node.clientId !== dragBlockId && !node.isVirtual && node.lane === lane && node.depth === depth);
}

function snapDragPosition(
  chart: FlowBuilderChart,
  previewX: number,
  previewY: number,
) {
  const lane = Math.round(
    (previewX + chart.layout.nodeWidth / 2 - chart.layout.paddingX - chart.layout.nodeWidth / 2) / (chart.layout.nodeWidth + chart.layout.laneGap),
  ) + chart.layout.minLane;

  const depth = Math.max(
    0,
    Math.round(
      (previewY - chart.layout.paddingY - chart.layout.yOffset) / (chart.layout.nodeHeight + chart.layout.rowGap),
    ),
  );

  return { lane, depth };
}

export const FlowCanvas = forwardRef<FlowCanvasHandle, FlowCanvasProps>(function FlowCanvas({
  blocks,
  selectedBlockId,
  className,
  onSelectBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onMoveBlockUp,
  onMoveBlockDown,
  onAddAfter,
  onRepositionBlock,
}, ref) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chart = buildFlowBuilderChart(blocks);
  const blockMap = new Map(blocks.map((block) => [block.clientId, block]));
  const blockOrderMap = new Map(blocks.map((block, index) => [block.clientId, index]));
  const nodes = chart.nodes;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [panState, setPanState] = useState<PanState | null>(null);

  useImperativeHandle(ref, () => ({
    focusStart() {
      const element = scrollRef.current;

      if (!element) {
        return;
      }

      const firstNode = chart.nodes
        .filter((node) => !node.isVirtual)
        .sort((left, right) => {
          const leftDepth = left.depth ?? 0;
          const rightDepth = right.depth ?? 0;

          if (leftDepth !== rightDepth) {
            return leftDepth - rightDepth;
          }

          if (left.position !== right.position) {
            return left.position - right.position;
          }

          return left.x - right.x;
        })[0];

      if (!firstNode) {
        element.scrollTo({ left: 0, top: 0, behavior: "smooth" });
        return;
      }

      element.scrollTo({
        left: Math.max(0, firstNode.x + CANVAS_BLEED_X - 64),
        top: Math.max(0, firstNode.y + CANVAS_BLEED_Y - 48),
        behavior: "smooth",
      });
    },
    scrollToTop() {
      scrollRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    scrollToLeft() {
      scrollRef.current?.scrollTo({
        left: 0,
        behavior: "smooth",
      });
    },
    scrollToRight() {
      const element = scrollRef.current;

      if (!element) {
        return;
      }

      element.scrollTo({
        left: Math.max(0, element.scrollWidth - element.clientWidth),
        behavior: "smooth",
      });
    },
    centerHorizontally() {
      const element = scrollRef.current;

      if (!element) {
        return;
      }

      element.scrollTo({
        left: Math.max(0, (element.scrollWidth - element.clientWidth) / 2),
        behavior: "smooth",
      });
    },
    scrollToBottom() {
      const element = scrollRef.current;

      if (!element) {
        return;
      }

      element.scrollTo({
        top: Math.max(0, element.scrollHeight - element.clientHeight),
        behavior: "smooth",
      });
    },
    scrollBy(deltaX, deltaY = 0) {
      scrollRef.current?.scrollBy({
        left: deltaX,
        top: deltaY,
        behavior: "smooth",
      });
    },
  }), [chart.nodes]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const scrollContainer = scrollRef.current;

      if (!scrollContainer) {
        return;
      }

      const rect = scrollContainer.getBoundingClientRect();
      const contentX = event.clientX - rect.left + scrollContainer.scrollLeft;
      const contentY = event.clientY - rect.top + scrollContainer.scrollTop;

      setDragState((current) => current ? {
        ...current,
        previewX: contentX - current.offsetX,
        previewY: contentY - current.offsetY,
        moved: current.moved || Math.abs(contentX - current.offsetX - current.previewX) > 4 || Math.abs(contentY - current.offsetY - current.previewY) > 4,
      } : current);
    }

    function handlePointerUp() {
      setDragState((current) => {
        if (!current) {
          return current;
        }

        if (!current.moved) {
          return null;
        }

        const snapped = snapDragPosition(chart, current.previewX, current.previewY);
        const swapTarget = findSwapTarget(nodes, current.blockId, snapped.lane, snapped.depth);

        onRepositionBlock({
          blockId: current.blockId,
          lane: snapped.lane,
          depth: snapped.depth,
          swapWithBlockId: swapTarget?.clientId,
          previousLane: current.originLane,
          previousDepth: current.originDepth,
        });

        return null;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [chart, dragState, nodes, onRepositionBlock]);

  useEffect(() => {
    if (!panState) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const scrollContainer = scrollRef.current;

      if (!scrollContainer) {
        return;
      }

      const deltaX = event.clientX - panState.startClientX;
      const deltaY = event.clientY - panState.startClientY;

      scrollContainer.scrollLeft = panState.startScrollLeft - deltaX;
      scrollContainer.scrollTop = panState.startScrollTop - deltaY;
    }

    function handlePointerUp() {
      setPanState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [panState]);

  function handleNodePointerDown(event: ReactPointerEvent<HTMLButtonElement>, node: FlowBuilderNode, block?: FlowBuilderBlockDraft) {
    if (!block || !scrollRef.current) {
      return;
    }

    event.stopPropagation();

    const rect = scrollRef.current.getBoundingClientRect();
    const contentX = event.clientX - rect.left + scrollRef.current.scrollLeft;
    const contentY = event.clientY - rect.top + scrollRef.current.scrollTop;

    setDragState({
      blockId: block.clientId,
      pointerId: event.pointerId,
      offsetX: contentX - node.x,
      offsetY: contentY - node.y,
      originLane: node.lane,
      originDepth: node.depth ?? 0,
      previewX: node.x,
      previewY: node.y,
      moved: false,
    });
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const scrollContainer = scrollRef.current;

    if (!scrollContainer) {
      return;
    }

    const target = event.target;

    if (target instanceof HTMLElement && target.closest("[data-flow-node-card='true']")) {
      return;
    }

    setPanState({
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: scrollContainer.scrollLeft,
      startScrollTop: scrollContainer.scrollTop,
    });
  }

  function handleCanvasWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const scrollContainer = scrollRef.current;

    if (!scrollContainer || !event.shiftKey) {
      return;
    }

    event.preventDefault();
    scrollContainer.scrollLeft += event.deltaY + event.deltaX;
  }

  if (blocks.length === 0) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-border bg-card/70 px-8 py-12 text-center">
        <div className="max-w-md space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Workflow className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Seu fluxo ainda esta em branco</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione blocos para montar a conversa. O canvas vai mostrar inicio, espera, decisao e fim com os caminhos do backend real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onPointerDown={handleCanvasPointerDown}
      onWheel={handleCanvasWheel}
      className={cn(
        "overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--secondary)/0.35))] scrollbar-thin",
        panState ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
    >
      <div
        className="relative"
        style={{
          width: chart.width + CANVAS_BLEED_X * 2,
          height: chart.height + CANVAS_BLEED_Y * 2,
          minWidth: "100%",
        }}
      >
        <div
          className="absolute"
          style={{
            left: CANVAS_BLEED_X,
            top: CANVAS_BLEED_Y,
            width: chart.width,
            height: chart.height,
          }}
        >
          <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {chart.edges.map((edge) => {
              const source = nodeMap.get(edge.fromId);
              const target = nodeMap.get(edge.toId);

              if (!source || !target) {
                return null;
              }

              const start = anchorPoint(source, edge.sourceAnchor ?? "bottom");
              const end = anchorPoint(target, edge.targetAnchor ?? "top");
              const startX = start.x;
              const startY = start.y;
              const endX = end.x;
              const endY = end.y;
              const startControl = controlPoint(start, edge.sourceAnchor ?? "bottom", Math.max(72, Math.abs(end.x - start.x) * 0.2));
              const endControl = controlPoint(end, edge.targetAnchor ?? "top", Math.max(72, Math.abs(end.x - start.x) * 0.2));
              const labelX = (startX + endX) / 2;
              const labelY = startY + (endY - startY) / 2;

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${startX} ${startY} C ${startControl.x} ${startControl.y}, ${endControl.x} ${endControl.y}, ${endX} ${endY}`}
                    fill="none"
                    stroke={strokeColor(edge.tone)}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={edge.kind === "fallback" ? "6 6" : undefined}
                    opacity={0.9}
                  />
                  <circle cx={endX} cy={endY} r="4" fill={strokeColor(edge.tone)} />
                  {edge.label ? (
                    <foreignObject x={labelX - 58} y={labelY - 13} width={116} height={28}>
                      <div className="flex h-full items-center justify-center">
                        <span className={cn("rounded-full border px-2 py-1 text-[11px] font-medium shadow-sm", edgeBadgeClass(edge.kind))}>
                          {edge.label}
                        </span>
                      </div>
                    </foreignObject>
                  ) : null}
                </g>
              );
            })}
          </svg>

          {nodes.map((node, index) => (
            <NodeCard
              key={node.id}
              node={dragState?.blockId === node.clientId
                ? {
                    ...node,
                    x: dragState.previewX,
                    y: dragState.previewY,
                  }
                : node}
              block={node.clientId ? blockMap.get(node.clientId) : undefined}
              isSelected={selectedBlockId === node.clientId}
              index={node.clientId ? (blockOrderMap.get(node.clientId) ?? index) : index}
              isLast={node.clientId ? (blockOrderMap.get(node.clientId) ?? index) === blocks.length - 1 : index === nodes.length - 1}
              onSelect={onSelectBlock}
              onDuplicate={onDuplicateBlock}
              onDelete={onDeleteBlock}
              onMoveUp={onMoveBlockUp}
              onMoveDown={onMoveBlockDown}
              onAddAfter={onAddAfter}
              onPointerDown={handleNodePointerDown}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
