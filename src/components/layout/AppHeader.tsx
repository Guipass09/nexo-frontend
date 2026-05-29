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
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[linear-gradient(90deg,rgba(5,8,22,0.96),rgba(9,17,43,0.94),rgba(17,26,61,0.92))] px-4 shadow-[0_18px_46px_-30px_rgba(5,8,22,0.65)] backdrop-blur-2xl md:px-6">
      <div className="flex h-[4.5rem] items-center gap-3">
      <SidebarTrigger className="shrink-0 rounded-2xl border border-white/10 bg-white/6 text-slate-200 shadow-[0_14px_30px_-24px_rgba(5,8,22,0.7)] hover:border-primary/30 hover:bg-white/10 hover:text-white" />
      <div className="hidden md:flex flex-col leading-tight min-w-0">
        <h1 className="font-display text-base font-semibold tracking-tight text-slate-50 truncate">{meta.title}</h1>
        <p className="text-xs font-medium text-slate-300/78 truncate">{meta.subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300/72" />
          <Input placeholder="Buscar conversas, contatos ou mensagens..." className="nexo-soft-input h-11 w-64 rounded-[1.25rem] pl-9 text-slate-50 placeholder:text-slate-300/52 lg:w-96" />
        </div>
        <Button variant="ghost" size="icon" className="md:hidden rounded-2xl text-slate-200 hover:text-white">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative rounded-2xl border border-white/10 bg-white/6 text-slate-200 shadow-[0_14px_30px_-24px_rgba(5,8,22,0.7)] hover:border-primary/25 hover:bg-white/10 hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse-dot" />
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={openAiAssistant}
          className="hidden lg:inline-flex gap-1.5 rounded-full border-primary/20 bg-[linear-gradient(135deg,rgba(37,99,255,0.16),rgba(124,58,237,0.12))] text-slate-50 shadow-[0_14px_34px_-24px_rgba(37,99,255,0.48)] hover:border-primary/30 hover:bg-[linear-gradient(135deg,rgba(37,99,255,0.22),rgba(124,58,237,0.16))]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Nexo IA
        </Button>
        <div className="hidden lg:flex flex-col items-end leading-tight mr-1">
          <span className="text-sm font-medium text-slate-50">{user?.name ?? "Conta Nexo"}</span>
          <span className="text-[11px] text-slate-300/74">{roleLabel}</span>
        </div>
        <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 shadow-[0_14px_32px_-18px_rgba(37,99,255,0.46)]">
          {user?.avatarUrl ? <AvatarImage src={resolveMediaUrl(user.avatarUrl) ?? undefined} alt={user.name} className="object-cover" /> : null}
          <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </div>
      </div>
    </header>
  );
}
