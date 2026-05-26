import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import type {
  AiAgentAssistantChatResult,
  AiAgentAssistantWorkspace,
  AiAgentProfile,
  AiAgentQualityMetrics,
  AiAgentSimulationCapturedMessage,
  AiAgentSimulationMediaSuggestion,
  AiAgentSimulationResult,
  AiAgentSimulationSource,
  AiAgentSimulationTurn,
  AiAgentTrainingReport,
  AiAgentTriggerType,
  AiAgentVirtualAgent,
} from "@/types/domain";

export type AiAgentPromptPayload = {
  title?: string;
  content: string;
};

export type UpdateAiAgentProfilePayload = {
  profileId?: string | number | null;
  name?: string;
  enabled: boolean;
  allowSavedContacts?: boolean;
  triggerType?: AiAgentTriggerType;
  triggerKeywords?: string[];
  prompts?: AiAgentPromptPayload[];
  virtualAgent?: AiAgentVirtualAgent;
};

export type CreateAiAgentProfilePayload = {
  name?: string;
  triggerType?: AiAgentTriggerType;
  triggerKeywords?: string[];
};

export type TrainAiAgentPayload = {
  profileId?: string | number | null;
};

export type SimulateAiAgentPayload = {
  profileId?: string | number | null;
  message?: string;
  messages?: string[];
  savedContact?: boolean;
};

export type TrainAiAgentResult = {
  profile: AiAgentProfile;
  report: AiAgentTrainingReport;
  message?: string;
};

export type AiAgentAssistantPayload = {
  profileId?: string | number | null;
  conversationId?: string | number | null;
};

export type AiAgentAssistantChatPayload = {
  profileId?: string | number | null;
  conversationId?: string | number | null;
  messageId?: string | number | null;
  message: string;
};

export type AiAgentAssistantResetPayload = {
  profileId?: string | number | null;
};

export async function getAiAgentProfile() {
  const response = normalizeResourceResponse<AiAgentProfile>(
    await apiClient.get<unknown>("/ai-agent"),
  );

  return response.data;
}

export async function updateAiAgentProfile(payload: UpdateAiAgentProfilePayload) {
  const response = normalizeResourceResponse<AiAgentProfile>(
    await apiClient.put<unknown>("/ai-agent", payload),
  );

  return response.data;
}

export async function createAiAgentProfile(payload: CreateAiAgentProfilePayload = {}) {
  const response = normalizeResourceResponse<AiAgentProfile>(
    await apiClient.post<unknown>("/ai-agent/profiles", payload),
  );

  return response.data;
}

export async function deleteAiAgentProfile(profileId: string | number) {
  const response = normalizeResourceResponse<AiAgentProfile>(
    await apiClient.delete<unknown>(`/ai-agent/profiles/${profileId}`),
  );

  return response.data;
}

export async function trainAiAgent(payload: TrainAiAgentPayload = {}) {
  const response = normalizeResourceResponse<TrainAiAgentResult>(
    await apiClient.post<unknown>("/ai-agent/train", payload),
  );

  return response.data;
}

function toText(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeSimulationSource(value: unknown): AiAgentSimulationSource {
  const source = isRecord(value) ? value : {};

  return {
    topic: toText(source.topic, "knowledge_base"),
    sourceType: toText(source.source_type ?? source.sourceType, "context"),
    sourceLabel: toText(source.source_label ?? source.sourceLabel),
    content: toText(source.content),
  };
}

function normalizeSimulationMedia(value: unknown): AiAgentSimulationMediaSuggestion {
  const media = isRecord(value) ? value : {};

  return {
    source: toText(media.source, "rag"),
    topic: toText(media.topic, "media"),
    assetId: typeof media.asset_id === "number" || typeof media.asset_id === "string" ? media.asset_id : media.assetId as string | number | undefined,
    assetName: toText(media.asset_name ?? media.assetName),
    mediaType: toText(media.media_type ?? media.mediaType),
    sendWhen: toText(media.send_when ?? media.sendWhen, "contextual_offer"),
    guidance: toText(media.guidance),
    canSend: Boolean(media.can_send ?? media.canSend),
  };
}

function normalizeCapturedMessage(value: unknown): AiAgentSimulationCapturedMessage {
  const message = isRecord(value) ? value : {};
  const media = isRecord(message.media) ? message.media : null;

  return {
    type: toText(message.type) === "media" ? "media" : "text",
    text: toText(message.text),
    media: media ? {
      type: toText(media.type, "document"),
      name: toText(media.name),
      caption: toText(media.caption),
    } : null,
  };
}

function normalizeSimulationIntent(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return {
    key: toText(value.key),
    label: toText(value.label),
    messageAct: toText(value.message_act ?? value.messageAct),
    directTopic: toText(value.direct_topic ?? value.directTopic),
    mustAnswerFirst: Boolean(value.must_answer_first ?? value.mustAnswerFirst),
  };
}

function normalizeSimulationStage(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return {
    key: toText(value.key),
    label: toText(value.label),
    goal: toText(value.goal),
    nextAction: toText(value.next_action ?? value.nextAction),
    source: toText(value.source),
  };
}

function normalizeRuleApplied(value: unknown) {
  const rule = isRecord(value) ? value : {};

  return {
    label: toText(rule.label),
    source: toText(rule.source, "execution_plan"),
  };
}

function normalizeRiskDetected(value: unknown) {
  const risk = isRecord(value) ? value : {};

  return {
    code: toText(risk.code),
    level: toText(risk.level, "warning"),
    message: toText(risk.message),
    source: toText(risk.source, "execution_plan"),
  };
}

function normalizeQualityMetrics(value: unknown): AiAgentQualityMetrics | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    overallScore: toNumber(value.overall_score ?? value.overallScore),
    status: toText(value.status, "attention"),
    indicators: Array.isArray(value.indicators)
      ? value.indicators.map((item) => {
        const indicator = isRecord(item) ? item : {};

        return {
          key: toText(indicator.key),
          label: toText(indicator.label),
          score: indicator.score === null || indicator.score === undefined ? null : toNumber(indicator.score),
          status: toText(indicator.status, "attention"),
          applicable: indicator.applicable === undefined ? undefined : Boolean(indicator.applicable),
          evidence: toText(indicator.evidence),
          improvement: toText(indicator.improvement),
        };
      }).filter((item) => item.key !== "")
      : [],
    pointsToImprove: Array.isArray(value.points_to_improve ?? value.pointsToImprove)
      ? toArray(value.points_to_improve ?? value.pointsToImprove).map((item) => toText(item)).filter(Boolean)
      : [],
  };
}

function normalizeSimulationTurn(value: unknown): AiAgentSimulationTurn {
  const turn = isRecord(value) ? value : {};
  const openaiStatus = isRecord(turn.openai_status ?? turn.openaiStatus)
    ? turn.openai_status ?? turn.openaiStatus
    : {};
  const normalizeOpenAiLayer = (layer: string): "ok" | "failed" | "skipped" => {
    const status = toText(openaiStatus[layer]);

    return status === "ok" || status === "failed" ? status : "skipped";
  };

  return {
    incoming: toText(turn.incoming),
    responded: Boolean(turn.responded),
    reply: typeof turn.reply === "string" ? turn.reply : null,
    conversationStage: toText(turn.conversation_stage ?? turn.conversationStage, "conversation"),
    intent: typeof turn.intent === "string" ? turn.intent : null,
    intentDetected: normalizeSimulationIntent(turn.intent_detected ?? turn.intentDetected),
    stageDetected: normalizeSimulationStage(turn.stage_detected ?? turn.stageDetected),
    responseStrategy: typeof (turn.response_strategy ?? turn.responseStrategy) === "string"
      ? toText(turn.response_strategy ?? turn.responseStrategy)
      : null,
    rulesApplied: Array.isArray(turn.rules_applied ?? turn.rulesApplied)
      ? toArray(turn.rules_applied ?? turn.rulesApplied).map(normalizeRuleApplied).filter((item) => item.label !== "")
      : [],
    risksDetected: Array.isArray(turn.risks_detected ?? turn.risksDetected)
      ? toArray(turn.risks_detected ?? turn.risksDetected).map(normalizeRiskDetected).filter((item) => item.code !== "" || item.message !== "")
      : [],
    decisionReason: toText(turn.decision_reason ?? turn.decisionReason),
    score: toNumber(turn.score ?? (isRecord(turn.diagnostics) ? turn.diagnostics.score : undefined)),
    issues: Array.isArray(turn.issues)
      ? turn.issues.map((item) => toText(item)).filter(Boolean)
      : Array.isArray(isRecord(turn.diagnostics) ? turn.diagnostics.issues : undefined)
        ? (turn.diagnostics.issues as unknown[]).map((item) => toText(item)).filter(Boolean)
        : [],
    sourcesUsed: Array.isArray(turn.sources_used ?? turn.sourcesUsed)
      ? toArray(turn.sources_used ?? turn.sourcesUsed).map(normalizeSimulationSource)
      : [],
    mediaSuggestions: Array.isArray(turn.media_suggestions ?? turn.mediaSuggestions)
      ? toArray(turn.media_suggestions ?? turn.mediaSuggestions).map(normalizeSimulationMedia)
      : [],
    capturedMessages: Array.isArray(turn.captured_messages ?? turn.capturedMessages)
      ? toArray(turn.captured_messages ?? turn.capturedMessages).map(normalizeCapturedMessage)
      : [],
    qualityMetrics: normalizeQualityMetrics(turn.quality_metrics ?? turn.qualityMetrics),
    openaiStatus: {
      planner: normalizeOpenAiLayer("planner"),
      composer: normalizeOpenAiLayer("composer"),
      critic: normalizeOpenAiLayer("critic"),
      rewrite: normalizeOpenAiLayer("rewrite"),
      embeddings: normalizeOpenAiLayer("embeddings"),
    },
    openaiErrors: Array.isArray(turn.openai_errors ?? turn.openaiErrors)
      ? toArray(turn.openai_errors ?? turn.openaiErrors).map((item) => {
        const error = isRecord(item) ? item : {};

        return {
          layer: toText(error.layer),
          status: toText(error.status),
          model: toText(error.model),
          latencyMs: toNumber(error.latency_ms ?? error.latencyMs),
          errorType: typeof (error.error_type ?? error.errorType) === "string" ? toText(error.error_type ?? error.errorType) : null,
          error: typeof error.error === "string" ? error.error : null,
          conversationId: error.conversation_id as string | number | null,
          userId: error.user_id as string | number | null,
          requestId: typeof (error.request_id ?? error.requestId) === "string" ? toText(error.request_id ?? error.requestId) : null,
        };
      })
      : [],
    fallbackUsed: Boolean(turn.fallback_used ?? turn.fallbackUsed),
    openaiFailed: Boolean(turn.openai_failed ?? turn.openaiFailed),
  };
}

export async function simulateAiAgent(payload: SimulateAiAgentPayload) {
  const response = normalizeResourceResponse<Record<string, unknown>>(
    await apiClient.post<unknown>("/ai-agent/simulate", payload),
  );
  const data = response.data;
  const summary = isRecord(data.summary) ? data.summary : {};
  const profile = isRecord(data.profile) ? data.profile : undefined;

  return {
    ok: Boolean(data.ok),
    error: typeof data.error === "string" ? data.error : undefined,
    profile: profile ? {
      profileId: profile.profile_id as string | number,
      name: toText(profile.name, "Agent IA"),
      enabled: Boolean(profile.enabled),
      triggerType: toText(profile.trigger_type ?? profile.triggerType),
      promptCount: toNumber(profile.prompt_count ?? profile.promptCount),
      simulatedCompanyName: toText(profile.simulated_company_name ?? profile.simulatedCompanyName),
    } : undefined,
    turns: Array.isArray(data.turns) ? data.turns.map(normalizeSimulationTurn) : [],
    summary: {
      turnCount: toNumber(summary.turn_count ?? summary.turnCount),
      respondedTurns: toNumber(summary.responded_turns ?? summary.respondedTurns),
      averageScore: toNumber(summary.average_score ?? summary.averageScore),
      issues: Array.isArray(summary.issues) ? summary.issues.map((item) => toText(item)).filter(Boolean) : [],
      qualityMetrics: normalizeQualityMetrics(summary.quality_metrics ?? summary.qualityMetrics),
    },
  } satisfies AiAgentSimulationResult;
}

export async function getAiAgentAssistantWorkspace(payload: AiAgentAssistantPayload = {}) {
  const response = normalizeResourceResponse<AiAgentAssistantWorkspace>(
    await apiClient.get<unknown>("/ai-agent/assistant", {
      query: {
        ...(payload.profileId ? { profileId: payload.profileId } : {}),
        ...(payload.conversationId ? { conversationId: payload.conversationId } : {}),
      },
    }),
  );

  return response.data;
}

export async function sendAiAgentAssistantChat(payload: AiAgentAssistantChatPayload) {
  const response = normalizeResourceResponse<AiAgentAssistantChatResult>(
    await apiClient.post<unknown>("/ai-agent/assistant/chat", payload),
  );

  return response.data;
}

export async function resetAiAgentAssistantWorkspace(payload: AiAgentAssistantResetPayload = {}) {
  const response = normalizeResourceResponse<AiAgentAssistantWorkspace>(
    await apiClient.post<unknown>("/ai-agent/assistant/reset", payload),
  );

  return response.data;
}
