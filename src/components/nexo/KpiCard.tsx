import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "info" | "warning" | "success";
}

const toneMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "primary" }: KpiCardProps) {
  const isNegative = delta?.startsWith("-");
  return (
    <Card className="group p-5 border-border/60 hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl transition-smooth group-hover:scale-110", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            isNegative ? "text-destructive bg-destructive/10" : "text-success bg-success/10"
          )}>
            {isNegative ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}
