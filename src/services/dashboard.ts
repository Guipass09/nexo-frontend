import type { DashboardOverview } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import { hydrateKpiIcons } from "@/services/kpi-icons";

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function getDashboardOverview() {
  const response = normalizeResourceResponse<DashboardOverview>(await apiClient.get<unknown>("/dashboard"));
  const data = response.data ?? ({} as DashboardOverview);
  const auditSummary = data.auditSummary
    ? {
      ...data.auditSummary,
      actionsByOperator: ensureArray(data.auditSummary.actionsByOperator),
      messagesByDay: ensureArray(data.auditSummary.messagesByDay),
      recentEvents: ensureArray(data.auditSummary.recentEvents),
    }
    : null;

  return {
    ...data,
    kpis: hydrateKpiIcons(ensureArray(data.kpis)),
    messagesChart: ensureArray(data.messagesChart),
    funnelData: ensureArray(data.funnelData),
    recentConversations: ensureArray(data.recentConversations),
    auditSummary,
  };
}
