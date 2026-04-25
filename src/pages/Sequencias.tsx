import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import {
  useCreateSequenceMessage,
  useCreateSequence,
  useDeleteSequence,
  useDeleteSequenceMessage,
  useSequenceMessages,
  useSequences,
  useUpdateSequence,
  useUpdateSequenceMessage,
} from "@/hooks/use-app-data";
import { Plus, Edit, Trash2, Power, Clock, MessageSquare, ListOrdered } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "@/hooks/use-toast";
import type { Sequence, SequenceMessage, SequenceStatus } from "@/types/domain";
import type { SequenceMessagePayload } from "@/services/sequences";
import { cn } from "@/lib/utils";

type SequenceDraft = {
  id?: string;
  name: string;
  status: SequenceStatus;
  delay: string;
};

type MessageDraft = {
  id?: string;
  index?: number;
  order: string;
  text: string;
  delay: string;
  note: string;
  type: NonNullable<SequenceMessage["type"]>;
};

const emptySequenceDraft: SequenceDraft = {
  name: "",
  status: "ativo",
  delay: "",
};

const emptyMessageDraft: MessageDraft = {
  order: "",
  text: "",
  delay: "",
  note: "",
  type: "text",
};

function sequenceToDraft(sequence: Sequence): SequenceDraft {
  return {
    id: sequence.id,
    name: sequence.name,
    status: sequence.status,
    delay: sequence.delay,
  };
}

function messageToDraft(message: SequenceMessage, index: number): MessageDraft {
  return {
    id: message.id,
    index,
    order: String(message.order),
    text: message.text,
    delay: message.delay,
    note: message.note,
    type: message.type ?? "text",
  };
}

function draftToMessagePayload(draft: MessageDraft, fallbackOrder: number): SequenceMessagePayload {
  return {
    order: Number(draft.order) || fallbackOrder,
    text: draft.text.trim(),
    delay: draft.delay.trim(),
    note: draft.note.trim(),
    type: draft.type,
  };
}

export default function Sequencias() {
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [sequenceDialogOpen, setSequenceDialogOpen] = useState(false);
  const [sequenceDraft, setSequenceDraft] = useState<SequenceDraft>(emptySequenceDraft);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState<MessageDraft>(emptyMessageDraft);

  const sequencesQuery = useSequences();
  const sequences = sequencesQuery.data ?? [];
  const selectedSequence = sequences.find((sequence) => sequence.id === selectedSequenceId) ?? sequences[0] ?? null;
  const sequenceMessagesQuery = useSequenceMessages(selectedSequence?.id ?? null);
  const sequenceMessages = sequenceMessagesQuery.data ?? [];
  const createSequenceMutation = useCreateSequence();
  const updateSequenceMutation = useUpdateSequence();
  const deleteSequenceMutation = useDeleteSequence();
  const createSequenceMessageMutation = useCreateSequenceMessage();
  const updateSequenceMessageMutation = useUpdateSequenceMessage();
  const deleteSequenceMessageMutation = useDeleteSequenceMessage();
  const isSavingSequence = createSequenceMutation.isPending || updateSequenceMutation.isPending;
  const isSavingMessage = createSequenceMessageMutation.isPending || updateSequenceMessageMutation.isPending || deleteSequenceMessageMutation.isPending;

  const selectedSequenceSubtitle = useMemo(() => {
    if (!selectedSequence) {
      return "Crie ou selecione uma sequencia para gerenciar mensagens";
    }

    return `${selectedSequence.messages} mensagens · atraso base ${selectedSequence.delay || "-"}`;
  }, [selectedSequence]);

  useEffect(() => {
    if (!sequences.length) {
      setSelectedSequenceId(null);
      return;
    }

    if (!selectedSequenceId || !sequences.some((sequence) => sequence.id === selectedSequenceId)) {
      setSelectedSequenceId(sequences[0].id);
    }
  }, [selectedSequenceId, sequences]);

  const openCreateSequence = () => {
    setSequenceDraft(emptySequenceDraft);
    setSequenceDialogOpen(true);
  };

  const openEditSequence = (sequence: Sequence) => {
    setSelectedSequenceId(sequence.id);
    setSequenceDraft(sequenceToDraft(sequence));
    setSequenceDialogOpen(true);
  };

  const saveSequence = () => {
    if (!sequenceDraft.name.trim()) {
      toast({ title: "Nome obrigatorio", description: "Informe um nome para a sequencia.", variant: "destructive" });
      return;
    }

    const payload = {
      name: sequenceDraft.name.trim(),
      status: sequenceDraft.status,
      delay: sequenceDraft.delay.trim(),
    };

    if (sequenceDraft.id) {
      updateSequenceMutation.mutate({ sequenceId: sequenceDraft.id, payload }, {
        onSuccess: () => {
          toast({ title: "Sequencia atualizada", description: "As alteracoes foram salvas no backend." });
          setSequenceDialogOpen(false);
        },
        onError: (error) => toast({ title: "Falha ao atualizar sequencia", description: getApiErrorMessage(error), variant: "destructive" }),
      });
      return;
    }

    createSequenceMutation.mutate(payload, {
      onSuccess: (createdSequence) => {
        toast({ title: "Sequencia criada", description: "A nova sequencia ja esta salva no banco." });
        setSelectedSequenceId(createdSequence?.id ?? null);
        setSequenceDialogOpen(false);
      },
      onError: (error) => toast({ title: "Falha ao criar sequencia", description: getApiErrorMessage(error), variant: "destructive" }),
    });
  };

  const toggleSequenceStatus = (sequence: Sequence) => {
    const nextStatus: SequenceStatus = sequence.status === "ativo" ? "pausado" : "ativo";
    updateSequenceMutation.mutate({ sequenceId: sequence.id, payload: { status: nextStatus } }, {
      onSuccess: () => toast({ title: nextStatus === "ativo" ? "Sequencia ativada" : "Sequencia pausada" }),
      onError: (error) => toast({ title: "Falha ao alterar status", description: getApiErrorMessage(error), variant: "destructive" }),
    });
  };

  const deleteSequence = (sequence: Sequence) => {
    deleteSequenceMutation.mutate(sequence.id, {
      onSuccess: () => toast({ title: "Sequencia excluida", description: "A sequencia foi removida do backend." }),
      onError: (error) => toast({ title: "Falha ao excluir sequencia", description: getApiErrorMessage(error), variant: "destructive" }),
    });
  };

  const openCreateMessage = () => {
    if (!selectedSequence) {
      toast({ title: "Crie uma sequencia primeiro", description: "Mensagens precisam estar vinculadas a uma sequencia.", variant: "destructive" });
      return;
    }

    setMessageDraft({ ...emptyMessageDraft, order: String(sequenceMessages.length + 1) });
    setMessageDialogOpen(true);
  };

  const openEditMessage = (message: SequenceMessage, index: number) => {
    setMessageDraft(messageToDraft(message, index));
    setMessageDialogOpen(true);
  };

  const saveMessage = () => {
    if (!selectedSequence) {
      return;
    }

    if (!messageDraft.text.trim()) {
      toast({ title: "Conteudo obrigatorio", description: "Informe o texto da mensagem.", variant: "destructive" });
      return;
    }

    const payload = draftToMessagePayload(messageDraft, sequenceMessages.length + 1);

    if (messageDraft.id) {
      updateSequenceMessageMutation.mutate({ sequenceId: selectedSequence.id, messageId: messageDraft.id, payload }, {
        onSuccess: () => {
          toast({ title: "Mensagem atualizada", description: "A mensagem foi persistida pelo endpoint granular." });
          setMessageDialogOpen(false);
        },
        onError: (error) => toast({ title: "Falha ao salvar mensagem", description: getApiErrorMessage(error), variant: "destructive" }),
      });
      return;
    }

    createSequenceMessageMutation.mutate({ sequenceId: selectedSequence.id, payload }, {
      onSuccess: () => {
        toast({ title: "Mensagem criada", description: "A mensagem foi persistida pelo endpoint granular." });
        setMessageDialogOpen(false);
      },
      onError: (error) => toast({ title: "Falha ao salvar mensagem", description: getApiErrorMessage(error), variant: "destructive" }),
    });
  };

  const deleteMessage = (message: SequenceMessage) => {
    if (!selectedSequence) {
      return;
    }

    if (!message.id) {
      toast({ title: "ID ausente", description: "Atualize a lista antes de excluir esta mensagem.", variant: "destructive" });
      return;
    }

    deleteSequenceMessageMutation.mutate({ sequenceId: selectedSequence.id, messageId: message.id }, {
      onSuccess: () => toast({ title: "Mensagem excluida", description: "A mensagem foi removida pelo endpoint granular." }),
      onError: (error) => toast({ title: "Falha ao excluir mensagem", description: getApiErrorMessage(error), variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {(sequencesQuery.isError || sequenceMessagesQuery.isError) && (
        <Card className="p-4 border-destructive/40 text-sm text-destructive">
          Erro ao carregar {sequencesQuery.isError ? "/sequences" : `/sequences/${selectedSequence?.id}/messages`}:{" "}
          {getApiErrorMessage(sequencesQuery.error ?? sequenceMessagesQuery.error)}
        </Card>
      )}

      <Card className="p-4 border-warning/20 bg-warning/5">
        <h2 className="text-sm font-semibold">Onde usar sequencias</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sequencias aqui sao listas reais salvas no backend para organizar mensagens em ordem e atraso.
          Elas ainda nao disparam sozinhas pelo webhook. Para resposta automatica imediata, use <strong>Fluxos</strong>.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button className="gradient-primary text-primary-foreground gap-1.5" onClick={openCreateSequence}>
          <Plus className="h-4 w-4" /> Nova sequência
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sequences.map((sequence) => (
          <Card
            key={sequence.id}
            className={cn(
              "p-4 border-border/60 hover:shadow-elegant transition-smooth cursor-pointer",
              selectedSequence?.id === sequence.id && "border-primary/50 shadow-elegant",
            )}
            onClick={() => setSelectedSequenceId(sequence.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListOrdered className="h-4 w-4 text-primary" />
              </div>
              <StatusBadge status={sequence.status} />
            </div>
            <h3 className="font-semibold text-sm mb-3 truncate">{sequence.name}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {sequence.messages} msgs</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {sequence.delay || "-"}</span>
            </div>
            <div className="flex gap-1 border-t border-border/60 pt-3" onClick={(event) => event.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 flex-1 gap-1.5 text-xs" onClick={() => openEditSequence(sequence)}>
                <Edit className="h-3 w-3" /> Editar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleSequenceStatus(sequence)}
                disabled={updateSequenceMutation.isPending}
                title={sequence.status === "ativo" ? "Pausar sequencia" : "Ativar sequencia"}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir sequência?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acao remove a sequencia e suas mensagens do backend.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                    <p className="font-medium">{sequence.name}</p>
                    <p className="text-xs text-muted-foreground">{sequence.status} · {sequence.messages} mensagens</p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteSequence(sequence)} disabled={deleteSequenceMutation.isPending}>
                      {deleteSequenceMutation.isPending ? "Excluindo..." : "Excluir sequência"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
      </div>

      {sequences.length === 0 ? (
        <Card className="p-6 border-border/60 text-sm text-muted-foreground">
          Nenhuma sequencia encontrada. Use "Nova sequência" para criar um registro real no backend.
        </Card>
      ) : null}

      <Card className="p-5 md:p-6 border-border/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h3 className="font-semibold">Sequência: {selectedSequence?.name ?? "-"}</h3>
            <p className="text-xs text-muted-foreground">{selectedSequenceSubtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openCreateMessage} disabled={!selectedSequence || sequenceMessagesQuery.isFetching}>
              <Plus className="h-3.5 w-3.5" /> Adicionar mensagem
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {sequenceMessages.map((message, index) => (
            <div key={`${message.order}-${index}`} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md shrink-0">
                  {message.order}
                </div>
                {index < sequenceMessages.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
              </div>
              <Card className="flex-1 p-4 border-border/60 hover:border-primary/40 transition-smooth">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Atraso: {message.delay || "-"}
                  </span>
                  <span className="text-[10px] text-muted-foreground italic">{message.note}</span>
                </div>
                <p className="text-sm leading-relaxed mb-3">{message.text}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => openEditMessage(message, index)}>
                    <Edit className="h-3 w-3" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A sequencia sera salva novamente sem esta mensagem.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                        <p className="line-clamp-2">{message.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">Ordem {message.order}</p>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMessage(message)} disabled={isSavingMessage}>
                          {isSavingMessage ? "Excluindo..." : "Excluir mensagem"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {selectedSequence && sequenceMessages.length === 0 && !sequenceMessagesQuery.isFetching ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Esta sequencia ainda nao tem mensagens. Adicione uma mensagem para testar a persistencia real.
          </div>
        ) : null}

        <Button variant="outline" className="w-full mt-4 border-dashed gap-1.5" onClick={openCreateMessage} disabled={!selectedSequence}>
          <Plus className="h-4 w-4" /> Adicionar mensagem
        </Button>
      </Card>

      <Dialog open={sequenceDialogOpen} onOpenChange={setSequenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sequenceDraft.id ? "Editar sequência" : "Nova sequência"}</DialogTitle>
            <DialogDescription>As alteracoes serao enviadas para o backend Laravel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sequence-name">Nome</Label>
              <Input id="sequence-name" value={sequenceDraft.name} onChange={(event) => setSequenceDraft((draft) => ({ ...draft, name: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sequence-status">Status</Label>
                <select
                  id="sequence-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={sequenceDraft.status}
                  onChange={(event) => setSequenceDraft((draft) => ({ ...draft, status: event.target.value as SequenceStatus }))}
                >
                  <option value="ativo">Ativa</option>
                  <option value="pausado">Pausada</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sequence-delay">Atraso base</Label>
                <Input id="sequence-delay" value={sequenceDraft.delay} onChange={(event) => setSequenceDraft((draft) => ({ ...draft, delay: event.target.value }))} placeholder="Ex: 30s, 1h, 1 dia" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSequenceDialogOpen(false)} disabled={isSavingSequence}>Cancelar</Button>
            <Button onClick={saveSequence} disabled={isSavingSequence}>{isSavingSequence ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{messageDraft.index !== undefined ? "Editar mensagem" : "Nova mensagem"}</DialogTitle>
            <DialogDescription>Mensagens sao persistidas atualizando a sequencia selecionada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr] gap-3">
              <div className="space-y-2">
                <Label htmlFor="message-order">Ordem</Label>
                <Input id="message-order" type="number" min={1} value={messageDraft.order} onChange={(event) => setMessageDraft((draft) => ({ ...draft, order: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-delay">Atraso</Label>
                <Input id="message-delay" value={messageDraft.delay} onChange={(event) => setMessageDraft((draft) => ({ ...draft, delay: event.target.value }))} placeholder="Ex: 0s, 30s" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-type">Tipo</Label>
                <select
                  id="message-type"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={messageDraft.type}
                  onChange={(event) => setMessageDraft((draft) => ({ ...draft, type: event.target.value as MessageDraft["type"] }))}
                >
                  <option value="text">Texto</option>
                  <option value="audio">Audio</option>
                  <option value="template">Template</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-text">Conteudo</Label>
              <Textarea id="message-text" value={messageDraft.text} onChange={(event) => setMessageDraft((draft) => ({ ...draft, text: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-note">Nota interna</Label>
              <Input id="message-note" value={messageDraft.note} onChange={(event) => setMessageDraft((draft) => ({ ...draft, note: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)} disabled={isSavingMessage}>Cancelar</Button>
            <Button onClick={saveMessage} disabled={isSavingMessage}>{isSavingMessage ? "Salvando..." : "Salvar mensagem"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
