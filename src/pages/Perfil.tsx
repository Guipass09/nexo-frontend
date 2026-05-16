import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Bell, Camera, Globe, LogOut, Moon } from "lucide-react";
import { queryClient } from "@/App";
import { clearAuthSession, getStoredAuthUser } from "@/lib/auth";
import { logout } from "@/services/auth";
import { toast } from "@/hooks/use-toast";
import { getWhatsAppConnectionErrorMessage, useWhatsAppConnection } from "@/hooks/use-whatsapp-connection";
import { getApiErrorMessage } from "@/lib/api/client";
import { WhatsAppConnectionCard } from "@/components/profile/WhatsAppConnectionCard";

export default function Perfil() {
  const nav = useNavigate();
  const user = getStoredAuthUser();
  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NX";
  const {
    connection,
    connectionQuery,
    startConnection,
    retryConnection,
    startWebConnection,
    testConnection,
    syncTemplates,
    disconnectConnection,
    disconnectWebConnection,
    uiError,
    isWebQrModalOpen,
    setIsWebQrModalOpen,
    webQrStatus,
    isLoadingConnection,
    isConnecting,
    isStartingWeb,
    isTesting,
    isSyncingTemplates,
    isDisconnecting,
    isDisconnectingWeb,
    isLoadingWebQr,
  } = useWhatsAppConnection();

  const queryErrorMessage = useMemo(
    () => connectionQuery.isError ? getApiErrorMessage(connectionQuery.error, "Nao foi possivel carregar o status do WhatsApp.") : null,
    [connectionQuery.error, connectionQuery.isError],
  );

  const handleStartConnection = async () => {
    try {
      const result = await startConnection();
      toast({
        title: "WhatsApp conectado",
        description: "A autorizacao foi concluida e a conexao do usuario foi salva no backend.",
      });

      if (result?.testMessage) {
        toast({
          title: result.testMessage.status === "ok" ? "Mensagem teste enviada" : "Mensagem teste nao enviada",
          description: result.testMessage.message,
          variant: result.testMessage.status === "ok" ? "default" : "destructive",
        });
      }
    } catch (error) {
      const connectionError = getWhatsAppConnectionErrorMessage(error);
      toast({
        title: connectionError.title,
        description: connectionError.message,
        variant: "destructive",
      });
    }
  };

  const handleRetryConnection = async () => {
    try {
      const result = await retryConnection();
      toast({
        title: "Nova tentativa concluida",
        description: "O fluxo de onboarding foi reexecutado com sucesso.",
      });

      if (result?.testMessage) {
        toast({
          title: result.testMessage.status === "ok" ? "Mensagem teste enviada" : "Mensagem teste nao enviada",
          description: result.testMessage.message,
          variant: result.testMessage.status === "ok" ? "default" : "destructive",
        });
      }
    } catch (error) {
      const connectionError = getWhatsAppConnectionErrorMessage(error);
      toast({
        title: connectionError.title,
        description: connectionError.message,
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnection();
      toast({
        title: "Conexao verificada",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Falha ao testar conexao",
        description: getApiErrorMessage(error, "Nao foi possivel testar a integracao agora."),
        variant: "destructive",
      });
    }
  };

  const handleSyncTemplates = async () => {
    try {
      const result = await syncTemplates();
      toast({
        title: "Templates sincronizados",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Falha ao sincronizar templates",
        description: getApiErrorMessage(error, "Nao foi possivel sincronizar os templates agora."),
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectConnection();
      toast({
        title: "Integracao removida",
        description: "A conexao foi removida do usuario sem executar nenhuma acao destrutiva na conta Meta.",
      });
    } catch (error) {
      toast({
        title: "Falha ao desconectar",
        description: getApiErrorMessage(error, "Nao foi possivel remover a integracao agora."),
        variant: "destructive",
      });
    }
  };

  const handleStartWebConnection = async () => {
    try {
      await startWebConnection();
      toast({
        title: "QR Code iniciado",
        description: "Escaneie com o celular para concluir a conexao do WhatsApp Web.",
      });
    } catch (error) {
      toast({
        title: "Falha ao iniciar QR Code",
        description: getApiErrorMessage(error, "Nao foi possivel iniciar a sessao do WhatsApp Web."),
        variant: "destructive",
      });
    }
  };

  const handleDisconnectWeb = async () => {
    try {
      await disconnectWebConnection();
      toast({
        title: "WhatsApp Web desconectado",
        description: "A sessao conectada por QR Code foi encerrada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Falha ao desconectar QR Code",
        description: getApiErrorMessage(error, "Nao foi possivel desconectar a sessao do WhatsApp Web."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-elegant">
              <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card border-2 border-background shadow-md flex items-center justify-center hover:scale-110 transition-smooth">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold">{user?.name ?? "Conta Nexo"}</h2>
            <p className="text-sm text-muted-foreground mb-2">{user?.email ?? "Sem e-mail vinculado"}</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {user?.role === "admin" ? "Administrador" : "Usuario"}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await logout();
              } catch {
                // noop
              } finally {
                queryClient.clear();
                clearAuthSession();
                nav("/");
              }
            }}
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold mb-5 pb-5 border-b border-border/60">Informacoes pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome completo</Label><Input defaultValue={user?.name ?? ""} /></div>
          <div className="space-y-2"><Label>E-mail</Label><Input type="email" defaultValue={user?.email ?? ""} /></div>
          <div className="space-y-2"><Label>Empresa</Label><Input defaultValue={user?.companyName ?? ""} placeholder="Empresa ou negocio" /></div>
          <div className="space-y-2"><Label>Cargo</Label><Input defaultValue={user?.role === "admin" ? "Administrador do sistema" : "Usuario operacional"} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input placeholder="Adicionar telefone" /></div>
        </div>
        <div className="flex justify-end mt-5">
          <Button className="gradient-primary text-primary-foreground">Salvar alteracoes</Button>
        </div>
      </Card>

      <WhatsAppConnectionCard
        connection={connection}
        isLoading={isLoadingConnection}
        isConnecting={isConnecting}
        isStartingWeb={isStartingWeb}
        isTesting={isTesting}
        isSyncingTemplates={isSyncingTemplates}
        isDisconnecting={isDisconnecting}
        isDisconnectingWeb={isDisconnectingWeb}
        isWebQrModalOpen={isWebQrModalOpen}
        onWebQrModalOpenChange={setIsWebQrModalOpen}
        webQrStatus={webQrStatus}
        isLoadingWebQr={isLoadingWebQr}
        error={uiError}
        queryErrorMessage={queryErrorMessage}
        onConnect={() => {
          void handleStartConnection();
        }}
        onConnectWeb={() => {
          void handleStartWebConnection();
        }}
        onRetry={() => {
          void handleRetryConnection();
        }}
        onTest={() => {
          void handleTestConnection();
        }}
        onSyncTemplates={() => {
          void handleSyncTemplates();
        }}
        onDisconnect={() => {
          void handleDisconnect();
        }}
        onDisconnectWeb={() => {
          void handleDisconnectWeb();
        }}
      />

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold mb-5 pb-5 border-b border-border/60">Preferencias</h3>
        <div className="space-y-4">
          {[
            { icon: Globe, title: "Idioma", desc: "Portugues (Brasil)" },
            { icon: Moon, title: "Tema escuro", desc: "Reduz fadiga visual a noite", toggle: true },
            { icon: Bell, title: "Notificacoes por e-mail", desc: "Resumos e alertas importantes", toggle: true, on: true },
          ].map((p) => (
            <div key={p.title} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <p.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              {p.toggle ? <Switch defaultChecked={p.on} /> : <Button variant="ghost" size="sm">Alterar</Button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
