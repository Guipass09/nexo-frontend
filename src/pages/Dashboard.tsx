import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/nexo/KpiCard";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { useDashboardOverview } from "@/hooks/use-app-data";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import { ArrowRight, MessageSquare, Workflow, FileText, Users, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStoredAuthUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api/client";

const shortcuts = [
  { label: "Ver conversas", icon: MessageSquare, to: "/conversas", tone: "primary" },
  { label: "Ver fluxos", icon: Workflow, to: "/fluxos", tone: "accent" },
  { label: "Ver templates", icon: FileText, to: "/templates", tone: "info" },
  { label: "Ver contatos", icon: Users, to: "/contatos", tone: "warning" },
];

export default function Dashboard() {
  const { data, error, isError } = useDashboardOverview();
  const user = getStoredAuthUser();
  const isAdmin = user?.role === "admin";
  const workspaceTitle = isAdmin ? "Painel administrativo" : "Meu workspace";
  const workspaceSummary = isAdmin
    ? "Visao geral da operacao, automacoes e equipe."
    : "Seu painel pessoal para operar conversas, fluxos, templates e audios.";
  const dashboard = data ?? {
    kpis: [],
    messagesChart: [],
    funnelData: [],
    recentConversations: [],
    auditSummary: null,
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {isError && (
        <Card className="p-4 border-destructive/40 text-sm text-destructive">
          Erro ao carregar /dashboard: {getApiErrorMessage(error)}
        </Card>
      )}

      {/* Bot status banner */}
      <Card className="p-5 border-border/60 bg-gradient-to-r from-card via-card to-accent/5 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">{workspaceTitle}</h2>
                <StatusBadge status="ativo" withDot />
              </div>
              <p className="text-sm text-muted-foreground">{workspaceSummary}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashboard.kpis.map((k) => <KpiCard key={k.label} {...k} />)}
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
              <AreaChart data={dashboard.messagesChart}>
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
              <BarChart data={dashboard.funnelData} layout="vertical" margin={{ left: 0 }}>
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
            {dashboard.recentConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-6 text-center">
                <p className="text-sm font-medium">Nenhuma conversa ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conecte seu WhatsApp no Perfil para comecar a receber mensagens neste painel.
                </p>
                <Link to="/perfil" className="mt-4 inline-flex">
                  <Button size="sm" className="gap-2">
                    <Bot className="h-4 w-4" />
                    Conectar WhatsApp
                  </Button>
                </Link>
              </div>
            ) : dashboard.recentConversations.slice(0, 5).map((c) => (
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

      {isAdmin && dashboard.auditSummary && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="p-5 border-border/60">
            <h3 className="font-semibold mb-4">Resumo operacional</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Erros</p>
                <p className="text-xl font-bold">{dashboard.auditSummary.errorEvents}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Falhas envio</p>
                <p className="text-xl font-bold">{dashboard.auditSummary.failedMessages}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Manuais hoje</p>
                <p className="text-xl font-bold">{dashboard.auditSummary.manualMessagesToday}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-3">Ações por operador</h4>
              <div className="space-y-2">
                {dashboard.auditSummary.actionsByOperator.map((item) => (
                  <div key={item.operatorName} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.operatorName}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5 border-border/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Mensagens manuais</h3>
                <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              </div>
              <Link to="/auditoria">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">Auditoria <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.auditSummary.messagesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="sent" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 border-border/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Últimos eventos operacionais</h3>
              <Link to="/auditoria">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">Ver auditoria <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
            <div className="space-y-2">
              {dashboard.auditSummary.recentEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <StatusBadge status={event.status} className="text-[10px] py-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">{event.operatorName} · {event.contactName}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{event.type} · {event.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
