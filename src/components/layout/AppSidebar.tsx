import {
  LayoutDashboard, MessageSquare, Workflow, ListOrdered, Mic, FileText,
  Users, BarChart3, Settings, UserCircle, Map,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/nexo/Logo";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Conversas", url: "/conversas", icon: MessageSquare, badge: "12" },
  { title: "Jornada da mensagem", url: "/jornada", icon: Map },
];

const automationItems = [
  { title: "Fluxos", url: "/fluxos", icon: Workflow },
  { title: "Sequências", url: "/sequencias", icon: ListOrdered },
  { title: "Áudios", url: "/audios", icon: Mic },
  { title: "Templates", url: "/templates", icon: FileText },
];

const dataItems = [
  { title: "Contatos", url: "/contatos", icon: Users },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const settingsItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Perfil", url: "/perfil", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItem = (item: typeof mainItems[number]) => {
    const isActive = location.pathname === item.url;
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild tooltip={item.title} className="h-10">
          <NavLink
            to={item.url}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 transition-smooth",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground shadow-md font-medium",
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="text-sm">{item.title}</span>}
            {!collapsed && "badge" in item && item.badge && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground">
                {item.badge}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Logo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 scrollbar-thin">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3">Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3 mt-2">Automação</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{automationItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3 mt-2">Dados</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{dataItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3 mt-2">Sistema</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{settingsItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
              <span className="text-xs font-medium text-sidebar-foreground">Robô ativo</span>
            </div>
            <p className="text-[10px] text-sidebar-foreground/60">Operando normalmente</p>
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