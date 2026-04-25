import { ApiError, apiClient, buildApiUrl } from "@/lib/api/client";
import { normalizeCollectionResponse } from "@/lib/api/normalizers";
import { getAuthToken, handleUnauthorizedSession } from "@/lib/auth";
import type { AuditEvent, AuditEventTypeOption, OperatorOption } from "@/types/domain";
import type { LaravelPaginationMeta } from "@/types/laravel";

export interface AuditFilters {
  operatorId?: string;
  type?: string;
  status?: string;
  deliveryStatus?: string;
  conversationId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface AuditEventsResponse {
  data: AuditEvent[];
  meta?: LaravelPaginationMeta;
}

export async function listOperators() {
  const response = await apiClient.get<unknown>("/operators");
  return normalizeCollectionResponse<OperatorOption>(response).data;
}

export async function listAuditEventTypes(filters: Omit<AuditFilters, "type" | "page" | "perPage"> = {}) {
  const response = await apiClient.get<unknown>("/audit/event-types", {
    query: {
      ...(filters.operatorId ? { operator_id: filters.operatorId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.deliveryStatus ? { delivery_status: filters.deliveryStatus } : {}),
      ...(filters.conversationId ? { conversation_id: filters.conversationId } : {}),
      ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
      ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    },
  });

  return normalizeCollectionResponse<AuditEventTypeOption>(response).data;
}

export async function listAuditEvents(filters: AuditFilters = {}): Promise<AuditEventsResponse> {
  const response = await apiClient.get<unknown>("/audit/events", {
    query: {
      ...(filters.operatorId ? { operator_id: filters.operatorId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.deliveryStatus ? { delivery_status: filters.deliveryStatus } : {}),
      ...(filters.conversationId ? { conversation_id: filters.conversationId } : {}),
      ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
      ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
      page: filters.page ?? 1,
      per_page: filters.perPage ?? 20,
    },
  });

  const normalized = normalizeCollectionResponse<AuditEvent>(response);

  return {
    data: normalized.data,
    meta: normalized.meta,
  };
}

export async function exportAuditEventsCsv(filters: AuditFilters = {}) {
  const token = getAuthToken();
  const response = await fetch(buildApiUrl("/audit/events/export", import.meta.env.VITE_API_BASE_URL ?? "/api", {
    ...(filters.operatorId ? { operator_id: filters.operatorId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.deliveryStatus ? { delivery_status: filters.deliveryStatus } : {}),
    ...(filters.conversationId ? { conversation_id: filters.conversationId } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
  }), {
    headers: {
      Accept: "text/csv",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorizedSession();
      throw new ApiError("Request failed with status 401", 401);
    }

    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return response.blob();
}

export function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}
