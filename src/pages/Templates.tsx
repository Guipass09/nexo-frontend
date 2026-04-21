import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { templates } from "@/data/mocks";
import { Plus, Search, Eye, Edit, FileText, Mic } from "lucide-react";

export default function Templates() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar template..." className="pl-9 bg-secondary/40" />
        </div>
        <Button className="gradient-primary text-primary-foreground gap-1.5"><Plus className="h-4 w-4" /> Novo template</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {["Todas", "Saudação", "Apresentação", "Valores", "Suporte", "Follow-up", "Encerramento", "Vendas"].map((c, i) => (
          <button key={c} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-smooth ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((t) => {
          const Icon = t.type === "Áudio" ? Mic : FileText;
          return (
            <Card key={t.id} className="p-5 border-border/60 hover:shadow-elegant transition-smooth group">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${t.type === "Áudio" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <StatusBadge status={t.status} />
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate">{t.name}</h3>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{t.category}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">{t.text}</p>
              <div className="flex gap-1 pt-3 border-t border-border/60">
                <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs"><Eye className="h-3 w-3" /> Visualizar</Button>
                <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs"><Edit className="h-3 w-3" /> Editar</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}