import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { journeyEvents } from "@/data/mocks";
import {
  MessageSquare, Brain, Workflow, Send, Clock, AlertTriangle, CheckCircle2, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  message: MessageSquare,
  ai: Brain,
  flow: Workflow,
  send: Send,
  wait: Clock,
};

const statusMap = {
  ok: { color: "bg-success text-success-foreground border-success", ring: "ring-success/20" },
  warn: { color: "bg-warning text-warning-foreground border-warning", ring: "ring-warning/20" },
  pending: { color: "bg-muted text-muted-foreground border-border", ring: "ring-border" },
  error: { color: "bg-destructive text-destructive-foreground border-destructive", ring: "ring-destructive/20" },
};

export default function Jornada() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="p-5 border-border/60 bg-gradient-to-r from-card to-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Workflow className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h2 className="text-lg font-semibold">Mariana Costa</h2>
                <StatusBadge status="ativo" withDot />
              </div>
              <p className="text-sm text-muted-foreground">Fluxo: Captação Premium · Etapa 2 de 5 · Iniciado às 14:10</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Exportar</Button>
            <Button size="sm" className="gradient-primary text-primary-foreground">Intervir</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 md:p-8 border-border/60">
        <h3 className="font-semibold mb-1">Caminho completo do atendimento</h3>
        <p className="text-xs text-muted-foreground mb-8">Cada evento da jornada do cliente, em tempo real.</p>

        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-border" />
          <div className="space-y-4">
            {journeyEvents.map((e, idx) => {
              const Icon = iconMap[e.type as keyof typeof iconMap] || MessageSquare;
              const s = statusMap[e.status];
              return (
                <div key={e.id} className="relative flex gap-4 group animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className={cn(
                    "relative z-10 h-10 w-10 rounded-full border-2 bg-card flex items-center justify-center shrink-0 ring-4 transition-smooth",
                    s.ring,
                  )}>
                    <Icon className={cn("h-4 w-4", e.status === "ok" ? "text-success" : e.status === "warn" ? "text-warning" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        {e.title}
                        {e.status === "warn" && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        {e.status === "pending" && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                      </h4>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{e.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.description}</p>
                  </div>
                </div>
              );
            })}

            <div className="relative flex gap-4 opacity-60">
              <div className="relative z-10 h-10 w-10 rounded-full border-2 border-dashed border-border bg-card flex items-center justify-center shrink-0">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 pt-2">
                <p className="text-xs text-muted-foreground italic">Aguardando próxima ação do cliente...</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de eventos", value: "10", icon: CheckCircle2 },
          { label: "Mensagens trocadas", value: "7", icon: MessageSquare },
          { label: "Tempo decorrido", value: "22 min", icon: Clock },
          { label: "Etapa atual", value: "2/5", icon: Workflow },
        ].map((s) => (
          <Card key={s.label} className="p-4 border-border/60">
            <s.icon className="h-4 w-4 text-primary mb-2" />
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}