import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/nexo/KpiCard";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { dashboardKpis, messagesChart, conversations, funnelData } from "@/data/mocks";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import { ArrowRight, MessageSquare, Workflow, FileText, Users, Bot, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const shortcuts = [
  { label: "Nova conversa", icon: MessageSquare, to: "/conversas", tone: "primary" },
  { label: "Criar fluxo", icon: Workflow, to: "/fluxos", tone: "accent" },
  { label: "Novo template", icon: FileText, to: "/templates", tone: "info" },
  { label: "Adicionar contato", icon: Users, to: "/contatos", tone: "warning" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Bot status banner */}
      <Card className="p-5 border-border/60 bg-gradient-to-r from-card via-card to-accent/5 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">Robô Nexo</h2>
                <StatusBadge status="ativo" withDot />
              </div>
              <p className="text-sm text-muted-foreground">Operando há 14 dias · Última atividade há poucos segundos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Ver logs</Button>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5">Pausar robô</Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashboardKpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Volume de mensagens</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Mensagens</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Áudios</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messagesChart}>
                <defs>
                  <linearGradient id="gMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="mensagens" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gMsg)" />
                <Area type="monotone" dataKey="audios" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#gAud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-border/60">
          <div className="mb-4">
            <h3 className="font-semibold">Funil de atendimento</h3>
            <p className="text-xs text-muted-foreground">Distribuição por etapa</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Shortcuts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 border-border/60">
          <h3 className="font-semibold mb-4">Atalhos rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            {shortcuts.map((s) => (
              <Link key={s.label} to={s.to} className="group p-4 rounded-lg border border-border hover:border-primary/40 hover:shadow-md transition-smooth bg-secondary/30">
                <s.icon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-smooth" />
                <div className="text-sm font-medium">{s.label}</div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2 border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Conversas recentes</h3>
            <Link to="/conversas">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">Ver todas <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="space-y-1">
            {conversations.slice(0, 5).map((c) => (
              <Link key={c.id} to="/conversas" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-smooth">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{c.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <StatusBadge status={c.status} className="text-[10px]" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{c.time}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}