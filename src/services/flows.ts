import type { Flow, FlowBlock } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";

export type FlowPayload = {
  name: string;
  status: Flow["status"];
  trigger?: string;
  blocks?: FlowBlockPayload[];
};

export type FlowBlockPayload = {
  type: FlowBlock["type"];
  label: string;
  description?: string;
  position?: number;
  config?: Record<string, unknown>;
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
