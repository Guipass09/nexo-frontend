import { useEffect, useMemo, useState } from "react";
import { Bot, BrainCircuit, ChevronDown, ChevronUp, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAiAgentProfile, useUpdateAiAgentProfile } from "@/hooks/use-app-data";

type PromptDraft = {
  id: string;
  title: string;
  content: string;
};

function makePromptDraft(index: number): PromptDraft {
  return {
    id: `draft:${Date.now()}:${index}:${Math.random().toString(36).slice(2, 8)}`,
    title: `Prompt ${index}`,
    content: "",
  };
}

export default function AgentIa() {
  const { toast } = useToast();
  const { data, isLoading, error, isError } = useAiAgentProfile();
  const updateMutation = useUpdateAiAgentProfile();
  const [enabled, setEnabled] = useState(false);
  const [prompts, setPrompts] = useState<PromptDraft[]>([makePromptDraft(1)]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setEnabled(data.enabled);
    setPrompts(
      data.prompts.length > 0
        ? data.prompts.map((prompt, index) => ({
            id: prompt.id || `prompt:${index}`,
            title: prompt.title?.trim() || `Prompt ${index + 1}`,
            content: prompt.content,
          }))
        : [makePromptDraft(1)],
    );
  }, [data]);

  const combinedPromptPreview = useMemo(() => {
    return prompts
      .map((prompt) => {
        const title = prompt.title.trim();
        const content = prompt.content.trim();

        if (!content) {
          return "";
        }

        return `${title ? `${title}:\n` : ""}${content}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }, [prompts]);

  const handlePromptChange = (id: string, field: "title" | "content", value: string) => {
    setPrompts((current) => current.map((prompt) => (
      prompt.id === id
        ? { ...prompt, [field]: value }
        : prompt
    )));
  };

  const handleAddPrompt = () => {
    setPrompts((current) => [...current, makePromptDraft(current.length + 1)]);
  };

  const handleMovePrompt = (id: string, direction: "up" | "down") => {
    setPrompts((current) => {
      const index = current.findIndex((prompt) => prompt.id === id);

      if (index < 0) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);

      return next;
    });
  };

  const handleRemovePrompt = (id: string) => {
    setPrompts((current) => {
      if (current.length === 1) {
        return [makePromptDraft(1)];
      }

      return current.filter((prompt) => prompt.id !== id);
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      enabled,
      prompts: prompts
        .map((prompt) => ({
          title: prompt.title.trim() || undefined,
          content: prompt.content.trim(),
        }))
        .filter((prompt) => prompt.content !== ""),
    }, {
      onSuccess: () => {
        toast({
          title: "Agent IA atualizado",
          description: enabled
            ? "O Agent IA esta ativo e agora tem prioridade sobre os fluxos automaticos."
            : "O Agent IA foi salvo e esta desativado no momento.",
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Falha ao salvar Agent IA",
          description: getApiErrorMessage(mutationError),
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AGENT IA</h1>
          <p className="text-sm text-muted-foreground">
            Acumule prompts de atendimento e ligue o Agent IA para responder com autonomia usando todas as instrucoes ao mesmo tempo.
          </p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={updateMutation.isPending || isLoading}>
          <Save className="h-4 w-4" />
          Salvar Agent IA
        </Button>
      </div>

      {isError && (
        <Card className="p-4 border-destructive/40 text-sm text-destructive">
          Erro ao carregar Agent IA: {getApiErrorMessage(error)}
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="p-5 md:p-6 border-border/60">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Motor do Agent IA</h2>
                    <Badge variant={enabled ? "default" : "secondary"}>
                      {enabled ? "Ligado" : "Desligado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Quando ligado, o Agent IA atende primeiro e os fluxos automaticos ficam em segundo plano para novas mensagens recebidas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
                <div className="text-right">
                  <p className="text-sm font-medium">Ativar Agent IA</p>
                  <p className="text-xs text-muted-foreground">Prioridade sobre fluxos</p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </div>
          </Card>

          <Card className="p-5 md:p-6 border-border/60">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Prompts acumulados</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cada prompt e somado ao contexto do Agent IA. Organize em partes como empresa, tom de voz, politica comercial, plataforma e excecoes.
                </p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleAddPrompt}>
                <Plus className="h-4 w-4" />
                Novo prompt
              </Button>
            </div>

            <div className="space-y-4">
              {prompts.map((prompt, index) => (
                <Card key={prompt.id} className="p-4 border-border/70 bg-muted/10">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Prompt {index + 1}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {prompt.content.trim() ? `${prompt.content.trim().length} caracteres` : "Sem conteudo"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMovePrompt(prompt.id, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMovePrompt(prompt.id, "down")}
                        disabled={index === prompts.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePrompt(prompt.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Titulo do prompt</Label>
                      <Input
                        value={prompt.title}
                        onChange={(event) => handlePromptChange(prompt.id, "title", event.target.value)}
                        placeholder={`Ex.: Contexto da empresa, Politica comercial, Horario de atendimento...`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conteudo</Label>
                      <Textarea
                        rows={8}
                        value={prompt.content}
                        onChange={(event) => handlePromptChange(prompt.id, "content", event.target.value)}
                        placeholder="Descreva o que a IA precisa saber neste bloco de contexto."
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 md:p-6 border-border/60">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Como o Agent IA vai atender</h2>
                <p className="text-sm text-muted-foreground">
                  O sistema junta todos os prompts abaixo, le o historico recente da conversa e responde com autonomia quando o Agent IA estiver ligado.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                <p className="font-medium">Prioridade operacional</p>
                <p className="text-muted-foreground mt-1">
                  Ligado: Agent IA responde primeiro e ignora fluxos para novas mensagens. Desligado: os fluxos continuam funcionando normalmente.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                <p className="font-medium">Prompts acumulados</p>
                <p className="text-muted-foreground mt-1">
                  A IA usa todos os prompts ao mesmo tempo, sem substituir o anterior, para tomar decisoes e formular respostas mais completas.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                <p className="font-medium">Edicao simples</p>
                <p className="text-muted-foreground mt-1">
                  Separe por assunto: empresa, plataforma, horario, regras de vendas, objecoes, linguagem e atendimento humano.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 md:p-6 border-border/60">
            <h2 className="text-lg font-semibold mb-2">Previa do contexto combinado</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Esta e a ordem em que o Agent IA vai ler o material salvo.
            </p>
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-4">
              <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-foreground/90">
                {combinedPromptPreview || "Adicione pelo menos um prompt com conteudo para formar o contexto do Agent IA."}
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
