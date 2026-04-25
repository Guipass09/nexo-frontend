import type { ReportsOverview } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import { hydrateKpiIcons } from "@/services/kpi-icons";

export async function listReports() {
  const response = normalizeResourceResponse<ReportsOverview>(await apiClient.get<unknown>("/reports"));

  return {
    ...response.data,
    kpis: hydrateKpiIcons(response.data.kpis),
  };
}
