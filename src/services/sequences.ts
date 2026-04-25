import type { Sequence, SequenceMessage } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";

export type SequencePayload = {
  name: string;
  status: Sequence["status"];
  delay?: string;
  messages?: SequenceMessagePayload[];
};

export type SequenceMessagePayload = {
  order: number;
  text: string;
  delay?: string;
  note?: string;
  type?: SequenceMessage["type"];
};

export async function listSequences() {
  const response = normalizeCollectionResponse<Sequence>(await apiClient.get<unknown>("/sequences"));
  return response.data;
}

export async function listSequenceMessages(sequenceId: string) {
  const response = normalizeCollectionResponse<SequenceMessage>(
    await apiClient.get<unknown>(`/sequences/${sequenceId}/messages`),
  );
  return response.data;
}

export async function createSequence(payload: SequencePayload) {
  const response = normalizeResourceResponse<Sequence>(await apiClient.post<unknown>("/sequences", payload));
  return response.data;
}

export async function updateSequence(sequenceId: string, payload: Partial<SequencePayload>) {
  const response = normalizeResourceResponse<Sequence>(await apiClient.put<unknown>(`/sequences/${sequenceId}`, payload));
  return response.data;
}

export async function deleteSequence(sequenceId: string) {
  return apiClient.delete<{ message?: string }>(`/sequences/${sequenceId}`);
}

export async function createSequenceMessage(sequenceId: string, payload: SequenceMessagePayload) {
  const response = normalizeResourceResponse<SequenceMessage>(
    await apiClient.post<unknown>(`/sequences/${sequenceId}/messages`, payload),
  );
  return response.data;
}

export async function updateSequenceMessage(sequenceId: string, messageId: string, payload: Partial<SequenceMessagePayload>) {
  const response = normalizeResourceResponse<SequenceMessage>(
    await apiClient.put<unknown>(`/sequences/${sequenceId}/messages/${messageId}`, payload),
  );
  return response.data;
}

export async function deleteSequenceMessage(sequenceId: string, messageId: string) {
  return apiClient.delete<{ message?: string }>(`/sequences/${sequenceId}/messages/${messageId}`);
}

export function toSequenceMessagePayload(message: SequenceMessage): SequenceMessagePayload {
  return {
    order: message.order,
    text: message.text,
    delay: message.delay,
    note: message.note,
    type: message.type ?? "text",
  };
}
