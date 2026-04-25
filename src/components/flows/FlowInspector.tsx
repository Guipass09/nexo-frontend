import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  GitBranch,
  MessageSquare,
  PlayCircle,
  Plus,
  Trash2,
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMediaAssets } from "@/hooks/use-app-data";
import type { MediaAssetType } from "@/types/domain";
import {
  createEmptyFlowBuilderBlock,
  flowBuilderBlockTypeMeta,
  flowBuilderBlockTypeOptions,
  getConditionBranchDisplayName,
  parseConditionKeywordDraft,
  parseMetadataJson,
  replaceConditionKeywordConfig,
  stringifyFlowBlockConfig,
  type ConditionKeywordDraft,
  type FlowBuilderBlockDraft,
} from "@/services/flow-editor";

const iconByType: Record<string, LucideIcon> = {
  start: PlayCircle,
  send_message: MessageSquare,
  send_template: Bot,
  send_media: Workflow,
  wait_for_reply: Clock3,
  condition_keyword: GitBranch,
  ai_decision: Bot,
  handoff_human: UserRound,
  end: CheckCircle2,
};

const toneByType: Record<string, string> = {
  start: "border-accent/35 bg-accent/10 text-accent",
  action: "border-primary/25 bg-primary/10 text-primary",
  wait: "border-warning/30 bg-warning/10 text-warning",
  decision: "border-info/30 bg-info/10 text-info",
  handoff: "border-destructive/30 bg-destructive/10 text-destructive",
  end: "border-success/30 bg-success/10 text-success",
};

function createBranchId() {
  return `branch-${Math.random().toString(36).slice(2, 10)}`;
}

function positionValueOrEmpty(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

function parseKeywordInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ensureBinaryBranches(draft: ConditionKeywordDraft) {
  const nextBranches = [...draft.branches];

  while (nextBranches.length < 2) {
    const branchIndex = nextBranches.length;
    nextBranches.push({
      id: createBranchId(),
      name: branchIndex === 0 ? "Sim" : "Nao",
      keywords: "",
      nextPosition: "",
    });
  }

  return nextBranches.slice(0, 2).map((branch, index) => ({
    ...branch,
    name: branch.name || getConditionBranchDisplayName(undefined, index),
  }));
}

function ConnectionSelect({
  label,
  value,
  options,
  placeholder = "Sem destino",
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface FlowInspectorProps {
  block: FlowBuilderBlockDraft | null;
  blocks: FlowBuilderBlockDraft[];
  onUpdateBlock: (blockId: string, updater: (block: FlowBuilderBlockDraft) => FlowBuilderBlockDraft) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onAddAfter: (type: FlowBuilderBlockDraft["type"], afterBlockId: string) => void;
  onApplyConditionBinaryModel: (blockId: string) => void;
}

export function FlowInspector({
  block,
  blocks,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onAddAfter,
  onApplyConditionBinaryModel,
}: FlowInspectorProps) {
  const [advancedJson, setAdvancedJson] = useState("{}");
  const [advancedJsonError, setAdvancedJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!block) {
      return;
    }

    setAdvancedJson(stringifyFlowBlockConfig(block.config));
    setAdvancedJsonError(null);
  }, [block]);

  const connectionOptions = useMemo(() => (
    blocks
      .filter((item) => item.clientId !== block?.clientId)
      .map((item) => ({
        value: String(item.position),
        label: `#${item.position} - ${item.title || flowBuilderBlockTypeMeta[item.type].label}`,
      }))
  ), [block?.clientId, blocks]);
  const selectedMediaType = block?.type === "send_media" && typeof block.config.type === "string"
    ? block.config.type as MediaAssetType
    : "image";
  const { data: selectedMediaAssets = [] } = useMediaAssets(selectedMediaType, { enabled: block?.type === "send_media" });

  if (!block) {
    return (
      <div className="rounded-lg border border-border/70 bg-card p-6">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Painel do bloco</h3>
          <p className="text-sm text-muted-foreground">
            Selecione um bloco no canvas para editar titulo, conteudo, destinos e configuracoes do backend.
          </p>
        </div>
      </div>
    );
  }

  const meta = flowBuilderBlockTypeMeta[block.type];
  const Icon = iconByType[block.type] ?? Workflow;
  const conditionDraft = parseConditionKeywordDraft(block.config);

  function updateBlock(updater: (current: FlowBuilderBlockDraft) => FlowBuilderBlockDraft) {
    onUpdateBlock(block.clientId, updater);
  }

  function patchBlock(patch: Partial<FlowBuilderBlockDraft>) {
    updateBlock((current) => ({
      ...current,
      ...patch,
    }));
  }

  function patchConfig(updater: (current: Record<string, unknown>) => Record<string, unknown>) {
    updateBlock((current) => ({
      ...current,
      config: updater(current.config),
    }));
  }

  function updateConditionDraft(updater: (draft: ConditionKeywordDraft) => ConditionKeywordDraft) {
    const nextDraft = updater(conditionDraft);

    patchConfig((currentConfig) => replaceConditionKeywordConfig(currentConfig, nextDraft));
  }

  function updateVariablesJson(nextValue: string) {
    patchConfig((currentConfig) => {
      try {
        const parsed = parseMetadataJson(nextValue);
        return {
          ...currentConfig,
          variables: parsed,
        };
      } catch {
        return currentConfig;
      }
    });
  }

  function renderTypeSpecificFields() {
    switch (block.type) {
      case "send_message":
        return (
          <div className="space-y-2">
            <Label htmlFor="block-message-text">Mensagem enviada</Label>
            <Textarea
              id="block-message-text"
              rows={6}
              value={typeof block.config.text === "string" ? block.config.text : ""}
              placeholder="Texto real que o cliente vai receber."
              onChange={(event) => patchConfig((currentConfig) => ({
                ...currentConfig,
                text: event.target.value,
              }))}
            />
          </div>
        );

      case "wait_for_reply":
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wait-reason">Motivo de espera</Label>
                <Input
                  id="wait-reason"
                  value={typeof block.config.reason === "string" ? block.config.reason : ""}
                  onChange={(event) => patchConfig((currentConfig) => ({
                    ...currentConfig,
                    reason: event.target.value,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wait-timeout">Timeout (minutos)</Label>
                <Input
                  id="wait-timeout"
                  type="number"
                  min={0}
                  value={positionValueOrEmpty(block.config.timeout_minutes)}
                  onChange={(event) => patchConfig((currentConfig) => ({
                    ...currentConfig,
                    timeout_minutes: event.target.value ? Number(event.target.value) : undefined,
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wait-keywords">Palavras esperadas</Label>
              <Input
                id="wait-keywords"
                placeholder="sim, continuar, quero"
                value={Array.isArray(block.config.expected_keywords) ? block.config.expected_keywords.join(", ") : ""}
                onChange={(event) => patchConfig((currentConfig) => ({
                  ...currentConfig,
                  expected_keywords: parseKeywordInput(event.target.value),
                }))}
              />
            </div>
          </div>
        );

      case "condition_keyword":
      case "ai_decision":
        return (
          <div className="space-y-4">
            {block.type === "ai_decision" ? (
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ai-objective">Objetivo da decisao</Label>
                  <Textarea
                    id="ai-objective"
                    rows={3}
                    value={typeof block.config.objective === "string" ? block.config.objective : ""}
                    placeholder="Ex.: entender se a resposta indica interesse em marcar avaliacao, tirar duvida de valor ou falar com humano."
                    onChange={(event) => patchConfig((currentConfig) => ({
                      ...currentConfig,
                      objective: event.target.value,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-guidance">Instrucao extra para a IA</Label>
                  <Textarea
                    id="ai-guidance"
                    rows={3}
                    value={typeof block.config.guidance === "string" ? block.config.guidance : ""}
                    placeholder="Explique nuances, prioridades e quando a decisao deve encaminhar para humano."
                    onChange={(event) => patchConfig((currentConfig) => ({
                      ...currentConfig,
                      guidance: event.target.value,
                    }))}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-min-confidence">Confianca minima</Label>
                    <Input
                      id="ai-min-confidence"
                      type="number"
                      min={0}
                      max={1}
                      step="0.01"
                      value={typeof block.config.ai_min_confidence === "number" ? String(block.config.ai_min_confidence) : "0.72"}
                      onChange={(event) => patchConfig((currentConfig) => ({
                        ...currentConfig,
                        ai_min_confidence: event.target.value ? Number(event.target.value) : 0.72,
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-best-effort-confidence">Melhor esforco minimo</Label>
                    <Input
                      id="ai-best-effort-confidence"
                      type="number"
                      min={0}
                      max={1}
                      step="0.01"
                      value={typeof block.config.ai_best_effort_min_confidence === "number" ? String(block.config.ai_best_effort_min_confidence) : "0.42"}
                      onChange={(event) => patchConfig((currentConfig) => ({
                        ...currentConfig,
                        ai_best_effort_min_confidence: event.target.value ? Number(event.target.value) : 0.42,
                      }))}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-best-effort-enabled">Permitir melhor direcao</Label>
                    <select
                      id="ai-best-effort-enabled"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={block.config.ai_best_effort_enabled ? "true" : "false"}
                      onChange={(event) => patchConfig((currentConfig) => ({
                        ...currentConfig,
                        ai_best_effort_enabled: event.target.value === "true",
                      }))}
                    >
                      <option value="true">Sim</option>
                      <option value="false">Nao</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-handoff-uncertain">Transferir para humano se incerto</Label>
                    <select
                      id="ai-handoff-uncertain"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={block.config.handoff_on_uncertain ? "true" : "false"}
                      onChange={(event) => patchConfig((currentConfig) => ({
                        ...currentConfig,
                        handoff_on_uncertain: event.target.value === "true",
                      }))}
                    >
                      <option value="false">Nao</option>
                      <option value="true">Sim</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-info/20 bg-info/5 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium">{block.type === "ai_decision" ? "Caminhos da decisao autonoma" : "Caminhos da decisao"}</p>
                  <p className="text-xs text-muted-foreground">
                    {block.type === "ai_decision"
                      ? "Descreva os caminhos que a IA pode escolher. Ela decide pelo sentido da resposta, nao apenas por palavra exata."
                      : "Para perguntas binarias, use dois ramos. O primeiro abre para a esquerda e o segundo para a direita no fluxograma."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onApplyConditionBinaryModel(block.clientId)}
                  >
                    Modelo Sim / Nao
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateConditionDraft((currentDraft) => ({
                      ...currentDraft,
                      branches: [
                        ...currentDraft.branches,
                        { id: createBranchId(), name: "", keywords: "", nextPosition: "" },
                      ],
                    }))}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Novo ramo
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {conditionDraft.branches.length === 0 ? (
                  <div className="rounded-md border border-dashed border-info/20 bg-background/80 px-3 py-4 text-sm text-muted-foreground">
                    Nenhum ramo configurado ainda.
                  </div>
                ) : null}
                <div className={cn("grid gap-3", conditionDraft.branches.length >= 2 && "xl:grid-cols-2")}>
                {conditionDraft.branches.map((branch, index) => (
                  <div
                    key={branch.id}
                    className={cn(
                      "rounded-md border border-border/60 bg-background p-3",
                      index === 0 && "border-info/30",
                      index === 1 && "border-primary/25",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          index === 0 && "border-info/30 bg-info/10 text-info",
                          index === 1 && "border-primary/25 bg-primary/10 text-primary",
                        )}
                      >
                        {index === 0 ? "Lado esquerdo" : index === 1 ? "Lado direito" : `Ramo ${index + 1}`}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => updateConditionDraft((currentDraft) => ({
                          ...currentDraft,
                          branches: currentDraft.branches.filter((item) => item.id !== branch.id),
                        }))}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remover
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`branch-name-${branch.id}`}>Rotulo do caminho</Label>
                        <Input
                          id={`branch-name-${branch.id}`}
                          value={branch.name}
                          placeholder={getConditionBranchDisplayName(undefined, index)}
                          onChange={(event) => updateConditionDraft((currentDraft) => ({
                            ...currentDraft,
                            branches: currentDraft.branches.map((item) => item.id === branch.id ? { ...item, name: event.target.value } : item),
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`branch-keywords-${branch.id}`}>{block.type === "ai_decision" ? "Sinais / exemplos do caminho" : "Palavras-chave"}</Label>
                        <Input
                          id={`branch-keywords-${branch.id}`}
                          placeholder={block.type === "ai_decision" ? "quer agendar, quer marcar, pode ser, tenho interesse" : "premium, valor, preco"}
                          value={branch.keywords}
                          onChange={(event) => updateConditionDraft((currentDraft) => ({
                            ...currentDraft,
                            branches: currentDraft.branches.map((item) => item.id === branch.id ? { ...item, keywords: event.target.value } : item),
                          }))}
                        />
                      </div>
                      <ConnectionSelect
                        label={index === 0 ? "Destino da esquerda" : index === 1 ? "Destino da direita" : "Destino"}
                        value={branch.nextPosition}
                        options={connectionOptions}
                        placeholder="Selecione o bloco de destino"
                        onChange={(value) => updateConditionDraft((currentDraft) => ({
                          ...currentDraft,
                          branches: currentDraft.branches.map((item) => item.id === branch.id ? { ...item, nextPosition: value } : item),
                        }))}
                      />
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="simple-keyword">{block.type === "ai_decision" ? "Atalho forte opcional" : "Atalho simples"}</Label>
                <Input
                  id="simple-keyword"
                  placeholder={block.type === "ai_decision" ? "humano" : "humano"}
                  value={conditionDraft.simpleKeyword}
                  onChange={(event) => updateConditionDraft((currentDraft) => ({
                    ...currentDraft,
                    simpleKeyword: event.target.value,
                  }))}
                />
              </div>
              <ConnectionSelect
                label="Destino do atalho"
                value={conditionDraft.simpleNextPosition}
                options={connectionOptions}
                onChange={(value) => updateConditionDraft((currentDraft) => ({
                  ...currentDraft,
                  simpleNextPosition: value,
                }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ConnectionSelect
                label="Fallback principal"
                value={conditionDraft.defaultNextPosition}
                options={connectionOptions}
                onChange={(value) => updateConditionDraft((currentDraft) => ({
                  ...currentDraft,
                  defaultNextPosition: value,
                }))}
              />
              <ConnectionSelect
                label="Fallback alternativo"
                value={conditionDraft.fallbackNextPosition}
                options={connectionOptions}
                onChange={(value) => updateConditionDraft((currentDraft) => ({
                  ...currentDraft,
                  fallbackNextPosition: value,
                }))}
              />
            </div>
          </div>
        );

      case "handoff_human":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="handoff-reason">Motivo</Label>
              <Input
                id="handoff-reason"
                value={typeof block.config.reason === "string" ? block.config.reason : ""}
                onChange={(event) => patchConfig((currentConfig) => ({
                  ...currentConfig,
                  reason: event.target.value,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handoff-department">Departamento</Label>
              <Input
                id="handoff-department"
                value={typeof block.config.department === "string" ? block.config.department : ""}
                onChange={(event) => patchConfig((currentConfig) => ({
                  ...currentConfig,
                  department: event.target.value,
                }))}
              />
            </div>
          </div>
        );

      case "end":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="end-reason">Motivo</Label>
              <Input
                id="end-reason"
                value={typeof block.config.reason === "string" ? block.config.reason : ""}
                onChange={(event) => patchConfig((currentConfig) => ({
                  ...currentConfig,
                  reason: event.target.value,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-result">Resultado</Label>
              <Input
                id="end-result"
                value={typeof block.config.outcome === "string" ? block.config.outcome : typeof block.config.result === "string" ? block.config.result : ""}
                onChange={(event) => patchConfig((currentConfig) => ({
                  ...currentConfig,
                  outcome: event.target.value,
                }))}
              />
            </div>
          </div>
        );

      case "send_template":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-id">Template ID</Label>
              <Input
                id="template-id"
                type="number"
                min={1}
                value={positionValueOrEmpty(block.config.template_id)}
                onChange={(event) => patchConfig((currentConfig) => ({
                  ...currentConfig,
                  template_id: event.target.value ? Number(event.target.value) : undefined,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-variables">Variaveis (JSON)</Label>
              <Textarea
                id="template-variables"
                rows={5}
                value={stringifyFlowBlockConfig(
                  typeof block.config.variables === "object" && block.config.variables !== null && !Array.isArray(block.config.variables)
                    ? block.config.variables as Record<string, unknown>
                    : {},
                )}
                onChange={(event) => updateVariablesJson(event.target.value)}
              />
            </div>
          </div>
        );

      case "send_media":
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="media-type">Tipo de midia</Label>
                <select
                  id="media-type"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={typeof block.config.type === "string" ? block.config.type : "image"}
                  onChange={(event) => patchConfig((currentConfig) => ({
                    ...currentConfig,
                    type: event.target.value,
                    asset_id: undefined,
                  }))}
                >
                  <option value="image">Imagem</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documento</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-source">Origem</Label>
                <select
                  id="media-source"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={typeof block.config.source === "string" ? block.config.source : "url"}
                  onChange={(event) => patchConfig((currentConfig) => ({
                    ...currentConfig,
                    source: event.target.value,
                  }))}
                >
                  <option value="url">URL</option>
                  <option value="id">Meta ID</option>
                  <option value="asset">Biblioteca</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="media-url">URL</Label>
                <Input
                  id="media-url"
                  value={typeof block.config.url === "string" ? block.config.url : ""}
                  onChange={(event) => patchConfig((currentConfig) => ({
                    ...currentConfig,
                    url: event.target.value,
                  }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="media-id">ID externo</Label>
                  <Input
                    id="media-id"
                    value={typeof block.config.id === "string" ? block.config.id : ""}
                    onChange={(event) => patchConfig((currentConfig) => ({
                      ...currentConfig,
                      id: event.target.value,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-asset-id">Biblioteca de midia</Label>
                  <select
                    id="media-asset-id"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={positionValueOrEmpty(block.config.asset_id)}
                    onChange={(event) => patchConfig((currentConfig) => ({
                      ...currentConfig,
                      asset_id: event.target.value ? Number(event.target.value) : undefined,
                      source: event.target.value ? "asset" : currentConfig.source,
                    }))}
                  >
                    <option value="">Selecione...</option>
                    {selectedMediaAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        #{asset.id} - {asset.originalName ?? asset.metaMediaId ?? asset.publicUrl ?? asset.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedMediaType === "audio" && selectedMediaAssets.find((asset) => String(asset.id) === String(block.config.asset_id))?.publicUrl ? (
                <audio
                  src={selectedMediaAssets.find((asset) => String(asset.id) === String(block.config.asset_id))?.publicUrl ?? undefined}
                  controls
                  preload="metadata"
                  className="h-9 w-full"
                />
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="media-caption">Legenda</Label>
                <Textarea
                  id="media-caption"
                  rows={4}
                  value={typeof block.config.caption === "string" ? block.config.caption : ""}
                  onChange={(event) => patchConfig((currentConfig) => ({
                    ...currentConfig,
                    caption: event.target.value,
                  }))}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            Este tipo de bloco usa a sequencia visual e o JSON avancado abaixo.
          </div>
        );
    }
  }

  return (
    <div className="rounded-lg border border-border/70 bg-card">
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg border", toneByType[meta.tone])}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{block.title || meta.label}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{meta.label}</Badge>
                <Badge variant="secondary">Posicao #{block.position}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onDuplicateBlock(block.clientId)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDeleteBlock(block.clientId)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="block-type">Tipo</Label>
            <select
              id="block-type"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={block.type}
              onChange={(event) => patchBlock({
                type: event.target.value as FlowBuilderBlockDraft["type"],
                title: block.title || flowBuilderBlockTypeMeta[event.target.value as FlowBuilderBlockDraft["type"]].label,
                config: createEmptyFlowBuilderBlock(
                  event.target.value as FlowBuilderBlockDraft["type"],
                  block.position,
                ).config,
              })}
            >
              {flowBuilderBlockTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {flowBuilderBlockTypeMeta[type].label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="block-title">Titulo</Label>
              <Input
                id="block-title"
                value={block.title}
                onChange={(event) => patchBlock({ title: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-position">Posicao</Label>
              <Input
                id="block-position"
                type="number"
                min={1}
                value={String(block.position)}
                onChange={(event) => patchBlock({
                  position: Number(event.target.value) || block.position,
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="block-description">Resumo interno</Label>
            <Textarea
              id="block-description"
              rows={3}
              value={block.description}
              placeholder="Descricao curta para o time entender este bloco."
              onChange={(event) => patchBlock({ description: event.target.value })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Configuracao do bloco</p>
            <p className="text-xs text-muted-foreground">
              Edite os campos operacionais e, se precisar, refine no JSON avancado.
            </p>
          </div>
          {renderTypeSpecificFields()}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Inserir proximo bloco</p>
              <p className="text-xs text-muted-foreground">
                Para fluxos lineares, o proximo passo segue a ordem por `position`.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {flowBuilderBlockTypeOptions
              .filter((type) => type !== "start")
              .map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={() => onAddAfter(type, block.clientId)}
                >
                  <Plus className="mr-2 h-4 w-4" /> {flowBuilderBlockTypeMeta[type].label}
                </Button>
              ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">JSON avancado</p>
              <p className="text-xs text-muted-foreground">
                O conteudo abaixo e salvo em `config` para manter compatibilidade com o executor Laravel.
              </p>
            </div>
            {advancedJsonError ? (
              <Badge variant="destructive">JSON invalido</Badge>
            ) : (
              <Badge variant="outline">JSON valido</Badge>
            )}
          </div>
          <Textarea
            className="min-h-[220px] font-mono text-xs"
            value={advancedJson}
            onChange={(event) => {
              const nextValue = event.target.value;
              setAdvancedJson(nextValue);

              try {
                const parsed = parseMetadataJson(nextValue);
                setAdvancedJsonError(null);
                patchBlock({ config: parsed });
              } catch {
                setAdvancedJsonError("JSON invalido");
              }
            }}
          />
          {advancedJsonError ? (
            <p className="text-xs text-destructive">Corrija o JSON antes de salvar o fluxo.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
