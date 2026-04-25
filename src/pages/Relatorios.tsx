import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/nexo/KpiCard";
import { useReports } from "@/hooks/use-app-data";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line,
} from "recharts";
import { Calendar, Download } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/client";

export default function Relatorios() {
  const { data, error, isError } = useReports();
  const reports = data ?? {
    hourly: [],
    topFlows: [],
    messagesChart: [],
    kpis: [],
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {isError && (
        <Card className="p-4 border-destructive/40 text-sm text-destructive">
          Erro ao carregar /reports: {getApiErrorMessage(error)}
        </Card>
      )}

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
        {reports.kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 border-border/60">
          <h3 className="font-semibold mb-1">Volume diário</h3>
          <p className="text-xs text-muted-foreground mb-4">Mensagens vs áudios</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports.messagesChart}>
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
              <LineChart data={reports.hourly}>
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
          {reports.topFlows.map((f, i) => {
            const max = reports.topFlows[0]?.uses ?? 1;
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
