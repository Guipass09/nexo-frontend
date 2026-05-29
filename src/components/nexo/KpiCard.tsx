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
  primary: "bg-[linear-gradient(135deg,rgba(37,99,255,0.18),rgba(124,58,237,0.16))] text-primary shadow-[0_14px_36px_-24px_rgba(37,99,255,0.75)]",
  accent: "bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(236,72,153,0.18))] text-violet-700 shadow-[0_14px_36px_-24px_rgba(124,58,237,0.7)]",
  info: "bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(37,99,255,0.16))] text-sky-700 shadow-[0_14px_36px_-24px_rgba(14,165,233,0.7)]",
  warning: "bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(236,72,153,0.15))] text-amber-700 shadow-[0_14px_36px_-24px_rgba(245,158,11,0.65)]",
  success: "bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(37,99,255,0.14))] text-emerald-700 shadow-[0_14px_36px_-24px_rgba(16,185,129,0.65)]",
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "primary" }: KpiCardProps) {
  const isNegative = delta?.startsWith("-");
  return (
    <Card className="group nexo-premium-surface p-5 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_30px_72px_-42px_rgba(37,99,255,0.5)]">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-[1.15rem] ring-1 ring-white/40 transition-smooth group-hover:scale-110", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur",
            isNegative
              ? "border-rose-200/80 bg-rose-50/85 text-rose-700"
              : "border-emerald-200/80 bg-emerald-50/85 text-emerald-700"
          )}>
            {isNegative ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </Card>
  );
}
