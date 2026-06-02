// Onda B2 — "Cérebro do atendimento"
// Traduz respostas humanas (8 perguntas) em tenantBrain/operationalContext (camelCase),
// que o backend converte para snake_case e grava em metadata['tenant_brain'] / ['operational_context'].
// Nenhum termo técnico é exposto ao usuário: tudo é derivado aqui.

export type BusinessType =
  | "clinic" | "restaurant" | "school" | "law_firm"
  | "store" | "local_services" | "real_estate" | "other";

export type MainGoal =
  | "schedule" | "reserve" | "enroll" | "sell" | "quote" | "support" | "general";

export type AdvanceStep =
  | "cadastro" | "matricula" | "reserva" | "pedido" | "orcamento" | "documentos" | "none";

export type ServiceMode = "online" | "in_person" | "both";

export type FallbackChoice = "confirm_team" | "ask_details" | "handoff" | "ficha_only";

export type AgentBrainForm = {
  businessType: BusinessType | "";
  mainGoal: MainGoal | "";
  advanceStep: AdvanceStep | "";
  serviceMode: ServiceMode | "";
  supportedTopics: string[];
  forbiddenClaims: string[];
  forbiddenClaimsExtra: string;
  handoffTriggers: string[];
  fallbackBehavior: FallbackChoice | "";
};

export const emptyAgentBrainForm: AgentBrainForm = {
  businessType: "",
  mainGoal: "",
  advanceStep: "",
  serviceMode: "",
  supportedTopics: [],
  forbiddenClaims: [],
  forbiddenClaimsExtra: "",
  handoffTriggers: [],
  fallbackBehavior: "",
};

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "clinic", label: "Clínica / consultório" },
  { value: "restaurant", label: "Restaurante" },
  { value: "school", label: "Escola / curso" },
  { value: "law_firm", label: "Advocacia" },
  { value: "store", label: "Loja" },
  { value: "local_services", label: "Serviços locais" },
  { value: "real_estate", label: "Imobiliária" },
  { value: "other", label: "Outro" },
];

export const MAIN_GOAL_OPTIONS: { value: MainGoal; label: string }[] = [
  { value: "schedule", label: "Agendar" },
  { value: "reserve", label: "Reservar" },
  { value: "enroll", label: "Matricular" },
  { value: "sell", label: "Vender" },
  { value: "quote", label: "Gerar orçamento" },
  { value: "support", label: "Dar suporte" },
  { value: "general", label: "Atendimento geral" },
];

export const ADVANCE_STEP_OPTIONS: { value: AdvanceStep; label: string }[] = [
  { value: "cadastro", label: "Cadastro" },
  { value: "matricula", label: "Matrícula" },
  { value: "reserva", label: "Reserva" },
  { value: "pedido", label: "Pedido" },
  { value: "orcamento", label: "Orçamento" },
  { value: "documentos", label: "Envio de documentos" },
  { value: "none", label: "Nenhuma etapa obrigatória" },
];

export const SERVICE_MODE_OPTIONS: { value: ServiceMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "Presencial" },
  { value: "both", label: "Online e presencial" },
];

export const SUPPORTED_TOPIC_OPTIONS: { value: string; label: string; domain: string }[] = [
  { value: "services", label: "Serviços/produtos", domain: "service_info" },
  { value: "pricing", label: "Preços/pagamentos", domain: "pricing" },
  { value: "hours", label: "Horários", domain: "scheduling" },
  { value: "location", label: "Localização", domain: "location" },
  { value: "booking", label: "Agendamento/reserva", domain: "scheduling" },
  { value: "registration", label: "Cadastro/matrícula", domain: "registration" },
  { value: "service_access", label: "Acesso ao serviço", domain: "service_access" },
  { value: "support", label: "Suporte", domain: "handoff" },
  { value: "documents", label: "Documentos/requisitos", domain: "service_access" },
];

export const FORBIDDEN_CLAIM_OPTIONS: { value: string; label: string }[] = [
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "resultado garantido", label: "Resultado garantido" },
  { value: "desconto não confirmado", label: "Desconto não confirmado" },
  { value: "prazo não confirmado", label: "Prazo não confirmado" },
  { value: "preço não cadastrado", label: "Preço não cadastrado" },
  { value: "vaga ou disponibilidade sem confirmação", label: "Vaga/disponibilidade sem confirmação" },
  { value: "orientação jurídica ou médica definitiva", label: "Orientação jurídica/médica definitiva" },
];

export const HANDOFF_TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: "humano", label: "Cliente pedir humano" },
  { value: "reclamação", label: "Reclamação" },
  { value: "dúvida sensível", label: "Dúvida sensível" },
  { value: "preço personalizado", label: "Preço personalizado" },
  { value: "fora do padrão", label: "Caso fora do padrão" },
  { value: "problema técnico", label: "Problema técnico" },
  { value: "urgente", label: "Pedido urgente" },
];

export const FALLBACK_OPTIONS: { value: FallbackChoice; label: string }[] = [
  { value: "confirm_team", label: "Dizer que vai confirmar com a equipe" },
  { value: "ask_details", label: "Pedir mais detalhes" },
  { value: "handoff", label: "Encaminhar para humano" },
  { value: "ficha_only", label: "Responder apenas com base na ficha" },
];

const COMPLETION_SIGNAL_PRESETS: Record<AdvanceStep, string[]> = {
  cadastro: ["cadastrei", "já cadastrei", "finalizei o cadastro"],
  matricula: ["me matriculei", "finalizei a matrícula", "já fiz a matrícula"],
  reserva: ["reservei", "já reservei", "confirmei a reserva"],
  pedido: ["fiz o pedido", "pedido feito", "já pedi"],
  orcamento: ["enviei os dados", "quero orçamento", "pode fazer o orçamento"],
  documentos: ["enviei os documentos", "já mandei os documentos", "documentos enviados"],
  none: [],
};

const PRIMARY_ACTION_LABEL: Record<AdvanceStep, string> = {
  cadastro: "cadastro",
  matricula: "matrícula",
  reserva: "reserva",
  pedido: "pedido",
  orcamento: "orçamento",
  documentos: "envio de documentos",
  none: "",
};

const CONVERSION_FLOW_BY_STEP: Record<AdvanceStep, string> = {
  cadastro: "registration_then_schedule",
  matricula: "enrollment",
  reserva: "reservation",
  pedido: "direct_schedule",
  orcamento: "budget_request",
  documentos: "consultation_request",
  none: "none",
};

const FALLBACK_TO_CANONICAL: Record<FallbackChoice, string> = {
  confirm_team: "human",
  ask_details: "planner",
  handoff: "human",
  ficha_only: "rag",
};

/** Suggested completion signals for the current step (used by the UI preview). */
export function completionSignalsForStep(step: AdvanceStep | ""): string[] {
  return step && step !== "none" ? COMPLETION_SIGNAL_PRESETS[step] ?? [] : [];
}

/**
 * Builds the camelCase payload pieces the backend understands.
 * Only the keys this form manages are emitted — topic_keywords and
 * vocabulary_aliases are intentionally NOT sent, so any rich existing
 * defaults (e.g. Sementes da Fala) are preserved by the additive merge.
 */
export function deriveAgentBrainPayload(form: AgentBrainForm): {
  tenantBrain: Record<string, unknown>;
  operationalContext: Record<string, unknown>;
} {
  const step = (form.advanceStep || "none") as AdvanceStep;
  const requiresRegistration = step !== "none";
  const onlineish = form.serviceMode === "online" || form.serviceMode === "both";
  const deliveryMode = form.serviceMode === "both" ? "hybrid" : (form.serviceMode || "online");

  const supportedDomains = Array.from(
    new Set(
      form.supportedTopics
        .map((topic) => SUPPORTED_TOPIC_OPTIONS.find((option) => option.value === topic)?.domain)
        .filter((domain): domain is string => Boolean(domain)),
    ),
  );

  const forbiddenClaims = Array.from(
    new Set(
      [
        ...form.forbiddenClaims,
        ...form.forbiddenClaimsExtra.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean),
      ],
    ),
  );

  const tenantBrain: Record<string, unknown> = {
    businessType: form.businessType || "other",
    primaryActionLabel: PRIMARY_ACTION_LABEL[step],
    completionSignals: COMPLETION_SIGNAL_PRESETS[step] ?? [],
    supportedDomains,
    forbiddenClaims,
    handoffRules: {
      triggers: form.handoffTriggers,
      autoEscalateOnConfusion: false,
    },
    fallbackBehavior: form.fallbackBehavior ? FALLBACK_TO_CANONICAL[form.fallbackBehavior] : "planner",
    serviceAccess: {
      hasSessionLink: onlineish,
      deliveryMode,
    },
    location: {
      onlineOnly: form.serviceMode === "online",
      hasPhysicalAddress: form.serviceMode !== "online",
    },
    registration: {
      required: requiresRegistration,
      precedesScheduling: requiresRegistration,
    },
  };

  const operationalContext: Record<string, unknown> = {
    businessType: form.businessType || "other",
    conversionFlowType: CONVERSION_FLOW_BY_STEP[step],
    requiresRegistration,
    requiresScheduling: form.mainGoal === "schedule" || form.mainGoal === "reserve" || step === "reserva",
    hasSessionLink: onlineish,
    serviceDeliveryMode: deliveryMode,
    primaryAction: PRIMARY_ACTION_LABEL[step],
  };

  return { tenantBrain, operationalContext };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

/** Best-effort reverse mapping to pre-fill the form from a loaded profile. */
export function agentBrainFormFromProfile(
  tenantBrain?: Record<string, unknown> | null,
  operationalContext?: Record<string, unknown> | null,
): AgentBrainForm {
  const brain = tenantBrain ?? {};
  const ctx = operationalContext ?? {};

  const businessTypeRaw = String((ctx.business_type ?? brain.business_type ?? "") as string);
  const businessType = BUSINESS_TYPE_OPTIONS.some((option) => option.value === businessTypeRaw)
    ? (businessTypeRaw as BusinessType)
    : "";

  const flow = String((ctx.conversion_flow_type ?? "") as string);
  const stepByFlow = (Object.entries(CONVERSION_FLOW_BY_STEP).find(([, value]) => value === flow)?.[0] ?? "") as AdvanceStep | "";
  const advanceStep: AdvanceStep | "" = stepByFlow || ((ctx.requires_registration as boolean) === false ? "none" : "");

  const deliveryRaw = String((ctx.service_delivery_mode ?? (brain.service_access as Record<string, unknown> | undefined)?.delivery_mode ?? "") as string);
  const serviceMode: ServiceMode | "" =
    deliveryRaw === "hybrid" ? "both" : deliveryRaw === "in_person" ? "in_person" : deliveryRaw === "online" ? "online" : "";

  const supportedDomains = asStringArray(brain.supported_domains);
  const supportedTopics = SUPPORTED_TOPIC_OPTIONS
    .filter((option) => supportedDomains.includes(option.domain))
    .map((option) => option.value);

  const forbiddenRaw = asStringArray(brain.forbidden_claims);
  const forbiddenKnown = FORBIDDEN_CLAIM_OPTIONS.map((option) => option.value);
  const forbiddenClaims = forbiddenRaw.filter((claim) => forbiddenKnown.includes(claim));
  const forbiddenClaimsExtra = forbiddenRaw.filter((claim) => !forbiddenKnown.includes(claim)).join(", ");

  const handoffTriggers = asStringArray((brain.handoff_rules as Record<string, unknown> | undefined)?.triggers)
    .filter((trigger) => HANDOFF_TRIGGER_OPTIONS.some((option) => option.value === trigger));

  const fallbackRaw = String((brain.fallback_behavior ?? "") as string);
  const fallbackBehavior: FallbackChoice | "" =
    fallbackRaw === "rag" ? "ficha_only" : fallbackRaw === "human" ? "handoff" : fallbackRaw === "planner" ? "ask_details" : "";

  return {
    businessType,
    mainGoal: "",
    advanceStep,
    serviceMode,
    supportedTopics: Array.from(new Set(supportedTopics)),
    forbiddenClaims,
    forbiddenClaimsExtra,
    handoffTriggers,
    fallbackBehavior,
  };
}

/** Human-language preview shown to the user (never exposes technical terms). */
export function buildAgentBrainPreview(form: AgentBrainForm): string {
  const parts: string[] = [];
  const step = form.advanceStep;

  if (step && step !== "none") {
    const label = ADVANCE_STEP_OPTIONS.find((option) => option.value === step)?.label.toLowerCase() ?? "a próxima etapa";
    parts.push(`conduzir os clientes para ${label}`);
  } else if (form.mainGoal) {
    const goal = MAIN_GOAL_OPTIONS.find((option) => option.value === form.mainGoal)?.label.toLowerCase();
    if (goal) parts.push(`focar em ${goal}`);
  }

  if (form.serviceMode) {
    const mode = SERVICE_MODE_OPTIONS.find((option) => option.value === form.serviceMode)?.label.toLowerCase();
    if (mode) parts.push(`atender ${mode}`);
  }

  if (form.handoffTriggers.length > 0) {
    parts.push(`chamar uma pessoa em ${form.handoffTriggers.length} situação(ões)`);
  }

  if (parts.length === 0) {
    return "Responda as perguntas acima para o Nexo montar a estratégia do seu atendente automaticamente.";
  }

  return `Com essas respostas, seu atendente vai ${parts.join(", ")}.`;
}
