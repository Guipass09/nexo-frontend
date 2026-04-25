import {
  MessageSquare, Users, Send, Mic, Workflow, CheckCircle2, UserCog, TrendingUp,
} from "lucide-react";
import type {
  AudioSequence,
  Contact,
  Conversation,
  ConversationMessage,
  DashboardKpi,
  Flow,
  FlowBlock,
  FunnelStage,
  JourneyEvent,
  MessagesChartPoint,
  ReportsOverview,
  Sequence,
  SequenceMessage,
  Template,
} from "@/types/domain";

export const dashboardKpis: DashboardKpi[] = [
  { label: "Conversas ativas", value: 184, delta: "+12%", icon: MessageSquare, tone: "primary" },
  { label: "Clientes atendidos", value: 1247, delta: "+8%", icon: Users, tone: "accent" },
  { label: "Mensagens hoje", value: 5832, delta: "+24%", icon: Send, tone: "info" },
  { label: "Áudios enviados hoje", value: 412, delta: "+6%", icon: Mic, tone: "warning" },
  { label: "Fluxos ativos", value: 14, delta: "+2", icon: Workflow, tone: "primary" },
  { label: "Atendimentos finalizados", value: 938, delta: "+18%", icon: CheckCircle2, tone: "success" },
  { label: "Aguardando humano", value: 27, delta: "-3", icon: UserCog, tone: "warning" },
  { label: "Taxa de resposta", value: "94%", delta: "+1.2%", icon: TrendingUp, tone: "accent" },
];

export const messagesChart: MessagesChartPoint[] = [
  { day: "Seg", mensagens: 4200, audios: 320 },
  { day: "Ter", mensagens: 5100, audios: 410 },
  { day: "Qua", mensagens: 4800, audios: 380 },
  { day: "Qui", mensagens: 6200, audios: 510 },
  { day: "Sex", mensagens: 7100, audios: 590 },
  { day: "Sáb", mensagens: 3900, audios: 280 },
  { day: "Dom", mensagens: 2800, audios: 190 },
];

export const funnelData: FunnelStage[] = [
  { stage: "Contato inicial", value: 1240 },
  { stage: "Qualificação", value: 890 },
  { stage: "Proposta enviada", value: 540 },
  { stage: "Negociação", value: 280 },
  { stage: "Fechamento", value: 142 },
];

export const conversations: Conversation[] = [
  { id: "1", name: "Mariana Costa", phone: "+55 11 98823-4521", lastMessage: "Pode me enviar o áudio com os valores?", time: "14:32", unread: 3, status: "ativo", tag: "Lead", flow: "Captação Premium", avatar: "MC" },
  { id: "2", name: "Rafael Mendes", phone: "+55 21 99812-3344", lastMessage: "Obrigado pelo atendimento!", time: "14:18", unread: 0, status: "finalizado", tag: "Cliente", flow: "Pós-venda", avatar: "RM" },
  { id: "3", name: "Juliana Pereira", phone: "+55 31 98765-1122", lastMessage: "Quero falar com um humano por favor", time: "13:55", unread: 1, status: "humano", tag: "Suporte", flow: "Triagem", avatar: "JP" },
  { id: "4", name: "Carlos Almeida", phone: "+55 47 99988-7766", lastMessage: "Áudio recebido (00:42)", time: "13:40", unread: 0, status: "aguardando", tag: "Demonstração", flow: "Demo Produto", avatar: "CA" },
  { id: "5", name: "Beatriz Lima", phone: "+55 11 97654-3210", lastMessage: "Ótimo, vou aguardar a confirmação.", time: "13:12", unread: 0, status: "ativo", tag: "Prioridade alta", flow: "Captação Premium", avatar: "BL" },
  { id: "6", name: "Eduardo Santos", phone: "+55 85 98123-4567", lastMessage: "Não consegui entender a mensagem.", time: "12:48", unread: 2, status: "erro", tag: "Suporte", flow: "Triagem", avatar: "ES" },
  { id: "7", name: "Patrícia Rocha", phone: "+55 41 99654-3322", lastMessage: "Perfeito, pode prosseguir!", time: "12:05", unread: 0, status: "ativo", tag: "Cliente", flow: "Onboarding", avatar: "PR" },
  { id: "8", name: "Felipe Andrade", phone: "+55 51 98432-1190", lastMessage: "Aguardo seu retorno.", time: "11:22", unread: 0, status: "aguardando", tag: "Follow-up", flow: "Reativação", avatar: "FA" },
];

export const conversationMessages: ConversationMessage[] = [
  { id: "m1", from: "bot", type: "text", text: "Olá Mariana! 👋 Sou o assistente da Nexo. Como posso ajudar hoje?", time: "14:10" },
  { id: "m2", from: "client", type: "text", text: "Oi! Quero saber sobre o plano premium.", time: "14:11" },
  { id: "e1", from: "system", type: "event", text: "Fluxo iniciado: Captação Premium", time: "14:11" },
  { id: "m3", from: "bot", type: "text", text: "Perfeito! O plano Premium inclui atendimento prioritário, áudios personalizados e relatórios avançados.", time: "14:12" },
  { id: "m4", from: "bot", type: "audio", text: "Áudio explicativo", duration: "00:48", time: "14:12" },
  { id: "m5", from: "client", type: "text", text: "Interessante! Qual o valor?", time: "14:25" },
  { id: "e2", from: "system", type: "event", text: "Etapa avançada: Apresentação de valores", time: "14:25" },
  { id: "m6", from: "bot", type: "text", text: "Temos 3 opções: Starter R$ 197, Pro R$ 397 e Premium R$ 697 por mês.", time: "14:26" },
  { id: "m7", from: "client", type: "text", text: "Pode me enviar o áudio com os valores?", time: "14:32" },
];

export const journeyEvents: JourneyEvent[] = [
  { id: "j1", time: "14:10", type: "message", title: "Cliente iniciou conversa", description: "Mensagem recebida pelo número principal", status: "ok" },
  { id: "j2", time: "14:10", type: "ai", title: "Intenção identificada", description: "Interesse em produto detectado com 92% de confiança", status: "ok" },
  { id: "j3", time: "14:11", type: "flow", title: "Fluxo acionado", description: "Captação Premium → Etapa 1 de 5", status: "ok" },
  { id: "j4", time: "14:12", type: "send", title: "Mensagem enviada pelo robô", description: "Apresentação inicial + áudio explicativo (00:48)", status: "ok" },
  { id: "j5", time: "14:12", type: "wait", title: "Aguardando resposta", description: "Timeout configurado: 30 min", status: "wait" },
  { id: "j6", time: "14:25", type: "message", title: "Cliente respondeu", description: "Pergunta sobre valores detectada", status: "ok" },
  { id: "j7", time: "14:25", type: "flow", title: "Etapa avançada", description: "Captação Premium → Etapa 2 de 5: Valores", status: "ok" },
  { id: "j8", time: "14:26", type: "send", title: "Tabela de valores enviada", description: "Mensagem com 3 opções de plano", status: "ok" },
  { id: "j9", time: "14:32", type: "wait", title: "Solicitação de áudio", description: "Cliente pediu detalhamento em áudio", status: "warn" },
  { id: "j10", time: "14:33", type: "send", title: "Próxima ação prevista", description: "Enviar áudio sequência de valores", status: "pending" },
];

export const flows: Flow[] = [
  { id: "f1", name: "Captação Premium", status: "ativo", trigger: "Palavra-chave: premium", steps: 8, created: "12/03/2025" },
  { id: "f2", name: "Triagem inicial", status: "ativo", trigger: "Primeira mensagem", steps: 5, created: "02/02/2025" },
  { id: "f3", name: "Pós-venda", status: "ativo", trigger: "Compra confirmada", steps: 6, created: "18/01/2025" },
  { id: "f4", name: "Reativação 30 dias", status: "pausado", trigger: "Inatividade 30d", steps: 4, created: "05/12/2024" },
  { id: "f5", name: "Onboarding cliente", status: "ativo", trigger: "Tag: novo cliente", steps: 7, created: "22/11/2024" },
  { id: "f6", name: "Follow-up demonstração", status: "rascunho", trigger: "Após demo", steps: 3, created: "10/04/2025" },
];

export const flowBlocks: FlowBlock[] = [
  { id: "b1", type: "start", label: "Início", description: "Gatilho: palavra-chave 'premium'" },
  { id: "b2", type: "message", label: "Saudação", description: "Olá! 👋 Bem-vindo à Nexo Premium" },
  { id: "b3", type: "wait", label: "Aguardar resposta", description: "Timeout: 5 minutos" },
  { id: "b4", type: "condition", label: "Condição", description: "Cliente demonstrou interesse?" },
  { id: "b5", type: "audio", label: "Áudio explicativo", description: "audio_premium_v3.mp3 (00:48)" },
  { id: "b6", type: "message", label: "Tabela de valores", description: "3 planos com call-to-action" },
  { id: "b7", type: "human", label: "Transferir humano", description: "Equipe comercial" },
  { id: "b8", type: "end", label: "Finalizar", description: "Salvar tags + relatório" },
];

export const sequences: Sequence[] = [
  { id: "s1", name: "Boas-vindas Premium", messages: 5, delay: "30s", status: "ativo" },
  { id: "s2", name: "Recuperação de carrinho", messages: 4, delay: "1h", status: "ativo" },
  { id: "s3", name: "Nutrição de leads", messages: 7, delay: "1d", status: "pausado" },
  { id: "s4", name: "Pós-compra", messages: 3, delay: "12h", status: "ativo" },
];

export const sequenceMessages: SequenceMessage[] = [
  { order: 1, text: "Olá! Que bom ter você aqui na Nexo 👋", delay: "Imediato", note: "Saudação calorosa" },
  { order: 2, text: "Antes de começarmos, posso te fazer uma pergunta rápida?", delay: "30s", note: "Engajamento" },
  { order: 3, text: "Qual o principal desafio que você quer resolver?", delay: "45s", note: "Qualificação" },
  { order: 4, text: "Excelente! Tenho a solução perfeita para você 🚀", delay: "1min", note: "Validação" },
  { order: 5, text: "Vou te enviar um áudio com mais detalhes...", delay: "1min", note: "Transição para áudio" },
];

export const audioSequences: AudioSequence[] = [
  { id: "a1", name: "Apresentação institucional", duration: "01:24", category: "Apresentação", order: 1 },
  { id: "a2", name: "Explicação de valores", duration: "00:48", category: "Vendas", order: 2 },
  { id: "a3", name: "Cases de sucesso", duration: "02:10", category: "Social proof", order: 3 },
  { id: "a4", name: "Convite para demonstração", duration: "00:36", category: "Conversão", order: 4 },
  { id: "a5", name: "Follow-up amigável", duration: "00:52", category: "Relacionamento", order: 5 },
];

export const templates: Template[] = [
  { id: "t1", name: "Saudação padrão", type: "Texto", category: "Saudação", text: "Olá {{nome}}! Como posso ajudar?", status: "ativo" },
  { id: "t2", name: "Apresentação Nexo", type: "Texto", category: "Apresentação", text: "Somos a Nexo, especialistas em automação...", status: "ativo" },
  { id: "t3", name: "Tabela de valores", type: "Texto", category: "Valores", text: "Conheça nossos planos: Starter, Pro e Premium...", status: "ativo" },
  { id: "t4", name: "Áudio comercial v3", type: "Áudio", category: "Vendas", text: "Áudio com pitch comercial completo", status: "ativo" },
  { id: "t5", name: "Follow-up 24h", type: "Texto", category: "Follow-up", text: "Oi {{nome}}, tudo bem? Conseguiu ver minha mensagem?", status: "rascunho" },
  { id: "t6", name: "Encerramento positivo", type: "Texto", category: "Encerramento", text: "Foi um prazer conversar! Estou à disposição.", status: "ativo" },
  { id: "t7", name: "Suporte técnico", type: "Texto", category: "Suporte", text: "Recebi sua solicitação de suporte. Vou te ajudar!", status: "ativo" },
  { id: "t8", name: "Áudio boas-vindas", type: "Áudio", category: "Saudação", text: "Áudio personalizado de boas-vindas", status: "ativo" },
];

export const contacts: Contact[] = [
  { id: "c1", name: "Mariana Costa", phone: "+55 11 98823-4521", origin: "Instagram", status: "Ativo", tags: ["Lead", "Prioridade alta"], lastInteraction: "Há 2 min", flow: "Captação Premium", responsible: "Robô" },
  { id: "c2", name: "Rafael Mendes", phone: "+55 21 99812-3344", origin: "Site", status: "Cliente", tags: ["Cliente"], lastInteraction: "Há 14 min", flow: "Pós-venda", responsible: "Robô" },
  { id: "c3", name: "Juliana Pereira", phone: "+55 31 98765-1122", origin: "Indicação", status: "Atendimento", tags: ["Suporte"], lastInteraction: "Há 37 min", flow: "Triagem", responsible: "Ana (humano)" },
  { id: "c4", name: "Carlos Almeida", phone: "+55 47 99988-7766", origin: "Anúncio", status: "Lead", tags: ["Demonstração"], lastInteraction: "Há 52 min", flow: "Demo Produto", responsible: "Robô" },
  { id: "c5", name: "Beatriz Lima", phone: "+55 11 97654-3210", origin: "Site", status: "Ativo", tags: ["Lead", "Agendado"], lastInteraction: "Há 1h", flow: "Captação Premium", responsible: "Robô" },
  { id: "c6", name: "Eduardo Santos", phone: "+55 85 98123-4567", origin: "WhatsApp", status: "Pendente", tags: ["Suporte"], lastInteraction: "Há 1h", flow: "Triagem", responsible: "Robô" },
  { id: "c7", name: "Patrícia Rocha", phone: "+55 41 99654-3322", origin: "Site", status: "Cliente", tags: ["Cliente", "Follow-up"], lastInteraction: "Há 2h", flow: "Onboarding", responsible: "Robô" },
  { id: "c8", name: "Felipe Andrade", phone: "+55 51 98432-1190", origin: "Indicação", status: "Lead", tags: ["Follow-up"], lastInteraction: "Há 3h", flow: "Reativação", responsible: "Robô" },
];

export const reportData: Pick<ReportsOverview, "hourly" | "topFlows"> = {
  hourly: [
    { hour: "08h", atendimentos: 24 },
    { hour: "10h", atendimentos: 58 },
    { hour: "12h", atendimentos: 72 },
    { hour: "14h", atendimentos: 94 },
    { hour: "16h", atendimentos: 88 },
    { hour: "18h", atendimentos: 65 },
    { hour: "20h", atendimentos: 42 },
  ],
  topFlows: [
    { name: "Captação Premium", uses: 1240 },
    { name: "Triagem inicial", uses: 980 },
    { name: "Pós-venda", uses: 620 },
    { name: "Onboarding", uses: 410 },
    { name: "Reativação", uses: 280 },
  ],
};

export const reportKpis: DashboardKpi[] = [
  { label: "Mensagens enviadas", value: "34.5k", delta: "+18%", icon: Send, tone: "primary" },
  { label: "Áudios enviados", value: "2.847", delta: "+12%", icon: Mic, tone: "warning" },
  { label: "Conversas abertas", value: "1.284", delta: "+9%", icon: MessageSquare, tone: "info" },
  { label: "Taxa de conclusão", value: "78%", delta: "+3.2%", icon: CheckCircle2, tone: "success" },
  { label: "Transf. humano", value: "14%", delta: "-2.1%", icon: UserCog, tone: "accent" },
];
