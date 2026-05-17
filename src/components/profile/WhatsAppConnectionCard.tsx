import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProfileWhatsAppConnection, WhatsAppWebQrStatus } from "@/types/domain";
import {
  AlertTriangle,
  ChevronDown,
  Link2,
  LoaderCircle,
  MessageSquare,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Unplug,
  Wifi,
} from "lucide-react";
import { BrandMark } from "@/components/nexo/BrandMark";

interface WhatsAppConnectionCardError {
  title: string;
  message: string;
  technicalDetails?: Record<string, unknown> | null;
}

interface WhatsAppConnectionCardProps {
  connection: ProfileWhatsAppConnection | null;
  isLoading: boolean;
  isConnecting: boolean;
  isStartingWeb: boolean;
  isTesting: boolean;
  isSyncingTemplates: boolean;
  isDisconnecting: boolean;
  isDisconnectingWeb: boolean;
  isWebQrModalOpen: boolean;
  onWebQrModalOpenChange: (open: boolean) => void;
  webQrStatus: WhatsAppWebQrStatus | null;
  isLoadingWebQr: boolean;
  error: WhatsAppConnectionCardError | null;
  queryErrorMessage?: string | null;
  onConnect: () => void;
  onConnectWeb: () => void;
  onRetry: () => void;
  onTest: () => void;
  onSyncTemplates: () => void;
  onDisconnect: () => void;
  onDisconnectWeb: () => void;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Ainda sem registro";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function healthLabel(health?: ProfileWhatsAppConnection["health"]) {
  switch (health) {
    case "active":
      return "Ativo";
    case "error":
      return "Erro";
    case "token_expired":
      return "Token expirado";
    case "webhook_pending":
      return "Webhook pendente";
    case "pending":
      return "Pendente";
    case "disconnected":
    default:
      return "Desconectado";
  }
}

function healthBadgeClass(health?: ProfileWhatsAppConnection["health"]) {
  switch (health) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "token_expired":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "webhook_pending":
    case "pending":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "disconnected":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function connectionTypeLabel(connectionType?: ProfileWhatsAppConnection["connectionType"] | null) {
  switch (connectionType) {
    case "whatsapp_web":
      return "WhatsApp Web";
    case "cloud_api":
      return "Cloud API";
    case "coexistence":
      return "Coexistence";
    case "unknown":
    default:
      return "Nao identificado";
  }
}

function statusLabel(status?: ProfileWhatsAppConnection["status"] | WhatsAppWebQrStatus["status"]) {
  switch (status) {
    case "qr_pending":
      return "Aguardando leitura";
    case "reconnecting":
      return "Reconectando";
    case "connected":
      return "Conectado";
    case "failed":
    case "error":
      return "Erro";
    case "pending":
      return "Gerando QR Code";
    case "disconnected":
    default:
      return "Desconectado";
  }
}

export function WhatsAppConnectionCard({
  connection,
  isLoading,
  isConnecting,
  isStartingWeb,
  isTesting,
  isSyncingTemplates,
  isDisconnecting,
  isDisconnectingWeb,
  isWebQrModalOpen,
  onWebQrModalOpenChange,
  webQrStatus,
  isLoadingWebQr,
  error,
  queryErrorMessage,
  onConnect,
  onConnectWeb,
  onRetry,
  onTest,
  onSyncTemplates,
  onDisconnect,
  onDisconnectWeb,
}: WhatsAppConnectionCardProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const isConnected = connection?.status === "connected";
  const isWebProvider = connection?.provider === "whatsapp_web";
  const isConnectedWebSession = isWebProvider && isConnected;
  const hasRuntimeConnectionFailure = isConnected && (connection?.status === "error" || connection?.status === "failed");
  const hasErrorState = Boolean(error || queryErrorMessage || hasRuntimeConnectionFailure);
  const errorPayload = useMemo<WhatsAppConnectionCardError | null>(() => {
    if (error) {
      return error;
    }

    if (hasRuntimeConnectionFailure) {
      return {
        title: isWebProvider ? "Falha na sessao do WhatsApp Web" : "Nao foi possivel concluir a conexao",
        message: connection.lastError ?? "A integracao foi salva com erro e precisa de nova tentativa.",
        technicalDetails: connection.metadata ?? null,
      };
    }

    if (queryErrorMessage) {
      return {
        title: "Falha ao carregar a conexao",
        message: queryErrorMessage,
        technicalDetails: null,
      };
    }

    return null;
  }, [connection?.lastError, connection?.metadata, error, hasRuntimeConnectionFailure, isWebProvider, queryErrorMessage]);

  return (
    <Card className="border-border/60 p-6">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Conectar WhatsApp</h3>
            <Badge
              variant="outline"
              className={isConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700"}
            >
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
            {connection ? (
              <Badge variant="outline" className={healthBadgeClass(connection.health)}>
                Saude: {healthLabel(connection.health)}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Escolha entre a Cloud API oficial da Meta ou o modo QR Code mantendo o WhatsApp no celular.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {!isConnected ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold">WhatsApp oficial da Meta</h4>
                    <p className="text-sm text-muted-foreground">
                      Para numero novo ou operacao profissional via Cloud API oficial.
                    </p>
                  </div>
                </div>
                <Button onClick={onConnect} disabled={isLoading || isConnecting} className="mt-5 w-full">
                  <Link2 className="mr-2 h-4 w-4" />
                  {isConnecting ? "Abrindo Meta..." : "Conectar pela Meta"}
                </Button>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold">Manter WhatsApp no celular</h4>
                    <p className="text-sm text-muted-foreground">
                      Escaneie um QR Code como no WhatsApp Web e use seus fluxos sem sair do app.
                    </p>
                  </div>
                </div>
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Este modo mantem seu WhatsApp no celular, mas depende de sessao conectada via WhatsApp Web. Pode exigir reconexao caso a sessao caia.
                  </AlertDescription>
                </Alert>
                <Button onClick={onConnectWeb} disabled={isLoading || isStartingWeb} variant="outline" className="mt-5 w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  {isStartingWeb ? "Gerando QR..." : "Conectar por QR Code"}
                </Button>
              </div>
            </div>

            {hasErrorState && errorPayload ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{errorPayload.title}</AlertTitle>
                <AlertDescription>
                  <div className="space-y-3">
                    <p>{errorPayload.message}</p>
                    {errorPayload.technicalDetails ? (
                      <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <ChevronDown className={`h-4 w-4 transition-transform ${showTechnicalDetails ? "rotate-180" : ""}`} />
                            Detalhes tecnicos
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <pre className="overflow-x-auto rounded-xl bg-background/90 p-3 text-[11px] text-foreground">
                            {JSON.stringify(errorPayload.technicalDetails, null, 2)}
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={onRetry} disabled={isConnecting}>
                      {isConnecting ? "Tentando..." : "Tentar novamente"}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        ) : connection ? (
          <>
            <Alert>
              <Wifi className="h-4 w-4" />
              <AlertTitle>Seu WhatsApp esta conectado e pronto para automacoes.</AlertTitle>
              <AlertDescription>
                O painel ja pode usar esse canal para conversas, fluxos, automacoes e atendimento no tenant correto.
              </AlertDescription>
            </Alert>

            {isWebProvider ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Este modo depende da sessao do WhatsApp Web. Se o celular perder conexao ou a sessao cair, pode ser necessario escanear novamente.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Numero conectado", value: connection.phoneNumber ?? "Nao informado" },
                { label: isWebProvider ? "Web Session ID" : "Phone Number ID", value: isWebProvider ? (connection.webSessionId ?? "Nao informado") : (connection.phoneNumberId ?? "Nao informado") },
                { label: isWebProvider ? "Provider" : "Business Account ID", value: isWebProvider ? "whatsapp_web" : (connection.businessAccountId ?? "Nao informado") },
                { label: "Tipo de conexao", value: connectionTypeLabel(connection.connectionType) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-2 break-all text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-border/60 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                    <p className="mt-2 text-sm font-medium">{statusLabel(connection.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Webhook</p>
                    <p className="mt-2 text-sm font-medium">{connection.webhookStatus ?? "Nao se aplica"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Data da conexao</p>
                    <p className="mt-2 text-sm font-medium">{formatDateTime(connection.connectedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Atualizado em</p>
                    <p className="mt-2 text-sm font-medium">{formatDateTime(connection.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-5 space-y-3">
                <p className="text-sm font-medium">Acoes</p>
                {!isWebProvider ? (
                  <>
                    <Button variant="outline" className="w-full justify-start" onClick={onTest} disabled={isTesting}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isTesting ? "Testando conexao..." : "Testar conexao"}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={onSyncTemplates} disabled={isSyncingTemplates}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      {isSyncingTemplates ? "Sincronizando..." : "Sincronizar templates"}
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive" onClick={onDisconnect} disabled={isDisconnecting}>
                      <Unplug className="mr-2 h-4 w-4" />
                      {isDisconnecting ? "Desconectando..." : "Desconectar"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-start" onClick={() => onWebQrModalOpenChange(true)}>
                      <QrCode className="mr-2 h-4 w-4" />
                      Ver QR / status
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive" onClick={onDisconnectWeb} disabled={isDisconnectingWeb}>
                      <Unplug className="mr-2 h-4 w-4" />
                      {isDisconnectingWeb ? "Desconectando..." : "Desconectar"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <Alert>
            <AlertDescription>Carregando status do WhatsApp...</AlertDescription>
          </Alert>
        )}
      </div>

      <Dialog open={isWebQrModalOpen} onOpenChange={onWebQrModalOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Conectar por QR Code</DialogTitle>
            <DialogDescription>
              Escaneie com o celular e acompanhe o status da sessao em tempo real.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este modo depende da sessao do WhatsApp Web. Se o celular perder conexao ou a sessao cair, pode ser necessario escanear novamente.
              </AlertDescription>
            </Alert>

            <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/20 p-6">
              {isConnectedWebSession ? (
                <div className="flex h-64 flex-col items-center justify-center gap-5 text-center">
                  <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-8 py-7 shadow-sm">
                    <div className="flex flex-col items-center gap-4">
                      <BrandMark className="h-14 w-14 rounded-2xl shadow-none" letterClassName="text-xl" />
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-foreground">WhatsApp conectado com sucesso</p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                          O Nexo ja reconheceu sua sessao. Agora voce pode fechar esta janela e usar conversas, fluxos e automacoes normalmente.
                        </p>
                      </div>
                      <Badge className="border-emerald-200 bg-white text-emerald-700 hover:bg-white">
                        Sessao conectada
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : webQrStatus?.qrCode ? (
                <img
                  src={webQrStatus.qrCode}
                  alt="QR Code do WhatsApp Web"
                  className="mx-auto h-64 w-64 rounded-2xl bg-white p-3 shadow-sm"
                />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                  <LoaderCircle className="h-6 w-6 animate-spin" />
                  <p>{isLoadingWebQr ? "Gerando QR Code..." : "Aguardando QR Code da sessao..."}</p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
                <p className="mt-2 text-sm font-medium">{statusLabel(webQrStatus?.status ?? connection?.status ?? "pending")}</p>
              </div>
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Atualizado em</p>
                <p className="mt-2 text-sm font-medium">{formatDateTime(webQrStatus?.updatedAt ?? connection?.updatedAt ?? null)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={onConnectWeb} disabled={isStartingWeb}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isStartingWeb ? "Atualizando..." : isConnectedWebSession ? "Atualizar status" : "Atualizar QR"}
              </Button>
              <Button variant="outline" onClick={onDisconnectWeb} disabled={isDisconnectingWeb}>
                <Unplug className="mr-2 h-4 w-4" />
                {isDisconnectingWeb ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
