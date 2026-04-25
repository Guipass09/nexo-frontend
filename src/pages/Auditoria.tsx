import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { useAuditEventTypes, useAuditEvents, useOperators } from "@/hooks/use-app-data";
import { getStoredAuthUser } from "@/lib/auth";
import { exportAuditEventsCsv, isForbiddenError } from "@/services/audit";
import { toast } from "@/hooks/use-toast";

const EVENT_STATUS_OPTIONS = ["", "ok", "warn", "pending", "error", "wait"];
const DELIVERY_STATUS_OPTIONS = ["", "pending", "sent", "delivered", "read", "failed", "skipped"];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function Auditoria() {
  const user = getStoredAuthUser();
  const isAdmin = user?.role === "admin";
  const [operatorId, setOperatorId] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const baseFilters = useMemo(() => ({
    operatorId,
    status: eventStatus,
    deliveryStatus,
    conversationId,
    dateFrom,
    dateTo,
  }), [conversationId, dateFrom, dateTo, deliveryStatus, eventStatus, operatorId]);

  const filters = useMemo(() => ({
    ...baseFilters,
    type: eventType,
    page,
    perPage: 12,
  }), [baseFilters, eventType, page]);

  const operatorsQuery = useOperators(isAdmin);
  const eventTypesQuery = useAuditEventTypes(baseFilters, isAdmin);
  const auditQuery = useAuditEvents(filters, isAdmin);

  if (!isAdmin) {
    return (
      <Card className="p-6 border-border/60">
        <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">A auditoria operacional está disponível apenas para administradores.</p>
      </Card>
    );
  }

  const isForbidden = isForbiddenError(operatorsQuery.error) || isForbiddenError(eventTypesQuery.error) || isForbiddenError(auditQuery.error);
  const totalPages = auditQuery.data?.meta?.last_page ?? 1;

  const resetFilters = () => {
    setOperatorId("");
    setEventType("");
    setEventStatus("");
    setDeliveryStatus("");
    setConversationId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportAuditEventsCsv(filters);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `audit-events-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exportado", description: "O arquivo de auditoria foi gerado com os filtros atuais." });
    } catch {
      toast({
        title: "Falha ao exportar CSV",
        description: "Nao foi possivel gerar o arquivo agora. Verifique sua permissao ou tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={operatorId}
            onChange={(event) => {
              setOperatorId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os operadores</option>
            {operatorsQuery.data?.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.name} ({operator.role})
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={eventType}
            onChange={(event) => {
              setEventType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os eventos</option>
            {eventTypesQuery.data?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={eventStatus}
            onChange={(event) => {
              setEventStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            {EVENT_STATUS_OPTIONS.filter(Boolean).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={deliveryStatus}
            onChange={(event) => {
              setDeliveryStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os envios</option>
            {DELIVERY_STATUS_OPTIONS.filter(Boolean).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <Input
            placeholder="ID da conversa"
            value={conversationId}
            onChange={(event) => {
              setConversationId(event.target.value.replace(/\D+/g, ""));
              setPage(1);
            }}
          />

          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
          />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetFilters}>
              Limpar filtros
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleExport} disabled={isExporting || auditQuery.isFetching}>
              {isExporting ? "Exportando..." : "Exportar CSV"}
            </Button>
          </div>
        </div>
      </Card>

      {isForbidden ? (
        <Card className="p-6 border-border/60">
          <h2 className="text-lg font-semibold mb-2">Permissão insuficiente</h2>
          <p className="text-sm text-muted-foreground">Sua conta não pode consultar a auditoria operacional.</p>
        </Card>
      ) : auditQuery.isError ? (
        <Card className="p-6 border-border/60">
          <h2 className="text-lg font-semibold mb-2">Falha ao carregar auditoria</h2>
          <p className="text-sm text-muted-foreground">Nao foi possível buscar os eventos agora. Tente novamente em instantes.</p>
        </Card>
      ) : auditQuery.isLoading ? (
        <Card className="p-6 border-border/60">
          <h2 className="text-lg font-semibold mb-2">Carregando auditoria</h2>
          <p className="text-sm text-muted-foreground">Buscando eventos operacionais com os filtros atuais...</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {auditQuery.data?.data.length ? auditQuery.data.data.map((event) => (
              <Card key={event.id} className="p-4 border-border/60">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <StatusBadge status={event.status} className="text-[10px] py-0" />
                      <span className="text-xs text-muted-foreground">{event.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description || "Sem descrição adicional."}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Data: {formatDateTime(event.createdAt)}</span>
                      <span>Operador: {event.operator?.name ?? "Sistema"}</span>
                      <span>Conversa: #{event.conversationId}</span>
                      <span>Contato: {event.conversation?.contact?.name ?? "Nao informado"}</span>
                    </div>
                  </div>
                  <div className="w-full lg:max-w-sm space-y-2 text-xs">
                    {event.linkedMessage && (
                      <div className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="font-medium mb-1">Mensagem vinculada</p>
                        <p className="text-muted-foreground line-clamp-3">{event.linkedMessage.text || "Sem conteúdo textual"}</p>
                        <p className="text-muted-foreground mt-1">
                          Status: {event.linkedMessage.deliveryStatus ?? "n/a"}
                        </p>
                      </div>
                    )}
                    {Object.keys(event.meta ?? {}).length > 0 && (
                      <div className="rounded-lg border border-border bg-background p-3">
                        <p className="font-medium mb-1">Meta</p>
                        <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                          {JSON.stringify(event.meta, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )) : (
              <Card className="p-6 border-border/60">
                <p className="text-sm text-muted-foreground">Nenhum evento encontrado para os filtros atuais.</p>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Pagina {auditQuery.data?.meta?.current_page ?? 1} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Anterior
              </Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Proxima
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
