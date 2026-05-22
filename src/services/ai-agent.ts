import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import type {
  AiAgentAssistantChatResult,
  AiAgentAssistantWorkspace,
  AiAgentProfile,
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
