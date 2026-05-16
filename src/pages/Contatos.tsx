import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/use-app-data";
import { Plus, Search, Filter, Phone, Download, MoreVertical, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "@/hooks/use-toast";

type ContactDraft = {
  name: string;
  phone: string;
  origin: string;
  status: string;
  tags: string;
  flow: string;
  responsible: string;
};

const emptyContactDraft: ContactDraft = {
  name: "",
  phone: "",
  origin: "Manual",
  status: "ativo",
  tags: "",
  flow: "",
  responsible: "",
};

export default function Contatos() {
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContactDraft);
  const { data: contacts = [], error, isError } = useContacts();
  const createContactMutation = useCreateContact();
  const deleteContactMutation = useDeleteContact();

  const openCreateContact = () => {
    setContactDraft(emptyContactDraft);
    setContactDialogOpen(true);
  };

  const saveContact = () => {
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) {
      toast({
        title: "Campos obrigatorios",
        description: "Informe nome e telefone do contato.",
        variant: "destructive",
      });
      return;
    }

    createContactMutation.mutate({
      name: contactDraft.name.trim(),
      phone: contactDraft.phone.trim(),
      origin: contactDraft.origin.trim() || "Manual",
      status: contactDraft.status.trim() || "ativo",
      tags: contactDraft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      flow: contactDraft.flow.trim(),
      responsible: contactDraft.responsible.trim(),
    }, {
      onSuccess: () => {
        toast({ title: "Contato criado", description: "O contato foi salvo no backend." });
        setContactDialogOpen(false);
      },
      onError: (mutationError) => {
        toast({
          title: "Falha ao criar contato",
          description: getApiErrorMessage(mutationError, "Verifique se POST /api/contacts existe no backend."),
          variant: "destructive",
        });
      },
    });
  };

  const removeContact = (contactId: string, contactName: string) => {
    deleteContactMutation.mutate(contactId, {
      onSuccess: () => {
        toast({
          title: "Contato excluido",
          description: `${contactName} foi removido e o historico desse numero foi resetado.`,
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Falha ao excluir contato",
          description: getApiErrorMessage(mutationError, "Nao foi possivel excluir o contato agora."),
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {isError && (
        <Card className="p-4 border-destructive/40 text-sm text-destructive">
          Erro ao carregar /contacts: {getApiErrorMessage(error)}
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone ou tag..." className="pl-9 bg-secondary/40" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5"><Filter className="h-4 w-4" /> Filtros</Button>
          <Button variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> Exportar</Button>
          <Button className="gradient-primary text-primary-foreground gap-1.5" onClick={openCreateContact}>
            <Plus className="h-4 w-4" /> Novo contato
          </Button>
        </div>
      </div>

      <Card className="border-border/60 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Nenhum contato ainda</h3>
              <p className="text-sm text-muted-foreground">
                Conecte seu WhatsApp para receber contatos automaticamente ou cadastre o primeiro manualmente.
              </p>
            </div>
            <Button className="gradient-primary text-primary-foreground gap-1.5" onClick={openCreateContact}>
              <Plus className="h-4 w-4" /> Novo contato
            </Button>
          </div>
        ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Origem</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Tags</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Fluxo atual</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Última interação</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-secondary/30 transition-smooth">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.origin}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((t) => <StatusBadge key={t} status={t} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{c.flow}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{c.lastInteraction}</td>
                  <td className="px-4 py-3 text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(event) => event.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir contato
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso vai remover o contato, as conversas e o historico vinculado a esse numero.
                            Depois disso, o sistema vai tratar esse numero como se nunca tivesse visto antes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeContact(c.id, c.name)}
                            disabled={deleteContactMutation.isPending}
                          >
                            {deleteContactMutation.isPending ? "Excluindo..." : "Excluir contato"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {contacts.length === 0
              ? "Nenhum contato cadastrado neste workspace."
              : `Mostrando 1-${contacts.length} de ${contacts.length} contatos`}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7">Anterior</Button>
            <Button variant="outline" size="sm" className="h-7">Próximo</Button>
          </div>
        </div>
      </Card>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo contato</DialogTitle>
            <DialogDescription>O cadastro sera enviado para o backend Laravel quando o endpoint estiver disponivel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Nome</Label>
                <Input id="contact-name" value={contactDraft.name} onChange={(event) => setContactDraft((draft) => ({ ...draft, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Telefone</Label>
                <Input id="contact-phone" value={contactDraft.phone} onChange={(event) => setContactDraft((draft) => ({ ...draft, phone: event.target.value }))} placeholder="5511999999999" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contact-origin">Origem</Label>
                <Input id="contact-origin" value={contactDraft.origin} onChange={(event) => setContactDraft((draft) => ({ ...draft, origin: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-status">Status</Label>
                <Input id="contact-status" value={contactDraft.status} onChange={(event) => setContactDraft((draft) => ({ ...draft, status: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-tags">Tags</Label>
              <Input id="contact-tags" value={contactDraft.tags} onChange={(event) => setContactDraft((draft) => ({ ...draft, tags: event.target.value }))} placeholder="lead, premium" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contact-flow">Fluxo</Label>
                <Input id="contact-flow" value={contactDraft.flow} onChange={(event) => setContactDraft((draft) => ({ ...draft, flow: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-responsible">Responsavel</Label>
                <Input id="contact-responsible" value={contactDraft.responsible} onChange={(event) => setContactDraft((draft) => ({ ...draft, responsible: event.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)} disabled={createContactMutation.isPending}>Cancelar</Button>
            <Button onClick={saveContact} disabled={createContactMutation.isPending}>
              {createContactMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
