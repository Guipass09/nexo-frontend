import type { LucideIcon } from "lucide-react";

export type KpiTone = "primary" | "accent" | "info" | "warning" | "success";
export type ConversationStatus = "ativo" | "aguardando" | "humano" | "finalizado" | "erro";
export type FlowStatus = "ativo" | "pausado" | "rascunho";
export type SequenceStatus = "ativo" | "pausado";
export type JourneyStatus = "ok" | "warn" | "pending" | "error" | "wait";
export type JourneyEventType = "message" | "ai" | "flow" | "send" | "wait";
export type ConversationMessageType = "text" | "audio" | "event" | "template" | "image" | "video" | "document";
export type ConversationMessageSender = "bot" | "client" | "system" | "agent";
export type MediaAssetType = "image" | "video" | "audio" | "document";

export interface DashboardKpi {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone: KpiTone;
}

export interface MessagesChartPoint {
  day: string;
  mensagens: number;
  audios: number;
}

export interface FunnelStage {
  stage: string;
  value: number;
}

export interface Conversation {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: ConversationStatus;
  tag: string;
  flow: string;
  avatar: string;
  avatarUrl?: string | null;
  deliveryStatus?: "sent" | "delivered" | "read" | "failed" | "skipped" | "pending" | null;
  serviceWindow?: {
    isOpen: boolean;
    requiresTemplate: boolean;
    lastCustomerMessageAt: string | null;
    closesAt: string | null;
    hoursRemaining: number | null;
    source?: string;
    reason: string;
  };
}

export interface ConversationMessage {
  id: string;
  from: ConversationMessageSender;
  type: ConversationMessageType;
  text: string;
  rawText?: string;
  isOptimistic?: boolean;
  canRetry?: boolean;
  time: string;
  sentAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  duration?: string;
  deliveryStatus?: "sent" | "delivered" | "read" | "failed" | "skipped" | "pending" | null;
  deliveryError?: string | null;
  externalId?: string | null;
  templateId?: string | null;
  templateName?: string | null;
  mediaAsset?: MediaAsset | null;
}

export interface MediaAsset {
  id: string;
  type: MediaAssetType;
  sourceType: "upload" | "url" | "meta_id";
  status?: "active" | "archived" | "pending";
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  sizeLabel?: string | null;
  publicUrl?: string | null;
  downloadUrl?: string | null;
  storageDisk?: string | null;
  storagePath?: string | null;
  storageVisibility?: string | null;
  checksum?: string | null;
  metaMediaId?: string | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archivedByName?: string | null;
  usageCount?: number;
  isUsed?: boolean;
  createdAt?: string | null;
  metadata?: Record<string, unknown>;
  relatedMessages?: MediaAssetRelatedMessage[];
  auditEvents?: MediaAssetAuditEvent[];
}

export interface MediaAssetAuditEvent {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  status: JourneyStatus;
  operatorName?: string | null;
  operatorEmail?: string | null;
  createdAt?: string | null;
  meta?: Record<string, unknown>;
}

export interface MediaAssetRelatedMessage {
  id: string;
  conversationId?: string | null;
  contactName?: string | null;
  operatorName?: string | null;
  templateName?: string | null;
  from: ConversationMessageSender;
  type: ConversationMessageType;
  text?: string | null;
  deliveryStatus?: "sent" | "delivered" | "read" | "failed" | "skipped" | "pending" | null;
  externalId?: string | null;
  sentAt?: string | null;
}

export interface JourneyEvent {
  id: string;
  time: string;
  type: JourneyEventType;
  title: string;
  description: string;
  status: JourneyStatus;
}

export interface Flow {
  id: string;
  name: string;
  status: FlowStatus;
  trigger: string;
  aiCompanyPrompt?: string;
  steps: number;
  created: string;
}

export interface FlowBlock {
  id: string;
  type:
    | "start"
    | "message"
    | "audio"
    | "wait"
    | "condition"
    | "human"
    | "end"
    | "send_message"
    | "send_template"
    | "send_media"
    | "wait_for_reply"
    | "condition_keyword"
    | "ai_decision"
    | "handoff_human";
  label: string;
  description: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface Sequence {
  id: string;
  name: string;
  messages: number;
  delay: string;
  status: SequenceStatus;
}

export interface SequenceMessage {
  id?: string;
  order: number;
  text: string;
  delay: string;
  note: string;
  type?: "text" | "audio" | "template";
}

export interface AudioSequence {
  id: string;
  name: string;
  duration: string;
  category: string;
  order: number;
}

export interface AiAgentPrompt {
  id: string;
  title?: string | null;
  content: string;
  sortOrder: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AiAgentVirtualAgent {
  agentName: string;
  roleTitle: string;
  businessName: string;
  segment: string;
  businessModel: string;
  primaryGoal: string;
  desiredOutcome: string;
  tone: string;
  conversationApproach: string;
  responseLength: string;
  businessDescription: string;
  audienceDescription: string;
  services: string;
  faq: string;
  progressionRules: string;
  successSignals: string;
  operatingHours: string;
  pricingPolicy: string;
  schedulingInstructions: string;
  linksAndResources: string;
  handoffRules: string;
  boundaries: string;
  extraKnowledge: string;
  requiredSteps: string[];
  allowedActions: string[];
}

export interface AiAgentTrainingScenario {
  key: string;
  title: string;
  score: number;
  passed: boolean;
  issues: string[];
  turnCount: number;
  lastReply?: string | null;
  qualityMetrics?: AiAgentQualityMetrics | null;
}

export interface AiAgentTrainingProgression {
  runCount: number;
  level: number;
  levelLabel: string;
  previousAverageScore: number;
  bestAverageScore: number;
  firstAverageScore: number;
  improvementFromLastRun: number;
  improvementFromFirstRun: number;
  streakAbove95: number;
  nextFocus: string[];
  adaptiveScenarioCount: number;
  lastRoundAverageScore?: number;
}

export interface AiAgentTrainingHistoryEntry {
  runNumber: number;
  level: number;
  levelLabel: string;
  averageScore: number;
  passedScenarios: number;
  scenarioCount: number;
  issues: string[];
  lastRunAt: string;
}

export interface AiAgentTrainingCriticPriority {
  scenarioKey: string;
  scenarioTitle: string;
  severity: "high" | "medium" | "low";
  issues: string[];
  reason: string;
  positiveAction: string;
}

export interface AiAgentTrainingCritic {
  summary: string;
  strengths: string[];
  priorities: AiAgentTrainingCriticPriority[];
  safeActions: string[];
  recommendedRuleChanges?: Record<string, unknown>;
  issueCounts?: Record<string, number>;
}

export interface AiAgentTrainingReport {
  lastRunAt: string;
  averageScore: number;
  scenarioCount: number;
  passedScenarios: number;
  issues: string[];
  appliedAdjustments: string[];
  scenarios: AiAgentTrainingScenario[];
  critic?: AiAgentTrainingCritic | null;
  progression?: AiAgentTrainingProgression | null;
  history?: AiAgentTrainingHistoryEntry[];
  qualityMetrics?: AiAgentQualityMetrics | null;
}

export interface AiAgentSimulationSource {
  topic: string;
  sourceType: string;
  sourceLabel: string;
  content: string;
}

export interface AiAgentSimulationMediaSuggestion {
  source: string;
  topic: string;
  assetId?: number | string | null;
  assetName: string;
  mediaType: string;
  sendWhen: string;
  guidance: string;
  canSend: boolean;
}

export interface AiAgentSimulationCapturedMessage {
  type: "text" | "media";
  text: string;
  media?: {
    type: string;
    name: string;
    caption: string;
  } | null;
}

export interface AiAgentQualityIndicator {
  key: string;
  label: string;
  score: number | null;
  status: "excellent" | "good" | "attention" | "critical" | "not_applicable" | string;
  applicable?: boolean;
  evidence?: string;
  improvement?: string;
}

export interface AiAgentQualityMetrics {
  overallScore: number;
  status: "excellent" | "good" | "attention" | "critical" | string;
  indicators: AiAgentQualityIndicator[];
  pointsToImprove: string[];
}

export interface AiAgentSimulationTurn {
  incoming: string;
  responded: boolean;
  reply?: string | null;
  conversationStage: string;
  intent?: string | null;
  responseStrategy?: string | null;
  score: number;
  issues: string[];
  sourcesUsed: AiAgentSimulationSource[];
  mediaSuggestions: AiAgentSimulationMediaSuggestion[];
  capturedMessages: AiAgentSimulationCapturedMessage[];
  qualityMetrics?: AiAgentQualityMetrics | null;
}

export interface AiAgentSimulationResult {
  ok: boolean;
  error?: string;
  profile?: {
    profileId: string | number;
    name: string;
    enabled: boolean;
    triggerType?: string;
    promptCount?: number;
    simulatedCompanyName?: string;
  };
  turns: AiAgentSimulationTurn[];
  summary: {
    turnCount: number;
    respondedTurns: number;
    averageScore: number;
    issues: string[];
    qualityMetrics?: AiAgentQualityMetrics | null;
  };
}

export interface AiAgentAssistantMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt: string;
}

export interface AiAgentAssistantTopicGuidance {
  topic: string;
  customerSignal: string;
  guidance: string;
}

export interface AiAgentAssistantResourceRule {
  resource: string;
  confirmations: string[];
  nextAction: string;
}

export interface AiAgentAssistantRules {
  affirmationAliases: string[];
  negationAliases: string[];
  completionAliases: string[];
  forbiddenReplyFragments: string[];
  globalNotes: string[];
  topicGuidance: AiAgentAssistantTopicGuidance[];
  resourceConfirmationRules: AiAgentAssistantResourceRule[];
}

export interface AiAgentAssistantConversationInsight {
  conversationId: string;
  contactName: string;
  phone?: string | null;
  status: string;
  lastMessageAt?: string | null;
  lastCustomerMessage?: string | null;
  lastAgentReply?: string | null;
  issueHint?: string | null;
  recentMessages: Array<{
    id: string;
    from: string;
    text: string;
    sentAt?: string | null;
  }>;
}

export interface AiAgentAssistantFlowBlockInsight {
  id: string;
  type: string;
  label: string;
  description: string;
  position: number;
}

export interface AiAgentAssistantFlowInsight {
  flowId: string;
  name: string;
  status: string;
  trigger: string;
  stepsCount: number;
  aiCompanyPrompt?: string | null;
  summary?: string | null;
  blocks: AiAgentAssistantFlowBlockInsight[];
}

export interface AiAgentAssistantMediaAssetInsight {
  assetId: string;
  name: string;
  type: string;
  mimeType?: string | null;
  status?: string | null;
}

export interface AiAgentAssistantWorkspace {
  profileId: string;
  assistantName: string;
  introMessage: string;
  messages: AiAgentAssistantMessage[];
  rules: AiAgentAssistantRules;
  profileSummary: {
    agentName: string;
    businessName: string;
    segment: string;
    primaryGoal: string;
    desiredOutcome: string;
    conversationApproach: string;
    responseLength: string;
  };
  trainingSnapshot: {
    averageScore: number | null;
    passedScenarios: number | null;
    scenarioCount: number | null;
    issues: string[];
    nextFocus: string[];
    criticSummary?: string | null;
  };
  recentConversations: AiAgentAssistantConversationInsight[];
  selectedConversation?: AiAgentAssistantConversationInsight | null;
  flows?: AiAgentAssistantFlowInsight[];
  mediaAssets?: AiAgentAssistantMediaAssetInsight[];
  suggestions: string[];
}

export interface AiAgentAssistantChatResult {
  workspace: AiAgentAssistantWorkspace;
  appliedChanges: string[];
  autoRuleChanges: Record<string, unknown>;
  diagnosis: string;
}

export type AiAgentTriggerType = "all_contacts" | "unsaved_contacts" | "saved_contacts" | "keyword";

export interface AiAgentKnowledgeItem {
  id: string;
  sourceType: string;
  sourceLabel: string;
  topic: string;
  content: string;
  priority: number;
  status: string;
  hasEmbedding: boolean;
  indexedAt?: string | null;
  updatedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AiAgentProfile {
  id?: string | number;
  name?: string;
  enabled: boolean;
  takesPriorityOverFlows: boolean;
  allowSavedContacts: boolean;
  triggerType?: AiAgentTriggerType;
  triggerKeywords?: string[];
  promptCount: number;
  combinedPromptPreview?: string;
  prompts: AiAgentPrompt[];
  virtualAgent?: AiAgentVirtualAgent;
  trainingReport?: AiAgentTrainingReport | null;
  knowledgeSummary?: {
    activeBlocks: number;
    embeddedBlocks: number;
    sourceTypes: string[];
    topics: string[];
  };
  knowledgeItems?: AiAgentKnowledgeItem[];
  profiles?: AiAgentProfile[];
}

export interface Template {
  id: string;
  name: string;
  type: "Texto" | "Áudio";
  category: string;
  text: string;
  content?: string;
  status: "ativo" | "rascunho";
  metaId?: string | null;
  metaName?: string | null;
  language?: string | null;
  metaStatus?: string | null;
  isOfficial?: boolean;
  components?: Array<Record<string, unknown>>;
  variableMapping?: Array<Record<string, unknown>>;
  bodyVariables?: Array<{
    key: string;
    label: string;
    source?: string | null;
    index: number;
    required: boolean;
  }>;
  mediaHeader?: {
    type: "image" | "video" | "document";
    required: boolean;
  } | null;
  metaSyncedAt?: string | null;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  origin: string;
  status: string;
  tags: string[];
  lastInteraction: string;
  flow: string;
  responsible: string;
  avatarUrl?: string | null;
}

export interface AiVocabularyMapping {
  id: string;
  sourceTerm: string;
  canonicalValue: string;
  normalizedSourceTerm?: string;
  normalizedCanonicalValue?: string;
  createdAt?: string | null;
  createdBy?: string | null;
}

export interface AiVocabularyChatResult {
  reply: string;
  action: "learned" | "list" | "help";
  mapping?: AiVocabularyMapping | null;
  recentMappings: AiVocabularyMapping[];
}

export interface HourlyReportPoint {
  hour: string;
  atendimentos: number;
}

export interface TopFlowReport {
  name: string;
  uses: number;
}

export interface ReportsOverview {
  hourly: HourlyReportPoint[];
  topFlows: TopFlowReport[];
  messagesChart: MessagesChartPoint[];
  kpis: DashboardKpi[];
}

export interface DashboardOverview {
  kpis: DashboardKpi[];
  messagesChart: MessagesChartPoint[];
  funnelData: FunnelStage[];
  recentConversations: Conversation[];
  auditSummary?: {
    errorEvents: number;
    failedMessages: number;
    manualMessagesToday: number;
    actionsByOperator: Array<{
      operatorName: string;
      count: number;
    }>;
    messagesByDay: Array<{
      day: string;
      sent: number;
    }>;
    recentEvents: Array<{
      id: string;
      time: string;
      createdAt: string;
      type: string;
      title: string;
      status: JourneyStatus;
      operatorName: string;
      contactName: string;
    }>;
  } | null;
}

export interface OperatorOption {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
  status: "active" | "blocked";
  permissions: Record<string, boolean>;
  tokenExpiresAt: string | null;
  lastActiveAt: string | null;
  createdAt: string | null;
  whatsAppConnected?: boolean | null;
  whatsAppPhone?: string | null;
  whatsAppConnectedAt?: string | null;
  lastWhatsAppMessageAt?: string | null;
}

export interface WhatsAppSettings {
  phoneNumberId: string | null;
  businessAccountId: string | null;
  businessNumber: string | null;
  apiVersion: string;
  hasAccessToken: boolean;
  accessTokenMasked: string | null;
  hasWebhookVerifyToken: boolean;
  webhookVerifyTokenMasked: string | null;
  canManageCredentials?: boolean;
  ready: boolean;
}

export type WhatsAppConnectionProvider = "cloud_api" | "whatsapp_web";
export type WhatsAppConnectionStatus = "pending" | "connected" | "error" | "failed" | "disconnected" | "qr_pending" | "reconnecting";
export type WhatsAppConnectionType = "cloud_api" | "coexistence" | "whatsapp_web" | "unknown";
export type WhatsAppConnectionHealth = "active" | "error" | "token_expired" | "webhook_pending" | "pending" | "disconnected";

export interface WhatsAppCoexistenceEligibility {
  eligible: boolean | null;
  code?: string | null;
  reason?: string | null;
  details?: Record<string, unknown> | null;
}

export interface ProfileWhatsAppConnection {
  id: string;
  userId?: string | null;
  provider?: WhatsAppConnectionProvider | null;
  businessAccountId: string | null;
  wabaId?: string | null;
  businessId?: string | null;
  phoneNumberId: string | null;
  phoneNumber: string | null;
  webSessionId?: string | null;
  displayName?: string | null;
  status: WhatsAppConnectionStatus;
  connectionType: WhatsAppConnectionType | null;
  webhookStatus?: string | null;
  health: WhatsAppConnectionHealth;
  lastError?: string | null;
  lastErrorCode?: string | null;
  metadata?: Record<string, unknown> | null;
  coexistenceEligibility?: WhatsAppCoexistenceEligibility | null;
  connectedAt: string | null;
  disconnectedAt?: string | null;
  tokenExpiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WhatsAppWebQrStatus {
  sessionId: string | null;
  status: WhatsAppConnectionStatus;
  qrCode: string | null;
  updatedAt?: string | null;
}

export interface WhatsAppEmbeddedSignupStartConfig {
  appId: string | null;
  configurationId: string | null;
  graphVersion?: string | null;
  redirectUri?: string | null;
  feature?: string | null;
  sessionInfoVersion?: number | null;
  state?: string | null;
  extras?: Record<string, unknown> | null;
}

export interface WhatsAppConnectionActionResult {
  status: "ok" | "error";
  message: string;
  checkedAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface WhatsAppExchangeTokenResult {
  connection: ProfileWhatsAppConnection | null;
  testMessage?: WhatsAppConnectionActionResult | null;
}

export interface AuditEventLinkedMessage {
  id: string;
  operatorId: string | null;
  from: ConversationMessageSender;
  text: string;
  deliveryStatus?: "sent" | "delivered" | "read" | "failed" | "skipped" | "pending" | null;
  externalId?: string | null;
  sentAt?: string | null;
}

export interface AuditEvent {
  id: string;
  conversationId: string;
  time: string;
  createdAt: string;
  type: string;
  title: string;
  description: string;
  status: JourneyStatus;
  operator: OperatorOption | null;
  conversation: {
    id: string;
    status: string;
    contact: {
      id: string;
      name: string;
      phone: string;
    } | null;
  } | null;
  meta: Record<string, unknown>;
  linkedMessage: AuditEventLinkedMessage | null;
}

export interface AuditEventTypeOption {
  value: string;
  label: string;
  count: number;
}
