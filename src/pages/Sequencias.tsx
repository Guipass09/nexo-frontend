import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { sequences, sequenceMessages } from "@/data/mocks";
import { Plus, Edit, Copy, Power, Clock, MessageSquare, ListOrdered } from "lucide-react";

export default function Sequencias() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-end">
        <Button className="gradient-primary text-primary-foreground gap-1.5"><Plus className="h-4 w-4" /> Nova sequência</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sequences.map((s) => (
          <Card key={s.id} className="p-4 border-border/60 hover:shadow-elegant transition-smooth">
            <div className="flex items-start justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListOrdered className="h-4 w-4 text-primary" />
              </div>
              <StatusBadge status={s.status} />
            </div>
            <h3 className="font-semibold text-sm mb-3 truncate">{s.name}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {s.messages} msgs</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.delay}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 md:p-6 border-border/60">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold">Sequência: Boas-vindas Premium</h3>
            <p className="text-xs text-muted-foreground">5 mensagens · Disparo automático após gatilho</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><Copy className="h-3.5 w-3.5" /> Duplicar</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Power className="h-3.5 w-3.5" /> Pausar</Button>
          </div>
        </div>

        <div className="space-y-3">
          {sequenceMessages.map((m, idx) => (
            <div key={m.order} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md shrink-0">
                  {m.order}
                </div>
                {idx < sequenceMessages.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
              </div>
              <Card className="flex-1 p-4 border-border/60 hover:border-primary/40 transition-smooth">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Atraso: {m.delay}
                  </span>
                  <span className="text-[10px] text-muted-foreground italic">{m.note}</span>
                </div>
                <p className="text-sm leading-relaxed mb-3">{m.text}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><Edit className="h-3 w-3" /> Editar</Button>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full mt-4 border-dashed gap-1.5"><Plus className="h-4 w-4" /> Adicionar mensagem</Button>
      </Card>
    </div>
  );
}