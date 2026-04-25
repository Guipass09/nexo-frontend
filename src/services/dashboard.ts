import type { DashboardOverview } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import { hydrateKpiIcons } from "@/services/kpi-icons";

export async function getDashboardOverview() {
  const response = normalizeResourceResponse<DashboardOverview>(await apiClient.get<unknown>("/dashboard"));

  return {
    ...response.data,
    kpis: hydrateKpiIcons(response.data.kpis),
  };
}
