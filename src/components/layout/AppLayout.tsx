import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AiAgentAssistantWidget } from "@/components/ai-agent/AiAgentAssistantWidget";
import { AppRenderBoundary } from "./AppRenderBoundary";

export default function AppLayout() {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden animate-fade-in-up">
            <AppRenderBoundary
              fallback={(
                <div className="flex min-h-[60vh] items-center justify-center">
                  <Card className="max-w-lg border-border/60 px-6 py-5 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Nao foi possivel renderizar esta tela agora.</p>
                    <p className="mt-2">
                      Atualize a pagina. Se o problema continuar, o restante do painel segue protegido e podemos corrigir
                      esta area sem derrubar o app inteiro.
                    </p>
                  </Card>
                </div>
              )}
            >
              <Outlet />
            </AppRenderBoundary>
          </main>
        </div>
        <AiAgentAssistantWidget />
      </div>
    </SidebarProvider>
  );
}
