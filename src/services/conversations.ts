import type { Conversation, ConversationMessage, JourneyEvent, MediaAssetType } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";

export interface ConversationFilters {
  status?: string;
  unread?: "all" | "true" | "false";
  deliveryStatus?: string;
  tag?: string;
  flow?: string;
  search?: string;
}

export type ConversationPayload = {
  contact_id: string;
  status?: Conversation["status"];
  tag?: string;
  flow_name?: string;
  last_message?: string;
};

const statusFilterMap: Record<string, string> = {
  Ativos: "ativo",
  Aguardando: "aguardando",
  Humano: "humano",
  Finalizado: "finalizado",
};

function normalizeStatusFilter(status?: string) {
  if (!status || status === "Todos") {
    return undefined;
  }

  return statusFilterMap[status] ?? status.toLowerCase();
}

export async function listConversations(filters: ConversationFilters = {}) {
  const response = normalizeCollectionResponse<Conversation>(
    await apiClient.get<unknown>("/conversations", {
      query: {
        per_page: 50,
        ...(normalizeStatusFilter(filters.status) ? { status: normalizeStatusFilter(filters.status) } : {}),
        ...(filters.unread && filters.unread !== "all" ? { unread: filters.unread } : {}),
        ...(filters.deliveryStatus ? { delivery_status: filters.deliveryStatus } : {}),
        ...(filters.tag ? { tag: filters.tag } : {}),
        ...(filters.flow ? { flow: filters.flow } : {}),
        ...(filters.search ? { search: filters.search } : {}),
      },
    }),
  );
  return response.data;
}

export async function getConversationById(id: string) {
  const response = normalizeResourceResponse<Conversation | null>(await apiClient.get<unknown>(`/conversations/${id}`));
  return response.data;
}

export async function createConversation(payload: ConversationPayload) {
  const response = normalizeResourceResponse<Conversation>(await apiClient.post<unknown>("/conversations", payload));
  return response.data;
}

export async function deleteConversation(conversationId: string) {
  return apiClient.delete<{ message?: string }>(`/conversations/${conversationId}`);
}

export async function listConversationMessages(conversationId: string) {
  const response = normalizeCollectionResponse<ConversationMessage>(
    await apiClient.get<unknown>(`/conversations/${conversationId}/messages`),
  );
  return response.data;
}

export async function listJourneyEvents(conversationId: string) {
  const response = normalizeCollectionResponse<JourneyEvent>(
    await apiClient.get<unknown>(`/conversations/${conversationId}/journey`),
  );
  return response.data;
}

export async function markConversationAsRead(conversationId: string) {
  return apiClient.post<{ data: { id: string; unread: number } }>(`/conversations/${conversationId}/read`);
}

export async function sendConversationMessage(conversationId: string, text: string) {
  const normalizedText = text.trim();
  const response = await apiClient.post<{ data: ConversationMessage }>(
    `/conversations/${conversationId}/messages`,
    { text: normalizedText },
  );

  return response.data;
}

export async function sendConversationTemplateMessage(
  conversationId: string,
  templateId: string,
  variables?: Record<string, unknown>,
  media?: Record<string, unknown>,
) {
  const response = await apiClient.post<{ data: ConversationMessage }>(
    `/conversations/${conversationId}/template-message`,
    {
      template_id: Number(templateId),
      variables,
      media,
    },
  );

  return response.data;
}

export async function sendConversationMediaMessage(
  conversationId: string,
  media: {
    type: MediaAssetType;
    source: "url" | "id" | "asset";
    url?: string;
    id?: string;
    asset_id?: string | number;
    caption?: string;
    filename?: string;
  },
) {
  const response = await apiClient.post<{ data: ConversationMessage }>(
    `/conversations/${conversationId}/media-message`,
    media,
  );

  return response.data;
}
