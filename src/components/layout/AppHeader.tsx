import { Bell, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredAuthUser, subscribeToAuthUserChanges } from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/media-url";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Visão geral do robô de atendimento" },
  "/conversas": { title: "Conversas", subtitle: "Acompanhe atendimentos em tempo real" },
  "/jornada": { title: "Jornada da mensagem", subtitle: "Caminho completo do atendimento" },
  "/fluxos": { title: "Fluxos & Automações", subtitle: "Crie e gerencie automações inteligentes" },
  "/sequencias": { title: "Sequências de mensagens", subtitle: "Monte sequências automatizadas" },
  "/audios": { title: "Sequências de áudio", subtitle: "Organize seus áudios por etapa" },
  "/templates": { title: "Central de templates", subtitle: "Modelos prontos para uso" },
  "/contatos": { title: "Contatos", subtitle: "Base de clientes e leads" },
  "/relatorios": { title: "Relatórios", subtitle: "Métricas e insights do atendimento" },
  "/auditoria": { title: "Auditoria operacional", subtitle: "Rastreamento das ações manuais do painel" },
  "/configuracoes": { title: "Configurações", subtitle: "Ajustes gerais do sistema" },
  "/perfil": { title: "Meu perfil", subtitle: "Suas preferências e dados" },
  "/nexo-bot": { title: "Nexo bot", subtitle: "Ajustes finos e aprendizado do Agent IA" },
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = titles[location.pathname] || { title: "Nexo", subtitle: "" };
  const [user, setUser] = useState(() => getStoredAuthUser());

  useEffect(() => subscribeToAuthUserChanges(setUser), []);

  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NX";
  const roleLabel = user?.role === "admin" ? "Admin" : "Usuario";

  const openAiAssistant = () => {
    navigate("/nexo-bot");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/45 bg-[linear-gradient(90deg,rgba(255,255,255,0.82),rgba(245,247,255,0.72),rgba(255,255,255,0.76))] px-4 shadow-[0_18px_46px_-34px_rgba(5,10,43,0.42)] backdrop-blur-2xl md:px-6">
      <div className="flex h-[4.5rem] items-center gap-3">
      <SidebarTrigger className="shrink-0 rounded-2xl border border-white/60 bg-white/70 shadow-[0_14px_30px_-24px_rgba(5,11,46,0.45)] hover:border-primary/20 hover:bg-primary/10 hover:text-primary" />
      <div className="hidden md:flex flex-col leading-tight min-w-0">
        <h1 className="font-display text-base font-semibold tracking-tight text-slate-950 truncate">{meta.title}</h1>
        <p className="text-xs font-medium text-muted-foreground truncate">{meta.subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar conversas, contatos ou mensagens..." className="nexo-soft-input h-11 w-64 rounded-[1.25rem] pl-9 lg:w-96" />
        </div>
        <Button variant="ghost" size="icon" className="md:hidden rounded-2xl">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative rounded-2xl border border-white/55 bg-white/60 shadow-[0_14px_30px_-24px_rgba(5,11,46,0.4)] hover:border-primary/20 hover:bg-white/80">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse-dot" />
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={openAiAssistant}
          className="hidden lg:inline-flex gap-1.5 rounded-full border-cyan-300/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(237,242,255,0.76))] text-primary shadow-[0_14px_34px_-24px_rgba(37,99,255,0.55)] hover:bg-cyan-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Nexo IA
        </Button>
        <div className="hidden lg:flex flex-col items-end leading-tight mr-1">
          <span className="text-sm font-medium text-slate-950">{user?.name ?? "Conta Nexo"}</span>
          <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
        </div>
        <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/15 shadow-[0_14px_32px_-18px_rgba(13,91,255,0.58)]">
          {user?.avatarUrl ? <AvatarImage src={resolveMediaUrl(user.avatarUrl) ?? undefined} alt={user.name} className="object-cover" /> : null}
          <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </div>
      </div>
    </header>
  );
}
