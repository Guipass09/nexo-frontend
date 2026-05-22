import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Bot,
  Building2,
  Clock,
  LoaderCircle,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { BrandMark } from "@/components/nexo/BrandMark";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  useAiAgentProfile,
  useCreateAiAgentProfile,
  useDeleteAiAgentProfile,
  useTrainAiAgent,
  useUpdateAiAgentProfile,
} from "@/hooks/use-app-data";
import type {
  AiAgentProfile,
  AiAgentTrainingCriticPriority,
  AiAgentTrainingReport,
  AiAgentTriggerType,
  AiAgentVirtualAgent,
} from "@/types/domain";

type FieldKey = keyof AiAgentVirtualAgent;

const BUSINESS_MODEL_OPTIONS = [
  { value: "service_business", label: "Serviço / consultoria" },
  { value: "clinic_or_health", label: "Clínica / saúde" },
  { value: "education", label: "Educação / treinamento" },
  { value: "saas_or_platform", label: "SaaS / plataforma" },
  { value: "commerce", label: "Comércio / produto" },
  { value: "real_estate", label: "Imobiliário" },
  { value: "legal_or_specialist", label: "Especialista / jurídico" },
  { value: "support_only", label: "Suporte / pós-venda" },
  { value: "other", label: "Outro" },
];

const PRIMARY_OBJECTIVE_OPTIONS = [
  { value: "guide_and_answer", label: "Responder e orientar" },
  { value: "qualify_lead", label: "Qualificar lead" },
  { value: "schedule", label: "Agendar" },
  { value: "convert", label: "Converter / vender" },
  { value: "support", label: "Resolver suporte" },
  { value: "onboarding", label: "Fazer onboarding" },
  { value: "handoff", label: "Triar e levar para humano" },
];

const CONVERSATION_APPROACH_OPTIONS = [
  { value: "guided", label: "Guiado e humano" },
  { value: "consultative", label: "Consultivo" },
  { value: "hybrid", label: "Híbrido" },
  { value: "direct", label: "Direto ao ponto" },
];

const RESPONSE_LENGTH_OPTIONS = [
  { value: "concise", label: "Curta" },
  { value: "balanced", label: "Equilibrada" },
  { value: "detailed", label: "Mais detalhada" },
];

const TONE_OPTIONS = [
  "acolhedor, claro e profissional",
  "calmo, seguro e educativo",
  "direto, leve e objetivo",
  "consultivo, humano e elegante",
];

const REQUIRED_STEP_OPTIONS = [
  { value: "none", label: "Nenhum requisito antes de avançar" },
  { value: "qualification", label: "Qualificação mínima" },
  { value: "registration", label: "Cadastro" },
  { value: "document_submission", label: "Envio de documentos" },
  { value: "payment", label: "Pagamento" },
  { value: "choose_plan", label: "Escolha de plano" },
  { value: "choose_unit", label: "Escolha de unidade" },
  { value: "human_review", label: "Validação humana" },
  { value: "contract_signature", label: "Assinatura / aceite" },
];

const ALLOWED_ACTION_OPTIONS = [
  { value: "answer_question", label: "Responder dúvidas" },
  { value: "explain_next_step", label: "Explicar próximo passo" },
  { value: "send_link", label: "Enviar link" },
  { value: "collect_contact_data", label: "Coletar dados" },
  { value: "collect_schedule_preference", label: "Coletar disponibilidade" },
  { value: "ask_permission", label: "Pedir confirmação antes de avançar" },
  { value: "invite_progress", label: "Conduzir para avanço" },
  { value: "handoff_human", label: "Encaminhar para humano" },
];

const trainingPhrases = [
  "Estruturando a empresa em fatos, objetivos, requisitos e ações permitidas.",
  "Simulando saudações, perguntas diretas, objeções e confirmações curtas.",
  "Validando se o Agent responde com educação, sem repetir e sem vazar bastidores.",
  "Testando se o próximo passo faz sentido para esse contexto, sem forçar um funil fixo.",
  "Calibrando a estratégia invisível e a linguagem para ficar mais natural.",
  "Comparando cenários para preservar o que melhorou e reduzir regressões.",
];

const emptyVirtualAgent: AiAgentVirtualAgent = {
  agentName: "",
  roleTitle: "Especialista de atendimento",
  businessName: "",
  segment: "",
  businessModel: "",
  primaryGoal: "",
  desiredOutcome: "",
  tone: "acolhedor, claro e profissional",
  conversationApproach: "guided",
  responseLength: "balanced",
  businessDescription: "",
  audienceDescription: "",
  services: "",
  faq: "",
  progressionRules: "",
  successSignals: "",
  operatingHours: "",
  pricingPolicy: "",
  schedulingInstructions: "",
  linksAndResources: "",
  handoffRules: "",
  boundaries: "",
  extraKnowledge: "",
  requiredSteps: [],
  allowedActions: [],
};

function mergeVirtualAgent(value?: Partial<AiAgentVirtualAgent> | null): AiAgentVirtualAgent {
  return {
    ...emptyVirtualAgent,
    ...(value ?? {}),
    requiredSteps: Array.isArray(value?.requiredSteps) ? value?.requiredSteps.filter(Boolean) : [],
    allowedActions: Array.isArray(value?.allowedActions) ? value?.allowedActions.filter(Boolean) : [],
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

function formatTrainingDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function formatDelta(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "0";
  }

  const rounded = Math.round(value * 10) / 10;

  if (rounded > 0) {
    return `+${rounded.toFixed(1)}`;
  }

  if (rounded < 0) {
    return rounded.toFixed(1);
  }

  return "0.0";
}

function optionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function criticSeverityLabel(severity: AiAgentTrainingCriticPriority["severity"]) {
  switch (severity) {
    case "high":
      return "Alta";
    case "medium":
      return "Média";
    default:
      return "Baixa";
  }
}

function criticSeverityClass(severity: AiAgentTrainingCriticPriority["severity"]) {
  switch (severity) {
    case "high":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
}

export default function AgentIa() {
  const { toast } = useToast();
  const { data, isLoading, error, isError } = useAiAgentProfile();
  const updateMutation = useUpdateAiAgentProfile();
  const createProfileMutation = useCreateAiAgentProfile();
  const deleteProfileMutation = useDeleteAiAgentProfile();
  const trainMutation = useTrainAiAgent();

  const [profiles, setProfiles] = useState<AiAgentProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Assistente principal");
  const [triggerType, setTriggerType] = useState<AiAgentTriggerType>("all_contacts");
  const [triggerKeywordsText, setTriggerKeywordsText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [allowSavedContacts, setAllowSavedContacts] = useState(true);
  const [virtualAgent, setVirtualAgent] = useState<AiAgentVirtualAgent>(emptyVirtualAgent);
  const [trainingPhraseIndex, setTrainingPhraseIndex] = useState(0);

  const applyProfileToForm = (profile: AiAgentProfile) => {
    setActiveProfileId(normalizeProfileId(profile.id));
    setProfileName(profile.name || "Assistente principal");
    setTriggerType(profile.triggerType ?? (profile.allowSavedContacts === false ? "unsaved_contacts" : "all_contacts"));
    setTriggerKeywordsText((profile.triggerKeywords ?? []).join("\n"));
    setEnabled(profile.enabled);
    setAllowSavedContacts(profile.triggerType === "unsaved_contacts" ? false : (profile.allowSavedContacts ?? true));
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

  useEffect(() => {
    if (!trainMutation.isPending) {
      setTrainingPhraseIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setTrainingPhraseIndex((current) => (current + 1) % trainingPhrases.length);
    }, 1700);

    return () => {
      window.clearInterval(interval);
    };
  }, [trainMutation.isPending]);

  const activeProfile = useMemo(() => {
    return profiles.find((profile) => normalizeProfileId(profile.id) === activeProfileId) ?? null;
  }, [activeProfileId, profiles]);

  const activeTrainingReport = useMemo<AiAgentTrainingReport | null>(() => {
    return activeProfile?.trainingReport ?? null;
  }, [activeProfile]);

  const filledFieldsCount = useMemo(() => {
    const stringCount = Object.entries(virtualAgent)
      .filter(([key, value]) => !["requiredSteps", "allowedActions"].includes(key) && typeof value === "string" && value.trim() !== "")
      .length;
    const arrayCount = virtualAgent.requiredSteps.length + virtualAgent.allowedActions.length;

    return stringCount + arrayCount;
  }, [virtualAgent]);

  const contextPreview = useMemo(() => {
    const lines = [
      virtualAgent.agentName && `Pessoa virtual: ${virtualAgent.agentName}`,
      virtualAgent.roleTitle && `Papel: ${virtualAgent.roleTitle}`,
      virtualAgent.businessName && `Empresa: ${virtualAgent.businessName}`,
      virtualAgent.segment && `Segmento: ${virtualAgent.segment}`,
      virtualAgent.businessModel && `Modelo do negócio: ${optionLabel(BUSINESS_MODEL_OPTIONS, virtualAgent.businessModel)}`,
      virtualAgent.primaryGoal && `Objetivo principal: ${optionLabel(PRIMARY_OBJECTIVE_OPTIONS, virtualAgent.primaryGoal)}`,
      virtualAgent.desiredOutcome && `Resultado esperado: ${virtualAgent.desiredOutcome}`,
      virtualAgent.conversationApproach && `Abordagem: ${optionLabel(CONVERSATION_APPROACH_OPTIONS, virtualAgent.conversationApproach)}`,
      virtualAgent.responseLength && `Tamanho ideal: ${optionLabel(RESPONSE_LENGTH_OPTIONS, virtualAgent.responseLength)}`,
      virtualAgent.requiredSteps.length > 0 && `Requisitos antes de avançar: ${virtualAgent.requiredSteps.map((item) => optionLabel(REQUIRED_STEP_OPTIONS, item)).join(", ")}`,
      virtualAgent.allowedActions.length > 0 && `Ações permitidas: ${virtualAgent.allowedActions.map((item) => optionLabel(ALLOWED_ACTION_OPTIONS, item)).join(", ")}`,
      virtualAgent.businessDescription && `Sobre a empresa:\n${virtualAgent.businessDescription}`,
      virtualAgent.audienceDescription && `Quem atende:\n${virtualAgent.audienceDescription}`,
      virtualAgent.services && `Ofertas e soluções:\n${virtualAgent.services}`,
      virtualAgent.progressionRules && `Como avançar a conversa:\n${virtualAgent.progressionRules}`,
      virtualAgent.faq && `Dúvidas frequentes:\n${virtualAgent.faq}`,
      virtualAgent.pricingPolicy && `Preço e políticas:\n${virtualAgent.pricingPolicy}`,
      virtualAgent.linksAndResources && `Links e recursos:\n${virtualAgent.linksAndResources}`,
      virtualAgent.handoffRules && `Escalonamento humano:\n${virtualAgent.handoffRules}`,
      virtualAgent.boundaries && `Limites:\n${virtualAgent.boundaries}`,
      virtualAgent.extraKnowledge && `Conhecimento extra:\n${virtualAgent.extraKnowledge}`,
    ].filter(Boolean);

    return lines.join("\n\n");
  }, [virtualAgent]);

  const updateField = (field: FieldKey, value: AiAgentVirtualAgent[FieldKey]) => {
    setVirtualAgent((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleListField = (field: "requiredSteps" | "allowedActions", value: string) => {
    setVirtualAgent((current) => {
      const currentValues = current[field];
      const exists = currentValues.includes(value);
      let nextValues = exists
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      if (field === "requiredSteps" && value === "none" && !exists) {
        nextValues = ["none"];
      }

      if (field === "requiredSteps" && value !== "none") {
        nextValues = nextValues.filter((item) => item !== "none");
      }

      return {
        ...current,
        [field]: nextValues,
      };
    });
  };

  const clearStructure = () => {
    setVirtualAgent(emptyVirtualAgent);
    toast({
      title: "Ficha reiniciada",
      description: "A estrutura do Agent IA foi limpa para você preencher do zero.",
    });
  };

  const handleSave = () => {
    const normalizedTriggerType =
      triggerType === "all_contacts" && !allowSavedContacts
        ? "unsaved_contacts"
        : triggerType === "unsaved_contacts" && allowSavedContacts
          ? "all_contacts"
          : triggerType;

    updateMutation.mutate({
      profileId: activeProfileId,
      name: profileName,
      enabled,
      allowSavedContacts: normalizedTriggerType === "unsaved_contacts" ? false : allowSavedContacts,
      triggerType: normalizedTriggerType,
      triggerKeywords: parseKeywords(triggerKeywordsText),
      virtualAgent,
    }, {
      onSuccess: () => {
        toast({
          title: "Agent IA atualizado",
          description: enabled
            ? "A estrutura universal do agente foi salva e já pode responder com mais coerência."
            : "A estrutura foi salva. Quando ligar, o Agent IA usará essa estratégia.",
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

  const handleTrain = () => {
    trainMutation.mutate({
      profileId: activeProfileId,
    }, {
      onSuccess: (result) => {
        const nextProfiles = profilesFromResponse(result.profile);
        const active =
          nextProfiles.find((profile) => normalizeProfileId(profile.id) === activeProfileId) ??
          nextProfiles[0];

        setProfiles(nextProfiles);

        if (active) {
          applyProfileToForm(active);
        }

        const progression = result.report.progression;
        const improvementLabel = progression ? formatDelta(progression.improvementFromLastRun) : null;
        const criticSummary = result.report.critic?.summary;

        toast({
          title: "Treino do Agent IA concluído",
          description: criticSummary
            ? criticSummary
            : progression
            ? `Nível ${progression.levelLabel}. ${result.report.scenarioCount} cenários validados. Nota média ${result.report.averageScore.toFixed(0)} (${improvementLabel} vs o último treino).`
            : `Foram validados ${result.report.scenarioCount} cenários. Nota média ${result.report.averageScore.toFixed(0)}.`,
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Falha ao treinar o Agent IA",
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
          description: "A nova ficha já nasceu no formato universal do Agent IA.",
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
          description: "As próximas conversas vão usar os assistentes restantes.",
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
              Agent IA universal
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Estruture o agente por objetivo, regras, ações e contexto.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Em vez de ensinar frases prontas, você define como a empresa funciona, o que o cliente busca no final e quais passos podem existir antes do avanço. O Nexo transforma isso em estratégia invisível.
            </p>
          </div>
          <div className="flex min-w-[280px] flex-col gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Atendimento automático</p>
                <p className="text-xs text-slate-500">Quando ligado, o Agent IA assume antes dos fluxos.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Responder contatos salvos</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Desligue para atender apenas números novos no WhatsApp conectado.
                  </p>
                </div>
                <Switch
                  checked={allowSavedContacts}
                  onCheckedChange={(checked) => {
                    setAllowSavedContacts(checked);

                    if (checked && triggerType === "unsaved_contacts") {
                      setTriggerType("all_contacts");
                    }

                    if (!checked && triggerType === "all_contacts") {
                      setTriggerType("unsaved_contacts");
                    }
                  }}
                />
              </div>
            </div>
            <Badge variant={enabled ? "default" : "secondary"} className="w-fit">
              {enabled ? "Ligado" : "Desligado"}
            </Badge>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={clearStructure}
              >
                <Trash2 className="h-4 w-4" />
                Limpar ficha
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleTrain}
                disabled={trainMutation.isPending || isLoading}
              >
                {trainMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Treinar IA
              </Button>
            </div>
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

      {activeTrainingReport && (
        <Card className="border-border/60 bg-[linear-gradient(135deg,_rgba(37,99,235,0.08),_rgba(16,185,129,0.06))] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-semibold text-primary">
                <Bot className="h-3.5 w-3.5" />
                Último treino do Agent IA
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">
                Nota média {activeTrainingReport.averageScore.toFixed(0)} em {activeTrainingReport.scenarioCount} cenários
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeTrainingReport.passedScenarios} cenários passaram sem issues. Última execução em {formatTrainingDate(activeTrainingReport.lastRunAt)}.
              </p>
              {activeTrainingReport.critic?.summary && (
                <p className="mt-3 rounded-2xl border border-primary/10 bg-white/75 px-4 py-3 text-sm leading-6 text-slate-700">
                  {activeTrainingReport.critic.summary}
                </p>
              )}
              {activeTrainingReport.progression && (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Progressão ativa: nível <strong>{activeTrainingReport.progression.levelLabel}</strong>, treino{" "}
                  {activeTrainingReport.progression.runCount} e melhora de{" "}
                  <strong>{formatDelta(activeTrainingReport.progression.improvementFromLastRun)}</strong> ponto(s) vs o treino anterior.
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
              <PreviewPill label="Cenários ok" value={`${activeTrainingReport.passedScenarios}/${activeTrainingReport.scenarioCount}`} />
              <PreviewPill label="Nível" value={activeTrainingReport.progression?.levelLabel ?? "Base"} />
              <PreviewPill
                label="Melhor nota"
                value={activeTrainingReport.progression ? activeTrainingReport.progression.bestAverageScore.toFixed(0) : activeTrainingReport.averageScore.toFixed(0)}
              />
            </div>
          </div>

          {(activeTrainingReport.critic?.strengths?.length || activeTrainingReport.critic?.priorities?.length || activeTrainingReport.appliedAdjustments.length > 0 || activeTrainingReport.issues.length > 0 || (activeTrainingReport.progression?.nextFocus?.length ?? 0) > 0) && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {(activeTrainingReport.critic?.strengths?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-emerald-950">Pontos fortes</p>
                  <div className="mt-3 space-y-2 text-sm text-emerald-900/90">
                    {activeTrainingReport.critic?.strengths.slice(0, 4).map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              )}

              {(activeTrainingReport.critic?.priorities?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-violet-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-violet-950">Prioridades do crítico</p>
                  <div className="mt-3 space-y-3">
                    {activeTrainingReport.critic?.priorities.slice(0, 3).map((item) => (
                      <div key={`${item.scenarioKey}-${item.severity}`} className="rounded-2xl border border-violet-100 bg-violet-50/50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-violet-950">{item.scenarioTitle}</p>
                            <p className="mt-1 text-xs leading-5 text-violet-900/80">{item.reason}</p>
                          </div>
                          <Badge variant="outline" className={criticSeverityClass(item.severity)}>
                            {criticSeverityLabel(item.severity)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-violet-700/80">
                          Ação positiva
                        </p>
                        <p className="mt-1 text-sm leading-5 text-violet-950/90">{item.positiveAction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTrainingReport.appliedAdjustments.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-emerald-950">Ajustes aplicados</p>
                  <div className="mt-3 space-y-2 text-sm text-emerald-900/90">
                    {activeTrainingReport.appliedAdjustments.slice(0, 5).map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              )}

              {(activeTrainingReport.critic?.safeActions?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-cyan-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-cyan-950">Ações que fortalecem o Agent</p>
                  <div className="mt-3 space-y-2 text-sm text-cyan-900/90">
                    {activeTrainingReport.critic?.safeActions.slice(0, 5).map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              )}

              {(activeTrainingReport.progression?.nextFocus?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-sky-950">Próximo foco do treino</p>
                  <div className="mt-3 space-y-2 text-sm text-sky-900/90">
                    {activeTrainingReport.progression?.nextFocus.slice(0, 3).map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              )}

              {activeTrainingReport.issues.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-amber-950">Pontos ainda observados</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeTrainingReport.issues.map((item) => (
                      <Badge key={item} variant="secondary" className="bg-amber-100 text-amber-900">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      <Card className="border-border/60 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Assistentes e gatilhos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você pode ter mais de um assistente ligado, desde que cada um tenha um gatilho diferente.
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
                      "min-w-[210px] rounded-2xl border px-4 py-3 text-left transition",
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
                  placeholder="Ex.: Pré-venda, suporte, agenda"
                />
              </Field>
              <Field label="Gatilho de ativação">
                <Select
                  value={triggerType}
                  onValueChange={(value) => {
                    const nextTriggerType = value as AiAgentTriggerType;
                    setTriggerType(nextTriggerType);

                    if (nextTriggerType === "unsaved_contacts") {
                      setAllowSavedContacts(false);
                      return;
                    }

                    setAllowSavedContacts(true);
                  }}
                >
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
                  placeholder={"Ex.: orçamento\nquero contratar\nagendar"}
                />
              </Field>
            )}

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs leading-5 text-amber-950">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Workflow className="h-3.5 w-3.5" />
                Trava de conversa ativa
              </div>
              Quando um assistente assumir uma conversa, esse gatilho fica seguro até o atendimento terminar. Palavra-chave enviada no meio não troca o assistente.
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-6">
          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={UserRound}
              title="Identidade e posicionamento"
              description="Quem é essa pessoa virtual, o tipo de negócio e como ela deve soar no WhatsApp."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nome da pessoa virtual">
                <Input
                  value={virtualAgent.agentName}
                  onChange={(event) => updateField("agentName", event.target.value)}
                  placeholder="Ex.: Iris, Nexo IA, Time de atendimento"
                />
              </Field>
              <Field label="Papel no atendimento">
                <Input
                  value={virtualAgent.roleTitle}
                  onChange={(event) => updateField("roleTitle", event.target.value)}
                  placeholder="Ex.: Especialista de atendimento"
                />
              </Field>
              <Field label="Empresa ou profissional">
                <Input
                  value={virtualAgent.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  placeholder="Ex.: Nome da empresa"
                />
              </Field>
              <Field label="Segmento">
                <Input
                  value={virtualAgent.segment}
                  onChange={(event) => updateField("segment", event.target.value)}
                  placeholder="Ex.: Clínica, SaaS, consultoria, comércio"
                />
              </Field>
              <Field label="Modelo do negócio">
                <Select value={virtualAgent.businessModel || undefined} onValueChange={(value) => updateField("businessModel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_MODEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tom predominante">
                <Select value={virtualAgent.tone || undefined} onValueChange={(value) => updateField("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Target}
              title="Objetivo e resultado"
              description="O Agent precisa entender o que o cliente quer no final, não decorar um passo a passo fixo."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Objetivo principal do atendimento">
                <Select value={virtualAgent.primaryGoal || undefined} onValueChange={(value) => updateField("primaryGoal", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_OBJECTIVE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Abordagem da conversa">
                <Select value={virtualAgent.conversationApproach || undefined} onValueChange={(value) => updateField("conversationApproach", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONVERSATION_APPROACH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tamanho ideal da resposta">
                <Select value={virtualAgent.responseLength || undefined} onValueChange={(value) => updateField("responseLength", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_LENGTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Resultado esperado pelo cliente" className="md:col-span-2">
                <Input
                  value={virtualAgent.desiredOutcome}
                  onChange={(event) => updateField("desiredOutcome", event.target.value)}
                  placeholder="Ex.: sair com agenda marcada, proposta enviada, suporte resolvido, onboarding iniciado"
                />
              </Field>
              <Field label="O que a empresa faz" className="md:col-span-2">
                <Textarea
                  rows={5}
                  value={virtualAgent.businessDescription}
                  onChange={(event) => updateField("businessDescription", event.target.value)}
                  placeholder="Explique o negócio de forma objetiva: o que oferece, para quem e como costuma funcionar."
                />
              </Field>
              <Field label="Quem é o cliente ideal" className="md:col-span-2">
                <Textarea
                  rows={4}
                  value={virtualAgent.audienceDescription}
                  onChange={(event) => updateField("audienceDescription", event.target.value)}
                  placeholder="Quais perfis chegam mais aqui, o que costumam buscar e como chegam."
                />
              </Field>
              <Field label="Ofertas, serviços ou soluções" className="md:col-span-2">
                <Textarea
                  rows={6}
                  value={virtualAgent.services}
                  onChange={(event) => updateField("services", event.target.value)}
                  placeholder="Liste o que a empresa entrega, quais opções existem e o que pode ser explicado ao cliente."
                />
              </Field>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Waypoints}
              title="Requisitos e ações do agente"
              description="Aqui nasce o fluxo invisível: o que pode existir antes de avançar e o que o Agent está autorizado a fazer."
            />
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <Label>Requisitos antes de avançar</Label>
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
                  {REQUIRED_STEP_OPTIONS.map((option) => (
                    <ChecklistOption
                      key={option.value}
                      checked={virtualAgent.requiredSteps.includes(option.value)}
                      label={option.label}
                      onCheckedChange={() => toggleListField("requiredSteps", option.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Ações permitidas ao Agent</Label>
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
                  {ALLOWED_ACTION_OPTIONS.map((option) => (
                    <ChecklistOption
                      key={option.value}
                      checked={virtualAgent.allowedActions.includes(option.value)}
                      label={option.label}
                      onCheckedChange={() => toggleListField("allowedActions", option.value)}
                    />
                  ))}
                </div>
              </div>

              <Field label="Como a conversa deve progredir" className="lg:col-span-2">
                <Textarea
                  rows={5}
                  value={virtualAgent.progressionRules}
                  onChange={(event) => updateField("progressionRules", event.target.value)}
                  placeholder="Explique a lógica da conversa sem escrever frases prontas. Ex.: primeiro entender a necessidade, depois validar fit, depois enviar proposta."
                />
              </Field>
              <Field label="Como saber que a conversa foi bem sucedida" className="lg:col-span-2">
                <Textarea
                  rows={4}
                  value={virtualAgent.successSignals}
                  onChange={(event) => updateField("successSignals", event.target.value)}
                  placeholder="Ex.: cliente com horário marcado, lead qualificado, proposta aceita, suporte resolvido."
                />
              </Field>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Building2}
              title="Conhecimento operacional"
              description="Tudo o que o Agent precisa dominar sobre funcionamento, preços, dúvidas e materiais disponíveis."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Perguntas frequentes" className="md:col-span-2">
                <Textarea
                  rows={7}
                  value={virtualAgent.faq}
                  onChange={(event) => updateField("faq", event.target.value)}
                  placeholder="Quais perguntas aparecem sempre e o que o Agent precisa saber para responder bem."
                />
              </Field>
              <Field label="Preço, planos e políticas">
                <Textarea
                  rows={5}
                  value={virtualAgent.pricingPolicy}
                  onChange={(event) => updateField("pricingPolicy", event.target.value)}
                  placeholder="O que pode falar sobre preço, quando pode falar, se existe orçamento, pacote, mensalidade etc."
                />
              </Field>
              <Field label="Horário e disponibilidade">
                <Textarea
                  rows={5}
                  value={virtualAgent.operatingHours}
                  onChange={(event) => updateField("operatingHours", event.target.value)}
                  placeholder="Dias, horários, exceções e como agir fora do horário."
                />
              </Field>
              <Field label="Links e recursos liberados" className="md:col-span-2">
                <Textarea
                  rows={5}
                  value={virtualAgent.linksAndResources}
                  onChange={(event) => updateField("linksAndResources", event.target.value)}
                  placeholder="Links oficiais, páginas, formulários, catálogos, PDFs, materiais e orientações que o Agent pode compartilhar."
                />
              </Field>
              <Field label="Quando chamar humano">
                <Textarea
                  rows={4}
                  value={virtualAgent.handoffRules}
                  onChange={(event) => updateField("handoffRules", event.target.value)}
                  placeholder="Quais casos exigem atendimento humano ou especialista."
                />
              </Field>
              <Field label="Limites e proibições">
                <Textarea
                  rows={4}
                  value={virtualAgent.boundaries}
                  onChange={(event) => updateField("boundaries", event.target.value)}
                  placeholder="O que a IA não pode prometer, afirmar, decidir ou inventar."
                />
              </Field>
              <Field label="Conhecimento extra" className="md:col-span-2">
                <Textarea
                  rows={6}
                  value={virtualAgent.extraKnowledge}
                  onChange={(event) => updateField("extraKnowledge", event.target.value)}
                  placeholder="Exceções, observações estratégicas, detalhes importantes que não couberam nos outros blocos."
                />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={ShieldCheck}
              title="Como o Agent vai pensar"
              description="Essa ficha vira dados estruturados. O motor do Agent interpreta objetivo, requisitos, ações e regras antes de escrever a resposta."
            />
            <div className="mt-5 space-y-3 text-sm">
              <InfoBlock title="Sem texto pronto">
                O Agent não deve decorar frases. Ele usa essa estrutura para decidir o melhor próximo passo e redigir na hora.
              </InfoBlock>
              <InfoBlock title="Universal por projeto">
                Em vez de assumir funis iguais, o sistema usa o que você marcar como objetivo, requisito e ação permitida.
              </InfoBlock>
              <InfoBlock title="Treino com regressão">
                O botão Treinar IA valida se o Agent ficou educado, coeso, útil e sem repetição, e tenta preservar o que já melhorou.
              </InfoBlock>
              <InfoBlock title="Fluxos continuam existentes">
                A aba Fluxo segue disponível. Aqui o objetivo é criar uma estratégia invisível para o atendimento conversacional.
              </InfoBlock>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Workflow}
              title="Prévia da estrutura"
              description={`${filledFieldsCount} itens preenchidos`}
            />
            <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4">
              <pre className="max-h-[560px] whitespace-pre-wrap break-words text-xs leading-6 text-foreground/90">
                {contextPreview || "Preencha a ficha para ver como o Agent IA vai estruturar esse negócio internamente."}
              </pre>
            </div>
          </Card>
        </aside>
      </div>

      <Dialog open={trainMutation.isPending}>
        <DialogContent className="max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_38%),linear-gradient(160deg,_#ffffff_0%,_#f8fafc_55%,_#ecfdf5_100%)] p-0">
          <div className="px-8 py-10 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/80 bg-white/90 shadow-lg">
              <BrandMark className="h-20 w-20 animate-pulse rounded-[1.5rem]" letterClassName="text-2xl" />
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-slate-950">Treinando o Agent IA</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              O Nexo está organizando o contexto da empresa, simulando cenários reais e ajustando a estratégia invisível do agente.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-sm font-medium leading-6 text-slate-900">
                {trainingPhrases[trainingPhraseIndex]}
              </p>
            </div>
            <Progress value={((trainingPhraseIndex + 1) / trainingPhrases.length) * 100} className="mt-6 h-2" />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Simulando, avaliando e refinando
            </p>
          </div>
        </DialogContent>
      </Dialog>
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

function ChecklistOption({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-2 py-1 transition hover:border-border/60 hover:bg-background/70">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      <span className="text-sm leading-6 text-slate-700">{label}</span>
    </label>
  );
}
