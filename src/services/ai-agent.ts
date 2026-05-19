import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import type { AiAgentProfile, AiAgentVirtualAgent } from "@/types/domain";

export type AiAgentPromptPayload = {
  title?: string;
  content: string;
};

export type UpdateAiAgentProfilePayload = {
  enabled: boolean;
  prompts: AiAgentPromptPayload[];
  virtualAgent?: AiAgentVirtualAgent;
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
