import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/nexo/KpiCard";
import { messagesChart, reportData } from "@/data/mocks";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
} from "recharts";
import { Send, Mic, MessageSquare, CheckCircle2, UserCog, Calendar, Download } from "lucide-react";

export default function Relatorios() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-1.5 bg-secondary/40 p-1 rounded-lg w-fit">
          {["Hoje", "7 dias", "30 dias", "Mês"].map((p, i) => (
            <button key={p} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-smooth ${i === 1 ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5"><Calendar className="h-4 w-4" /> Período</Button>
          <Button className="gradient-primary text-primary-foreground gap-1.5"><Download className="h-4 w-4" /> Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Mensagens enviadas" value="34.5k" delta="+18%" icon={Send} tone="primary" />
        <KpiCard label="Áudios enviados" value="2.847" delta="+12%" icon={Mic} tone="warning" />
        <KpiCard label="Conversas abertas" value="1.284" delta="+9%" icon={MessageSquare} tone="info" />
        <KpiCard label="Taxa de conclusão" value="78%" delta="+3.2%" icon={CheckCircle2} tone="success" />
        <KpiCard label="Transf. humano" value="14%" delta="-2.1%" icon={UserCog} tone="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 border-border/60">
          <h3 className="font-semibold mb-1">Volume diário</h3>
          <p className="text-xs text-muted-foreground mb-4">Mensagens vs áudios</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messagesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="mensagens" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="audios" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-border/60">
          <h3 className="font-semibold mb-1">Pico de atendimento</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribuição por horário</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="atendimentos" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: "hsl(var(--accent))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5 border-border/60">
        <h3 className="font-semibold mb-4">Fluxos mais utilizados</h3>
        <div className="space-y-3">
          {reportData.topFlows.map((f, i) => {
            const max = reportData.topFlows[0].uses;
            const pct = (f.uses / max) * 100;
            return (
              <div key={f.name} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.uses.toLocaleString()} usos</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full transition-smooth" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}