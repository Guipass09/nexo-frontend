import type { Flow, FlowBlock } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";

export type FlowPayload = {
  name: string;
  status: Flow["status"];
  trigger?: string;
  ai_company_prompt?: string;
  blocks?: FlowBlockPayload[];
};

export type FlowBlockPayload = {
  type: FlowBlock["type"];
  label: string;
  description?: string;
  position?: number;
  config?: Record<string, unknown>;
};

export type GenerateFlowDraftPayload = {
  prompt: string;
  company_context?: string;
  existing_flow?: {
    name?: string;
    trigger?: string;
    ai_company_prompt?: string;
    blocks?: FlowBlockPayload[];
  };
};

export type GeneratedFlowDraft = {
  name: string;
  status: Flow["status"];
  trigger: string;
  aiCompanyPrompt: string;
  notes: string[];
  blocks: FlowBlockPayload[];
};

export async function listFlows() {
  const response = normalizeCollectionResponse<Flow>(await apiClient.get<unknown>("/flows"));
  return response.data;
}

export async function listFlowBlocks(flowId: string) {
  const response = normalizeCollectionResponse<FlowBlock>(await apiClient.get<unknown>(`/flows/${flowId}/blocks`));
  return response.data;
}

export async function createFlow(payload: FlowPayload) {
  const response = normalizeResourceResponse<Flow>(await apiClient.post<unknown>("/flows", payload));
  return response.data;
}

export async function generateFlowDraft(payload: GenerateFlowDraftPayload) {
  const response = normalizeResourceResponse<{
    name: string;
    status: Flow["status"];
    trigger: string;
    ai_company_prompt?: string;
    notes?: string[];
    blocks?: FlowBlockPayload[];
  }>(await apiClient.post<unknown>("/flows/generate", payload));

  return {
    name: response.data.name,
    status: response.data.status,
    trigger: response.data.trigger,
    aiCompanyPrompt: response.data.ai_company_prompt ?? "",
    notes: Array.isArray(response.data.notes) ? response.data.notes : [],
    blocks: Array.isArray(response.data.blocks) ? response.data.blocks : [],
  } satisfies GeneratedFlowDraft;
}

export async function updateFlow(flowId: string, payload: Partial<FlowPayload>) {
  const response = normalizeResourceResponse<Flow>(await apiClient.put<unknown>(`/flows/${flowId}`, payload));
  return response.data;
}

export async function deleteFlow(flowId: string) {
  return apiClient.delete<{ message?: string }>(`/flows/${flowId}`);
}

export async function createFlowBlock(flowId: string, payload: FlowBlockPayload) {
  const response = normalizeResourceResponse<FlowBlock>(await apiClient.post<unknown>(`/flows/${flowId}/blocks`, payload));
  return response.data;
}

export async function updateFlowBlock(flowId: string, blockId: string, payload: Partial<FlowBlockPayload>) {
  const response = normalizeResourceResponse<FlowBlock>(await apiClient.put<unknown>(`/flows/${flowId}/blocks/${blockId}`, payload));
  return response.data;
}

export async function deleteFlowBlock(flowId: string, blockId: string) {
  return apiClient.delete<{ message?: string }>(`/flows/${flowId}/blocks/${blockId}`);
}

export function toFlowBlockPayload(block: FlowBlock, index: number): FlowBlockPayload {
  return {
    type: block.type,
    label: block.label,
    description: block.description,
    position: block.order ?? index + 1,
    config: block.metadata ?? {},
  };
}
