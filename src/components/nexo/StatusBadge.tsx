import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  ativo: "bg-success/10 text-success border-success/20",
  pausado: "bg-warning/10 text-warning border-warning/20",
  rascunho: "bg-muted text-muted-foreground border-border",
  finalizado: "bg-info/10 text-info border-info/20",
  aguardando: "bg-warning/10 text-warning border-warning/20",
  humano: "bg-primary/10 text-primary border-primary/20",
  erro: "bg-destructive/10 text-destructive border-destructive/20",
  Lead: "bg-info/10 text-info border-info/20",
  Cliente: "bg-success/10 text-success border-success/20",
  Suporte: "bg-primary/10 text-primary border-primary/20",
  Demonstração: "bg-accent/10 text-accent border-accent/20",
  "Prioridade alta": "bg-destructive/10 text-destructive border-destructive/20",
  "Follow-up": "bg-warning/10 text-warning border-warning/20",
  Agendado: "bg-info/10 text-info border-info/20",
  Financeiro: "bg-accent/10 text-accent border-accent/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  withDot?: boolean;
}

export function StatusBadge({ status, className, withDot }: StatusBadgeProps) {
  const variant = variants[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        variant,
        className,
      )}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />}
      {status}
    </span>
  );
}