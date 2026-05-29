import { useMemo, useState } from "react";
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
import { useCreateTemplate, useDeleteTemplate, useSyncTemplates, useTemplates, useUpdateTemplate } from "@/hooks/use-app-data";
import { Search, FileText, Mic, BadgeCheck, RefreshCw, Plus, Edit, Trash2 } from "lucide-react";
import { getStoredAuthUser } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Template } from "@/types/domain";
import { getApiErrorMessage } from "@/lib/api/client";

type TemplateDraft = {
  id?: string;
  name: string;
  category: string;
  type: Template["type"];
  status: Template["status"];
  content: string;
};

const emptyTemplateDraft: TemplateDraft = {
  name: "",
  category: "",
  type: "Texto",
  status: "rascunho",
  content: "",
};

function templateToDraft(template: Template): TemplateDraft {
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    type: template.type,
    status: template.status,
    content: template.content ?? template.text,
  };
}

export default function Templates() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(emptyTemplateDraft);
  const { data: templates = [] } = useTemplates();
  const syncMutation = useSyncTemplates();
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();
  const user = getStoredAuthUser();
  const isAdmin = user?.role === "admin";
  const isSavingTemplate = createTemplateMutation.isPending || updateTemplateMutation.isPending;
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(templates.map((template) => template.category).filter(Boolean)));
    return ["Todas", ...uniqueCategories];
  }, [templates]);
  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return templates.filter((template) => {
      const matchesCategory = category === "Todas" || template.category === category;
      const searchable = [template.name, template.category, template.language, template.metaName, template.metaStatus, template.text]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return matchesCategory && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [category, search, templates]);

  const handleSyncTemplates = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (response) => {
        toast({
          title: "Templates sincronizados",
          description: `${response.data.synced} aprovados · ${response.data.created} novos · ${response.data.updated} atualizados`,
        });
      },
      onError: (error) => {
        toast({
          title: "Falha na sincronizacao",
          description: getApiErrorMessage(error, "Verifique as credenciais da Cloud API e tente novamente."),
          variant: "destructive",
        });
      },
    });
  };

  const openCreateTemplate = () => {
    setTemplateDraft(emptyTemplateDraft);
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (template: Template) => {
    setTemplateDraft(templateToDraft(template));
    setTemplateDialogOpen(true);
  };

  const saveTemplate = () => {
    if (!templateDraft.name.trim() || !templateDraft.category.trim() || !templateDraft.content.trim()) {
      toast({
        title: "Campos obrigatorios",
        description: "Informe nome, categoria e conteudo do template.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: templateDraft.name.trim(),
      category: templateDraft.category.trim(),
      type: templateDraft.type,
      status: templateDraft.status,
      content: templateDraft.content.trim(),
    };

    if (templateDraft.id) {
      updateTemplateMutation.mutate({ templateId: templateDraft.id, payload }, {
        onSuccess: () => {
          toast({ title: "Template atualizado", description: "As alteracoes foram salvas no backend." });
          setTemplateDialogOpen(false);
        },
        onError: (error) => toast({ title: "Falha ao atualizar template", description: getApiErrorMessage(error), variant: "destructive" }),
      });
      return;
    }

    createTemplateMutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Template criado", description: "O novo template foi salvo no backend." });
        setTemplateDialogOpen(false);
      },
      onError: (error) => toast({ title: "Falha ao criar template", description: getApiErrorMessage(error), variant: "destructive" }),
    });
  };

  const deleteTemplate = (template: Template) => {
    deleteTemplateMutation.mutate(template.id, {
      onSuccess: () => toast({ title: "Template excluido", description: "O template foi removido do backend." }),
      onError: (error) => toast({ title: "Falha ao excluir template", description: getApiErrorMessage(error), variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates, categorias ou variáveis..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <Button variant="outline" className="gap-1.5" onClick={handleSyncTemplates} disabled={syncMutation.isPending}>
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} /> Sincronizar Meta
            </Button>
          ) : null}
          <Button variant="outline" className="gap-1.5" onClick={openCreateTemplate}>
            <Plus className="h-4 w-4" /> Novo template
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-smooth",
              category === c ? "gradient-primary text-primary-foreground shadow-sm" : "bg-white/75 text-muted-foreground hover:bg-white hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((t) => {
          const Icon = t.type === "Áudio" ? Mic : FileText;
          return (
            <Card key={t.id} className="group p-5 transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${t.type === "Áudio" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <StatusBadge status={t.status} />
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate">{t.name}</h3>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{t.category}</p>
                {t.language ? <span className="text-[10px] rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">{t.language}</span> : null}
                {t.isOfficial ? (
                  <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-success/10 px-1.5 py-0.5 text-success">
                    <BadgeCheck className="h-2.5 w-2.5" /> oficial
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">{t.text}</p>
              {t.metaStatus ? (
                <p className="text-[11px] text-muted-foreground mb-3">
                  Meta: <span className="font-medium">{t.metaStatus}</span>{t.metaName ? ` · ${t.metaName}` : ""}
                </p>
              ) : !t.isOfficial ? (
                <p className="text-[11px] text-warning mb-3">
                  Rascunho local: nao envia pela API do WhatsApp ate existir/aprovar na Meta.
                </p>
              ) : null}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">{t.isOfficial ? "Gerenciado pela Meta" : "Local"}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEditTemplate(t)}>
                    <Edit className="h-3 w-3" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir template?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acao remove o template do backend. Templates oficiais podem voltar em uma proxima sincronizacao da Meta.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.category} · {t.status}{t.isOfficial ? " · oficial Meta" : ""}</p>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTemplate(t)} disabled={deleteTemplateMutation.isPending}>
                          {deleteTemplateMutation.isPending ? "Excluindo..." : "Excluir template"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {filteredTemplates.length === 0 ? (
        <Card className="p-6 border-border/60">
          <p className="text-sm text-muted-foreground">Nenhum template encontrado para os filtros atuais.</p>
        </Card>
      ) : null}

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{templateDraft.id ? "Editar template" : "Novo template"}</DialogTitle>
            <DialogDescription>
              As alteracoes serao enviadas para o backend Laravel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome</Label>
              <Input id="template-name" value={templateDraft.name} onChange={(event) => setTemplateDraft((draft) => ({ ...draft, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-category">Categoria</Label>
              <Input id="template-category" value={templateDraft.category} onChange={(event) => setTemplateDraft((draft) => ({ ...draft, category: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="template-type">Tipo</Label>
                <select
                  id="template-type"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={templateDraft.type}
                  onChange={(event) => setTemplateDraft((draft) => ({ ...draft, type: event.target.value as Template["type"] }))}
                >
                  <option value="Texto">Texto</option>
                  <option value="Áudio">Audio</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-status">Status</Label>
                <select
                  id="template-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={templateDraft.status}
                  onChange={(event) => setTemplateDraft((draft) => ({ ...draft, status: event.target.value as Template["status"] }))}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="ativo">Ativo</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Conteudo</Label>
              <Textarea
                id="template-content"
                value={templateDraft.content}
                onChange={(event) => setTemplateDraft((draft) => ({ ...draft, content: event.target.value }))}
                placeholder="Ex.: Olá {{nome}}, sua avaliação está confirmada para {{data}}."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} disabled={isSavingTemplate}>Cancelar</Button>
            <Button onClick={saveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
