import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { audioSequences } from "@/data/mocks";
import { Plus, Play, Upload, Mic, MoreVertical, Clock } from "lucide-react";

export default function Audios() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-2">
          {["Todos", "Apresentação", "Vendas", "Social proof", "Conversão", "Relacionamento"].map((c, i) => (
            <button key={c} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5"><Upload className="h-4 w-4" /> Upload</Button>
          <Button className="gradient-primary text-primary-foreground gap-1.5"><Plus className="h-4 w-4" /> Nova sequência</Button>
        </div>
      </div>

      <Card className="p-5 md:p-6 border-border/60">
        <h3 className="font-semibold mb-1">Sequência: Pitch comercial completo</h3>
        <p className="text-xs text-muted-foreground mb-6">5 áudios em ordem de envio</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {audioSequences.map((a) => (
            <Card key={a.id} className="p-4 border-border/60 hover:shadow-md transition-smooth group">
              <div className="flex items-start gap-3">
                <button className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-smooth shrink-0">
                  <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{a.name}</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1 shrink-0"><MoreVertical className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.duration}</span>
                    <span>·</span>
                    <span>Etapa {a.order}</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-0 gradient-primary rounded-full" />
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    <Mic className="h-2.5 w-2.5" /> {a.category}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <button className="border-2 border-dashed border-border rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-smooth flex flex-col items-center justify-center gap-2 min-h-[120px] text-muted-foreground hover:text-primary">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Adicionar áudio</span>
          </button>
        </div>
      </Card>
    </div>
  );
}