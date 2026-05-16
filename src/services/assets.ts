import { audioSequences } from "@/data/mocks";
import type { AudioSequence, MediaAsset, MediaAssetType, Template } from "@/types/domain";
import { getCollectionWithFallback } from "@/services/shared";
import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse } from "@/lib/api/normalizers";
import type { LaravelPaginationMeta } from "@/types/laravel";

export interface MediaAssetFilters {
  type?: MediaAssetType | "";
  sourceType?: "upload" | "url" | "meta_id" | "";
  status?: "active" | "archived" | "all";
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  unused?: boolean;
  page?: number;
  perPage?: number;
}

export type TemplatePayload = {
  name: string;
  category: string;
  type: Template["type"];
  status: Template["status"];
  content: string;
};

export async function listAudioSequences() {
  const response = await getCollectionWithFallback<AudioSequence>("/audio-sequences", () => audioSequences);
  return response.data;
}

export async function listTemplates() {
  const response = normalizeCollectionResponse<Template>(await apiClient.get<unknown>("/templates"));
  return response.data;
}

export async function syncTemplates() {
  return apiClient.post<{
    data: {
      status: string;
      synced: number;
      created: number;
      updated: number;
      message: string;
    };
  }>("/templates/sync");
}

export async function createTemplate(payload: TemplatePayload) {
  const response = await apiClient.post<{ data: Template }>("/templates", payload);

  return response.data;
}

export async function updateTemplate(templateId: string, payload: TemplatePayload) {
  const response = await apiClient.put<{ data: Template }>(`/templates/${templateId}`, payload);

  return response.data;
}

export async function deleteTemplate(templateId: string) {
  return apiClient.delete<{ message?: string }>(`/templates/${templateId}`);
}

export async function listMediaAssets(type?: MediaAssetType | null) {
  const response = await apiClient.get<{ data: MediaAsset[] }>("/media-assets", {
    query: {
      ...(type ? { type } : {}),
      status: "active",
    },
  });

  return response.data;
}

export async function listMediaAssetLibrary(filters: MediaAssetFilters = {}) {
  return apiClient.get<{
    data: MediaAsset[];
    meta?: LaravelPaginationMeta;
    message?: string;
  }>("/media-assets", {
    query: {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.sourceType ? { source_type: filters.sourceType } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.uploadedBy ? { uploaded_by: filters.uploadedBy } : {}),
      ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
      ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
      ...(filters.unused ? { unused: "true" } : {}),
      page: filters.page ?? 1,
      per_page: filters.perPage ?? 20,
    },
  });
}

export async function getMediaAsset(assetId: string) {
  const response = await apiClient.get<{ data: MediaAsset }>(`/media-assets/${assetId}`);

  return response.data;
}

export async function archiveMediaAsset(assetId: string) {
  const response = await apiClient.post<{ data: MediaAsset }>(`/media-assets/${assetId}/archive`);

  return response.data;
}

export async function restoreMediaAsset(assetId: string) {
  const response = await apiClient.post<{ data: MediaAsset }>(`/media-assets/${assetId}/restore`);

  return response.data;
}

export async function saveMediaAssetToLibrary(assetId: string) {
  const response = await apiClient.post<{ data: MediaAsset }>(`/media-assets/${assetId}/save`);

  return response.data;
}

export async function uploadMediaAsset(type: MediaAssetType, file: File) {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);

  const response = await apiClient.postForm<{
    data: MediaAsset;
    upload: {
      status: "uploaded" | "skipped" | "failed";
      error?: string | null;
      media_id?: string | null;
    };
    message?: string;
  }>("/media-assets/upload", formData);

  return response;
}
