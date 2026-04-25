import {
  CheckCircle2,
  MessageSquare,
  Mic,
  Send,
  TrendingUp,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";
import type { DashboardKpi } from "@/types/domain";

type BackendKpi = Omit<DashboardKpi, "icon"> & {
  icon?: DashboardKpi["icon"] | string;
};

const iconMap = {
  "check-circle-2": CheckCircle2,
  "message-square": MessageSquare,
  mic: Mic,
  send: Send,
  "trending-up": TrendingUp,
  "user-cog": UserCog,
  users: Users,
  workflow: Workflow,
} satisfies Record<string, DashboardKpi["icon"]>;

export function hydrateKpiIcons<T extends BackendKpi>(kpis: T[]): DashboardKpi[] {
  return kpis.map((kpi) => ({
    ...kpi,
    icon: typeof kpi.icon === "function" ? kpi.icon : iconMap[kpi.icon ?? "message-square"] ?? MessageSquare,
  }));
}
