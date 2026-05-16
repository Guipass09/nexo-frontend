import { Bell, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "react-router-dom";
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
};

export function AppHeader() {
  const location = useLocation();
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

  return (
    <header className="sticky top-0 z-30 glass border-b border-border h-16 flex items-center gap-3 px-4 md:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="hidden md:flex flex-col leading-tight min-w-0">
        <h1 className="text-base font-semibold tracking-tight truncate">{meta.title}</h1>
        <p className="text-xs text-muted-foreground truncate">{meta.subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar conversas, contatos..." className="pl-9 w-64 lg:w-80 bg-secondary/50 border-border" />
        </div>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse-dot" />
        </Button>
        <Button variant="outline" size="sm" className="hidden lg:inline-flex gap-1.5 border-accent/30 text-accent hover:bg-accent/10 hover:text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          Nexo IA
        </Button>
        <div className="hidden lg:flex flex-col items-end leading-tight mr-1">
          <span className="text-sm font-medium">{user?.name ?? "Conta Nexo"}</span>
          <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
        </div>
        <Avatar className="h-9 w-9 ring-2 ring-border cursor-pointer">
          {user?.avatarUrl ? <AvatarImage src={resolveMediaUrl(user.avatarUrl) ?? undefined} alt={user.name} className="object-cover" /> : null}
          <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
