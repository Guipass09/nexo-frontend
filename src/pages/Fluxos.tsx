import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { flows, flowBlocks } from "@/data/mocks";
import {
  Plus, Play, Pause, Copy, Trash2, Edit, Search, Workflow,
  MessageSquare, Mic, Clock, GitBranch, UserCog, CheckCircle2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const blockIcons: Record<string, React.ElementType> = {
  start: Zap, message: MessageSquare, audio: Mic, wait: Clock,
  condition: GitBranch, human: UserCog, end: CheckCircle2,
};
const blockTones: Record<string, string> = {
  start: "bg-accent/10 text-accent border-accent/30",
  message: "bg-primary/10 text-primary border-primary/30",
  audio: "bg-warning/10 text-warning border-warning/30",
  wait: "bg-muted text-muted-foreground border-border",
  condition: "bg-info/10 text-info border-info/30",
  human: "bg-destructive/10 text-destructive border-destructive/30",
  end: "bg-success/10 text-success border-success/30",
};

export default function Fluxos() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar fluxo..." className="pl-9 bg-secondary/40" />
        </div>
        <Button className="gradient-primary text-primary-foreground gap-1.5"><Plus className="h-4 w-4" /> Novo fluxo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flows.map((f) => (
          <Card key={f.id} className="p-5 border-border/60 hover:shadow-elegant transition-smooth group">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Workflow className="h-5 w-5 text-primary" />
              </div>
              <StatusBadge status={f.status} withDot={f.status === "ativo"} />
            </div>
            <h3 className="font-semibold mb-1 truncate">{f.name}</h3>
            <p className="text-xs text-muted-foreground mb-4 truncate">Gatilho: {f.trigger}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 pb-4 border-b border-border/60">
              <span>{f.steps} etapas</span>
              <span>·</span>
              <span>Criado em {f.created}</span>
            </div>
            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-smooth">
              <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs"><Edit className="h-3 w-3" /> Editar</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {f.status === "ativo" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Visual editor preview */}
      <Card className="p-5 md:p-6 border-border/60">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">Editor visual de fluxo</h3>
          <Button variant="outline" size="sm">Abrir editor completo</Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Visualize a estrutura do fluxo "Captação Premium"</p>

        <div className="overflow-x-auto scrollbar-thin pb-3">
          <div className="flex items-center gap-3 min-w-max">
            {flowBlocks.map((b, i) => {
              const Icon = blockIcons[b.type];
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-48 p-3 rounded-xl border-2 bg-card hover:shadow-md transition-smooth cursor-pointer",
                    blockTones[b.type],
                  )}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-semibold">{b.label}</span>
                    </div>
                    <p className="text-[11px] opacity-80 line-clamp-2">{b.description}</p>
                  </div>
                  {i < flowBlocks.length - 1 && (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <div className="h-px w-6 bg-border" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}