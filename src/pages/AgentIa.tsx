import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  Bot,
  Building2,
  Clock,
  Database,
  Gauge,
  HelpCircle,
  Image,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Radio,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  Trash2,
  UserRound,
  WandSparkles,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { BrandMark } from "@/components/nexo/BrandMark";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  useAiAgentAssistantWorkspace,
  useAiAgentProfile,
  useCreateAiAgentProfile,
  useDeleteAiAgentProfile,
  useSimulateAiAgent,
  useTrainAiAgent,
  useUpdateAiAgentProfile,
} from "@/hooks/use-app-data";
import type {
  AiAgentAttendanceMap,
  AiAgentProfile,
  AiAgentQualityIndicator,
  AiAgentSimulationResult,
  AiAgentSimulationTurn,
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

const simulatorExamples = [
  "quanto custa?",
  "boa noite, como funciona?",
  "já cadastrei",
  "quarta à noite pode?",
  "tem algum áudio explicando?",
];

type FieldHelp = {
  title: string;
  intro: string;
  example: string;
  tip?: string;
};

const FIELD_HELP: Record<string, FieldHelp> = {
  assistantName: {
    title: "Nome deste assistente",
    intro: "Use um nome interno para você identificar rapidamente quando esse Agent deve atuar.",
    example: "Pré-venda principal, Suporte da plataforma, Agenda, Pós-venda, Qualificação premium.",
    tip: "Evite nomes genéricos se houver mais de um assistente. Isso ajuda o Nexo bot a entender qual cérebro está sendo ajustado.",
  },
  triggerType: {
    title: "Gatilho de ativação",
    intro: "Escolha em quais conversas esse Agent pode assumir o atendimento.",
    example: "Use 'Todos os contatos' para um Agent principal. Use 'Palavra-chave' quando ele só deve entrar em assuntos como orçamento, suporte ou agenda.",
    tip: "Se você tiver vários Agents, cada um precisa de um gatilho claro para não disputar a mesma conversa.",
  },
  triggerKeywords: {
    title: "Palavras-chave",
    intro: "Informe expressões reais que o cliente costuma escrever e que devem acionar esse Agent.",
    example: "orçamento\nquero contratar\nagendar avaliação\nsuporte da plataforma\nsegunda via",
    tip: "Pode escrever uma por linha. Inclua variações naturais, mas não precisa exagerar: o RAG e o entendimento semântico ajudam no resto.",
  },
  agentName: {
    title: "Nome da pessoa virtual",
    intro: "É o nome público ou semi-público que dá personalidade ao atendimento.",
    example: "Sofia, Nexo IA, Clara, Time de Atendimento, Consultora Virtual.",
    tip: "Se a marca for mais formal, use 'Time de atendimento'. Se quiser humanizar, use um nome próprio.",
  },
  roleTitle: {
    title: "Papel no atendimento",
    intro: "Explique a função da IA sem transformar isso em cargo robótico.",
    example: "Especialista virtual em atendimento e agendamento. Consultora de pré-venda. Assistente de suporte ao cliente.",
    tip: "O papel deve dizer o que ela resolve, não apenas um título bonito.",
  },
  businessName: {
    title: "Empresa ou profissional",
    intro: "Coloque o nome oficial que a IA pode usar quando precisar se apresentar.",
    example: "Sementes da Fala, Clínica Horizonte, Studio Ana Lima, Dev Saúde Pro.",
    tip: "Se for profissional autônomo, use o nome comercial ou como o cliente reconhece a marca.",
  },
  segment: {
    title: "Segmento",
    intro: "Diga em poucas palavras o mercado em que a empresa atua.",
    example: "Fonoaudiologia infantil online, estética facial, consultoria jurídica, desenvolvimento de sistemas para saúde.",
    tip: "Quanto mais específico, melhor. 'Saúde' é amplo; 'terapia fonoaudiológica infantil online' é muito mais útil.",
  },
  businessModel: {
    title: "Modelo do negócio",
    intro: "Ajuda o Agent a entender se a venda é serviço, produto, assinatura, consulta, suporte ou outro formato.",
    example: "Serviço agendado, assinatura mensal, venda consultiva, atendimento clínico, produto digital.",
    tip: "Isso influencia perguntas, tom e próximos passos. Uma clínica conversa diferente de um e-commerce.",
  },
  tone: {
    title: "Tom predominante",
    intro: "Define como a resposta deve soar no WhatsApp.",
    example: "Acolhedor e profissional para saúde. Direto e consultivo para vendas B2B. Leve e próximo para comércio local.",
    tip: "Escolha o tom pensando no cliente final, não só no gosto da empresa.",
  },
  primaryGoal: {
    title: "Objetivo principal do atendimento",
    intro: "É o resultado que o Agent deve buscar na maioria das conversas.",
    example: "Agendar uma avaliação, qualificar um lead, vender um plano, resolver suporte, enviar proposta, orientar cadastro.",
    tip: "Um objetivo claro evita respostas soltas e perguntas desnecessárias.",
  },
  conversationApproach: {
    title: "Abordagem da conversa",
    intro: "Define se o Agent deve conduzir mais, perguntar mais ou responder de forma mais objetiva.",
    example: "Guiada para atendimento com etapas. Consultiva para venda complexa. Direta para suporte simples.",
    tip: "Se o cliente geralmente chega confuso, escolha uma abordagem mais guiada.",
  },
  responseLength: {
    title: "Tamanho ideal da resposta",
    intro: "Controla a quantidade de texto que a IA tende a enviar.",
    example: "Curta para WhatsApp rápido. Equilibrada para explicar e conduzir. Detalhada para dúvidas técnicas.",
    tip: "No WhatsApp, quase sempre o melhor é responder bem em blocos curtos.",
  },
  desiredOutcome: {
    title: "Resultado esperado pelo cliente",
    intro: "Descreva o que o cliente quer conseguir ao falar com a empresa.",
    example: "Sair com uma avaliação marcada, receber o link correto, entender valores, saber se o serviço serve para o caso dele, resolver um problema.",
    tip: "Isso ajuda a IA a responder com foco no desejo do cliente, não só no processo interno da empresa.",
  },
  businessDescription: {
    title: "O que a empresa faz",
    intro: "Explique o negócio em linguagem simples, como você explicaria para alguém que nunca ouviu falar da empresa.",
    example: "A empresa oferece terapia fonoaudiológica online para crianças com dificuldades de fala e comunicação. A família passa por uma avaliação inicial, recebe orientação e pode seguir com sessões acompanhadas pela plataforma.",
    tip: "Inclua o que oferece, para quem, como funciona e qual transformação entrega.",
  },
  audienceDescription: {
    title: "Quem é o cliente ideal",
    intro: "Descreva quem costuma procurar a empresa e quais dores, desejos ou dúvidas aparecem.",
    example: "Famílias com crianças a partir de 4 anos que percebem atraso na fala, troca de sons ou dificuldade de comunicação. Normalmente chegam inseguras e querem entender se precisam de avaliação.",
    tip: "Quanto mais claro o perfil, melhor a IA identifica intenção e nível de urgência.",
  },
  services: {
    title: "Ofertas, serviços ou soluções",
    intro: "Liste o que a empresa entrega e o que pode ser explicado ao cliente.",
    example: "Avaliação inicial gratuita, sessões online, atividades interativas, relatórios de evolução, orientação para família e acompanhamento pela plataforma.",
    tip: "Não escreva propaganda vazia. Escreva fatos úteis que a IA pode usar para responder dúvidas.",
  },
  progressionRules: {
    title: "Como a conversa deve progredir",
    intro: "Explique a lógica do atendimento sem escrever frases prontas.",
    example: "Primeiro acolher e entender a necessidade. Depois explicar se a solução faz sentido. Se houver interesse, pedir permissão para enviar o cadastro. Após confirmação de cadastro feito, seguir para agendamento.",
    tip: "Pense em etapas, não em texto decorado. A IA vai redigir naturalmente.",
  },
  successSignals: {
    title: "Como saber que a conversa foi bem sucedida",
    intro: "Defina sinais de que o atendimento pode avançar ou encerrar.",
    example: "Cliente recebeu o link, confirmou cadastro, informou disponibilidade, aceitou proposta, enviou dados necessários ou disse que a dúvida foi resolvida.",
    tip: "Isso reduz repetição e impede a IA de voltar para uma etapa já concluída.",
  },
  faq: {
    title: "Perguntas frequentes",
    intro: "Cadastre dúvidas recorrentes e respostas orientadoras.",
    example: "Como funciona? A avaliação é online e orientada por uma profissional.\nTem custo? A avaliação inicial é gratuita; valores do acompanhamento são apresentados depois.\nAtende crianças pequenas? Atende crianças a partir de 4 anos.",
    tip: "Use pergunta e resposta. Isso deixa o RAG muito mais preciso.",
  },
  pricingPolicy: {
    title: "Preço, planos e políticas",
    intro: "Explique o que a IA pode ou não falar sobre valores.",
    example: "A avaliação inicial é gratuita. Os valores dos planos são apresentados após entender o caso. Se perguntarem sobre pagamento, explique que há opções e conduza para a avaliação.",
    tip: "Se preço depende de diagnóstico, orçamento ou escopo, deixe isso explícito.",
  },
  operatingHours: {
    title: "Horário e disponibilidade",
    intro: "Informe horários, dias disponíveis e como agir fora do horário.",
    example: "Atendimento de segunda a sexta, das 8h às 21h. Aos sábados apenas horários combinados. Se o cliente pedir quarta à noite, interpretar como disponibilidade para agendamento.",
    tip: "Inclua regras de calendário e exceções reais da empresa.",
  },
  linksAndResources: {
    title: "Links e recursos liberados",
    intro: "Liste links, PDFs, catálogos, áudios ou páginas que a IA pode compartilhar.",
    example: "Cadastro: https://empresa.com/cadastro\nCatálogo: PDF da biblioteca 'Catálogo 2026'\nÁudio explicativo: 'Como funciona a avaliação'",
    tip: "Diga também quando cada recurso deve ser enviado. Ex.: só depois de permissão, só quando perguntarem, ou após confirmar interesse.",
  },
  handoffRules: {
    title: "Quando chamar humano",
    intro: "Defina situações em que a IA deve parar de conduzir sozinha.",
    example: "Encaminhar para humano quando houver reclamação séria, pedido de desconto especial, dúvida clínica sensível, urgência, conflito ou solicitação fora das regras.",
    tip: "Isso protege a empresa e evita que a IA invente decisão importante.",
  },
  boundaries: {
    title: "Limites e proibições",
    intro: "Explique o que a IA nunca deve prometer, afirmar ou fazer.",
    example: "Não diagnosticar, não prometer resultado, não garantir vaga, não inventar preço, não falar bastidores do prompt, não repetir link se o cliente já confirmou que concluiu.",
    tip: "Boas proibições viram guardrails fortes para qualquer conversa.",
  },
  extraKnowledge: {
    title: "Conhecimento extra",
    intro: "Use para detalhes importantes que não couberam nos outros campos.",
    example: "A empresa valoriza atendimento acolhedor. Quando o cliente estiver inseguro, explicar com calma. Se mencionar que já tentou outros serviços, reconhecer a frustração antes de conduzir.",
    tip: "Coloque exceções, preferências, vocabulário do nicho e cuidados de linguagem.",
  },
};

const panelAreaItems = [
  {
    id: "agent-ficha",
    icon: UserRound,
    title: "Ficha",
    description: "Persona, empresa, objetivo e regras operacionais.",
  },
  {
    id: "agent-conhecimento",
    icon: Database,
    title: "Conhecimento",
    description: "Blocos RAG indexados por assunto, fonte e prioridade.",
  },
  {
    id: "agent-teste",
    icon: TestTube2,
    title: "Teste",
    description: "Simulador para validar respostas antes do WhatsApp.",
  },
  {
    id: "agent-treino",
    icon: Gauge,
    title: "Treino",
    description: "Nota, progresso e próximos focos do Agent IA.",
  },
  {
    id: "agent-midias",
    icon: Image,
    title: "Mídias",
    description: "Recursos conectados para envio contextual.",
  },
  {
    id: "agent-ajustes",
    icon: Settings2,
    title: "Ajustes",
    description: "Aprendizados do Nexo bot aplicados ao cérebro.",
  },
];

const emptyAttendanceMap: AiAgentAttendanceMap = {
  main_goal: "",
  conversation_steps: [],
  minimum_required_data: [],
  when_to_send_link: "",
  when_to_schedule: "",
  when_to_handoff: "",
  business_hours: "",
  never_do: [],
  correct_guidance_examples: [],
  raw_notes: "",
};

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
  attendanceMap: emptyAttendanceMap,
};

function textToList(value: string): string[] {
  return value
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => {
      const normalized = item.toLocaleLowerCase("pt-BR");
      return list.findIndex((candidate) => candidate.toLocaleLowerCase("pt-BR") === normalized) === index;
    })
    .slice(0, 40);
}

function listToText(value?: string[] | null): string {
  return Array.isArray(value) ? value.join("\n") : "";
}

function mergeAttendanceMap(value?: Partial<AiAgentAttendanceMap> | null): AiAgentAttendanceMap {
  return {
    ...emptyAttendanceMap,
    ...(value ?? {}),
    conversation_steps: Array.isArray(value?.conversation_steps) ? value.conversation_steps.filter(Boolean) : [],
    minimum_required_data: Array.isArray(value?.minimum_required_data) ? value.minimum_required_data.filter(Boolean) : [],
    never_do: Array.isArray(value?.never_do) ? value.never_do.filter(Boolean) : [],
    correct_guidance_examples: Array.isArray(value?.correct_guidance_examples) ? value.correct_guidance_examples.filter(Boolean) : [],
  };
}

function mergeVirtualAgent(value?: Partial<AiAgentVirtualAgent> | null): AiAgentVirtualAgent {
  return {
    ...emptyVirtualAgent,
    ...(value ?? {}),
    requiredSteps: Array.isArray(value?.requiredSteps) ? value?.requiredSteps.filter(Boolean) : [],
    allowedActions: Array.isArray(value?.allowedActions) ? value?.allowedActions.filter(Boolean) : [],
    attendanceMap: mergeAttendanceMap(value?.attendanceMap),
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

function stageLabel(stage?: string | null) {
  if (!stage) {
    return "Conversa";
  }

  const labels: Record<string, string> = {
    conversation: "Conversa",
    explaining: "Explicação",
    registration_required: "Cadastro necessário",
    awaiting_registration_confirmation: "Aguardando confirmação",
    ready_to_schedule: "Pronto para agendar",
    scheduling_in_progress: "Agendamento",
    support: "Suporte",
    handoff: "Humano",
  };

  return labels[stage] ?? stage.replaceAll("_", " ");
}

function scoreTone(score: number) {
  if (score >= 90) {
    return "text-emerald-700";
  }

  if (score >= 72) {
    return "text-amber-700";
  }

  return "text-rose-700";
}

function qualityStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    excellent: "Excelente",
    good: "Bom",
    attention: "Ajustar",
    critical: "Crítico",
    not_applicable: "Neutro",
  };

  return labels[status ?? ""] ?? "Ajustar";
}

function qualityStatusClass(status?: string | null) {
  switch (status) {
    case "excellent":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "good":
      return "border-blue-200 bg-blue-50 text-blue-900";
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "not_applicable":
      return "border-slate-200 bg-slate-50 text-slate-500";
    default:
      return "border-amber-200 bg-amber-50 text-amber-900";
  }
}

function sourceTypeLabel(sourceType?: string | null) {
  const labels: Record<string, string> = {
    virtual_agent: "Ficha",
    prompt: "Prompt",
    flow: "Fluxo",
    media: "Mídia",
    nexo_bot: "Nexo bot",
    training: "Treino",
    universal: "Universal",
  };

  return labels[sourceType ?? ""] ?? humanizeLabel(sourceType ?? "Fonte");
}

function simulatorIntentLabel(intent?: string | null) {
  const labels: Record<string, string> = {
    fallback: "Entendimento por contexto",
    general_support: "Atendimento geral",
    question: "Pergunta do cliente",
    platform_question: "Dúvida sobre plataforma",
    evaluation_process: "Processo de atendimento",
    schedule_request: "Pedido de agendamento",
    scheduling: "Agendamento",
    schedule_preference: "Preferência de horário",
    pricing_and_plans: "Valores e planos",
  };

  return labels[intent ?? ""] ?? (intent ? humanizeLabel(intent) : "Não identificada");
}

function simulatorStrategyLabel(strategy?: string | null) {
  const labels: Record<string, string> = {
    openai_failed: "Falha da OpenAI",
    planner_unavailable: "Resposta segura com RAG",
    answer_naturally: "Resposta natural",
    answer: "Resposta direta",
    answer_from_context: "Resposta com contexto",
    answer_from_prompt: "Resposta com instruções do Agent",
    ask_more_details: "Pediu detalhe necessário",
    continue_conversation: "Continuação do atendimento",
    guardrail_internal_leak_blocked: "Proteção contra vazamento",
    guardrail_business_label_leak_blocked: "Proteção de rótulos internos",
    guardrail_direct_question_knowledge_fallback: "Resposta corrigida pelo RAG",
    guardrail_duplicate_reply_fallback: "Proteção contra repetição",
    guardrail_completed_step_reopen_blocked: "Etapa concluída protegida",
    guardrail_meta_or_scheduling_loop_fallback: "Fluxo corrigido",
    guardrail_pending_offer_fallback: "Oferta pendente avançada",
    guardrail_registration_link_fallback: "Link de cadastro tratado",
  };

  return labels[strategy ?? ""] ?? (strategy ? humanizeLabel(strategy) : "Resposta natural");
}

function openAiStatusClass(status?: string) {
  if (status === "ok") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function openAiStatusLabel(status?: string) {
  if (status === "ok") {
    return "ok";
  }

  if (status === "failed") {
    return "falhou";
  }

  return "não usado";
}

function humanizeLabel(value?: string | null) {
  if (!value) {
    return "Sem assunto";
  }

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

function countAssistantRules(rules?: { [key: string]: unknown } | null) {
  if (!rules) {
    return 0;
  }

  return Object.values(rules).reduce((total, value) => {
    if (Array.isArray(value)) {
      return total + value.length;
    }

    return total;
  }, 0);
}

export default function AgentIa() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, error, isError } = useAiAgentProfile();
  const updateMutation = useUpdateAiAgentProfile();
  const createProfileMutation = useCreateAiAgentProfile();
  const deleteProfileMutation = useDeleteAiAgentProfile();
  const trainMutation = useTrainAiAgent();
  const simulateMutation = useSimulateAiAgent();

  const [profiles, setProfiles] = useState<AiAgentProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Assistente principal");
  const [triggerType, setTriggerType] = useState<AiAgentTriggerType>("all_contacts");
  const [triggerKeywordsText, setTriggerKeywordsText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [allowSavedContacts, setAllowSavedContacts] = useState(true);
  const [virtualAgent, setVirtualAgent] = useState<AiAgentVirtualAgent>(emptyVirtualAgent);
  const [trainingPhraseIndex, setTrainingPhraseIndex] = useState(0);
  const [simulatorMessage, setSimulatorMessage] = useState("boa noite, como funciona?");
  const [simulatorConversationMessages, setSimulatorConversationMessages] = useState<string[]>([]);
  const [simulatorResult, setSimulatorResult] = useState<AiAgentSimulationResult | null>(null);
  const assistantWorkspaceQuery = useAiAgentAssistantWorkspace(
    { profileId: activeProfileId },
    Boolean(activeProfileId),
  );

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

  useEffect(() => {
    setSimulatorConversationMessages([]);
    setSimulatorResult(null);
    setSimulatorMessage("boa noite, como funciona?");
  }, [activeProfileId]);

  const activeProfile = useMemo(() => {
    return profiles.find((profile) => normalizeProfileId(profile.id) === activeProfileId) ?? null;
  }, [activeProfileId, profiles]);

  const activeTrainingReport = useMemo<AiAgentTrainingReport | null>(() => {
    return activeProfile?.trainingReport ?? null;
  }, [activeProfile]);

  const knowledgeItems = useMemo(() => {
    return activeProfile?.knowledgeItems ?? [];
  }, [activeProfile]);

  const knowledgeSummary = activeProfile?.knowledgeSummary;
  const assistantWorkspace = assistantWorkspaceQuery.data;
  const mediaAssets = assistantWorkspace?.mediaAssets ?? [];
  const nexoRuleCount = countAssistantRules(assistantWorkspace?.rules);

  const filledFieldsCount = useMemo(() => {
    const stringCount = Object.entries(virtualAgent)
      .filter(([key, value]) => !["requiredSteps", "allowedActions", "attendanceMap"].includes(key) && typeof value === "string" && value.trim() !== "")
      .length;
    const arrayCount = virtualAgent.requiredSteps.length + virtualAgent.allowedActions.length;
    const attendanceMap = virtualAgent.attendanceMap ?? emptyAttendanceMap;
    const attendanceStringCount = [
      attendanceMap.main_goal,
      attendanceMap.when_to_send_link,
      attendanceMap.when_to_schedule,
      attendanceMap.when_to_handoff,
      attendanceMap.business_hours,
      attendanceMap.raw_notes,
    ].filter((value) => value.trim() !== "").length;
    const attendanceListCount =
      attendanceMap.minimum_required_data.length +
      attendanceMap.never_do.length +
      attendanceMap.correct_guidance_examples.length +
      attendanceMap.conversation_steps.length;

    return stringCount + arrayCount + attendanceStringCount + attendanceListCount;
  }, [virtualAgent]);

  const contextPreview = useMemo(() => {
    const attendanceMap = virtualAgent.attendanceMap ?? emptyAttendanceMap;
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
      attendanceMap.main_goal && `Mapa de atendimento - objetivo central: ${attendanceMap.main_goal}`,
      attendanceMap.raw_notes && `Mapa de atendimento - ordem ideal:\n${attendanceMap.raw_notes}`,
      attendanceMap.minimum_required_data.length > 0 && `Dados mínimos do mapa: ${attendanceMap.minimum_required_data.join(", ")}`,
      attendanceMap.when_to_send_link && `Quando enviar link: ${attendanceMap.when_to_send_link}`,
      attendanceMap.when_to_schedule && `Quando agendar: ${attendanceMap.when_to_schedule}`,
      attendanceMap.business_hours && `Horários permitidos: ${attendanceMap.business_hours}`,
      attendanceMap.never_do.length > 0 && `Nunca fazer: ${attendanceMap.never_do.join(", ")}`,
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

  const updateAttendanceMapField = <K extends keyof AiAgentAttendanceMap>(field: K, value: AiAgentAttendanceMap[K]) => {
    setVirtualAgent((current) => ({
      ...current,
      attendanceMap: {
        ...(current.attendanceMap ?? emptyAttendanceMap),
        [field]: value,
      },
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

  const handleSimulate = (message = simulatorMessage) => {
    const nextMessage = message.trim();

    if (!nextMessage) {
      return;
    }

    const nextMessages = [...simulatorConversationMessages, nextMessage];

    setSimulatorConversationMessages(nextMessages);
    setSimulatorMessage("");

    simulateMutation.mutate({
      profileId: activeProfileId,
      messages: nextMessages,
      savedContact: true,
    }, {
      onSuccess: (result) => {
        setSimulatorResult(result);

        if (!result.ok) {
          toast({
            title: "Simulação não concluída",
            description: result.error ?? "Não foi possível testar essa mensagem agora.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Simulação concluída",
          description: `Nota ${result.summary.averageScore.toFixed(0)}. ${result.summary.issues.length ? "Há pontos para calibrar." : "Resposta aprovada no laboratório."}`,
        });
      },
      onError: (mutationError) => {
        setSimulatorConversationMessages(simulatorConversationMessages);
        setSimulatorMessage(nextMessage);
        toast({
          title: "Falha no simulador",
          description: getApiErrorMessage(mutationError),
          variant: "destructive",
        });
      },
    });
  };

  const handleClearSimulation = () => {
    setSimulatorConversationMessages([]);
    setSimulatorResult(null);
    setSimulatorMessage("boa noite, como funciona?");
  };

  const handleCorrectWithNexoBot = (turn: AiAgentSimulationTurn) => {
    const draft = [
      "No simulador do Agent IA, identifiquei um ponto para corrigir de forma geral.",
      `Mensagem do cliente: "${turn.incoming}"`,
      `Resposta da IA: "${turn.reply ?? "sem resposta"}"`,
      `Intenção detectada: ${turn.intentDetected?.label ?? simulatorIntentLabel(turn.intent)}.`,
      `Etapa detectada: ${turn.stageDetected?.label ?? stageLabel(turn.conversationStage)}.`,
      turn.decisionReason ? `Motivo da decisão: ${turn.decisionReason}` : "",
      turn.risksDetected.length > 0 ? `Riscos detectados: ${turn.risksDetected.map((risk) => risk.message || humanizeLabel(risk.code)).join("; ")}` : "",
      "Ajuste o comportamento para melhorar esse tipo de caso em todas as conversas futuras.",
    ].filter(Boolean).join("\n");

    window.localStorage.setItem("nexo-bot-prefill", JSON.stringify({
      profileId: activeProfileId,
      text: draft,
    }));
    navigate("/nexo-bot");
  };

  const latestSimulationTurn = simulatorResult?.turns.at(-1) ?? null;
  const simulatorChatTurns = simulatorResult?.turns ?? [];
  const panelAreaStats: Record<string, string> = {
    "agent-ficha": `${filledFieldsCount} itens`,
    "agent-conhecimento": `${knowledgeSummary?.activeBlocks ?? knowledgeItems.length} blocos`,
    "agent-teste": simulatorResult ? `Nota ${simulatorResult.summary.averageScore.toFixed(0)}` : "Simular",
    "agent-treino": activeTrainingReport ? `Nota ${activeTrainingReport.averageScore.toFixed(0)}` : "Sem treino",
    "agent-midias": `${mediaAssets.length} recursos`,
    "agent-ajustes": `${nexoRuleCount} regras`,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 p-6 shadow-elegant md:p-8 gradient-card">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Nexo IA premium
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Centro de inteligência do atendimento.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Configure a persona, teste conversas reais e acompanhe como a IA conduz cada atendimento com contexto, memória e segurança.
            </p>
          </div>
          <div className="relative flex min-w-[280px] flex-col gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {panelAreaItems.map((item) => (
          <PanelAreaCard
            key={item.id}
            icon={item.icon}
            targetId={item.id}
            title={item.title}
            description={item.description}
            status={panelAreaStats[item.id]}
          />
        ))}
      </section>

      {isError && (
        <Card className="border-destructive/40 p-4 text-sm text-destructive">
          Erro ao carregar Agent IA: {getApiErrorMessage(error)}
        </Card>
      )}

      <section id="agent-treino" className="scroll-mt-24">
        {activeTrainingReport ? (
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
        ) : (
          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Gauge}
              title="Treino e progresso"
              description="Rode o Treinar IA para validar cenários, gerar nota e criar próximos focos."
            />
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              Ainda não existe relatório de treino para este Agent. Quando você treinar, esta área mostra nota,
              pontos fortes, prioridades e ações aplicadas.
            </div>
          </Card>
        )}
      </section>

      <section id="agent-conhecimento" className="scroll-mt-24">
        <Card className="border-border/60 p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader
              icon={Database}
              title="Conhecimento RAG salvo"
              description="Blocos que o Agent pode buscar antes de responder: ficha, fluxos, Nexo bot, mídias, treino e prompts."
            />
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[430px]">
              <PreviewPill label="Blocos ativos" value={String(knowledgeSummary?.activeBlocks ?? knowledgeItems.length)} />
              <PreviewPill label="Com embedding" value={String(knowledgeSummary?.embeddedBlocks ?? knowledgeItems.filter((item) => item.hasEmbedding).length)} />
              <PreviewPill label="Fontes" value={String(knowledgeSummary?.sourceTypes?.length ?? 0)} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(knowledgeSummary?.topics ?? []).slice(0, 12).map((topic) => (
              <Badge key={topic} variant="secondary" className="bg-blue-50 text-blue-700">
                {humanizeLabel(topic)}
              </Badge>
            ))}
            {(knowledgeSummary?.sourceTypes ?? []).slice(0, 8).map((sourceType) => (
              <Badge key={sourceType} variant="outline">
                {sourceTypeLabel(sourceType)}
              </Badge>
            ))}
          </div>

          {knowledgeItems.length > 0 ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {knowledgeItems.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{humanizeLabel(item.topic)}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {sourceTypeLabel(item.sourceType)} {item.sourceLabel ? `• ${item.sourceLabel}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">P{item.priority}</Badge>
                      <Badge variant={item.hasEmbedding ? "default" : "secondary"}>
                        {item.hasEmbedding ? "Embedding" : "Texto"}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              Nenhum bloco RAG ativo apareceu para este Agent ainda. Salve a ficha, rode o treino ou ensine pelo Nexo bot para alimentar esta base automaticamente.
            </div>
          )}
        </Card>
      </section>

      <section id="agent-teste" className="scroll-mt-24">
        <Card className="overflow-hidden border-slate-200 bg-slate-950 p-0 text-white shadow-xl shadow-slate-900/10">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(20,184,166,0.34),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(37,99,235,0.36),transparent_26%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#082f49_100%)]" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="relative grid gap-6 p-5 md:p-7 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
                <TestTube2 className="h-3.5 w-3.5" />
                Simulador Nexo IA
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Teste seu agente como se fosse um cliente real.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  A simulação usa o perfil ativo, memória, RAG, boas maneiras, calendário, regras do Nexo bot e mídias disponíveis. Nada é enviado ao cliente real.
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Conversa simulada</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Cada nova mensagem reaproveita o histórico para testar memória, etapa e RAG em sequência.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSimulation}
                    disabled={simulateMutation.isPending || (simulatorConversationMessages.length === 0 && !simulatorResult)}
                    className="rounded-full border-white/15 bg-white/10 text-slate-100 hover:bg-white/20 hover:text-white"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Limpar
                  </Button>
                </div>

                <div className="mt-4 max-h-[390px] space-y-3 overflow-y-auto rounded-[1.35rem] border border-white/10 bg-slate-950/35 p-3">
                  {simulatorChatTurns.length > 0 ? simulatorChatTurns.map((turn, turnIndex) => (
                    <div key={`${turn.incoming}-${turnIndex}`} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="max-w-[86%] rounded-2xl rounded-tr-sm bg-blue-500 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-blue-950/20">
                          {turn.incoming}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/10 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-lg shadow-slate-950/15">
                          {turn.capturedMessages.length > 0 ? (
                            <div className="space-y-2">
                              {turn.capturedMessages.map((message, messageIndex) => (
                                <div key={`${message.type}-${messageIndex}`}>
                                  {message.type === "media" && message.media ? (
                                    <div className="mb-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
                                      {message.media.type} • {message.media.name}
                                    </div>
                                  ) : null}
                                  <p>{message.text || turn.reply || "A IA não respondeu neste turno."}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>{turn.reply || "A IA não respondeu neste turno."}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                            <span>{stageLabel(turn.conversationStage)}</span>
                            <span>Nota {turn.score.toFixed(0)}</span>
                            {turn.sourcesUsed.length > 0 ? <span>{turn.sourcesUsed.length} fonte(s)</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                      <MessageSquareText className="h-8 w-8 text-cyan-200" />
                      <p className="mt-3 text-sm font-semibold text-slate-100">Comece a conversa de teste</p>
                      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                        Digite como o cliente falaria no WhatsApp e veja como a IA conduz a próxima etapa.
                      </p>
                    </div>
                  )}
                </div>

                <Label className="mt-4 block text-slate-100">Nova mensagem do cliente</Label>
                <Textarea
                  value={simulatorMessage}
                  onChange={(event) => setSimulatorMessage(event.target.value)}
                  placeholder="Digite como o cliente falaria no WhatsApp..."
                  className="mt-3 min-h-[96px] resize-none border-white/10 bg-slate-950/45 text-base leading-7 text-white placeholder:text-slate-500 focus-visible:ring-cyan-300"
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      handleSimulate();
                    }
                  }}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {simulatorExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => handleSimulate(example)}
                      disabled={simulateMutation.isPending || !activeProfileId}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-400">
                    Dica: use Cmd/Ctrl + Enter para enviar e analisar a próxima etapa.
                  </p>
                  <Button
                    type="button"
                    onClick={() => handleSimulate()}
                    disabled={simulateMutation.isPending || !activeProfileId || simulatorMessage.trim() === ""}
                    className="rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  >
                    {simulateMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar no simulador
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-white/10 bg-white/95 p-4 text-slate-950 shadow-2xl shadow-cyan-950/20 md:p-5">
              {simulateMutation.isPending ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                    <WandSparkles className="h-8 w-8 animate-pulse" />
                  </div>
                  <p className="mt-4 text-lg font-semibold">Preparando atendimento inteligente</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Buscando fontes, avaliando etapa, mídia e qualidade da resposta antes de mostrar o resultado.
                  </p>
                </div>
              ) : latestSimulationTurn ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resposta da IA</p>
                      <div className="mt-3 rounded-[1.35rem] rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900">
                        {latestSimulationTurn.reply || "A IA não respondeu neste cenário."}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
                      <Gauge className={`mx-auto h-5 w-5 ${scoreTone(latestSimulationTurn.score)}`} />
                      <p className={`mt-2 text-3xl font-semibold ${scoreTone(latestSimulationTurn.score)}`}>
                        {latestSimulationTurn.score.toFixed(0)}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">nota</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <SimulatorMetric icon={MessageSquareText} label="Etapa detectada" value={latestSimulationTurn.stageDetected?.label ?? stageLabel(latestSimulationTurn.conversationStage)} />
                    <SimulatorMetric icon={Radio} label="Intenção" value={latestSimulationTurn.intentDetected?.label ?? simulatorIntentLabel(latestSimulationTurn.intent)} />
                    <SimulatorMetric icon={ArrowRight} label="Estratégia" value={simulatorStrategyLabel(latestSimulationTurn.responseStrategy)} />
                  </div>

                  {latestSimulationTurn.openaiStatus ? (
                    <div className={`rounded-3xl border p-4 ${latestSimulationTurn.openaiFailed ? "border-rose-200 bg-rose-50/80" : "border-emerald-100 bg-emerald-50/60"}`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                            {latestSimulationTurn.openaiFailed ? <AlertTriangle className="h-4 w-4 text-rose-600" /> : <Sparkles className="h-4 w-4 text-emerald-600" />}
                            Status OpenAI neste turno
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Mostra se planner, embeddings e outras camadas usaram a OpenAI real ou se houve fallback.
                          </p>
                        </div>
                        {latestSimulationTurn.fallbackUsed ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-900">Fallback usado</Badge>
                        ) : (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900">Sem fallback</Badge>
                        )}
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        {Object.entries(latestSimulationTurn.openaiStatus).map(([layer, status]) => (
                          <div key={layer} className={`rounded-2xl border px-3 py-2 ${openAiStatusClass(status)}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wide">{humanizeLabel(layer)}</p>
                            <p className="mt-1 text-sm font-semibold">{openAiStatusLabel(status)}</p>
                          </div>
                        ))}
                      </div>
                      {latestSimulationTurn.openaiErrors && latestSimulationTurn.openaiErrors.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {latestSimulationTurn.openaiErrors.slice(0, 3).map((error, index) => (
                            <div key={`${error.layer ?? "openai"}-${index}`} className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm leading-6 text-rose-900">
                              <strong>{humanizeLabel(error.layer ?? "OpenAI")}:</strong>{" "}
                              {humanizeLabel(error.errorType ?? "erro")} {error.model ? `• ${error.model}` : ""}
                              <div className="mt-1 text-xs leading-5 text-rose-800">
                                {error.httpStatus ? <span>HTTP {error.httpStatus} </span> : null}
                                {error.errorCode ? <span>• código {error.errorCode} </span> : null}
                                {error.endpoint ? <span>• endpoint {error.endpoint} </span> : null}
                                {error.requestId ? <span>• request {error.requestId} </span> : null}
                              </div>
                              {error.errorMessage || error.error ? (
                                <p className="mt-1 text-xs leading-5 text-rose-700">
                                  {error.errorMessage || error.error}
                                </p>
                              ) : null}
                              {error.exceptionClass ? (
                                <p className="mt-1 text-[11px] leading-5 text-rose-500">
                                  Classe: {error.exceptionClass}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <Database className="h-4 w-4 text-slate-600" />
                          Debug do caminho real
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Mostra a rota, memória e serviços usados neste turno para confirmar se o simulador entrou no runtime correto.
                        </p>
                      </div>
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                        {latestSimulationTurn.routeFinal || latestSimulationTurn.route || "sem rota"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rota</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {latestSimulationTurn.routeSelected || "?"} → {latestSimulationTurn.routeFinal || latestSimulationTurn.route || "?"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">OpenAI</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {latestSimulationTurn.openaiIntended ? "esperada" : "não esperada"} / {latestSimulationTurn.openaiCalled ? "chamada" : "não chamada"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Estado</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {latestSimulationTurn.currentStepBefore || "?"} → {latestSimulationTurn.currentStepAfter || "?"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cadastro concluído</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {latestSimulationTurn.completedSteps?.includes("signup") ? "sim" : "não"}
                        </p>
                      </div>
                    </div>
                    {(latestSimulationTurn.whyNotOpenai || latestSimulationTurn.fallbackReason || latestSimulationTurn.timeoutSource) ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
                        {latestSimulationTurn.whyNotOpenai ? <p><strong>Por que não chamou OpenAI:</strong> {latestSimulationTurn.whyNotOpenai}</p> : null}
                        {latestSimulationTurn.fallbackReason ? <p><strong>Fallback:</strong> {latestSimulationTurn.fallbackReason}</p> : null}
                        {latestSimulationTurn.timeoutSource ? <p><strong>Timeout:</strong> {latestSimulationTurn.timeoutSource}</p> : null}
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Serviços chamados</p>
                        <p className="mt-1 text-xs leading-5 text-slate-700">
                          {latestSimulationTurn.servicesCalled && latestSimulationTurn.servicesCalled.length > 0
                            ? latestSimulationTurn.servicesCalled.join(" → ")
                            : "nenhum serviço informado"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Serviços pulados</p>
                        <p className="mt-1 text-xs leading-5 text-slate-700">
                          {latestSimulationTurn.servicesSkipped && latestSimulationTurn.servicesSkipped.length > 0
                            ? latestSimulationTurn.servicesSkipped.join(", ")
                            : "nenhum serviço pulado informado"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Memória carregada</p>
                        <p className="mt-1 text-xs leading-5 text-slate-700">
                          {latestSimulationTurn.memoryLoaded ? JSON.stringify(latestSimulationTurn.memoryLoaded) : "sem memória carregada"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mapa de atendimento</p>
                        <p className="mt-1 text-xs leading-5 text-slate-700">
                          {latestSimulationTurn.mapaAtendimentoUsed ? "usado" : "não usado"}
                          {latestSimulationTurn.playbookDecision ? ` • ${latestSimulationTurn.playbookDecision}` : ""}
                        </p>
                      </div>
                    </div>
                    {latestSimulationTurn.executionPath && latestSimulationTurn.executionPath.length > 0 ? (
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Caminho: {latestSimulationTurn.executionPath.join(" → ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-950">
                      <Target className="h-4 w-4 text-blue-600" />
                      Motivo da decisão
                    </p>
                    <p className="mt-2 text-sm leading-6 text-blue-950/85">
                      {latestSimulationTurn.decisionReason || "O simulador ainda não recebeu um motivo estruturado para esta resposta."}
                    </p>
                  </div>

                  {latestSimulationTurn.qualityMetrics ? (
                    <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                            <ShieldCheck className="h-4 w-4 text-cyan-600" />
                            Métricas de qualidade
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Régua da resposta: fonte, memória, calendário, mídia, educação, etapa e confiança.
                          </p>
                        </div>
                        <Badge className={qualityStatusClass(latestSimulationTurn.qualityMetrics.status)}>
                          {qualityStatusLabel(latestSimulationTurn.qualityMetrics.status)} • {latestSimulationTurn.qualityMetrics.overallScore.toFixed(0)}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {latestSimulationTurn.qualityMetrics.indicators.map((indicator) => (
                          <QualityIndicatorCard key={indicator.key} indicator={indicator} />
                        ))}
                      </div>
                      {latestSimulationTurn.qualityMetrics.pointsToImprove.length > 0 ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Pontos a melhorar</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {latestSimulationTurn.qualityMetrics.pointsToImprove.slice(0, 5).map((point) => (
                              <Badge key={point} variant="secondary" className="bg-white text-amber-950">
                                {point}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <ShieldCheck className="h-4 w-4 text-cyan-600" />
                          Regras aplicadas
                        </p>
                        <Badge variant="secondary">{latestSimulationTurn.rulesApplied.length}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {latestSimulationTurn.rulesApplied.length > 0 ? latestSimulationTurn.rulesApplied.map((rule, index) => (
                          <div key={`${rule.source}-${rule.label}-${index}`} className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{humanizeLabel(rule.source)}</p>
                            <p className="mt-1 text-sm leading-6 text-cyan-950">{rule.label}</p>
                          </div>
                        )) : (
                          <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm leading-6 text-slate-500">
                            Nenhuma regra específica precisou ser destacada neste turno.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <Gauge className="h-4 w-4 text-amber-600" />
                          Riscos detectados
                        </p>
                        <Badge variant="secondary">{latestSimulationTurn.risksDetected.length}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {latestSimulationTurn.risksDetected.length > 0 ? latestSimulationTurn.risksDetected.map((risk, index) => (
                          <div key={`${risk.source}-${risk.code}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{humanizeLabel(risk.code)}</p>
                              <Badge variant="outline" className="border-amber-200 bg-white text-amber-900">
                                {humanizeLabel(risk.level)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-amber-950/90">{risk.message || humanizeLabel(risk.source)}</p>
                          </div>
                        )) : (
                          <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm leading-6 text-slate-500">
                            Nenhum risco relevante foi detectado para esta resposta.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <BookOpenText className="h-4 w-4 text-blue-600" />
                          Fontes usadas
                        </p>
                        <Badge variant="secondary">{latestSimulationTurn.sourcesUsed.length}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {latestSimulationTurn.sourcesUsed.length > 0 ? latestSimulationTurn.sourcesUsed.map((source, index) => (
                          <div key={`${source.sourceType}-${source.topic}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {source.sourceLabel || source.sourceType} • {source.topic}
                            </p>
                            <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-700">{source.content}</p>
                          </div>
                        )) : (
                          <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm leading-6 text-slate-500">
                            Nenhuma fonte específica foi necessária ou encontrada para esta mensagem.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <Radio className="h-4 w-4 text-emerald-600" />
                          Mídia sugerida
                        </p>
                        <Badge variant="secondary">{latestSimulationTurn.mediaSuggestions.length}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {latestSimulationTurn.mediaSuggestions.length > 0 ? latestSimulationTurn.mediaSuggestions.map((media, index) => (
                          <div key={`${media.assetName}-${index}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-emerald-950">{media.assetName || media.topic}</p>
                              <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                                {media.canSend ? "Enviável" : "Referência"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-emerald-900/75">{media.sendWhen}</p>
                            {media.guidance ? <p className="mt-2 text-sm leading-6 text-emerald-950/90">{media.guidance}</p> : null}
                          </div>
                        )) : (
                          <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm leading-6 text-slate-500">
                            Nenhuma mídia foi sugerida para esta pergunta.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Diagnóstico rápido</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {latestSimulationTurn.issues.length > 0 ? latestSimulationTurn.issues.map((issue) => (
                          <Badge key={issue} variant="secondary" className="bg-amber-100 text-amber-900">
                            {issue}
                          </Badge>
                        )) : (
                          <Badge className="bg-emerald-600">Sem falhas críticas</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => handleCorrectWithNexoBot(latestSimulationTurn)}
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Corrigir com Nexo bot
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col justify-between rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Sem simulação ainda</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      O resultado aparece aqui com nota, etapa, fontes e mídia.
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Comece com uma das perguntas sugeridas ou escreva como o cliente falaria no WhatsApp. Se a resposta ficar ruim, já mandamos o contexto para o Nexo bot aprender.
                    </p>
                  </div>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {simulatorExamples.slice(0, 4).map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => handleSimulate(example)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </Card>
      </section>

      <section id="agent-midias" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 p-5 md:p-6">
          <SectionHeader
            icon={Image}
            title="Mídias conectadas"
            description="Biblioteca disponível para o Agent sugerir ou enviar quando o contexto pedir."
          />
          <div className="mt-5 space-y-3">
            {mediaAssets.length > 0 ? mediaAssets.slice(0, 8).map((asset) => (
              <div key={asset.assetId} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{asset.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {humanizeLabel(asset.type)} {asset.mimeType ? `• ${asset.mimeType}` : ""}
                  </p>
                </div>
                <Badge variant={asset.status === "active" ? "default" : "secondary"}>
                  {asset.status ?? "ativo"}
                </Badge>
              </div>
            )) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Nenhuma mídia foi conectada ao Agent ainda. Ao cadastrar áudios, PDFs, imagens ou catálogos na biblioteca, o RAG pode usá-los como recurso de atendimento.
              </div>
            )}
          </div>
        </Card>

        <Card id="agent-ajustes" className="scroll-mt-24 border-border/60 p-5 md:p-6">
          <SectionHeader
            icon={Settings2}
            title="Ajustes do Nexo bot"
            description="Correções ensinadas pelo usuário que viram regra geral deste Agent."
          />
          <div className="mt-5 grid gap-3">
            <AdjustmentGroup title="Etapas concluídas" items={assistantWorkspace?.rules?.completionAliases ?? []} />
            <AdjustmentGroup title="Confirmações positivas" items={assistantWorkspace?.rules?.affirmationAliases ?? []} />
            <AdjustmentGroup title="Frases proibidas" items={assistantWorkspace?.rules?.forbiddenReplyFragments ?? []} />
            <AdjustmentGroup title="Notas gerais" items={assistantWorkspace?.rules?.globalNotes ?? []} />
            {(assistantWorkspace?.rules?.topicGuidance?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Orientações por assunto</p>
                <div className="mt-3 space-y-2">
                  {assistantWorkspace?.rules?.topicGuidance.slice(0, 5).map((item) => (
                    <p key={`${item.topic}-${item.guidance}`} className="text-sm leading-6 text-slate-600">
                      <strong>{humanizeLabel(item.topic)}:</strong> {item.guidance}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section id="agent-ficha" className="scroll-mt-24 space-y-6">
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
              <Field label="Nome deste assistente" help={FIELD_HELP.assistantName}>
                <Input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="Ex.: Pré-venda, suporte, agenda"
                />
              </Field>
              <Field label="Gatilho de ativação" help={FIELD_HELP.triggerType}>
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
              <Field label="Palavras-chave" help={FIELD_HELP.triggerKeywords}>
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
              <Field label="Nome da pessoa virtual" help={FIELD_HELP.agentName}>
                <Input
                  value={virtualAgent.agentName}
                  onChange={(event) => updateField("agentName", event.target.value)}
                  placeholder="Ex.: Iris, Nexo IA, Time de atendimento"
                />
              </Field>
              <Field label="Papel no atendimento" help={FIELD_HELP.roleTitle}>
                <Input
                  value={virtualAgent.roleTitle}
                  onChange={(event) => updateField("roleTitle", event.target.value)}
                  placeholder="Ex.: Especialista de atendimento"
                />
              </Field>
              <Field label="Empresa ou profissional" help={FIELD_HELP.businessName}>
                <Input
                  value={virtualAgent.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  placeholder="Ex.: Nome da empresa"
                />
              </Field>
              <Field label="Segmento" help={FIELD_HELP.segment}>
                <Input
                  value={virtualAgent.segment}
                  onChange={(event) => updateField("segment", event.target.value)}
                  placeholder="Ex.: Clínica, SaaS, consultoria, comércio"
                />
              </Field>
              <Field label="Modelo do negócio" help={FIELD_HELP.businessModel}>
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
              <Field label="Tom predominante" help={FIELD_HELP.tone}>
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
              <Field label="Objetivo principal do atendimento" help={FIELD_HELP.primaryGoal}>
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
              <Field label="Abordagem da conversa" help={FIELD_HELP.conversationApproach}>
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
              <Field label="Tamanho ideal da resposta" help={FIELD_HELP.responseLength}>
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
              <Field label="Resultado esperado pelo cliente" className="md:col-span-2" help={FIELD_HELP.desiredOutcome}>
                <Input
                  value={virtualAgent.desiredOutcome}
                  onChange={(event) => updateField("desiredOutcome", event.target.value)}
                  placeholder="Ex.: sair com agenda marcada, proposta enviada, suporte resolvido, onboarding iniciado"
                />
              </Field>
              <Field label="O que a empresa faz" className="md:col-span-2" help={FIELD_HELP.businessDescription}>
                <Textarea
                  rows={5}
                  value={virtualAgent.businessDescription}
                  onChange={(event) => updateField("businessDescription", event.target.value)}
                  placeholder="Explique o negócio de forma objetiva: o que oferece, para quem e como costuma funcionar."
                />
              </Field>
              <Field label="Quem é o cliente ideal" className="md:col-span-2" help={FIELD_HELP.audienceDescription}>
                <Textarea
                  rows={4}
                  value={virtualAgent.audienceDescription}
                  onChange={(event) => updateField("audienceDescription", event.target.value)}
                  placeholder="Quais perfis chegam mais aqui, o que costumam buscar e como chegam."
                />
              </Field>
              <Field label="Ofertas, serviços ou soluções" className="md:col-span-2" help={FIELD_HELP.services}>
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

              <Field label="Como a conversa deve progredir" className="lg:col-span-2" help={FIELD_HELP.progressionRules}>
                <Textarea
                  rows={5}
                  value={virtualAgent.progressionRules}
                  onChange={(event) => updateField("progressionRules", event.target.value)}
                  placeholder="Explique a lógica da conversa sem escrever frases prontas. Ex.: primeiro entender a necessidade, depois validar fit, depois enviar proposta."
                />
              </Field>
              <Field label="Como saber que a conversa foi bem sucedida" className="lg:col-span-2" help={FIELD_HELP.successSignals}>
                <Textarea
                  rows={4}
                  value={virtualAgent.successSignals}
                  onChange={(event) => updateField("successSignals", event.target.value)}
                  placeholder="Ex.: cliente com horário marcado, lead qualificado, proposta aceita, suporte resolvido."
                />
              </Field>
            </div>
          </Card>

          <Card className="overflow-hidden border-cyan-200/70 bg-gradient-to-br from-white via-cyan-50/35 to-emerald-50/40 p-5 md:p-6">
            <SectionHeader
              icon={Workflow}
              title="Mapa de Atendimento"
              description="O trilho central da persona: responde perguntas fora do mapa quando souber, mas volta ao foco do atendimento sem parecer robô."
            />
            <div className="mt-5 rounded-2xl border border-cyan-200 bg-white/75 p-4 text-sm leading-6 text-slate-700">
              <div className="mb-1 flex items-center gap-2 font-semibold text-slate-950">
                <Target className="h-4 w-4 text-cyan-600" />
                Como usar este mapa
              </div>
              Defina o caminho ideal, os dados mínimos e os limites. O Agent pode responder dúvidas da ficha/RAG no meio da conversa, mas depois retoma o próximo passo sem pedir informação demais.
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Objetivo central do atendimento" className="md:col-span-2">
                <Input
                  value={virtualAgent.attendanceMap.main_goal}
                  onChange={(event) => updateAttendanceMapField("main_goal", event.target.value)}
                  placeholder="Ex.: converter interessados em cadastro e agendamento, sem pular acolhimento."
                />
              </Field>

              <Field label="Ordem ideal da conversa" className="md:col-span-2">
                <Textarea
                  rows={6}
                  value={virtualAgent.attendanceMap.raw_notes}
                  onChange={(event) => updateAttendanceMapField("raw_notes", event.target.value)}
                  placeholder={"Ex.:\n1. Cumprimentar e acolher\n2. Entender a necessidade\n3. Coletar idade e principal dificuldade\n4. Responder dúvidas diretas\n5. Enviar cadastro quando houver interesse\n6. Confirmar cadastro\n7. Agendar dentro dos horários permitidos"}
                />
              </Field>

              <Field label="Dados mínimos que precisa coletar">
                <Textarea
                  rows={5}
                  value={listToText(virtualAgent.attendanceMap.minimum_required_data)}
                  onChange={(event) => updateAttendanceMapField("minimum_required_data", textToList(event.target.value))}
                  placeholder={"Uma por linha. Ex.:\nidade\nprincipal dificuldade\nnome do responsável"}
                />
              </Field>

              <Field label="Horários permitidos para atendimento/agendamento">
                <Textarea
                  rows={5}
                  value={virtualAgent.attendanceMap.business_hours}
                  onChange={(event) => updateAttendanceMapField("business_hours", event.target.value)}
                  placeholder="Ex.: Segunda a sexta, 8h às 18h. Sábado, 8h às 12h. Não atender madrugada."
                />
              </Field>

              <Field label="Quando enviar link">
                <Textarea
                  rows={4}
                  value={virtualAgent.attendanceMap.when_to_send_link}
                  onChange={(event) => updateAttendanceMapField("when_to_send_link", event.target.value)}
                  placeholder="Ex.: enviar o link quando o cliente pedir cadastro, quiser começar ou aceitar seguir após entender o caso."
                />
              </Field>

              <Field label="Quando agendar">
                <Textarea
                  rows={4}
                  value={virtualAgent.attendanceMap.when_to_schedule}
                  onChange={(event) => updateAttendanceMapField("when_to_schedule", event.target.value)}
                  placeholder="Ex.: agendar depois que o cadastro estiver concluído ou quando a empresa permitir agendamento direto."
                />
              </Field>

              <Field label="Quando encaminhar para humano" className="md:col-span-2">
                <Textarea
                  rows={4}
                  value={virtualAgent.attendanceMap.when_to_handoff}
                  onChange={(event) => updateAttendanceMapField("when_to_handoff", event.target.value)}
                  placeholder="Ex.: dúvidas sensíveis, reclamações, urgência, exceção de preço, indisponibilidade ou pedido explícito por humano."
                />
              </Field>

              <Field label="O que a IA nunca deve fazer">
                <Textarea
                  rows={5}
                  value={listToText(virtualAgent.attendanceMap.never_do)}
                  onChange={(event) => updateAttendanceMapField("never_do", textToList(event.target.value))}
                  placeholder={"Uma por linha. Ex.:\nnão enviar link logo após saudação\nnão aceitar horário fora do funcionamento\nnão pedir dados repetidos\nnão diagnosticar"}
                />
              </Field>

              <Field label="Exemplos de condução correta">
                <Textarea
                  rows={5}
                  value={listToText(virtualAgent.attendanceMap.correct_guidance_examples)}
                  onChange={(event) => updateAttendanceMapField("correct_guidance_examples", textToList(event.target.value))}
                  placeholder={"Uma por linha. Ex.:\nSe perguntar preço, responda primeiro e depois conduza.\nSe disser cadastrei, avance para agenda.\nSe pedir cadastro, envie o link e peça confirmação."}
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
              <Field label="Perguntas frequentes" className="md:col-span-2" help={FIELD_HELP.faq}>
                <Textarea
                  rows={7}
                  value={virtualAgent.faq}
                  onChange={(event) => updateField("faq", event.target.value)}
                  placeholder="Quais perguntas aparecem sempre e o que o Agent precisa saber para responder bem."
                />
              </Field>
              <Field label="Preço, planos e políticas" help={FIELD_HELP.pricingPolicy}>
                <Textarea
                  rows={5}
                  value={virtualAgent.pricingPolicy}
                  onChange={(event) => updateField("pricingPolicy", event.target.value)}
                  placeholder="O que pode falar sobre preço, quando pode falar, se existe orçamento, pacote, mensalidade etc."
                />
              </Field>
              <Field label="Horário e disponibilidade" help={FIELD_HELP.operatingHours}>
                <Textarea
                  rows={5}
                  value={virtualAgent.operatingHours}
                  onChange={(event) => updateField("operatingHours", event.target.value)}
                  placeholder="Dias, horários, exceções e como agir fora do horário."
                />
              </Field>
              <Field label="Links e recursos liberados" className="md:col-span-2" help={FIELD_HELP.linksAndResources}>
                <Textarea
                  rows={5}
                  value={virtualAgent.linksAndResources}
                  onChange={(event) => updateField("linksAndResources", event.target.value)}
                  placeholder="Links oficiais, páginas, formulários, catálogos, PDFs, materiais e orientações que o Agent pode compartilhar."
                />
              </Field>
              <Field label="Quando chamar humano" help={FIELD_HELP.handoffRules}>
                <Textarea
                  rows={4}
                  value={virtualAgent.handoffRules}
                  onChange={(event) => updateField("handoffRules", event.target.value)}
                  placeholder="Quais casos exigem atendimento humano ou especialista."
                />
              </Field>
              <Field label="Limites e proibições" help={FIELD_HELP.boundaries}>
                <Textarea
                  rows={4}
                  value={virtualAgent.boundaries}
                  onChange={(event) => updateField("boundaries", event.target.value)}
                  placeholder="O que a IA não pode prometer, afirmar, decidir ou inventar."
                />
              </Field>
              <Field label="Conhecimento extra" className="md:col-span-2" help={FIELD_HELP.extraKnowledge}>
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
      </section>

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

function PanelAreaCard({
  icon: Icon,
  targetId,
  title,
  description,
  status,
}: {
  icon: LucideIcon;
  targetId: string;
  title: string;
  description: string;
  status?: string;
}) {
  const handleClick = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group rounded-[1.35rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
        {status ? (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            {status}
          </Badge>
        ) : null}
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{description}</p>
    </button>
  );
}

function AdjustmentGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.slice(0, 8).map((item) => (
          <Badge key={item} variant="secondary" className="bg-white text-slate-700">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
  help,
}: {
  label: string;
  className?: string;
  children: ReactNode;
  help?: FieldHelp;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {help ? (
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              aria-label={`Ver exemplo para ${label}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
            <DialogContent className="max-w-lg rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl">
              <div className="overflow-hidden rounded-3xl">
                <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_36%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_65%,_#ecfdf5_100%)] px-6 py-5">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-slate-950">{help.title}</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-slate-600">
                      {help.intro}
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Modelo de preenchimento
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-900">
                      {help.example}
                    </p>
                  </div>
                  {help.tip ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-950">
                      <strong>Dica:</strong> {help.tip}
                    </div>
                  ) : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
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

function SimulatorMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5 text-cyan-600" />
        {label}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold capitalize text-slate-950">{value}</p>
    </div>
  );
}

function QualityIndicatorCard({ indicator }: { indicator: AiAgentQualityIndicator }) {
  return (
    <div className={`rounded-2xl border px-3 py-3 ${qualityStatusClass(indicator.status)}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide">{indicator.label}</p>
        <Badge variant="outline" className="shrink-0 border-current/25 bg-white/50 text-[10px]">
          {qualityStatusLabel(indicator.status)}
        </Badge>
      </div>
      <p className="mt-2 text-2xl font-semibold">
        {indicator.score === null ? "N/A" : indicator.score.toFixed(0)}
      </p>
      {indicator.evidence ? (
        <p className="mt-1 line-clamp-2 text-xs leading-5 opacity-80">{indicator.evidence}</p>
      ) : null}
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
