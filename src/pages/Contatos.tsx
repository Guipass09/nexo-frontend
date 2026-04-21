import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { contacts } from "@/data/mocks";
import { Plus, Search, Filter, Phone, Download, MoreVertical } from "lucide-react";

export default function Contatos() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone ou tag..." className="pl-9 bg-secondary/40" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5"><Filter className="h-4 w-4" /> Filtros</Button>
          <Button variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> Exportar</Button>
          <Button className="gradient-primary text-primary-foreground gap-1.5"><Plus className="h-4 w-4" /> Novo contato</Button>
        </div>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Origem</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Tags</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Fluxo atual</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Última interação</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-secondary/30 transition-smooth">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.origin}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((t) => <StatusBadge key={t} status={t} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{c.flow}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{c.lastInteraction}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Mostrando 1-8 de 1.247 contatos</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7">Anterior</Button>
            <Button variant="outline" size="sm" className="h-7">Próximo</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}