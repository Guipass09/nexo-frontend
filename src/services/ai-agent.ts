import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import type { AiAgentProfile, AiAgentTriggerType, AiAgentVirtualAgent } from "@/types/domain";

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
