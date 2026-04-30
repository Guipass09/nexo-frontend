import type { Flow, FlowBlock, FlowStatus } from "@/types/domain";
import type { FlowBlockPayload, FlowPayload } from "@/services/flows";

export type FlowTriggerMode = "first_message" | "keyword" | "tag" | "contains";

export type FlowTriggerDraft = {
  mode: FlowTriggerMode;
  value: string;
};

export type KeywordBranchDraft = {
  id: string;
  name: string;
  keywords: string;
  nextPosition: string;
};

export type ConditionKeywordDraft = {
  simpleKeyword: string;
  simpleNextPosition: string;
  defaultNextPosition: string;
  fallbackNextPosition: string;
  branches: KeywordBranchDraft[];
};

export type FlowBuilderFlowDraft = {
  id?: string;
  name: string;
  status: FlowStatus;
  triggerMode: FlowTriggerMode;
  triggerValue: string;
  aiCompanyPrompt: string;
  created: string;
};

export type FlowBuilderBlockDraft = {
  id?: string;
  clientId: string;
  type: FlowBlock["type"];
  title: string;
  description: string;
  position: number;
  config: Record<string, unknown>;
};

export type FlowBuilderBlockTone = "start" | "action" | "wait" | "decision" | "handoff" | "end";

export type FlowBuilderNode = {
  id: string;
  clientId?: string;
  blockId?: string;
  type: FlowBlock["type"] | "virtual_start";
  title: string;
  description: string;
  summary: string;
  position: number;
  tone: FlowBuilderBlockTone;
  lane: number;
  x: number;
  y: number;
  depth?: number;
  isVirtual?: boolean;
};

export type FlowBuilderEdge = {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  tone: FlowBuilderBlockTone;
  kind: "sequential" | "decision" | "fallback";
  sourceAnchor?: "top" | "right" | "bottom" | "left";
  targetAnchor?: "top" | "right" | "bottom" | "left";
};

export type FlowBuilderChart = {
  nodes: FlowBuilderNode[];
  edges: FlowBuilderEdge[];
  width: number;
  height: number;
  layout: {
    minLane: number;
    maxLane: number;
    nodeWidth: number;
    nodeHeight: number;
    laneGap: number;
    rowGap: number;
    paddingX: number;
    paddingY: number;
    yOffset: number;
  };
};

type FlowBuilderLink = {
  targetId: string;
  relationship: "sequential" | "decision" | "fallback" | "branch";
  branchIndex?: number;
};

export type BlockTypeMeta = {
  label: string;
  tone: FlowBuilderBlockTone;
  shortLabel: string;
};

export type FlowBuilderManualLayout = {
  lane?: number;
  depth?: number;
  nextPosition?: number;
  branchParentPosition?: number;
  branchSide?: "left" | "right";
};

export const MAX_CONDITION_BRANCHES = 8;

const defaultTriggerDraft: FlowTriggerDraft = {
  mode: "contains",
  value: "",
};

export const emptyConditionKeywordDraft: ConditionKeywordDraft = {
  simpleKeyword: "",
  simpleNextPosition: "",
  defaultNextPosition: "",
  fallbackNextPosition: "",
  branches: [],
};

export const flowBuilderBlockTypeOptions: FlowBlock["type"][] = [
  "start",
  "send_message",
  "send_template",
  "send_media",
  "wait_for_reply",
  "condition_keyword",
  "ai_decision",
  "handoff_human",
  "end",
];

export const flowBuilderBlockTypeMeta: Record<FlowBuilderBlockDraft["type"] | "virtual_start", BlockTypeMeta> = {
  virtual_start: { label: "Inicio", shortLabel: "Inicio", tone: "start" },
  start: { label: "Inicio", shortLabel: "Inicio", tone: "start" },
  message: { label: "Mensagem antiga", shortLabel: "Mensagem", tone: "action" },
  audio: { label: "Audio antigo", shortLabel: "Audio", tone: "action" },
  wait: { label: "Espera antiga", shortLabel: "Espera", tone: "wait" },
  condition: { label: "Condicao antiga", shortLabel: "Condicao", tone: "decision" },
  human: { label: "Humano antigo", shortLabel: "Humano", tone: "handoff" },
  end: { label: "Finalizar", shortLabel: "Fim", tone: "end" },
  send_message: { label: "Enviar mensagem", shortLabel: "Mensagem", tone: "action" },
  send_template: { label: "Enviar template", shortLabel: "Template", tone: "action" },
  send_media: { label: "Enviar midia", shortLabel: "Midia", tone: "action" },
  wait_for_reply: { label: "Esperar resposta", shortLabel: "Espera", tone: "wait" },
  condition_keyword: { label: "Condicao", shortLabel: "Decisao", tone: "decision" },
  ai_decision: { label: "Decisao IA", shortLabel: "IA", tone: "decision" },
  handoff_human: { label: "Transferir humano", shortLabel: "Humano", tone: "handoff" },
};

const CONDITION_POSITION_KEYS = [
  "next_position",
  "default_next_position",
  "fallback_next_position",
] as const;

function parseObject(value: string | Record<string, unknown> | undefined | null) {
  if (!value) {
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  const parsed = JSON.parse(value);
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
}

function stringifyPosition(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

function stringifyKeywords(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter((keyword): keyword is string => typeof keyword === "string" && keyword.trim().length > 0)
    .join(", ");
}

function createBranchId(index: number) {
  return `branch-${index + 1}`;
}

function createDraftId() {
  return `draft-${Math.random().toString(36).slice(2, 10)}`;
}

function removeUndefinedEntries<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

function parseKeywordsFromConfig(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function stringifyCompactJson(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2);
}

function resolveText(config: Record<string, unknown>, ...fallbacks: unknown[]) {
  const candidates = [config.text, config.caption, ...fallbacks];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

function summarizeKeywords(keywords: string[]) {
  if (keywords.length === 0) {
    return "sem palavras";
  }

  if (keywords.length === 1) {
    return keywords[0];
  }

  return `${keywords[0]} +${keywords.length - 1}`;
}

function describeBranch(branch: Record<string, unknown>) {
  const keywords = parseKeywordsFromConfig(branch.keywords ?? branch.keyword);
  const destination = stringifyPosition(branch.next_position);
  const name = typeof branch.name === "string" && branch.name.trim() ? branch.name.trim() : summarizeKeywords(keywords);
  return destination ? `${name} -> ${destination}` : name;
}

function blockToneForType(type: FlowBlock["type"] | "virtual_start"): FlowBuilderBlockTone {
  return flowBuilderBlockTypeMeta[type]?.tone ?? "action";
}

function flowTypeLabel(type: FlowBlock["type"] | "virtual_start") {
  return flowBuilderBlockTypeMeta[type]?.label ?? type;
}

function patchConditionConfig(
  baseConfig: Record<string, unknown>,
  draft: ConditionKeywordDraft,
) {
  const nextConfig = sanitizeAiDecisionConfig({ ...baseConfig });

  delete nextConfig.keyword;
  delete nextConfig.next_position;
  delete nextConfig.next_block_id;
  delete nextConfig.default_next_position;
  delete nextConfig.default_next_block_id;
  delete nextConfig.fallback_next_position;
  delete nextConfig.branches;

  return {
    ...nextConfig,
    ...buildConditionKeywordConfig(draft),
  };
}

function sanitizeAiDecisionConfig(config: Record<string, unknown>) {
  const nextConfig = { ...config };

  delete nextConfig.ai_min_confidence;
  delete nextConfig.ai_best_effort_enabled;
  delete nextConfig.ai_best_effort_min_confidence;

  return nextConfig;
}

function parseManualLayout(config: Record<string, unknown>): FlowBuilderManualLayout {
  const ui = typeof config.ui === "object" && config.ui !== null && !Array.isArray(config.ui)
    ? config.ui as Record<string, unknown>
    : {};

  return {
    lane: typeof ui.lane === "number" && Number.isFinite(ui.lane) ? ui.lane : undefined,
    depth: typeof ui.depth === "number" && Number.isFinite(ui.depth) ? Math.max(0, ui.depth) : undefined,
    nextPosition: typeof ui.next_position === "number" && Number.isFinite(ui.next_position) ? ui.next_position : undefined,
    branchParentPosition: typeof ui.branch_parent_position === "number" && Number.isFinite(ui.branch_parent_position)
      ? ui.branch_parent_position
      : undefined,
    branchSide: ui.branch_side === "left" || ui.branch_side === "right" ? ui.branch_side : undefined,
  };
}

function writeManualLayout(config: Record<string, unknown>, layout: FlowBuilderManualLayout) {
  const nextUi: Record<string, unknown> = {
    ...(typeof config.ui === "object" && config.ui !== null && !Array.isArray(config.ui) ? config.ui as Record<string, unknown> : {}),
  };

  if (layout.lane === undefined) {
    delete nextUi.lane;
  } else {
    nextUi.lane = layout.lane;
  }

  if (layout.depth === undefined) {
    delete nextUi.depth;
  } else {
    nextUi.depth = Math.max(0, layout.depth);
  }

  if (layout.nextPosition === undefined) {
    delete nextUi.next_position;
  } else {
    nextUi.next_position = layout.nextPosition;
  }

  if (layout.branchParentPosition === undefined) {
    delete nextUi.branch_parent_position;
  } else {
    nextUi.branch_parent_position = layout.branchParentPosition;
  }

  if (layout.branchSide === undefined) {
    delete nextUi.branch_side;
  } else {
    nextUi.branch_side = layout.branchSide;
  }

  if (Object.keys(nextUi).length === 0) {
    const { ui: _ui, ...rest } = config;
    return rest;
  }

  return {
    ...config,
    ui: nextUi,
  };
}

function remapKnownPosition(value: unknown, remapPosition: (value: unknown) => number | undefined) {
  const next = remapPosition(value);
  return next === undefined ? undefined : next;
}

function remapBranchList(
  branches: unknown,
  remapPosition: (value: unknown) => number | undefined,
) {
  if (!Array.isArray(branches)) {
    return undefined;
  }

  const remapped = branches
    .filter((branch): branch is Record<string, unknown> => typeof branch === "object" && branch !== null && !Array.isArray(branch))
    .map((branch) => removeUndefinedEntries({
      ...branch,
      next_position: remapKnownPosition(branch.next_position, remapPosition),
    }))
    .filter((branch) => {
      if (branch.next_position === undefined) {
        return false;
      }

      const keywords = parseKeywordsFromConfig(branch.keywords ?? branch.keyword);
      return keywords.length > 0;
    });

  return remapped.length > 0 ? remapped : undefined;
}

function remapConfigReferences(
  config: Record<string, unknown>,
  remapPosition: (value: unknown) => number | undefined,
) {
  const nextConfig: Record<string, unknown> = {
    ...config,
  };

  for (const key of CONDITION_POSITION_KEYS) {
    const remapped = remapKnownPosition(config[key], remapPosition);
    if (remapped === undefined) {
      delete nextConfig[key];
    } else {
      nextConfig[key] = remapped;
    }
  }

  const ui = typeof config.ui === "object" && config.ui !== null && !Array.isArray(config.ui)
    ? { ...(config.ui as Record<string, unknown>) }
    : undefined;

  if (ui) {
    const remappedUiNextPosition = remapKnownPosition(ui.next_position, remapPosition);
    if (remappedUiNextPosition === undefined) {
      delete ui.next_position;
    } else {
      ui.next_position = remappedUiNextPosition;
    }

    const remappedBranchParentPosition = remapKnownPosition(ui.branch_parent_position, remapPosition);
    if (remappedBranchParentPosition === undefined) {
      delete ui.branch_parent_position;
    } else {
      ui.branch_parent_position = remappedBranchParentPosition;
    }

    nextConfig.ui = Object.keys(ui).length > 0 ? ui : undefined;
    if (nextConfig.ui === undefined) {
      delete nextConfig.ui;
    }
  }

  const remappedBranches = remapBranchList(config.branches, remapPosition);
  if (remappedBranches) {
    nextConfig.branches = remappedBranches;
  } else {
    delete nextConfig.branches;
  }

  return nextConfig;
}

function isSideBranchLayout(layout: FlowBuilderManualLayout) {
  return layout.branchSide !== undefined
    || layout.branchParentPosition !== undefined
    || (layout.lane !== undefined && layout.lane !== 0);
}

function isSameBranchContext(
  parentPosition: number,
  parentLayout: FlowBuilderManualLayout,
  candidateLayout: FlowBuilderManualLayout,
) {
  if (candidateLayout.branchParentPosition !== undefined) {
    return candidateLayout.branchParentPosition === parentPosition;
  }

  if (candidateLayout.branchSide !== undefined) {
    return candidateLayout.branchSide === parentLayout.branchSide;
  }

  if (candidateLayout.lane !== undefined && parentLayout.lane !== undefined) {
    return Math.sign(candidateLayout.lane) === Math.sign(parentLayout.lane);
  }

  return true;
}

function createSequentialEdge(
  fromId: string,
  toId: string,
  tone: FlowBuilderBlockTone,
  label = "proximo",
): FlowBuilderEdge {
  return {
    id: `${fromId}:${toId}:${label}`,
    fromId,
    toId,
    label,
    tone,
    kind: "sequential",
    sourceAnchor: "bottom",
    targetAnchor: "top",
  };
}

function resolveKnownNextPosition(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  return undefined;
}

function preferredDecisionPlacement(branchIndex: number) {
  const rowOffsets = [-1, 1, -2, 2];

  return {
    laneOffset: rowOffsets[branchIndex % rowOffsets.length] ?? 0,
    depthOffset: Math.floor(branchIndex / rowOffsets.length),
  };
}

export function getConditionBranchDisplayName(name: string | undefined, index: number) {
  const normalized = name?.trim();

  if (normalized) {
    return normalized;
  }

  if (index === 0) {
    return "Sim";
  }

  if (index === 1) {
    return "Nao";
  }

  return `Caminho ${index + 1}`;
}

export function parseFlowTrigger(trigger: string): FlowTriggerDraft {
  const normalized = trigger.trim();

  if (!normalized) {
    return defaultTriggerDraft;
  }

  const lower = normalized.toLocaleLowerCase("pt-BR");

  if (lower === "primeira mensagem") {
    return {
      mode: "first_message",
      value: "",
    };
  }

  if (lower.startsWith("palavra-chave:")) {
    return {
      mode: "keyword",
      value: normalized.slice("palavra-chave:".length).trim(),
    };
  }

  if (lower.startsWith("tag:")) {
    return {
      mode: "tag",
      value: normalized.slice("tag:".length).trim(),
    };
  }

  return {
    mode: "contains",
    value: normalized,
  };
}

export function formatFlowTrigger(draft: FlowTriggerDraft) {
  const value = draft.value.trim();

  if (draft.mode === "first_message") {
    return "Primeira mensagem";
  }

  if (draft.mode === "keyword") {
    return value ? `Palavra-chave: ${value}` : "";
  }

  if (draft.mode === "tag") {
    return value ? `Tag: ${value}` : "";
  }

  return value;
}

export function parseConditionKeywordDraft(metadata: string | Record<string, unknown> | undefined | null): ConditionKeywordDraft {
  const config = parseObject(metadata);
  const branches = Array.isArray(config.branches) ? config.branches : [];

  return {
    simpleKeyword: typeof config.keyword === "string" ? config.keyword : "",
    simpleNextPosition: stringifyPosition(config.next_position),
    defaultNextPosition: stringifyPosition(config.default_next_position),
    fallbackNextPosition: stringifyPosition(config.fallback_next_position),
    branches: branches
      .filter((branch): branch is Record<string, unknown> => typeof branch === "object" && branch !== null && !Array.isArray(branch))
      .slice(0, MAX_CONDITION_BRANCHES)
      .map((branch, index) => ({
        id: typeof branch.id === "string" && branch.id.trim() ? branch.id : createBranchId(index),
        name: typeof branch.name === "string" ? branch.name : "",
        keywords: stringifyKeywords(branch.keywords) || (typeof branch.keyword === "string" ? branch.keyword : ""),
        nextPosition: stringifyPosition(branch.next_position),
      })),
  };
}

export function buildConditionKeywordConfig(draft: ConditionKeywordDraft) {
  const branches = draft.branches
    .slice(0, MAX_CONDITION_BRANCHES)
    .map((branch) => {
      const keywords = branch.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);

      return removeUndefinedEntries({
        name: branch.name.trim() || keywords[0] || "ramo",
        keywords,
        next_position: Number(branch.nextPosition) || undefined,
      });
    })
    .filter((branch) => Array.isArray(branch.keywords) && branch.keywords.length > 0 && branch.next_position !== undefined);

  const config: Record<string, unknown> = {};

  if (draft.simpleKeyword.trim()) {
    config.keyword = draft.simpleKeyword.trim();
  }

  if (draft.simpleNextPosition.trim()) {
    config.next_position = Number(draft.simpleNextPosition);
  }

  if (draft.defaultNextPosition.trim()) {
    config.default_next_position = Number(draft.defaultNextPosition);
  }

  if (draft.fallbackNextPosition.trim()) {
    config.fallback_next_position = Number(draft.fallbackNextPosition);
  }

  if (branches.length > 0) {
    config.branches = branches;
  }

  return config;
}

export function replaceConditionKeywordConfig(
  baseConfig: Record<string, unknown>,
  draft: ConditionKeywordDraft,
) {
  return patchConditionConfig(baseConfig, draft);
}

function isDecisionBlockType(type: FlowBlock["type"] | "virtual_start") {
  return type === "condition_keyword" || type === "condition" || type === "ai_decision";
}

export function parseMetadataJson(metadata: string) {
  return parseObject(metadata);
}

export function createEmptyFlowBuilderDraft(): FlowBuilderFlowDraft {
  return {
    name: "",
    status: "rascunho",
    triggerMode: "contains",
    triggerValue: "",
    aiCompanyPrompt: "",
    created: "",
  };
}

export function createEmptyFlowBuilderBlock(
  type: FlowBuilderBlockDraft["type"] = "send_message",
  position = 10,
): FlowBuilderBlockDraft {
  const configByType: Partial<Record<FlowBuilderBlockDraft["type"], Record<string, unknown>>> = {
    start: {},
    send_message: { text: "" },
    send_template: { template_id: undefined, variables: {} },
    send_media: { type: "image", source: "url", url: "", caption: "" },
    wait_for_reply: { reason: "customer_reply" },
    condition_keyword: {},
    ai_decision: {
      objective: "",
      guidance: "",
      handoff_on_uncertain: false,
    },
    handoff_human: { reason: "customer_requested_human" },
    end: { outcome: "completed" },
  };

  return {
    clientId: createDraftId(),
    type,
    title: flowTypeLabel(type),
    description: "",
    position,
    config: { ...(configByType[type] ?? {}) },
  };
}

export function createFlowBuilderDraft(flow: Flow): FlowBuilderFlowDraft {
  const triggerDraft = parseFlowTrigger(flow.trigger);

  return {
    id: flow.id,
    name: flow.name,
    status: flow.status,
    triggerMode: triggerDraft.mode,
    triggerValue: triggerDraft.value,
    aiCompanyPrompt: typeof flow.aiCompanyPrompt === "string" ? flow.aiCompanyPrompt : "",
    created: flow.created,
  };
}

export function createFlowBuilderBlocks(blocks: FlowBlock[]): FlowBuilderBlockDraft[] {
  return blocks
    .map((block, index) => ({
      id: block.id,
      clientId: block.id,
      type: block.type,
      title: block.label,
      description: block.description,
      position: block.order ?? (index + 1) * 10,
      config: block.type === "ai_decision"
        ? sanitizeAiDecisionConfig(parseObject(block.metadata ?? {}))
        : parseObject(block.metadata ?? {}),
    }))
    .sort((left, right) => left.position - right.position || left.clientId.localeCompare(right.clientId));
}

export function createFlowBuilderBlocksFromPayloadBlocks(blocks: FlowBlockPayload[]): FlowBuilderBlockDraft[] {
  return blocks
    .map((block, index) => ({
      clientId: createDraftId(),
      type: block.type,
      title: block.label,
      description: block.description ?? "",
      position: block.position ?? (index + 1) * 10,
      config: block.type === "ai_decision"
        ? sanitizeAiDecisionConfig(parseObject(block.config ?? {}))
        : parseObject(block.config ?? {}),
    }))
    .sort((left, right) => left.position - right.position || left.clientId.localeCompare(right.clientId));
}

export function normalizeFlowBuilderBlocks(blocks: FlowBuilderBlockDraft[]) {
  const sorted = [...blocks].sort((left, right) => left.position - right.position || left.clientId.localeCompare(right.clientId));
  const oldPositionToClientId = new Map(sorted.map((block) => [block.position, block.clientId]));
  const nextPositionByClientId = new Map(sorted.map((block, index) => [block.clientId, (index + 1) * 10]));

  function remapPosition(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
      const targetClientId = oldPositionToClientId.get(value);
      return targetClientId ? nextPositionByClientId.get(targetClientId) : undefined;
    }

    if (typeof value === "string" && value.trim()) {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        return remapPosition(numericValue);
      }
    }

    return undefined;
  }

  return sorted.map((block) => ({
    ...block,
    position: nextPositionByClientId.get(block.clientId) ?? block.position,
    config: remapConfigReferences(block.config, remapPosition),
  }));
}

export function getFlowBlockSummary(block: Pick<FlowBuilderBlockDraft, "type" | "title" | "description" | "position" | "config"> | FlowBlock) {
  const config = parseObject("config" in block ? block.config : block.metadata ?? {});

  switch (block.type) {
    case "start":
      return "Dispara o inicio do fluxo visual.";
    case "send_message": {
      const text = resolveText(config, "description" in block ? block.description : block.description);
      return text || "Mensagem de texto ainda nao configurada.";
    }
    case "send_template": {
      const templateId = config.template_id;
      return templateId ? `Template #${templateId}` : "Template ainda nao selecionado.";
    }
    case "send_media": {
      const mediaType = typeof config.type === "string" ? config.type : "midia";
      const source = typeof config.source === "string" ? config.source : "origem indefinida";
      return `${mediaType} via ${source}`;
    }
    case "wait":
    case "wait_for_reply": {
      const timeout = stringifyPosition(config.timeout_minutes);
      const keywords = parseKeywordsFromConfig(config.expected_keywords);
      const reason = typeof config.reason === "string" ? config.reason : "customer_reply";

      if (timeout) {
        return `Aguardando resposta por ${timeout} min (${reason})`;
      }

      if (keywords.length > 0) {
        return `Aguardando resposta com ${summarizeKeywords(keywords)}`;
      }

      return `Aguardando resposta (${reason})`;
    }
    case "condition":
    case "condition_keyword": {
      const branches = Array.isArray(config.branches)
        ? config.branches
            .filter((branch): branch is Record<string, unknown> => typeof branch === "object" && branch !== null && !Array.isArray(branch))
            .map(describeBranch)
        : [];

      const fallback = stringifyPosition(config.default_next_position ?? config.fallback_next_position);
      const simpleKeyword = typeof config.keyword === "string" ? config.keyword : "";

      if (branches.length > 0) {
        return `${branches.length} caminhos${fallback ? ` + fallback ${fallback}` : ""}`;
      }

      if (simpleKeyword) {
        return `Se responder "${simpleKeyword}" segue para ${stringifyPosition(config.next_position) || "destino indefinido"}`;
      }

      return "Decisao por palavra-chave ainda sem caminhos definidos.";
    }
    case "ai_decision": {
      const branches = Array.isArray(config.branches)
        ? config.branches
            .filter((branch): branch is Record<string, unknown> => typeof branch === "object" && branch !== null && !Array.isArray(branch))
            .map(describeBranch)
        : [];
      const fallback = stringifyPosition(config.default_next_position ?? config.fallback_next_position);
      const objective = typeof config.objective === "string" ? config.objective.trim() : "";

      if (branches.length > 0) {
        return `${branches.length} caminhos IA${fallback ? ` + fallback ${fallback}` : ""}`;
      }

      if (objective) {
        return `IA decide com base em: ${objective}`;
      }

      return "Decisao autonoma ainda sem caminhos definidos.";
    }
    case "human":
    case "handoff_human": {
      const department = typeof config.department === "string" ? config.department : "";
      const reason = typeof config.reason === "string" ? config.reason : "handoff";
      return department ? `${reason} -> ${department}` : reason;
    }
    case "end": {
      const outcome = typeof config.outcome === "string" ? config.outcome : typeof config.result === "string" ? config.result : "completed";
      return `Finaliza com resultado ${outcome}`;
    }
    default:
      return ("description" in block ? block.description : block.description) || "Sem resumo configurado.";
  }
}

export function buildFlowPayloadFromDraft(
  flowDraft: FlowBuilderFlowDraft,
  blocks: FlowBuilderBlockDraft[],
): FlowPayload {
  const normalizedBlocks = normalizeFlowBuilderBlocks(blocks);

  return {
    name: flowDraft.name.trim(),
    status: flowDraft.status,
    trigger: formatFlowTrigger({
      mode: flowDraft.triggerMode,
      value: flowDraft.triggerValue,
    }),
    ai_company_prompt: (flowDraft.aiCompanyPrompt ?? "").trim(),
    blocks: normalizedBlocks.map((block) => blockDraftToPayload(block)),
  };
}

export function blockDraftToPayload(block: FlowBuilderBlockDraft): FlowBlockPayload {
  return {
    type: block.type,
    label: block.title.trim() || flowTypeLabel(block.type),
    description: block.description.trim(),
    position: block.position,
    config: block.type === "ai_decision"
      ? sanitizeAiDecisionConfig(parseObject(block.config))
      : parseObject(block.config),
  };
}

export function stringifyFlowBlockConfig(config: Record<string, unknown>) {
  return stringifyCompactJson(config);
}

export function getFlowBuilderManualLayout(block: Pick<FlowBuilderBlockDraft, "config">) {
  return parseManualLayout(parseObject(block.config));
}

export function applyFlowBuilderManualLayout(
  block: FlowBuilderBlockDraft,
  layout: FlowBuilderManualLayout,
): FlowBuilderBlockDraft {
  return {
    ...block,
    config: writeManualLayout(parseObject(block.config), layout),
  };
}

function collectOutgoingLinks(
  block: FlowBuilderBlockDraft,
  index: number,
  sortedBlocks: FlowBuilderBlockDraft[],
  idByPosition: Map<number, string>,
  siblingChildrenByParent: Map<string, string[]>,
  siblingParentByChild: Map<string, string>,
): FlowBuilderLink[] {
  const nextSequential = sortedBlocks[index + 1];
  const config = parseObject(block.config);
  const siblingChildren = siblingChildrenByParent.get(block.clientId);
  const manualLayout = parseManualLayout(config);
  const isManualSideBranch = isSideBranchLayout(manualLayout);

  if (siblingChildren && siblingChildren.length > 0) {
    return siblingChildren.map((targetId, branchIndex) => ({
      targetId,
      relationship: "branch",
      branchIndex,
    }));
  }

  if (manualLayout.nextPosition !== undefined) {
    const targetId = idByPosition.get(manualLayout.nextPosition);
    if (targetId) {
      return [{
        targetId,
        relationship: "sequential",
      }];
    }
  }

  const explicitNextPosition = resolveKnownNextPosition(config.next_position);
  if (explicitNextPosition !== undefined && !isDecisionBlockType(block.type)) {
    const targetId = idByPosition.get(explicitNextPosition);
    if (targetId) {
      return [{
        targetId,
        relationship: "sequential",
      }];
    }
  }

  if (block.type === "end" || block.type === "handoff_human" || block.type === "human") {
    return [];
  }

  if (isDecisionBlockType(block.type)) {
    const links: FlowBuilderLink[] = [];
    const branches = Array.isArray(config.branches)
      ? config.branches.filter((branch): branch is Record<string, unknown> => typeof branch === "object" && branch !== null && !Array.isArray(branch))
      : [];

    branches.forEach((branch, branchIndex) => {
      const targetId = idByPosition.get(Number(branch.next_position));
      if (!targetId) {
        return;
      }

      links.push({
        targetId,
        relationship: "decision",
        branchIndex,
      });
    });

    if (typeof config.keyword === "string" && config.keyword.trim()) {
      const targetId = idByPosition.get(Number(config.next_position));
      if (targetId) {
        links.push({
          targetId,
          relationship: "decision",
          branchIndex: 0,
        });
      }
    }

    [
      config.default_next_position,
      config.fallback_next_position,
    ].forEach((targetPosition) => {
      const targetId = idByPosition.get(Number(targetPosition));
      if (!targetId) {
        return;
      }

      links.push({
        targetId,
        relationship: "fallback",
      });
    });

    if (links.length === 0 && nextSequential && !siblingParentByChild.has(block.clientId) && !isManualSideBranch) {
      links.push({
        targetId: nextSequential.clientId,
        relationship: "sequential",
      });
    }

    return links;
  }

  if (!nextSequential) {
    return [];
  }

  if (isManualSideBranch) {
    return [];
  }

  return [{
    targetId: nextSequential.clientId,
    relationship: "sequential",
  }];
}

export function buildFlowBuilderChart(blocks: FlowBuilderBlockDraft[]): FlowBuilderChart {
  const normalizedBlocks = normalizeFlowBuilderBlocks(blocks);
  const sortedBlocks = [...normalizedBlocks].sort((left, right) => left.position - right.position || left.clientId.localeCompare(right.clientId));
  const nodeWidth = 272;
  const nodeHeight = 152;
  const laneGap = 144;
  const rowGap = 72;
  const paddingX = 80;
  const paddingY = 40;

  if (sortedBlocks.length === 0) {
    return {
      nodes: [],
      edges: [],
      width: nodeWidth + paddingX * 2,
      height: nodeHeight + paddingY * 2,
      layout: {
        minLane: 0,
        maxLane: 0,
        nodeWidth,
        nodeHeight,
        laneGap,
        rowGap,
        paddingX,
        paddingY,
        yOffset: 0,
      },
    };
  }

  const idByPosition = new Map(sortedBlocks.map((block) => [block.position, block.clientId]));
  const lanes = new Map<string, number>();
  const depths = new Map<string, number>();
  const firstBlock = sortedBlocks[0];
  const hasExplicitStart = sortedBlocks.some((block) => block.type === "start");
  const outgoingLinksById = new Map<string, FlowBuilderLink[]>();
  const siblingChildrenByParent = new Map<string, string[]>();
  const siblingParentByChild = new Map<string, string>();

  sortedBlocks.forEach((block) => {
    if (!isDecisionBlockType(block.type)) {
      return;
    }

    const manualLayout = parseManualLayout(block.config);
    if (manualLayout.branchParentPosition === undefined || manualLayout.branchSide === undefined) {
      return;
    }

    const parentId = idByPosition.get(manualLayout.branchParentPosition);
    if (!parentId) {
      return;
    }

    const siblings = siblingChildrenByParent.get(parentId) ?? [];
    siblings[manualLayout.branchSide === "left" ? 0 : 1] = block.clientId;
    siblingChildrenByParent.set(parentId, siblings);
    siblingParentByChild.set(block.clientId, parentId);
  });

  sortedBlocks.forEach((block, index) => {
    if (!["message", "send_message", "send_template", "send_media"].includes(block.type)) {
      return;
    }
    const parentLayout = parseManualLayout(block.config);

    if ((siblingChildrenByParent.get(block.clientId) ?? []).filter(Boolean).length >= 2) {
      return;
    }

    const conditionSiblings: FlowBuilderBlockDraft[] = [];
    for (const candidate of sortedBlocks.slice(index + 1)) {
      const candidateLayout = parseManualLayout(candidate.config);
      if (isDecisionBlockType(candidate.type)) {
        if (isSideBranchLayout(candidateLayout) && !isSameBranchContext(block.position, parentLayout, candidateLayout)) {
          break;
        }
        conditionSiblings.push(candidate);
        if (conditionSiblings.length === 2) {
          break;
        }
        continue;
      }

      break;
    }

    if (conditionSiblings.length < 2) {
      return;
    }

    const siblings = siblingChildrenByParent.get(block.clientId) ?? [];
    conditionSiblings.forEach((candidate, conditionIndex) => {
      if (!siblings[conditionIndex]) {
        siblings[conditionIndex] = candidate.clientId;
      }
      siblingParentByChild.set(candidate.clientId, block.clientId);
    });
    siblingChildrenByParent.set(block.clientId, siblings);
  });

  sortedBlocks.forEach((block, index) => {
    outgoingLinksById.set(
      block.clientId,
      collectOutgoingLinks(block, index, sortedBlocks, idByPosition, siblingChildrenByParent, siblingParentByChild),
    );
  });

  if (firstBlock) {
    lanes.set(firstBlock.clientId, 0);
    depths.set(firstBlock.clientId, 0);
  }

  sortedBlocks.forEach((block) => {
    const manualLayout = parseManualLayout(block.config);
    const lane = manualLayout.lane ?? lanes.get(block.clientId) ?? 0;
    const depth = manualLayout.depth ?? depths.get(block.clientId) ?? 0;
    lanes.set(block.clientId, lane);
    depths.set(block.clientId, depth);

    (outgoingLinksById.get(block.clientId) ?? []).forEach((link) => {
      const branchPlacement = link.relationship === "decision" || link.relationship === "branch"
        ? preferredDecisionPlacement(link.branchIndex ?? 0)
        : { laneOffset: 0, depthOffset: 0 };
      const suggestedLane = link.relationship === "decision" || link.relationship === "branch"
        ? lane + branchPlacement.laneOffset
        : lane;
      const suggestedDepth = depth + 1 + branchPlacement.depthOffset;

      const targetBlock = sortedBlocks.find((item) => item.clientId === link.targetId);
      const targetManualLayout = targetBlock ? parseManualLayout(targetBlock.config) : {};

      if (!lanes.has(link.targetId) && targetManualLayout.lane === undefined) {
        lanes.set(link.targetId, suggestedLane);
      }

      const existingDepth = depths.get(link.targetId);
      if ((existingDepth === undefined || suggestedDepth < existingDepth) && targetManualLayout.depth === undefined) {
        depths.set(link.targetId, suggestedDepth);
      }
    });
  });

  const incomingSuggestions = new Map<string, Array<{ lane: number; depth: number }>>();

  sortedBlocks.forEach((block) => {
    const sourceLane = lanes.get(block.clientId) ?? 0;
    const sourceDepth = depths.get(block.clientId) ?? 0;

    (outgoingLinksById.get(block.clientId) ?? []).forEach((link) => {
      const current = incomingSuggestions.get(link.targetId) ?? [];
      current.push({
        lane: sourceLane,
        depth: sourceDepth,
      });
      incomingSuggestions.set(link.targetId, current);
    });
  });

  sortedBlocks.forEach((block) => {
    const manualLayout = parseManualLayout(block.config);
    const incoming = incomingSuggestions.get(block.clientId) ?? [];

    if (incoming.length < 2) {
      return;
    }

    if (manualLayout.depth === undefined) {
      depths.set(block.clientId, Math.max(...incoming.map((entry) => entry.depth)) + 1);
    }

    if (manualLayout.lane !== undefined) {
      return;
    }

    const uniqueLanes = Array.from(new Set(incoming.map((entry) => entry.lane)));
    if (uniqueLanes.length === 1) {
      lanes.set(block.clientId, uniqueLanes[0]);
      return;
    }

    const hasLeft = uniqueLanes.some((lane) => lane < 0);
    const hasRight = uniqueLanes.some((lane) => lane > 0);

    if (hasLeft && hasRight) {
      lanes.set(block.clientId, 0);
      return;
    }

    const averageLane = uniqueLanes.reduce((total, lane) => total + lane, 0) / uniqueLanes.length;
    lanes.set(block.clientId, Math.round(averageLane));
  });

  sortedBlocks.forEach((block, index) => {
    if (!depths.has(block.clientId)) {
      depths.set(block.clientId, index);
    }
    if (!lanes.has(block.clientId)) {
      lanes.set(block.clientId, 0);
    }
  });

  const laneValues = Array.from(lanes.values());
  const minLane = Math.min(...laneValues);
  const maxLane = Math.max(...laneValues);
  const totalColumns = maxLane - minLane + 1;
  const chartWidth = totalColumns * nodeWidth + (totalColumns - 1) * laneGap + paddingX * 2;
  const maxDepth = Math.max(...Array.from(depths.values()));
  const chartHeight = (maxDepth + 1) * nodeHeight + maxDepth * rowGap + paddingY * 2 + (!hasExplicitStart ? nodeHeight : 0);
  const yOffset = !hasExplicitStart ? nodeHeight : 0;

  const nodes = sortedBlocks.map((block) => {
    const lane = (lanes.get(block.clientId) ?? 0) - minLane;
    const depth = depths.get(block.clientId) ?? 0;

    return {
      id: block.clientId,
      clientId: block.clientId,
      blockId: block.id,
      type: block.type,
      title: block.title || flowTypeLabel(block.type),
      description: block.description,
      summary: getFlowBlockSummary(block),
      position: block.position,
      tone: blockToneForType(block.type),
      lane: lanes.get(block.clientId) ?? 0,
      x: paddingX + lane * (nodeWidth + laneGap),
      y: paddingY + yOffset + depth * (nodeHeight + rowGap),
      depth,
    } satisfies FlowBuilderNode;
  });

  const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
  const edges: FlowBuilderEdge[] = [];

  if (!hasExplicitStart && firstBlock) {
    const firstNode = nodeLookup.get(firstBlock.clientId);
    if (firstNode) {
      const virtualStartId = "virtual-start";
      nodes.unshift({
        id: virtualStartId,
        type: "virtual_start",
        title: "Inicio",
        description: "Entrada do fluxo",
        summary: "Primeiro ponto de entrada para este fluxo.",
        position: 0,
        tone: "start",
        lane: firstNode.lane,
        x: firstNode.x,
        y: paddingY,
        depth: 0,
        isVirtual: true,
      });

      edges.push(createSequentialEdge(virtualStartId, firstNode.id, "start", "inicio"));
    }
  }

  sortedBlocks.forEach((block, index) => {
    const fromId = block.clientId;
    const links = outgoingLinksById.get(block.clientId) ?? [];

    links.forEach((link) => {
      if (link.relationship === "sequential") {
        edges.push(createSequentialEdge(fromId, link.targetId, blockToneForType(block.type), isDecisionBlockType(block.type) ? "seguir" : "proximo"));
        return;
      }

      const targetBlock = sortedBlocks.find((item) => item.clientId === link.targetId);
      const targetLane = lanes.get(link.targetId) ?? 0;
      const sourceLane = lanes.get(fromId) ?? 0;
      const config = parseObject(block.config);
      const branch = link.relationship === "decision" && link.branchIndex !== undefined && Array.isArray(config.branches)
        ? config.branches[link.branchIndex]
        : undefined;
      const keywords = branch && typeof branch === "object" && branch !== null && !Array.isArray(branch)
        ? parseKeywordsFromConfig((branch as Record<string, unknown>).keywords ?? (branch as Record<string, unknown>).keyword)
        : [];

      edges.push({
        id: `${fromId}:${link.targetId}:${link.relationship}-${link.branchIndex ?? "default"}-${index}`,
        fromId,
        toId: link.targetId,
        label: link.relationship === "decision"
          ? getConditionBranchDisplayName(
              branch && typeof branch === "object" && branch !== null && !Array.isArray(branch) && typeof (branch as Record<string, unknown>).name === "string"
                ? (branch as Record<string, unknown>).name as string
                : summarizeKeywords(keywords),
              link.branchIndex ?? 0,
            )
          : link.relationship === "branch"
            ? link.branchIndex === 0 ? "ramo esquerdo" : "ramo direito"
          : targetBlock?.position ? `fallback ${targetBlock.position}` : "fallback",
        tone: link.relationship === "branch" ? blockToneForType(block.type) : "decision",
        kind: link.relationship === "branch" ? "decision" : link.relationship,
        sourceAnchor: link.relationship === "decision" || link.relationship === "branch"
          ? link.branchIndex === 0
            ? "left"
            : link.branchIndex === 1
              ? "right"
              : "bottom"
          : "bottom",
        targetAnchor: link.relationship === "decision" || link.relationship === "branch"
          ? targetLane < sourceLane
            ? "right"
            : targetLane > sourceLane
              ? "left"
              : "top"
          : "top",
      });
    });
  });

  return {
    nodes,
    edges,
    width: chartWidth,
    height: chartHeight,
    layout: {
      minLane,
      maxLane,
      nodeWidth,
      nodeHeight,
      laneGap,
      rowGap,
      paddingX,
      paddingY,
      yOffset,
    },
  };
}

export function getConditionBranchOptions(block: FlowBuilderBlockDraft) {
  const config = parseObject(block.config);
  const branches = Array.isArray(config.branches)
    ? config.branches
        .filter((branch): branch is Record<string, unknown> => typeof branch === "object" && branch !== null && !Array.isArray(branch))
        .slice(0, MAX_CONDITION_BRANCHES)
    : [];

  return {
    branches: branches.map((branch, index) => ({
      id: typeof branch.id === "string" ? branch.id : createBranchId(index),
      label: `${index === 0 ? "Esquerda" : index === 1 ? "Direita" : `Ramo ${index + 1}`} · ${describeBranch(branch)}`,
      direction: index === 0 ? "left" : index === 1 ? "right" : "down",
    })),
    simpleKeyword: typeof config.keyword === "string" ? config.keyword : "",
    defaultTarget: stringifyPosition(config.default_next_position),
    fallbackTarget: stringifyPosition(config.fallback_next_position),
  };
}
