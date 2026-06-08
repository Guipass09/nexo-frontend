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

export type PresentationStyle = "assistant_name" | "company_only" | "virtual_assistant" | "natural";

/** Ritmo de condução: quanto o agente coleta antes de avançar ao objetivo. */
export type ConversationPacing = "direct" | "balanced" | "consultative";

/** Factual knowledge fields ("O que seu atendente precisa saber").
 *  Reusa campos existentes do virtualAgent — sem novo contrato. */
export type BrainFacts = {
  services: string;
  pricing: string;
  hours: string;
  faq: string;
};

/** Texto padrão para "preço sob consulta" (reusa virtualAgent.pricingPolicy). */
export const PRICE_ON_REQUEST_TEXT = "Os valores são informados após o contato inicial.";

export type AgentBrainForm = {
  presentationStyle: PresentationStyle | "";
  mentionAi: boolean;
  businessType: BusinessType | "";
  mainGoal: MainGoal | "";
  advanceStep: AdvanceStep | "";
  serviceMode: ServiceMode | "";
  supportedTopics: string[];
  forbiddenClaims: string[];
  forbiddenClaimsExtra: string;
  handoffTriggers: string[];
  fallbackBehavior: FallbackChoice | "";
  farewellMessage: string;
  conversationPacing: ConversationPacing | "";
};

export const emptyAgentBrainForm: AgentBrainForm = {
  presentationStyle: "",
  mentionAi: true,
  businessType: "",
  mainGoal: "",
  advanceStep: "",
  serviceMode: "",
  supportedTopics: [],
  forbiddenClaims: [],
  forbiddenClaimsExtra: "",
  handoffTriggers: [],
  fallbackBehavior: "",
  farewellMessage: "",
  conversationPacing: "",
};

export const PRESENTATION_OPTIONS: { value: PresentationStyle; label: string }[] = [
  { value: "assistant_name", label: "Usar nome do assistente" },
  { value: "company_only", label: "Usar apenas o nome da empresa" },
  { value: "virtual_assistant", label: "Dizer que é assistente virtual" },
  { value: "natural", label: "Atender de forma natural, sem mencionar IA" },
];

export const PACING_OPTIONS: { value: ConversationPacing; label: string; hint: string }[] = [
  { value: "direct", label: "Direto ao objetivo", hint: "Mínimo de perguntas — vai direto ao próximo passo (cadastro, agenda, orçamento)." },
  { value: "balanced", label: "Equilibrado (padrão)", hint: "Uma pergunta por vez e avança assim que tiver o essencial." },
  { value: "consultative", label: "Consultivo", hint: "Coleta mais contexto antes de avançar (ainda uma pergunta por vez)." },
];

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

/**
 * Real-time greeting preview ("Assim o cliente verá sua primeira mensagem").
 * Derived from the presentation style + names. Never exposes technical terms.
 */
export function buildGreetingPreview(
  form: AgentBrainForm,
  companyName: string,
  assistantName: string,
): string {
  const company = companyName.trim() || "nossa empresa";
  const name = assistantName.trim();

  switch (form.presentationStyle) {
    case "assistant_name":
      return name
        ? `Olá, eu sou ${name}, assistente da ${company}. Como posso ajudar?`
        : `Olá! Sou o atendimento da ${company}. Como posso ajudar?`;
    case "company_only":
      return `Olá, aqui é da ${company}. Como posso ajudar?`;
    case "virtual_assistant":
      return `Olá, sou o assistente virtual da ${company}. Como posso ajudar?`;
    case "natural":
      return "Olá! Como posso ajudar?";
    default:
      return name
        ? `Olá, eu sou ${name}, da ${company}. Como posso ajudar?`
        : `Olá! Como posso ajudar?`;
  }
}

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
    presentationStyle: form.presentationStyle || "natural",
    mentionAi: form.mentionAi,
    // Persist the selected objective so it can be re-populated on reload.
    mainGoal: form.mainGoal,
    // Custom farewell used by the agent to close the conversation.
    farewellMessage: form.farewellMessage,
    conversationPacing: form.conversationPacing || "balanced",
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

  const presentationRaw = String((brain.presentation_style ?? "") as string);
  const presentationStyle = PRESENTATION_OPTIONS.some((option) => option.value === presentationRaw)
    ? (presentationRaw as PresentationStyle)
    : "";
  const mentionAi = brain.mention_ai === undefined ? true : Boolean(brain.mention_ai);

  const mainGoalRaw = String((brain.main_goal ?? "") as string);
  const mainGoal: MainGoal | "" = MAIN_GOAL_OPTIONS.some((option) => option.value === mainGoalRaw)
    ? (mainGoalRaw as MainGoal)
    : "";

  const farewellMessage = String((brain.farewell_message ?? "") as string);
  const pacingRaw = String((brain.conversation_pacing ?? "") as string);
  const conversationPacing: ConversationPacing | "" = PACING_OPTIONS.some((option) => option.value === pacingRaw)
    ? (pacingRaw as ConversationPacing)
    : "";

  return {
    presentationStyle,
    mentionAi,
    businessType,
    mainGoal,
    advanceStep,
    serviceMode,
    supportedTopics: Array.from(new Set(supportedTopics)),
    forbiddenClaims,
    forbiddenClaimsExtra,
    handoffTriggers,
    fallbackBehavior,
    farewellMessage,
    conversationPacing,
  };
}

/**
 * Executive summary "Como seu atendente irá trabalhar" — bullet lines in plain
 * language, generated from the brain answers (which mirror tenantBrain /
 * operationalContext). Never exposes technical terms.
 */
export function buildExecutiveSummary(
  form: AgentBrainForm,
  facts?: BrainFacts,
): { headline: string; lines: string[] } {
  const lines: string[] = [];
  const step = form.advanceStep;
  const stepLabel = ADVANCE_STEP_OPTIONS.find((option) => option.value === step)?.label.toLowerCase();
  const signals = completionSignalsForStep(step);
  const modeLabel = SERVICE_MODE_OPTIONS.find((option) => option.value === form.serviceMode)?.label.toLowerCase();
  const fallbackLabel = FALLBACK_OPTIONS.find((option) => option.value === form.fallbackBehavior)?.label.toLowerCase();
  const forbiddenCount = form.forbiddenClaims.length + (form.forbiddenClaimsExtra.trim() ? 1 : 0);

  if (step && step !== "none" && stepLabel) {
    lines.push(`Conduz cada conversa até o cliente concluir ${stepLabel}.`);
  } else {
    lines.push("Atende e orienta o cliente sem exigir uma etapa obrigatória.");
  }

  if (signals.length > 0) {
    lines.push(`Reconhece a conclusão por frases como “${signals[0]}”.`);
  }

  if (modeLabel) {
    lines.push(`Atende ${modeLabel}.`);
  }

  if (form.supportedTopics.length > 0) {
    lines.push(`Responde sobre ${form.supportedTopics.length} assunto(s) do seu negócio.`);
  }

  if (forbiddenCount > 0) {
    lines.push(`Nunca promete ${forbiddenCount} coisa(s) que você marcou como proibidas.`);
  }

  if (form.handoffTriggers.length > 0) {
    lines.push(`Chama uma pessoa de verdade em ${form.handoffTriggers.length} situação(ões).`);
  }

  if (fallbackLabel) {
    lines.push(`Quando não sabe a resposta: ${fallbackLabel}.`);
  }

  const hasText = (value?: string) => typeof value === "string" && value.trim() !== "";
  if (hasText(facts?.services)) {
    lines.push("Sabe explicar o que a empresa oferece.");
  }
  if (hasText(facts?.pricing)) {
    lines.push("Sabe orientar sobre preços e pagamento.");
  }
  if (hasText(facts?.hours)) {
    lines.push("Conhece os horários e a disponibilidade.");
  }
  if (hasText(facts?.faq)) {
    lines.push("Responde as dúvidas mais comuns dos clientes.");
  }

  return {
    headline: "Como seu atendente irá trabalhar",
    lines,
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
