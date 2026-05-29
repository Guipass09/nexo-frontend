import {
  LayoutDashboard, MessageSquare, Workflow, ListOrdered, Mic, FileText,
  Users, BarChart3, Settings, UserCircle, Map, ShieldCheck, Images, Bot,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/nexo/Logo";
import { getStoredAuthUser, hasPermission, type UserPermissionKey } from "@/lib/auth";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { title: "Conversas", url: "/conversas", icon: MessageSquare, badge: "12", permission: "conversations" },
  { title: "Jornada da mensagem", url: "/jornada", icon: Map, permission: "journey" },
];

const automationItems = [
  { title: "Fluxos", url: "/fluxos", icon: Workflow, permission: "flows" },
  { title: "Agent IA", url: "/agent-ia", icon: Bot, permission: "ai_agent" },
  { title: "Sequências", url: "/sequencias", icon: ListOrdered, permission: "sequences" },
  { title: "Áudios", url: "/audios", icon: Mic, permission: "audios" },
  { title: "Templates", url: "/templates", icon: FileText, permission: "templates" },
];

const dataItems = [
  { title: "Contatos", url: "/contatos", icon: Users, permission: "contacts" },
  { title: "Mídia", url: "/midias", icon: Images, permission: "media" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, permission: "reports" },
];

const settingsItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, permission: "settings" },
  { title: "Perfil", url: "/perfil", icon: UserCircle },
];

const adminItems = [
  { title: "Usuarios", url: "/usuarios", icon: Users, permission: "users" },
  { title: "Auditoria", url: "/auditoria", icon: ShieldCheck, permission: "audit" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const user = getStoredAuthUser();
  const isAdmin = user?.role === "admin";

  const renderItem = (item: typeof mainItems[number] & { permission?: UserPermissionKey }) => {
    if (item.permission && !hasPermission(user, item.permission)) {
      return null;
    }

    const isActive = location.pathname === item.url;
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild tooltip={item.title} className="h-11">
          <NavLink
            to={item.url}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 transition-smooth",
              "text-sidebar-foreground/75 hover:bg-white/10 hover:text-white",
              isActive && "bg-white/10 text-white shadow-[inset_0_0_0_1px_hsl(190_93%_47%_/_0.28),0_14px_34px_-24px_hsl(190_93%_47%_/_0.8)] font-semibold",
            )}
          >
            <span className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-smooth group-hover:bg-white/10 group-hover:text-cyan-200",
              isActive && "bg-cyan-400/10 text-cyan-200",
            )}>
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            {!collapsed && <span className="text-sm">{item.title}</span>}
            {!collapsed && "badge" in item && item.badge && (
              <span className="ml-auto rounded-full bg-cyan-300 px-2 py-0.5 text-[10px] font-extrabold text-nexo-navy shadow-glow">
                {item.badge}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border/80 p-4">
        <Logo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin px-2 py-4">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/50">Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="mt-2 px-3 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/50">Automação</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{automationItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="mt-2 px-3 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/50">Dados</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{dataItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="mt-2 px-3 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/50">Sistema</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{settingsItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="mt-2 px-3 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/50">Administração</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>{adminItems.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 p-3">
        {!collapsed ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
              <span className="text-xs font-semibold text-white">Robô ativo</span>
            </div>
            <p className="text-[10px] text-sidebar-foreground/58">Operando com inteligência conectada</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
