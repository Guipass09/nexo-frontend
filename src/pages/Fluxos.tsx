import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Expand,
  Minimize2,
  Pause,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { FlowCanvas } from "@/components/flows/FlowCanvas";
import { FlowInspector } from "@/components/flows/FlowInspector";
import {
  useCreateFlow,
  useDeleteFlow,
  useFlowBlocks,
  useFlows,
  useUpdateFlow,
} from "@/hooks/use-app-data";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { FlowStatus } from "@/types/domain";
import {
  applyFlowBuilderManualLayout,
  buildFlowBuilderChart,
  buildFlowPayloadFromDraft,
  createEmptyFlowBuilderBlock,
  createEmptyFlowBuilderDraft,
  createFlowBuilderBlocks,
  createFlowBuilderDraft,
  flowBuilderBlockTypeMeta,
  flowBuilderBlockTypeOptions,
  formatFlowTrigger,
  getFlowBuilderManualLayout,
  parseConditionKeywordDraft,
  normalizeFlowBuilderBlocks,
  replaceConditionKeywordConfig,
  type FlowBuilderBlockDraft,
  type FlowBuilderFlowDraft,
  type FlowTriggerMode,
} from "@/services/flow-editor";

type FlowFilterValue = "todos" | FlowStatus;
type PendingDestination = { type: "flow"; flowId: string } | { type: "new" } | null;

const triggerModeLabels: Record<FlowTriggerMode, string> = {
  first_message: "Primeira mensagem",
  keyword: "Palavra-chave",
  tag: "Tag",
  contains: "Texto livre",
};

const stateLegend = [
  { label: "Inicio", tone: "border-accent/30 bg-accent/10 text-accent" },
  { label: "Envio", tone: "border-primary/20 bg-primary/10 text-primary" },
  { label: "Espera", tone: "border-warning/30 bg-warning/10 text-warning" },
  { label: "Decisao", tone: "border-info/30 bg-info/10 text-info" },
  { label: "Humano", tone: "border-destructive/30 bg-destructive/10 text-destructive" },
  { label: "Fim", tone: "border-success/30 bg-success/10 text-success" },
];

function duplicateBlock(block: FlowBuilderBlockDraft) {
  const duplicated = createEmptyFlowBuilderBlock(block.type, block.position + 1);

  return {
    ...duplicated,
    title: block.title ? `${block.title} copia` : flowBuilderBlockTypeMeta[block.type].label,
    description: block.description,
    config: JSON.parse(JSON.stringify(block.config)) as Record<string, unknown>,
  } satisfies FlowBuilderBlockDraft;
}

function orderBlocksLikeFlow(blocks: FlowBuilderBlockDraft[]) {
  return [...blocks].sort((left, right) => left.position - right.position || left.clientId.localeCompare(right.clientId));
}

function isSideBranchLayout(block: FlowBuilderBlockDraft) {
  const layout = getFlowBuilderManualLayout(block);
  return layout.branchSide !== undefined
    || layout.branchParentPosition !== undefined
    || (layout.lane !== undefined && layout.lane !== 0);
}

function isSameBranchContext(parent: FlowBuilderBlockDraft, candidate: FlowBuilderBlockDraft) {
  const parentLayout = getFlowBuilderManualLayout(parent);
  const candidateLayout = getFlowBuilderManualLayout(candidate);

  if (candidateLayout.branchParentPosition !== undefined) {
    return candidateLayout.branchParentPosition === parent.position;
  }

  if (candidateLayout.branchSide !== undefined) {
    return candidateLayout.branchSide === parentLayout.branchSide;
  }

  if (candidateLayout.lane !== undefined && parentLayout.lane !== undefined) {
    return Math.sign(candidateLayout.lane) === Math.sign(parentLayout.lane);
  }

  return true;
}

function syncMessageSiblingBranches(blocks: FlowBuilderBlockDraft[]) {
  const ordered = orderBlocksLikeFlow(blocks);
  const branchMetadataByConditionId = new Map<string, { parentPosition: number; side: "left" | "right" }>();

  ordered.forEach((block, index) => {
    if (!["message", "send_message", "send_template", "send_media"].includes(block.type)) {
      return;
    }

    const leftCandidate = ordered[index + 1];
    const rightCandidate = ordered[index + 2];
    const isLeftCondition = leftCandidate && (leftCandidate.type === "condition_keyword" || leftCandidate.type === "condition");
    const isRightCondition = rightCandidate && (rightCandidate.type === "condition_keyword" || rightCandidate.type === "condition");

    if (!isLeftCondition || !isRightCondition || !leftCandidate || !rightCandidate) {
      return;
    }

    if (
      (isSideBranchLayout(leftCandidate) && !isSameBranchContext(block, leftCandidate))
      || (isSideBranchLayout(rightCandidate) && !isSameBranchContext(block, rightCandidate))
    ) {
      return;
    }

    branchMetadataByConditionId.set(leftCandidate.clientId, {
      parentPosition: block.position,
      side: "left",
    });
    branchMetadataByConditionId.set(rightCandidate.clientId, {
      parentPosition: block.position,
      side: "right",
    });
  });

  return ordered.map((block) => {
    const metadata = branchMetadataByConditionId.get(block.clientId);

    if (!metadata) {
      return block;
    }

    const currentLayout = getFlowBuilderManualLayout(block);
    return applyFlowBuilderManualLayout(block, {
      ...currentLayout,
      branchParentPosition: metadata.parentPosition,
      branchSide: metadata.side,
    });
  });
}

function blockHasConditionRoutes(block: FlowBuilderBlockDraft) {
  if (block.type !== "condition_keyword" && block.type !== "condition" && block.type !== "ai_decision") {
    return false;
  }

  const draft = parseConditionKeywordDraft(block.config);
  return draft.branches.length > 0
    || Boolean(draft.simpleKeyword.trim() && draft.simpleNextPosition.trim())
    || Boolean(draft.defaultNextPosition.trim())
    || Boolean(draft.fallbackNextPosition.trim());
}

export default function Fluxos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FlowFilterValue>("todos");
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [isCreatingNewFlow, setIsCreatingNewFlow] = useState(false);
  const [flowDraft, setFlowDraft] = useState<FlowBuilderFlowDraft>(createEmptyFlowBuilderDraft());
  const [blockDrafts, setBlockDrafts] = useState<FlowBuilderBlockDraft[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<PendingDestination>(null);
  const [confirmDeleteFlow, setConfirmDeleteFlow] = useState(false);
  const [pendingDeleteBlockId, setPendingDeleteBlockId] = useState<string | null>(null);

  const flowsQuery = useFlows();
  const flows = useMemo(() => flowsQuery.data ?? [], [flowsQuery.data]);
  const activeFlow = flows.find((flow) => flow.id === activeFlowId) ?? null;
  const flowBlocksQuery = useFlowBlocks(!isCreatingNewFlow ? activeFlowId : null);
  const createFlowMutation = useCreateFlow();
  const updateFlowMutation = useUpdateFlow();
  const deleteFlowMutation = useDeleteFlow();
  const isSaving = createFlowMutation.isPending || updateFlowMutation.isPending;
  const isDeleting = deleteFlowMutation.isPending;

  const filteredFlows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return flows.filter((flow) => {
      if (statusFilter !== "todos" && flow.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [flow.name, flow.trigger, flow.status]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch);
    });
  }, [flows, search, statusFilter]);

  const orderedDraftBlocks = useMemo(() => orderBlocksLikeFlow(blockDrafts), [blockDrafts]);
  const selectedBlock = orderedDraftBlocks.find((block) => block.clientId === selectedBlockId) ?? null;
  const flowStats = useMemo(() => ({
    actions: orderedDraftBlocks.filter((block) => ["send_message", "send_template", "send_media"].includes(block.type)).length,
    waits: orderedDraftBlocks.filter((block) => block.type === "wait_for_reply").length,
    decisions: orderedDraftBlocks.filter((block) => block.type === "condition_keyword" || block.type === "ai_decision").length,
    endings: orderedDraftBlocks.filter((block) => ["handoff_human", "end"].includes(block.type)).length,
  }), [orderedDraftBlocks]);

  useEffect(() => {
    if (isCreatingNewFlow || flows.length === 0) {
      return;
    }

    if (!activeFlowId || !flows.some((flow) => flow.id === activeFlowId)) {
      setActiveFlowId(flows[0].id);
    }
  }, [activeFlowId, flows, isCreatingNewFlow]);

  useEffect(() => {
    if (!selectedBlockId && orderedDraftBlocks.length > 0) {
      setSelectedBlockId(orderedDraftBlocks[0].clientId);
      return;
    }

    if (selectedBlockId && !orderedDraftBlocks.some((block) => block.clientId === selectedBlockId)) {
      setSelectedBlockId(orderedDraftBlocks[0]?.clientId ?? null);
    }
  }, [orderedDraftBlocks, selectedBlockId]);

  useEffect(() => {
    if (isCreatingNewFlow || hasUnsavedChanges || !activeFlow || !flowBlocksQuery.data) {
      return;
    }

    setFlowDraft(createFlowBuilderDraft(activeFlow));
    setBlockDrafts(createFlowBuilderBlocks(flowBlocksQuery.data));
  }, [activeFlow, flowBlocksQuery.data, hasUnsavedChanges, isCreatingNewFlow]);

  function applyBlockCollection(nextBlocks: FlowBuilderBlockDraft[], dirty = true) {
    const normalized = normalizeFlowBuilderBlocks(syncMessageSiblingBranches(nextBlocks));
    setBlockDrafts(normalized);

    if (dirty) {
      setHasUnsavedChanges(true);
    }
  }

  function loadNewFlowDraft() {
    setIsCreatingNewFlow(true);
    setActiveFlowId(null);
    setFlowDraft(createEmptyFlowBuilderDraft());
    setBlockDrafts([]);
    setSelectedBlockId(null);
    setHasUnsavedChanges(false);
  }

  function requestOpenFlow(flowId: string) {
    if (flowId === activeFlowId && !isCreatingNewFlow) {
      return;
    }

    if (hasUnsavedChanges) {
      setPendingDestination({ type: "flow", flowId });
      return;
    }

    setIsCreatingNewFlow(false);
    setActiveFlowId(flowId);
    setSelectedBlockId(null);
  }

  function requestNewFlow() {
    if (hasUnsavedChanges) {
      setPendingDestination({ type: "new" });
      return;
    }

    loadNewFlowDraft();
  }

  function discardAndContinue() {
    if (!pendingDestination) {
      return;
    }

    if (pendingDestination.type === "new") {
      loadNewFlowDraft();
    } else {
      setIsCreatingNewFlow(false);
      setActiveFlowId(pendingDestination.flowId);
      setSelectedBlockId(null);
      setHasUnsavedChanges(false);
    }

    setPendingDestination(null);
  }

  function cancelEditing() {
    if (isCreatingNewFlow) {
      loadNewFlowDraft();
      return;
    }

    if (!activeFlow || !flowBlocksQuery.data) {
      return;
    }

    setFlowDraft(createFlowBuilderDraft(activeFlow));
    setBlockDrafts(createFlowBuilderBlocks(flowBlocksQuery.data));
    setHasUnsavedChanges(false);
  }

  function updateFlowDraft(patch: Partial<FlowBuilderFlowDraft>) {
    setFlowDraft((current) => ({
      ...current,
      ...patch,
    }));
    setHasUnsavedChanges(true);
  }

  function updateBlock(blockId: string, updater: (block: FlowBuilderBlockDraft) => FlowBuilderBlockDraft) {
    applyBlockCollection(
      orderedDraftBlocks.map((block) => (block.clientId === blockId ? updater(block) : block)),
    );
  }

  function addBlock(type: FlowBuilderBlockDraft["type"], afterBlockId?: string) {
    const ordered = syncMessageSiblingBranches(orderBlocksLikeFlow(orderedDraftBlocks));
    const afterIndex = afterBlockId ? ordered.findIndex((block) => block.clientId === afterBlockId) : ordered.length - 1;
    const nextPosition = afterIndex >= 0 ? (ordered[afterIndex]?.position ?? 0) + 1 : 10;
    let nextBlock = createEmptyFlowBuilderBlock(type, nextPosition);
    let insertionIndex = afterIndex >= 0 ? afterIndex + 1 : ordered.length;

    if (afterIndex >= 0) {
      const afterBlock = ordered[afterIndex];
      const afterLayout = getFlowBuilderManualLayout(afterBlock);
      const chart = buildFlowBuilderChart(ordered);
      const afterNode = chart.nodes.find((node) => node.clientId === afterBlock.clientId);
      const isBranchContinuation = Boolean(
        afterLayout.branchParentPosition !== undefined
        || afterLayout.nextPosition !== undefined
        || (afterNode && Math.abs(afterNode.lane) > 0),
      );

      if (afterNode && isBranchContinuation) {
        const inheritedBranchSide = afterLayout.branchSide ?? (afterNode.lane < 0 ? "left" : afterNode.lane > 0 ? "right" : undefined);
        nextBlock = applyFlowBuilderManualLayout(nextBlock, {
          lane: afterNode.lane,
          depth: (afterNode.depth ?? afterLayout.depth ?? 0) + 1,
          branchSide: inheritedBranchSide,
        });
        insertionIndex = ordered.length;
      }
    }

    const nextCollection = [...ordered];
    nextCollection.splice(insertionIndex, 0, nextBlock);

    if (afterIndex >= 0) {
      const afterBlock = ordered[afterIndex];
      const afterLayout = getFlowBuilderManualLayout(afterBlock);
      const chart = buildFlowBuilderChart(ordered);
      const afterNode = chart.nodes.find((node) => node.clientId === afterBlock.clientId);
      const isBranchContinuation = Boolean(
        afterLayout.branchParentPosition !== undefined
        || afterLayout.nextPosition !== undefined
        || (afterNode && Math.abs(afterNode.lane) > 0),
      );

      if (isBranchContinuation && !blockHasConditionRoutes(afterBlock)) {
        const parentLayout = getFlowBuilderManualLayout(afterBlock);
        const updatedParent = applyFlowBuilderManualLayout(afterBlock, {
          ...parentLayout,
          nextPosition: nextBlock.position,
        });
        nextCollection[afterIndex] = updatedParent;
      }
    }

    applyBlockCollection(nextCollection);
    setSelectedBlockId(nextBlock.clientId);
  }

  function duplicateDraftBlock(blockId: string) {
    const ordered = orderBlocksLikeFlow(orderedDraftBlocks);
    const index = ordered.findIndex((block) => block.clientId === blockId);
    if (index < 0) {
      return;
    }

    const nextBlock = duplicateBlock(ordered[index]);
    const nextCollection = [...ordered];
    nextCollection.splice(index + 1, 0, nextBlock);
    applyBlockCollection(nextCollection);
    setSelectedBlockId(nextBlock.clientId);
  }

  function requestDeleteBlock(blockId: string) {
    setPendingDeleteBlockId(blockId);
  }

  function deleteDraftBlock() {
    if (!pendingDeleteBlockId) {
      return;
    }

    applyBlockCollection(
      orderedDraftBlocks.filter((block) => block.clientId !== pendingDeleteBlockId),
    );
    setPendingDeleteBlockId(null);
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    const ordered = orderBlocksLikeFlow(orderedDraftBlocks);
    const index = ordered.findIndex((block) => block.clientId === blockId);

    if (index < 0) {
      return;
    }

    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= ordered.length) {
      return;
    }

    const nextCollection = [...ordered];
    const [moved] = nextCollection.splice(index, 1);
    nextCollection.splice(nextIndex, 0, moved);
    applyBlockCollection(nextCollection);
    setSelectedBlockId(blockId);
  }

  function repositionBlock({
    blockId,
    lane,
    depth,
    swapWithBlockId,
    previousLane,
    previousDepth,
  }: {
    blockId: string;
    lane: number;
    depth: number;
    swapWithBlockId?: string;
    previousLane: number;
    previousDepth: number;
  }) {
    applyBlockCollection(
      orderedDraftBlocks.map((block) => {
        if (block.clientId === blockId) {
          return applyFlowBuilderManualLayout(block, { lane, depth });
        }

        if (swapWithBlockId && block.clientId === swapWithBlockId) {
          const currentLayout = getFlowBuilderManualLayout(block);
          return applyFlowBuilderManualLayout(block, {
            lane: currentLayout.lane ?? previousLane,
            depth: currentLayout.depth ?? previousDepth,
          });
        }

        return block;
      }),
    );
  }

  function applyConditionBinaryModel(blockId: string) {
    const ordered = orderBlocksLikeFlow(orderedDraftBlocks);
    const conditionIndex = ordered.findIndex((block) => block.clientId === blockId);

    if (conditionIndex < 0) {
      return;
    }

    const conditionBlock = ordered[conditionIndex];
    const targetBlocks = ordered
      .slice(conditionIndex + 1)
      .filter((block) => block.type !== "start")
      .slice(0, 2);

    if (targetBlocks.length < 2) {
      toast({
        title: "Faltam caminhos para a decisao",
        description: "Adicione pelo menos dois blocos abaixo da condicao para montar Sim e Nao.",
        variant: "destructive",
      });
      return;
    }

    const chart = buildFlowBuilderChart(ordered);
    const conditionNode = chart.nodes.find((node) => node.clientId === blockId);
    const baseLane = conditionNode?.lane ?? getFlowBuilderManualLayout(conditionBlock).lane ?? 0;
    const baseDepth = conditionNode?.depth ?? getFlowBuilderManualLayout(conditionBlock).depth ?? conditionIndex;
    const currentDraft = parseConditionKeywordDraft(conditionBlock.config);
    const nextBranches = [
      {
        ...(currentDraft.branches[0] ?? { id: `branch-left-${blockId}`, keywords: "", nextPosition: "" }),
        name: currentDraft.branches[0]?.name || "Sim",
        nextPosition: String(targetBlocks[0].position),
      },
      {
        ...(currentDraft.branches[1] ?? { id: `branch-right-${blockId}`, keywords: "", nextPosition: "" }),
        name: currentDraft.branches[1]?.name || "Nao",
        nextPosition: String(targetBlocks[1].position),
      },
    ];

    applyBlockCollection(
      ordered.map((block) => {
        if (block.clientId === blockId) {
          return {
            ...block,
            config: replaceConditionKeywordConfig(block.config, {
              ...currentDraft,
              branches: nextBranches,
            }),
          };
        }

        if (block.clientId === targetBlocks[0].clientId) {
          return applyFlowBuilderManualLayout(block, {
            lane: baseLane - 1,
            depth: baseDepth + 1,
            branchSide: "left",
          });
        }

        if (block.clientId === targetBlocks[1].clientId) {
          return applyFlowBuilderManualLayout(block, {
            lane: baseLane + 1,
            depth: baseDepth + 1,
            branchSide: "right",
          });
        }

        return block;
      }),
    );

    setSelectedBlockId(blockId);
  }

  function saveFlow(statusOverride?: FlowStatus) {
    if (!flowDraft.name.trim()) {
      toast({
        title: "Nome obrigatorio",
        description: "Informe um nome para o fluxo antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const nextDraft = {
      ...flowDraft,
      status: statusOverride ?? flowDraft.status,
    };

    let payload;

    try {
      payload = buildFlowPayloadFromDraft(nextDraft, orderedDraftBlocks);
    } catch (error) {
      toast({
        title: "Configuracao invalida",
        description: getApiErrorMessage(error, "Revise os blocos antes de salvar."),
        variant: "destructive",
      });
      return;
    }

    const onSuccess = (savedFlow: { id: string; created: string }) => {
      setFlowDraft((current) => ({
        ...current,
        id: savedFlow.id,
        status: nextDraft.status,
        created: savedFlow.created,
      }));
      setIsCreatingNewFlow(false);
      setActiveFlowId(savedFlow.id);
      setHasUnsavedChanges(false);

      toast({
        title: "Fluxo salvo",
        description: "A estrutura visual foi persistida no backend Laravel com sucesso.",
      });
    };

    if (!isCreatingNewFlow && flowDraft.id) {
      updateFlowMutation.mutate(
        { flowId: flowDraft.id, payload },
        {
          onSuccess,
          onError: (error) => toast({
            title: "Falha ao salvar fluxo",
            description: getApiErrorMessage(error),
            variant: "destructive",
          }),
        },
      );
      return;
    }

    createFlowMutation.mutate(payload, {
      onSuccess,
      onError: (error) => toast({
        title: "Falha ao criar fluxo",
        description: getApiErrorMessage(error),
        variant: "destructive",
      }),
    });
  }

  function duplicateCurrentFlow() {
    if (!flowDraft.name.trim()) {
      toast({
        title: "Nada para duplicar",
        description: "Crie ou carregue um fluxo antes de duplicar.",
        variant: "destructive",
      });
      return;
    }

    let payload;

    try {
      payload = buildFlowPayloadFromDraft(
        {
          ...flowDraft,
          id: undefined,
          name: `${flowDraft.name} copia`,
          status: "rascunho",
        },
        orderedDraftBlocks,
      );
    } catch (error) {
      toast({
        title: "Nao foi possivel duplicar",
        description: getApiErrorMessage(error, "Revise os blocos antes de duplicar."),
        variant: "destructive",
      });
      return;
    }

    createFlowMutation.mutate(payload, {
      onSuccess: (createdFlow) => {
        toast({
          title: "Fluxo duplicado",
          description: "A copia foi criada como rascunho para evitar ativacao acidental.",
        });
        setIsCreatingNewFlow(false);
        setActiveFlowId(createdFlow.id);
        setHasUnsavedChanges(false);
      },
      onError: (error) => toast({
        title: "Falha ao duplicar fluxo",
        description: getApiErrorMessage(error),
        variant: "destructive",
      }),
    });
  }

  function deleteCurrentFlow() {
    if (!flowDraft.id) {
      loadNewFlowDraft();
      return;
    }

    deleteFlowMutation.mutate(flowDraft.id, {
      onSuccess: () => {
        toast({
          title: "Fluxo excluido",
          description: "O fluxo foi removido do backend.",
        });
        setConfirmDeleteFlow(false);
        setHasUnsavedChanges(false);
      },
      onError: (error) => toast({
        title: "Falha ao excluir fluxo",
        description: getApiErrorMessage(error),
        variant: "destructive",
      }),
    });
  }

  const currentTriggerLabel = formatFlowTrigger({
    mode: flowDraft.triggerMode,
    value: flowDraft.triggerValue,
  }) || "Sem gatilho";
  const quickAddTargetBlockId = selectedBlockId ?? orderedDraftBlocks.at(-1)?.clientId;

  function renderBlockQuickAddBar(compact = false) {
    return (
      <div className={cn("flex gap-2", compact ? "overflow-x-auto pb-1" : "flex-wrap")}>
        {flowBuilderBlockTypeOptions.map((type) => (
          <Button
            key={`${compact ? "compact" : "full"}-${type}`}
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap"
            onClick={() => addBlock(type, quickAddTargetBlockId)}
          >
            <Plus className="h-4 w-4" /> {compact ? flowBuilderBlockTypeMeta[type].shortLabel : flowBuilderBlockTypeMeta[type].label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1900px] space-y-6">
      {(flowsQuery.isError || flowBlocksQuery.isError) ? (
        <Card className="border-destructive/40 p-4 text-sm text-destructive">
          Erro ao carregar fluxos: {getApiErrorMessage(flowsQuery.error ?? flowBlocksQuery.error)}
        </Card>
      ) : null}

      <Card className="border-border/70 bg-card/95 p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Workflow className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold">Fluxos</h1>
                <p className="text-sm text-muted-foreground">
                  Builder visual conectado ao backend Laravel, sem mock e sem quebrar o executor atual.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
              <div className="space-y-2">
                <Label htmlFor="flow-name">Nome do fluxo</Label>
                <Input
                  id="flow-name"
                  value={flowDraft.name}
                  placeholder="Ex.: Qualificacao inicial"
                  onChange={(event) => updateFlowDraft({ name: event.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="flow-status">Status</Label>
                  <select
                    id="flow-status"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={flowDraft.status}
                    onChange={(event) => updateFlowDraft({ status: event.target.value as FlowStatus })}
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="ativo">Ativo</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Estado do editor</Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-secondary/30 px-3">
                    <StatusBadge status={flowDraft.status} />
                    {hasUnsavedChanges ? (
                      <Badge variant="outline" className="rounded-md border-warning/30 bg-warning/10 text-warning">
                        Alteracoes pendentes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-md">
                        Tudo salvo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-2">
                <Label htmlFor="flow-trigger-mode">Gatilho</Label>
                <select
                  id="flow-trigger-mode"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={flowDraft.triggerMode}
                  onChange={(event) => updateFlowDraft({ triggerMode: event.target.value as FlowTriggerMode, triggerValue: event.target.value === "first_message" ? "" : flowDraft.triggerValue })}
                >
                  {Object.entries(triggerModeLabels).map(([mode, label]) => (
                    <option key={mode} value={mode}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flow-trigger-value">Valor do gatilho</Label>
                <Input
                  id="flow-trigger-value"
                  disabled={flowDraft.triggerMode === "first_message"}
                  placeholder={flowDraft.triggerMode === "keyword" ? "premium" : flowDraft.triggerMode === "tag" ? "vip" : "texto livre"}
                  value={flowDraft.triggerValue}
                  onChange={(event) => updateFlowDraft({ triggerValue: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flow-ai-company-prompt">Contexto geral da empresa para a IA</Label>
              <textarea
                id="flow-ai-company-prompt"
                className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Descreva a empresa, servicos, publico, diferenciais, faixa de preco, como abordar clientes, quais respostas evitar, como direcionar para proposta, demo, agendamento ou atendimento humano. Esse contexto sera usado por todos os blocos de Decisao IA deste fluxo."
                value={flowDraft.aiCompanyPrompt}
                onChange={(event) => updateFlowDraft({ aiCompanyPrompt: event.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Esse prompt geral alimenta toda Decisao IA do fluxo. Quanto mais contexto real da empresa voce colocar aqui, melhor a IA consegue responder perguntas e conduzir a conversa no WhatsApp.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:w-[340px]">
            <Button className="gap-2" onClick={() => saveFlow()} disabled={isSaving || isDeleting}>
              <Save className="h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => saveFlow("ativo")} disabled={isSaving || isDeleting}>
              <Play className="h-4 w-4" /> Ativar
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => saveFlow("pausado")} disabled={isSaving || isDeleting}>
              <Pause className="h-4 w-4" /> Pausar
            </Button>
            <Button variant="outline" className="gap-2" onClick={duplicateCurrentFlow} disabled={isSaving || isDeleting}>
              <Copy className="h-4 w-4" /> Duplicar
            </Button>
            <Button variant="outline" className="gap-2" onClick={requestNewFlow} disabled={isSaving || isDeleting}>
              <Plus className="h-4 w-4" /> Novo fluxo
            </Button>
            <Button variant="outline" className="gap-2" onClick={cancelEditing} disabled={!hasUnsavedChanges || isSaving || isDeleting}>
              Cancelar edicao
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive sm:col-span-2"
              onClick={() => setConfirmDeleteFlow(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" /> Excluir fluxo
            </Button>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-border/70 bg-secondary/30 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gatilho salvo</p>
            <p className="mt-1 text-sm font-medium">{currentTriggerLabel}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Blocos</p>
            <p className="mt-1 text-sm font-medium">{orderedDraftBlocks.length} etapas</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Decisoes</p>
            <p className="mt-1 text-sm font-medium">{flowStats.decisions} caminhos condicionais</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Saidas</p>
            <p className="mt-1 text-sm font-medium">{flowStats.endings} finais ou handoff</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-[300px_minmax(0,1fr)_400px]">
        <Card className="border-border/70 bg-card/95 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Biblioteca de fluxos</h2>
              <p className="text-sm text-muted-foreground">Troque de fluxo sem perder o contexto visual.</p>
            </div>
            <Button size="sm" className="gap-2" onClick={requestNewFlow}>
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar fluxo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FlowFilterValue)}
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </div>

          <div className="mt-4 space-y-2">
            {filteredFlows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nenhum fluxo encontrado com esse filtro.
              </div>
            ) : null}

            {filteredFlows.map((flow) => {
              const isSelected = !isCreatingNewFlow && flow.id === activeFlowId;

              return (
                <button
                  key={flow.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left transition-smooth",
                    isSelected ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/70 bg-background hover:border-primary/20 hover:bg-secondary/20",
                  )}
                  onClick={() => requestOpenFlow(flow.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{flow.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{flow.trigger || "Sem gatilho"}</p>
                    </div>
                    <StatusBadge status={flow.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{flow.steps} blocos</span>
                    <span>•</span>
                    <span>{flow.created}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-base font-semibold">Canvas do fluxo</h2>
                <p className="text-sm text-muted-foreground">
                  Visualize com clareza onde inicia, espera, decide, transfere e termina.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsCanvasFullscreen(true)}
                >
                  <Expand className="h-4 w-4" /> Tela cheia
                </Button>
                {stateLegend.map((item) => (
                  <span key={item.label} className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium", item.tone)}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {renderBlockQuickAddBar()}
            </div>
          </Card>

          <div className="relative">
            {flowBlocksQuery.isFetching && !isCreatingNewFlow ? (
              <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex justify-center">
                <Badge variant="secondary" className="rounded-full px-3 py-1 shadow-sm">
                  Atualizando blocos do backend...
                </Badge>
              </div>
            ) : null}

            <FlowCanvas
              className="min-h-[620px]"
              blocks={orderedDraftBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onDuplicateBlock={duplicateDraftBlock}
              onDeleteBlock={requestDeleteBlock}
              onMoveBlockUp={(blockId) => moveBlock(blockId, -1)}
              onMoveBlockDown={(blockId) => moveBlock(blockId, 1)}
              onAddAfter={addBlock}
              onRepositionBlock={repositionBlock}
            />
          </div>
        </div>

        <FlowInspector
          block={selectedBlock}
          blocks={orderedDraftBlocks}
          onUpdateBlock={updateBlock}
          onDeleteBlock={requestDeleteBlock}
          onDuplicateBlock={duplicateDraftBlock}
          onAddAfter={addBlock}
          onApplyConditionBinaryModel={applyConditionBinaryModel}
        />
      </div>

      <Dialog open={isCanvasFullscreen} onOpenChange={setIsCanvasFullscreen}>
        <DialogContent className="grid h-[100vh] max-h-[100vh] w-[100vw] max-w-none grid-rows-[auto_minmax(0,1fr)] translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none">
          <div className="flex min-h-0 h-full flex-col bg-background">
            <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4 pr-16 text-left">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <DialogTitle>Canvas do fluxo</DialogTitle>
                  <DialogDescription>
                    Navegue o fluxograma inteiro sem cortes e continue editando com as mesmas integrações do backend.
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsCanvasFullscreen(false)}
                  >
                    <Minimize2 className="h-4 w-4" /> Sair da tela cheia
                  </Button>
                  {stateLegend.map((item) => (
                    <span key={`fullscreen-${item.label}`} className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium", item.tone)}>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </DialogHeader>

            <div className="relative min-h-0 flex-1 overflow-hidden p-6">
              <div className="absolute left-6 top-6 z-20 max-w-[min(920px,calc(100%-3rem))] rounded-lg border border-border/70 bg-background/92 p-3 shadow-lg backdrop-blur">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-md">
                    Inserir bloco
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedBlockId ? "Apos o bloco selecionado" : "Apos o ultimo bloco"}
                  </span>
                </div>
                {renderBlockQuickAddBar(true)}
              </div>

              <FlowCanvas
                className="h-full min-h-0 min-w-0 pt-20"
                blocks={orderedDraftBlocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onDuplicateBlock={duplicateDraftBlock}
                onDeleteBlock={requestDeleteBlock}
                onMoveBlockUp={(blockId) => moveBlock(blockId, -1)}
                onMoveBlockDown={(blockId) => moveBlock(blockId, 1)}
                onAddAfter={addBlock}
                onRepositionBlock={repositionBlock}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDestination !== null} onOpenChange={(open) => !open && setPendingDestination(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alteracoes nao salvas?</AlertDialogTitle>
            <AlertDialogDescription>
              Voce tem mudancas no editor visual que ainda nao foram enviadas para o backend. Se continuar, elas serao perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={discardAndContinue}>
              Descartar e seguir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteFlow} onOpenChange={setConfirmDeleteFlow}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fluxo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove o fluxo do backend Laravel. O executor nao conseguira mais usa-lo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-4">
            <p className="font-medium">{flowDraft.name || "Fluxo sem nome"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{orderedDraftBlocks.length} blocos • {currentTriggerLabel}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCurrentFlow} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir fluxo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingDeleteBlockId !== null} onOpenChange={(open) => !open && setPendingDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
            <AlertDialogDescription>
              O bloco sera removido do fluxo visual e isso sera persistido no proximo save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md border border-warning/20 bg-warning/10 p-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">
                  {orderedDraftBlocks.find((block) => block.clientId === pendingDeleteBlockId)?.title || "Bloco selecionado"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Caminhos que apontam para ele devem ser revisados no painel lateral.
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDraftBlock}>Excluir bloco</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
