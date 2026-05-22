import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AiAgentAssistantWidget } from "@/components/ai-agent/AiAgentAssistantWidget";

export default function AppLayout() {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden animate-fade-in-up">
            <Outlet />
          </main>
        </div>
        <AiAgentAssistantWidget />
      </div>
    </SidebarProvider>
  );
}
