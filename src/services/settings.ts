import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import type { AiVocabularyChatResult, AiVocabularyMapping, WhatsAppSettings } from "@/types/domain";

export type UpdateWhatsAppSettingsPayload = {
  phone_number_id?: string;
  business_account_id?: string;
  business_number?: string;
  api_version?: string;
  access_token?: string;
  webhook_verify_token?: string;
  clear_access_token?: boolean;
  clear_webhook_verify_token?: boolean;
};

export async function getWhatsAppSettings() {
  const response = normalizeResourceResponse<WhatsAppSettings>(
    await apiClient.get<unknown>("/settings/whatsapp"),
  );

  return response.data;
}

export async function updateWhatsAppSettings(payload: UpdateWhatsAppSettingsPayload) {
  const response = normalizeResourceResponse<WhatsAppSettings>(
    await apiClient.put<unknown>("/settings/whatsapp", payload),
  );

  return response.data;
}

export async function listAiVocabularyMappings() {
  const response = await apiClient.get<{ data: AiVocabularyMapping[] }>("/ai-vocabulary/mappings");

  return response.data;
}

export async function sendAiVocabularyChatMessage(message: string) {
  const response = await apiClient.post<{ data: AiVocabularyChatResult }>("/ai-vocabulary/chat", { message });

  return response.data;
}
