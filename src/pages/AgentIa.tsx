import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Bot,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Handshake,
  KeyRound,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  composeVirtualAgentFromWizard,
  wizardInitialAnswers,
  wizardSteps,
  type WizardAnswerKey,
  type WizardAnswerMap,
} from "@/lib/ai-agent-persona";
import {
  useAiAgentProfile,
  useCreateAiAgentProfile,
  useDeleteAiAgentProfile,
  useUpdateAiAgentProfile,
} from "@/hooks/use-app-data";
import type { AiAgentProfile, AiAgentTriggerType, AiAgentVirtualAgent } from "@/types/domain";

const emptyVirtualAgent: AiAgentVirtualAgent = {
  agentName: "",
  roleTitle: "Atendente virtual",
  businessName: "",
  segment: "",
  primaryGoal: "",
  tone: "acolhedor, claro, profissional e natural no WhatsApp",
  businessDescription: "",
  services: "",
  faq: "",
  operatingHours: "",
  pricingPolicy: "",
  schedulingInstructions: "",
  handoffRules: "",
  boundaries: "",
  extraKnowledge: "",
};

type FieldKey = keyof AiAgentVirtualAgent;

function mergeVirtualAgent(value?: Partial<AiAgentVirtualAgent> | null): AiAgentVirtualAgent {
  return {
    ...emptyVirtualAgent,
    ...(value ?? {}),
  };
}

function normalizeProfileId(id?: string | number | null) {
  return id == null ? null : String(id);
}

function profilesFromResponse(data?: AiAgentProfile | null): AiAgentProfile[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data.profiles) && data.profiles.length > 0) {
    return data.profiles;
  }

  return [data];
}

function parseKeywords(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword, index, list) => {
      const normalized = keyword.toLocaleLowerCase("pt-BR");
      return list.findIndex((item) => item.toLocaleLowerCase("pt-BR") === normalized) === index;
    })
    .slice(0, 30);
}

function triggerLabel(triggerType?: AiAgentTriggerType) {
  switch (triggerType) {
    case "unsaved_contacts":
      return "Nao salvos";
    case "saved_contacts":
      return "Salvos";
    case "keyword":
      return "Palavra-chave";
    default:
      return "Todos";
  }
}

export default function AgentIa() {
  const { toast } = useToast();
  const { data, isLoading, error, isError } = useAiAgentProfile();
  const updateMutation = useUpdateAiAgentProfile();
  const createProfileMutation = useCreateAiAgentProfile();
  const deleteProfileMutation = useDeleteAiAgentProfile();
  const [profiles, setProfiles] = useState<AiAgentProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Assistente principal");
  const [triggerType, setTriggerType] = useState<AiAgentTriggerType>("all_contacts");
  const [triggerKeywordsText, setTriggerKeywordsText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [allowSavedContacts, setAllowSavedContacts] = useState(true);
  const [virtualAgent, setVirtualAgent] = useState<AiAgentVirtualAgent>(emptyVirtualAgent);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswerMap>(wizardInitialAnswers);

  const applyProfileToForm = (profile: AiAgentProfile) => {
    setActiveProfileId(normalizeProfileId(profile.id));
    setProfileName(profile.name || "Assistente principal");
    setTriggerType(profile.triggerType ?? (profile.allowSavedContacts === false ? "unsaved_contacts" : "all_contacts"));
    setTriggerKeywordsText((profile.triggerKeywords ?? []).join("\n"));
    setEnabled(profile.enabled);
    setAllowSavedContacts(profile.allowSavedContacts ?? true);
    setVirtualAgent(mergeVirtualAgent(profile.virtualAgent));
  };

  useEffect(() => {
    if (!data) {
      return;
    }

    const nextProfiles = profilesFromResponse(data);
    const active =
      nextProfiles.find((profile) => normalizeProfileId(profile.id) === activeProfileId) ??
      nextProfiles[0];

    setProfiles(nextProfiles);

    if (active) {
      applyProfileToForm(active);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const filledFieldsCount = useMemo(() => {
    return Object.values(virtualAgent).filter((value) => value.trim() !== "").length;
  }, [virtualAgent]);

  const contextPreview = useMemo(() => {
    const lines = [
      virtualAgent.agentName && `Nome da pessoa virtual: ${virtualAgent.agentName}`,
      virtualAgent.roleTitle && `Papel: ${virtualAgent.roleTitle}`,
      virtualAgent.businessName && `Empresa/profissional: ${virtualAgent.businessName}`,
      virtualAgent.segment && `Segmento: ${virtualAgent.segment}`,
      virtualAgent.primaryGoal && `Objetivo principal: ${virtualAgent.primaryGoal}`,
      virtualAgent.tone && `Tom: ${virtualAgent.tone}`,
      virtualAgent.businessDescription && `Sobre o negocio:\n${virtualAgent.businessDescription}`,
      virtualAgent.services && `Servicos/produtos:\n${virtualAgent.services}`,
      virtualAgent.operatingHours && `Horario:\n${virtualAgent.operatingHours}`,
      virtualAgent.pricingPolicy && `Valores:\n${virtualAgent.pricingPolicy}`,
      virtualAgent.schedulingInstructions && `Agendamento:\n${virtualAgent.schedulingInstructions}`,
      virtualAgent.faq && `Duvidas frequentes:\n${virtualAgent.faq}`,
      virtualAgent.handoffRules && `Quando chamar humano:\n${virtualAgent.handoffRules}`,
      virtualAgent.boundaries && `Limites:\n${virtualAgent.boundaries}`,
      virtualAgent.extraKnowledge && `Conhecimento extra:\n${virtualAgent.extraKnowledge}`,
    ].filter(Boolean);

    return lines.join("\n\n");
  }, [virtualAgent]);

  const updateField = (field: FieldKey, value: string) => {
    setVirtualAgent((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const wizardProgress = ((wizardStepIndex + 1) / (wizardSteps.length + 1)) * 100;
  const isWizardReviewStep = wizardStepIndex >= wizardSteps.length;
  const currentWizardStep = wizardSteps[Math.min(wizardStepIndex, wizardSteps.length - 1)];
  const generatedVirtualAgent = useMemo(() => {
    return composeVirtualAgentFromWizard(wizardAnswers);
  }, [wizardAnswers]);

  const openWizard = () => {
    setWizardAnswers({
      agentName: virtualAgent.agentName,
      businessName: virtualAgent.businessName,
      segment: virtualAgent.segment,
      audience: "",
      mainGoal: virtualAgent.primaryGoal,
      businessSummary: virtualAgent.businessDescription,
      services: virtualAgent.services,
      process: "",
      faq: virtualAgent.faq,
      hours: virtualAgent.operatingHours,
      pricing: virtualAgent.pricingPolicy,
      scheduling: virtualAgent.schedulingInstructions,
      handoff: virtualAgent.handoffRules,
      limits: virtualAgent.boundaries,
      tone: virtualAgent.tone,
    });
    setWizardStepIndex(0);
    setWizardOpen(true);
  };

  const updateWizardAnswer = (key: WizardAnswerKey, value: string) => {
    setWizardAnswers((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const applyWizardResult = () => {
    setVirtualAgent(generatedVirtualAgent);
    setWizardOpen(false);
    toast({
      title: "Ficha do Agent IA preenchida",
      description: "Revise os campos e clique em Salvar Agent IA para publicar no atendimento.",
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      profileId: activeProfileId,
      name: profileName,
      enabled,
      allowSavedContacts,
      triggerType,
      triggerKeywords: parseKeywords(triggerKeywordsText),
      prompts: [],
      virtualAgent,
    }, {
      onSuccess: () => {
        toast({
          title: "Agent IA atualizado",
          description: enabled
            ? "A pessoa virtual esta ligada e vai responder usando contexto, memoria e historico."
            : "A pessoa virtual foi salva e esta desligada no momento.",
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

  const handleSelectProfile = (profile: AiAgentProfile) => {
    applyProfileToForm(profile);
  };

  const handleCreateProfile = () => {
    createProfileMutation.mutate({
      name: `Assistente ${profiles.length + 1}`,
      triggerType: "keyword",
    }, {
      onSuccess: (result) => {
        const nextProfiles = profilesFromResponse(result);
        const created = nextProfiles[nextProfiles.length - 1] ?? nextProfiles[0];
        setProfiles(nextProfiles);

        if (created) {
          applyProfileToForm(created);
        }

        toast({
          title: "Novo assistente criado",
          description: "Configure um gatilho diferente antes de ligar.",
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Falha ao criar assistente",
          description: getApiErrorMessage(mutationError),
          variant: "destructive",
        });
      },
    });
  };

  const handleDeleteProfile = () => {
    if (!activeProfileId) {
      return;
    }

    deleteProfileMutation.mutate(activeProfileId, {
      onSuccess: (result) => {
        const nextProfiles = profilesFromResponse(result);
        setProfiles(nextProfiles);

        if (nextProfiles[0]) {
          applyProfileToForm(nextProfiles[0]);
        }

        toast({
          title: "Assistente removido",
          description: "As proximas conversas vao usar os assistentes restantes.",
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Falha ao remover assistente",
          description: getApiErrorMessage(mutationError),
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_55%,_#ecfdf5_100%)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Pessoa virtual do atendimento
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Agent IA que entende contexto, memoria e conversa.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Preencha fatos sobre o negocio. O Nexo ja entra com a personalidade humana, e a OpenAI decide a melhor resposta sem depender de frases prontas.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm min-w-[260px]">
            <Button type="button" variant="outline" className="gap-2" onClick={openWizard}>
              <Wand2 className="h-4 w-4" />
              Criar automaticamente
            </Button>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Atendimento automatico</p>
                <p className="text-xs text-slate-500">Prioridade sobre fluxos</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Responder contatos salvos</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Desligue para atender apenas numeros novos no WhatsApp conectado.
                  </p>
                </div>
                <Switch checked={allowSavedContacts} onCheckedChange={setAllowSavedContacts} />
              </div>
            </div>
            <Badge variant={enabled ? "default" : "secondary"} className="w-fit">
              {enabled ? "Ligado" : "Desligado"}
            </Badge>
            <Button className="gap-2" onClick={handleSave} disabled={updateMutation.isPending || isLoading}>
              <Save className="h-4 w-4" />
              Salvar Agent IA
            </Button>
          </div>
        </div>
      </section>

      {isError && (
        <Card className="border-destructive/40 p-4 text-sm text-destructive">
          Erro ao carregar Agent IA: {getApiErrorMessage(error)}
        </Card>
      )}

      <Card className="border-border/60 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Assistentes e gatilhos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use mais de um assistente ligado, desde que cada um tenha um gatilho diferente.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                onClick={handleCreateProfile}
                disabled={createProfileMutation.isPending || isLoading}
              >
                <Plus className="h-4 w-4" />
                Novo assistente
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {profiles.map((profile, index) => {
                const id = normalizeProfileId(profile.id) ?? `profile-${index}`;
                const isActive = id === activeProfileId;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectProfile(profile)}
                    className={[
                      "min-w-[190px] rounded-2xl border px-4 py-3 text-left transition",
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/30",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-950">
                        {profile.name || `Assistente ${index + 1}`}
                      </span>
                      <Badge variant={profile.enabled ? "default" : "secondary"}>
                        {profile.enabled ? "Ligado" : "Off"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Gatilho: {triggerLabel(profile.triggerType)}
                    </p>
                    {profile.triggerType === "keyword" && (profile.triggerKeywords ?? []).length > 0 && (
                      <p className="mt-1 truncate text-xs text-primary">
                        {(profile.triggerKeywords ?? []).join(", ")}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-border/70 bg-muted/20 p-4 xl:w-[430px]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <Field label="Nome deste assistente">
                <Input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="Ex.: Captação de novos contatos"
                />
              </Field>
              <Field label="Gatilho de ativação">
                <Select value={triggerType} onValueChange={(value) => setTriggerType(value as AiAgentTriggerType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_contacts">Todos os contatos</SelectItem>
                    <SelectItem value="unsaved_contacts">Apenas contatos não salvos</SelectItem>
                    <SelectItem value="saved_contacts">Apenas contatos salvos</SelectItem>
                    <SelectItem value="keyword">Palavra-chave</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {triggerType === "keyword" && (
              <Field label="Palavras-chave">
                <Textarea
                  rows={3}
                  value={triggerKeywordsText}
                  onChange={(event) => setTriggerKeywordsText(event.target.value)}
                  placeholder={"Ex.: avaliacao\norcamento\nquero agendar"}
                />
              </Field>
            )}

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs leading-5 text-amber-950">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <KeyRound className="h-3.5 w-3.5" />
                Trava de conversa ativa
              </div>
              Quando um assistente assumir uma conversa, esse gatilho fica seguro ate o atendimento terminar.
              Palavra-chave enviada no meio nao troca o assistente.
            </div>

            <Button
              type="button"
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleDeleteProfile}
              disabled={profiles.length <= 1 || !activeProfileId || deleteProfileMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Remover assistente atual
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl p-0">
          <div className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_100%)]">
            <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Assistente de criacao
              </div>
              <DialogTitle className="text-2xl">Criar Agent IA automaticamente</DialogTitle>
              <DialogDescription>
                Responda uma pergunta por vez. No final, o Nexo monta a ficha no formato mais claro para a IA entender o negocio.
              </DialogDescription>
              <div className="pt-2">
                <Progress value={wizardProgress} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {isWizardReviewStep
                    ? "Revisao final"
                    : `Pergunta ${wizardStepIndex + 1} de ${wizardSteps.length}`}
                </p>
              </div>
            </DialogHeader>

            <div className="px-6 py-6">
              {!isWizardReviewStep ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border/70 bg-white/85 p-5 shadow-sm">
                    <Badge variant="secondary" className="mb-3">
                      {currentWizardStep.title}
                    </Badge>
                    <h3 className="text-xl font-semibold text-slate-950">
                      {currentWizardStep.question}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {currentWizardStep.helper}
                    </p>
                  </div>

                  <Field label="Resposta">
                    {currentWizardStep.compact ? (
                      <Input
                        autoFocus
                        value={wizardAnswers[currentWizardStep.key]}
                        onChange={(event) => updateWizardAnswer(currentWizardStep.key, event.target.value)}
                        placeholder={currentWizardStep.placeholder}
                      />
                    ) : (
                      <Textarea
                        autoFocus
                        rows={7}
                        value={wizardAnswers[currentWizardStep.key]}
                        onChange={(event) => updateWizardAnswer(currentWizardStep.key, event.target.value)}
                        placeholder={currentWizardStep.placeholder}
                      />
                    )}
                  </Field>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-950">
                    <strong>Como isso sera usado:</strong> essa resposta vira conhecimento estruturado.
                    A IA nao copia como texto fixo; ela usa para entender perguntas e responder naturalmente.
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                    <h3 className="text-xl font-semibold text-emerald-950">
                      Ficha pronta para preencher o Agent IA
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                      O conteudo abaixo sera aplicado nos campos da tela. Depois voce ainda pode editar manualmente antes de salvar.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <PreviewPill label="Nome" value={generatedVirtualAgent.agentName || "Nao informado"} />
                    <PreviewPill label="Empresa" value={generatedVirtualAgent.businessName || "Nao informado"} />
                    <PreviewPill label="Segmento" value={generatedVirtualAgent.segment || "Nao informado"} />
                    <PreviewPill label="Tom" value={generatedVirtualAgent.tone || "Nao informado"} />
                  </div>
                  <div className="rounded-2xl border border-dashed border-border/70 bg-white/85 p-4">
                    <pre className="max-h-[360px] whitespace-pre-wrap break-words text-xs leading-6 text-slate-800">
                      {[
                        generatedVirtualAgent.businessDescription && `Resumo:\n${generatedVirtualAgent.businessDescription}`,
                        generatedVirtualAgent.services && `Servicos e funcionamento:\n${generatedVirtualAgent.services}`,
                        generatedVirtualAgent.faq && `Duvidas importantes:\n${generatedVirtualAgent.faq}`,
                        generatedVirtualAgent.operatingHours && `Horario:\n${generatedVirtualAgent.operatingHours}`,
                        generatedVirtualAgent.pricingPolicy && `Valores:\n${generatedVirtualAgent.pricingPolicy}`,
                        generatedVirtualAgent.schedulingInstructions && `Agendamento:\n${generatedVirtualAgent.schedulingInstructions}`,
                      ].filter(Boolean).join("\n\n")}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/60 bg-white/80 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWizardStepIndex((current) => Math.max(0, current - 1))}
                disabled={wizardStepIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              {!isWizardReviewStep ? (
                <Button
                  type="button"
                  onClick={() => setWizardStepIndex((current) => Math.min(wizardSteps.length, current + 1))}
                  className="gap-2"
                >
                  Confirmar e continuar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={applyWizardResult} className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Aplicar na ficha
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <div className="space-y-6">
          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={UserRound}
              title="Identidade da pessoa virtual"
              description="Defina quem ela representa. Isso nao vira texto fixo, vira contexto para a IA agir com naturalidade."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nome da pessoa virtual">
                <Input
                  value={virtualAgent.agentName}
                  onChange={(event) => updateField("agentName", event.target.value)}
                  placeholder="Ex.: Sofia, Nexo IA, Atendimento Sementes"
                />
              </Field>
              <Field label="Papel no atendimento">
                <Input
                  value={virtualAgent.roleTitle}
                  onChange={(event) => updateField("roleTitle", event.target.value)}
                  placeholder="Ex.: Atendente virtual, consultora inicial"
                />
              </Field>
              <Field label="Nome da empresa ou profissional">
                <Input
                  value={virtualAgent.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  placeholder="Ex.: Sementes da Fala"
                />
              </Field>
              <Field label="Segmento">
                <Input
                  value={virtualAgent.segment}
                  onChange={(event) => updateField("segment", event.target.value)}
                  placeholder="Ex.: Fonoaudiologia online infantil"
                />
              </Field>
              <Field label="Objetivo principal" className="md:col-span-2">
                <Input
                  value={virtualAgent.primaryGoal}
                  onChange={(event) => updateField("primaryGoal", event.target.value)}
                  placeholder="Ex.: Acolher familias, tirar duvidas e conduzir para agendamento da avaliacao gratuita."
                />
              </Field>
              <Field label="Tom de voz" className="md:col-span-2">
                <Input
                  value={virtualAgent.tone}
                  onChange={(event) => updateField("tone", event.target.value)}
                  placeholder="Ex.: acolhedor, simples, profissional, leve e seguro"
                />
              </Field>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Building2}
              title="Negocio e conhecimento"
              description="Coloque fatos objetivos. A IA interpreta a pergunta do cliente e escolhe o que usar."
            />
            <div className="mt-5 space-y-4">
              <Field label="Resumo do negocio">
                <Textarea
                  rows={5}
                  value={virtualAgent.businessDescription}
                  onChange={(event) => updateField("businessDescription", event.target.value)}
                  placeholder="O que a empresa faz, para quem atende, como funciona o atendimento e quais pontos nao podem ser esquecidos."
                />
              </Field>
              <Field label="Servicos, produtos ou etapas do atendimento">
                <Textarea
                  rows={6}
                  value={virtualAgent.services}
                  onChange={(event) => updateField("services", event.target.value)}
                  placeholder="Liste servicos, processo, criterios, etapas, diferenciais e o que a IA pode explicar quando perguntarem."
                />
              </Field>
              <Field label="Perguntas frequentes e respostas importantes">
                <Textarea
                  rows={7}
                  value={virtualAgent.faq}
                  onChange={(event) => updateField("faq", event.target.value)}
                  placeholder="Ex.: Se perguntar valores, explique que sao orientados na avaliacao. Se perguntar idade minima, informar a regra correta."
                />
              </Field>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Clock}
              title="Operacao e condução"
              description="Essas regras ajudam a IA a tomar decisoes praticas sem virar menu fechado."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Horario de atendimento">
                <Textarea
                  rows={4}
                  value={virtualAgent.operatingHours}
                  onChange={(event) => updateField("operatingHours", event.target.value)}
                  placeholder="Dias, horarios, excecoes e como responder fora do horario."
                />
              </Field>
              <Field label="Politica de valores">
                <Textarea
                  rows={4}
                  value={virtualAgent.pricingPolicy}
                  onChange={(event) => updateField("pricingPolicy", event.target.value)}
                  placeholder="O que pode ou nao falar sobre preco, planos, consulta gratuita, orcamento etc."
                />
              </Field>
              <Field label="Como conduzir agendamento" className="md:col-span-2">
                <Textarea
                  rows={5}
                  value={virtualAgent.schedulingInstructions}
                  onChange={(event) => updateField("schedulingInstructions", event.target.value)}
                  placeholder="Quais dados coletar, ordem ideal, como confirmar interesse e quando encaminhar para humano."
                />
              </Field>
              <Field label="Quando chamar humano">
                <Textarea
                  rows={4}
                  value={virtualAgent.handoffRules}
                  onChange={(event) => updateField("handoffRules", event.target.value)}
                  placeholder="Casos sensiveis, reclamacoes, pedidos especificos, duvidas que precisam de especialista."
                />
              </Field>
              <Field label="Limites e proibicoes">
                <Textarea
                  rows={4}
                  value={virtualAgent.boundaries}
                  onChange={(event) => updateField("boundaries", event.target.value)}
                  placeholder="O que a IA nao pode prometer, diagnosticar, inventar, garantir ou responder."
                />
              </Field>
              <Field label="Conhecimento extra" className="md:col-span-2">
                <Textarea
                  rows={6}
                  value={virtualAgent.extraKnowledge}
                  onChange={(event) => updateField("extraKnowledge", event.target.value)}
                  placeholder="Informacoes extras da plataforma, links, observacoes comerciais, exemplos de linguagem e excecoes."
                />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Wand2}
              title="Como a IA vai pensar"
              description="A OpenAI recebe personalidade global, memoria, historico e esta ficha para criar uma resposta nova a cada mensagem."
            />
            <div className="mt-5 space-y-3 text-sm">
              <InfoBlock title="Sem resposta pronta">
                O texto salvo aqui e conhecimento. A IA deve formular a frase conforme a pergunta, a etapa e o historico.
              </InfoBlock>
              <InfoBlock title="Memoria antes de repeticao">
                Ela usa o que ja foi dito para nao reiniciar, nao repetir abertura e nao perguntar o que o cliente ja respondeu.
              </InfoBlock>
              <InfoBlock title="Fluxos em segundo plano">
                Quando ligado, o Agent IA responde primeiro. Quando desligado, seus fluxos voltam a assumir normalmente.
              </InfoBlock>
              <InfoBlock title="Base humana do Nexo">
                Mesmo com pouco contexto, o Nexo ja orienta a IA a acolher, responder a pergunta e manter continuidade sem parecer robo.
              </InfoBlock>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Handshake}
              title="Qualidade do contexto"
              description={`${filledFieldsCount} campos preenchidos`}
            />
            <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4">
              <pre className="max-h-[520px] whitespace-pre-wrap break-words text-xs leading-6 text-foreground/90">
                {contextPreview || "Preencha a ficha da pessoa virtual para formar o contexto do atendimento."}
              </pre>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </div>
  );
}

function PreviewPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/85 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}
