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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nexo/EmptyState";

const shortcuts = [
  { label: "Ver conversas", icon: MessageSquare, to: "/conversas", tone: "primary" },
  { label: "Ver fluxos", icon: Workflow, to: "/fluxos", tone: "accent" },
  { label: "Ver templates", icon: FileText, to: "/templates", tone: "info" },
  { label: "Ver contatos", icon: Users, to: "/contatos", tone: "warning" },
];

export default function Dashboard() {
  const { data, error, isError, isPending, isFetching } = useDashboardOverview();
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
  const isInitialLoading = isPending && !data;
  const isRefreshing = isFetching && !!data;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {isError && (
        <Card className="nexo-premium-surface border-destructive/30 p-4 text-sm text-destructive">
          Erro ao carregar /dashboard: {getApiErrorMessage(error)}
        </Card>
      )}
      {isRefreshing ? (
        <Card className="nexo-premium-surface p-3 text-xs text-muted-foreground">
          Atualizando dados do painel...
        </Card>
      ) : null}

      <Card className="nexo-premium-surface relative overflow-hidden p-5 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,255,0.12),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(236,72,153,0.1),transparent_22%)]" />
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[1.1rem] gradient-primary flex items-center justify-center shadow-glow shrink-0 ring-1 ring-white/40">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold">{workspaceTitle}</h2>
                <StatusBadge status="ativo" withDot />
              </div>
              <p className="text-sm text-muted-foreground">{workspaceSummary}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 shadow-[0_18px_36px_-28px_rgba(37,99,255,0.4)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Operação</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Visão em tempo real</p>
            </div>
            <div className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 shadow-[0_18px_36px_-28px_rgba(124,58,237,0.35)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fluxos</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Automações alinhadas</p>
            </div>
            <div className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 shadow-[0_18px_36px_-28px_rgba(236,72,153,0.3)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">IA</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Contexto e memória ativos</p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isInitialLoading
          ? Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="nexo-premium-surface h-[132px] p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-20" />
              <Skeleton className="mt-5 h-3 w-full" />
            </Card>
          ))
          : dashboard.kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="nexo-premium-surface p-5 lg:col-span-2">
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
            {isInitialLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
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
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(203,213,225,0.65)", borderRadius: 16, fontSize: 12, boxShadow: "0 18px 44px -30px rgba(5,11,46,0.35)" }} />
                  <Area type="monotone" dataKey="mensagens" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gMsg)" />
                  <Area type="monotone" dataKey="audios" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#gAud)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="nexo-premium-surface p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Funil de atendimento</h3>
            <p className="text-xs text-muted-foreground">Distribuição por etapa</p>
          </div>
          <div className="h-64">
            {isInitialLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.funnelData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(203,213,225,0.65)", borderRadius: 16, fontSize: 12, boxShadow: "0 18px 44px -30px rgba(5,11,46,0.35)" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Shortcuts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="nexo-premium-surface p-5">
          <h3 className="font-semibold mb-4">Atalhos rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            {shortcuts.map((s) => (
              <Link key={s.label} to={s.to} className="group rounded-[1.35rem] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(241,245,255,0.72))] p-4 shadow-[0_18px_40px_-32px_rgba(5,11,46,0.32)] transition-smooth hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_26px_50px_-34px_rgba(37,99,255,0.42)]">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(37,99,255,0.18),rgba(124,58,237,0.16))] text-primary shadow-[0_14px_34px_-24px_rgba(37,99,255,0.65)] transition-smooth group-hover:scale-110">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium text-slate-950">{s.label}</div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="nexo-premium-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Conversas recentes</h3>
            <Link to="/conversas">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">Ver todas <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="space-y-1">
            {isInitialLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-2xl" />
                ))}
              </div>
            ) : dashboard.recentConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Nenhuma conversa encontrada ainda."
                description="Quando seus atendimentos começarem, eles aparecerão aqui. Conecte seu WhatsApp no Perfil para iniciar."
                action={(
                  <Link to="/perfil" className="inline-flex">
                  <Button size="sm" className="gap-2">
                    <Bot className="h-4 w-4" />
                    Conectar WhatsApp
                  </Button>
                </Link>
                )}
              />
            ) : dashboard.recentConversations.slice(0, 5).map((c) => (
              <Link key={c.id} to="/conversas" className="flex items-center gap-3 rounded-[1.1rem] border border-transparent p-3 hover:border-primary/10 hover:bg-white/55 transition-smooth">
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
          <Card className="nexo-premium-surface p-5">
            <h3 className="font-semibold mb-4">Resumo operacional</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/50 bg-white/55 p-3 backdrop-blur">
                <p className="text-xs text-muted-foreground mb-1">Erros</p>
                <p className="text-xl font-bold">{dashboard.auditSummary.errorEvents}</p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/55 p-3 backdrop-blur">
                <p className="text-xs text-muted-foreground mb-1">Falhas envio</p>
                <p className="text-xl font-bold">{dashboard.auditSummary.failedMessages}</p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/55 p-3 backdrop-blur">
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

          <Card className="nexo-premium-surface p-5">
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
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(203,213,225,0.65)", borderRadius: 16, fontSize: 12, boxShadow: "0 18px 44px -30px rgba(5,11,46,0.35)" }} />
                  <Bar dataKey="sent" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="nexo-premium-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Últimos eventos operacionais</h3>
              <Link to="/auditoria">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">Ver auditoria <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
            <div className="space-y-2">
              {dashboard.auditSummary.recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/55 bg-white/55 p-3 backdrop-blur">
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
