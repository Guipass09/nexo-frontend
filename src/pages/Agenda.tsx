import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Plus,
  Bot,
  User as UserIcon,
  Check,
  X,
  Trash2,
  Clock,
  CalendarClock,
  FileText,
  Phone,
} from "lucide-react";
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  listCollectedInfo,
  type Appointment,
  type AppointmentStatus,
  type CollectedInfo,
} from "@/services/appointments";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "@/hooks/use-toast";

const STATUS_FILTERS: { key: "" | AppointmentStatus; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "confirmed", label: "Confirmados" },
  { key: "pending", label: "Pendentes" },
  { key: "cancelled", label: "Cancelados" },
];

const STATUS_META: Record<AppointmentStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmado", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  pending: { label: "Pendente", className: "border-amber-200 bg-amber-50 text-amber-700" },
  cancelled: { label: "Cancelado", className: "border-rose-200 bg-rose-50 text-rose-700" },
};

type Draft = {
  customer_name: string;
  service: string;
  schedule_day: string;
  schedule_period: string;
  schedule_time: string;
  notes: string;
};

const emptyDraft: Draft = {
  customer_name: "",
  service: "",
  schedule_day: "",
  schedule_period: "",
  schedule_time: "",
  notes: "",
};

function formatWhen(a: Appointment): string {
  if (a.startsAt) {
    try {
      return new Date(a.startsAt).toLocaleString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      /* fall back to text */
    }
  }
  return a.scheduledText || "Horário a definir";
}

export default function Agenda() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"appointments" | "info">("appointments");
  const [statusFilter, setStatusFilter] = useState<"" | AppointmentStatus>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", statusFilter],
    queryFn: () => listAppointments(statusFilter || undefined),
  });

  const { data: collected = [], isLoading: collectedLoading } = useQuery({
    queryKey: ["collected-info"],
    queryFn: () => listCollectedInfo(),
    enabled: view === "info",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["appointments"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) => updateAppointment(id, { status }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Agendamento atualizado" });
    },
    onError: (error) => toast({ title: "Erro", description: getApiErrorMessage(error), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Agendamento removido" });
    },
    onError: (error) => toast({ title: "Erro", description: getApiErrorMessage(error), variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAppointment({
        customer_name: draft.customer_name || undefined,
        service: draft.service || undefined,
        schedule_day: draft.schedule_day || undefined,
        schedule_period: draft.schedule_period || undefined,
        schedule_time: draft.schedule_time || undefined,
        notes: draft.notes || undefined,
        status: "confirmed",
      }),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setDraft(emptyDraft);
      toast({ title: "Agendamento criado" });
    },
    onError: (error) => toast({ title: "Erro", description: getApiErrorMessage(error), variant: "destructive" }),
  });

  const counts = useMemo(() => {
    const all = queryClient.getQueryData<Appointment[]>(["appointments", ""]) ?? appointments;
    return {
      total: all.length,
      confirmed: all.filter((a) => a.status === "confirmed").length,
      pending: all.filter((a) => a.status === "pending").length,
    };
  }, [appointments, queryClient]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
            <CalendarDays className="h-6 w-6 text-cyan-600" />
            Agenda
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Agendamentos e reservas. A IA adiciona aqui automaticamente conforme agenda nas conversas.
          </p>
        </div>
        {view === "appointments" ? (
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={view === "appointments" ? "default" : "outline"}
          onClick={() => setView("appointments")}
          className="gap-2"
        >
          <CalendarClock className="h-4 w-4" /> Agendamentos
        </Button>
        <Button
          size="sm"
          variant={view === "info" ? "default" : "outline"}
          onClick={() => setView("info")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" /> Informações coletadas
        </Button>
      </div>

      {view === "appointments" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: counts.total, icon: CalendarClock },
              { label: "Confirmados", value: counts.confirmed, icon: Check },
              { label: "Pendentes", value: counts.pending, icon: Clock },
            ].map((s) => (
              <Card key={s.label} className="flex items-center gap-3 p-4">
                <s.icon className="h-5 w-5 text-cyan-600" />
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.key || "all"}
                size="sm"
                variant={statusFilter === f.key ? "default" : "outline"}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </>
      )}

      {view === "info" && (
        collectedLoading ? (
          <Card className="p-10 text-center text-sm text-slate-500">Carregando informações…</Card>
        ) : collected.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">Nenhuma informação coletada ainda</p>
            <p className="max-w-md text-sm text-slate-500">
              Conforme a IA conduz as conversas, tudo que ela coletar de cada contato (ex.: requisitos do
              protótipo) aparece aqui, separado por número.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {collected.map((c: CollectedInfo) => (
              <Card key={c.conversationId ?? c.phone ?? Math.random()} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                      {(c.contactName || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {c.contactName || "Contato sem nome"}
                      </p>
                      {c.phone ? (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 border-cyan-200 bg-cyan-50 text-[11px] text-cyan-700">
                    <Bot className="h-3 w-3" /> Coletado pela IA
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {c.facts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )
      )}

      {view === "appointments" && (isLoading ? (
        <Card className="p-10 text-center text-sm text-slate-500">Carregando agenda…</Card>
      ) : appointments.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Nenhum agendamento ainda</p>
          <p className="max-w-md text-sm text-slate-500">
            Quando a IA combinar um horário numa conversa do WhatsApp, o agendamento aparece aqui automaticamente.
            Você também pode adicionar um manualmente.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                  {(a.customerName || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {a.customerName || "Cliente sem nome"}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    {formatWhen(a)}
                  </p>
                  {a.service ? <p className="truncate text-xs text-slate-400">{a.service}</p> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUS_META[a.status].className}>
                  {STATUS_META[a.status].label}
                </Badge>
                <Badge variant="outline" className="gap-1 border-slate-200 bg-slate-50 text-[11px] text-slate-500">
                  {a.source === "ai_agent" ? <Bot className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                  {a.source === "ai_agent" ? "IA" : "Manual"}
                </Badge>
                {a.status !== "confirmed" ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Confirmar"
                    onClick={() => statusMutation.mutate({ id: a.id, status: "confirmed" })}
                  >
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                ) : null}
                {a.status !== "cancelled" ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Cancelar"
                    onClick={() => statusMutation.mutate({ id: a.id, status: "cancelled" })}
                  >
                    <X className="h-4 w-4 text-amber-600" />
                  </Button>
                ) : null}
                <Button size="icon" variant="ghost" title="Excluir" onClick={() => deleteMutation.mutate(a.id)}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>Adicione um agendamento manualmente à agenda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="customer_name">Cliente</Label>
              <Input
                id="customer_name"
                value={draft.customer_name}
                onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="service">Serviço / assunto</Label>
              <Input
                id="service"
                value={draft.service}
                onChange={(e) => setDraft({ ...draft, service: e.target.value })}
                placeholder="Ex.: avaliação inicial"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="schedule_day">Dia</Label>
                <Input
                  id="schedule_day"
                  value={draft.schedule_day}
                  onChange={(e) => setDraft({ ...draft, schedule_day: e.target.value })}
                  placeholder="quarta"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="schedule_period">Período</Label>
                <Input
                  id="schedule_period"
                  value={draft.schedule_period}
                  onChange={(e) => setDraft({ ...draft, schedule_period: e.target.value })}
                  placeholder="tarde"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="schedule_time">Horário</Label>
                <Input
                  id="schedule_time"
                  value={draft.schedule_time}
                  onChange={(e) => setDraft({ ...draft, schedule_time: e.target.value })}
                  placeholder="14h"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
