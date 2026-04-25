import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { ProfileWhatsAppConnection } from "@/types/domain";
import {
  AlertTriangle,
  ChevronDown,
  Link2,
  MessageSquare,
  RefreshCcw,
  ShieldCheck,
  Unplug,
  Wifi,
} from "lucide-react";

interface WhatsAppConnectionCardError {
  title: string;
  message: string;
  technicalDetails?: Record<string, unknown> | null;
}

interface WhatsAppConnectionCardProps {
  connection: ProfileWhatsAppConnection | null;
  isLoading: boolean;
  isConnecting: boolean;
  isTesting: boolean;
  isSyncingTemplates: boolean;
  isDisconnecting: boolean;
  error: WhatsAppConnectionCardError | null;
  queryErrorMessage?: string | null;
  onConnect: () => void;
  onRetry: () => void;
  onTest: () => void;
  onSyncTemplates: () => void;
  onDisconnect: () => void;
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
    case "cloud_api":
      return "Cloud API";
    case "coexistence":
      return "Coexistence";
    case "unknown":
    default:
      return "Nao identificado";
  }
}

export function WhatsAppConnectionCard({
  connection,
  isLoading,
  isConnecting,
  isTesting,
  isSyncingTemplates,
  isDisconnecting,
  error,
  queryErrorMessage,
  onConnect,
  onRetry,
  onTest,
  onSyncTemplates,
  onDisconnect,
}: WhatsAppConnectionCardProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const isConnected = connection?.status === "connected";
  const hasErrorState = Boolean(error || connection?.status === "error" || queryErrorMessage);
  const isDisconnected = !isConnected;
  const errorPayload = useMemo<WhatsAppConnectionCardError | null>(() => {
    if (error) {
      return error;
    }

    if (connection?.status === "error") {
      return {
        title: "Nao foi possivel concluir a conexao",
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
  }, [connection?.lastError, connection?.metadata, connection?.status, error, queryErrorMessage]);

  return (
    <Card className="p-6 border-border/60">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">WhatsApp conectado</h3>
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
            Conecte seu WhatsApp para usar fluxos, automacoes e atendimento no painel.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Coexistence</p>
          <p className="text-muted-foreground">
            Alguns numeros do WhatsApp Business App podem usar Coexistence quando elegiveis.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {isDisconnected ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Onboarding oficial da Meta</AlertTitle>
                <AlertDescription>
                  A conexao usa Meta Embedded Signup. A disponibilidade do Coexistence depende das regras e da elegibilidade do numero na Meta.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Embedded Signup",
                    description: "Autoriza a conta, cria ou conecta os ativos necessarios e retorna o numero para o sistema.",
                  },
                  {
                    title: "Coexistence quando elegivel",
                    description: "Numeros do WhatsApp Business App podem seguir no app e tambem operar na plataforma quando a Meta permitir.",
                  },
                  {
                    title: "Compativel com o sistema atual",
                    description: "A conexao fica por usuario e nao substitui a integracao global enquanto a transicao nao estiver completa.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
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

              {isConnecting && !hasErrorState ? (
                <Alert>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  <AlertTitle>Conectando</AlertTitle>
                  <AlertDescription>Abrindo conexao com a Meta...</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button onClick={onConnect} disabled={isLoading || isConnecting}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {isConnecting ? "Abrindo Meta..." : "Conectar WhatsApp"}
                </Button>
                {hasErrorState ? (
                  <Button variant="outline" onClick={onRetry} disabled={isConnecting}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Tentar novamente
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-border/60 bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-5">
              <p className="text-sm font-medium">O que voce vai ver apos conectar</p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Status da conexao, numero conectado, Business Account ID e Phone Number ID.</p>
                <p>Saude da conexao, erros de elegibilidade para Coexistence e data da ultima conexao.</p>
                <p>Acao de testar conexao, sincronizar templates e desconectar sem expor token no frontend.</p>
              </div>
            </div>
          </div>
        ) : connection ? (
          <div className="space-y-5">
            <Alert>
              <Wifi className="h-4 w-4" />
              <AlertTitle>Seu WhatsApp esta conectado e pronto para automacoes.</AlertTitle>
              <AlertDescription>
                O painel ja pode usar esse canal para conversas, fluxos, templates e atendimento, respeitando os estados reais da conexao retornados pelo backend.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Numero conectado", value: connection.phoneNumber ?? "Nao informado" },
                { label: "Phone Number ID", value: connection.phoneNumberId ?? "Nao informado" },
                { label: "Business Account ID", value: connection.businessAccountId ?? "Nao informado" },
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
                    <p className="mt-2 text-sm font-medium">{connection.status}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Webhook</p>
                    <p className="mt-2 text-sm font-medium">{connection.webhookStatus ?? "Ainda nao informado"}</p>
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

                {connection.coexistenceEligibility ? (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Elegibilidade Coexistence</p>
                      <p className="text-sm text-muted-foreground">
                        {connection.coexistenceEligibility.eligible === true
                          ? "Seu numero esta elegivel para operar com Coexistence."
                          : connection.coexistenceEligibility.eligible === false
                            ? "A Meta informou que este numero nao esta elegivel para Coexistence agora."
                            : "A elegibilidade ainda nao foi confirmada pela Meta."}
                      </p>
                      {connection.coexistenceEligibility.reason ? (
                        <p className="text-xs text-muted-foreground">
                          Motivo: {connection.coexistenceEligibility.reason}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {connection.lastError ? (
                  <>
                    <Separator className="my-4" />
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Ultimo erro registrado</AlertTitle>
                      <AlertDescription>{connection.lastError}</AlertDescription>
                    </Alert>
                  </>
                ) : null}
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 p-5">
                <p className="text-sm font-medium">Acoes</p>
                <Button className="w-full justify-start" variant="outline" onClick={onSyncTemplates} disabled={isSyncingTemplates}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {isSyncingTemplates ? "Sincronizando templates..." : "Sincronizar templates"}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={onTest} disabled={isTesting}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {isTesting ? "Testando conexao..." : "Testar conexao"}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={onDisconnect} disabled={isDisconnecting}>
                  <Unplug className="mr-2 h-4 w-4" />
                  {isDisconnecting ? "Desconectando..." : "Desconectar"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
            {isLoading ? "Carregando status do WhatsApp..." : "Nenhuma conexao encontrada para este usuario."}
          </div>
        )}
      </div>
    </Card>
  );
}
