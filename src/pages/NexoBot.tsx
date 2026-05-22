import { useEffect, useMemo, useState } from "react";
import { Bot, Eraser, Expand, Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useAiAgentAssistantChat,
  useAiAgentAssistantReset,
  useAiAgentAssistantWorkspace,
  useAiAgentProfile,
} from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";

type NormalizedAssistantMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type NormalizedRecentMessage = {
  id: string;
  from: string;
  text: string;
};

type NormalizedConversation = {
  conversationId: string;
  contactName: string;
  status: string;
  issueHint: string | null;
  recentMessages: NormalizedRecentMessage[];
};

type NormalizedWorkspace = {
  assistantName: string;
  introMessage: string;
  businessName: string;
  criticSummary: string | null;
  averageScore: number | null;
  passedScenarios: number | null;
  scenarioCount: number | null;
  suggestions: string[];
  messages: NormalizedAssistantMessage[];
  recentConversations: NormalizedConversation[];
};

const examplePhrases = [
  'Quando o cliente disser "fechou", isso significa sim.',
  'Nao repita a frase "me fala como prefere seguir agora".',
  "Quando enviar este link, espere confirmacao como pronto ou feito.",
  "Se perguntarem preco, responda primeiro a pergunta e so depois conduza o proximo passo.",
  "Quarta a noite significa disponibilidade valida para agenda.",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toText(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeProfiles(data: unknown) {
  if (isRecord(data) && Array.isArray(data.profiles)) {
    return data.profiles.filter(isRecord).map((profile) => ({
      id: profile.id ?? null,
      name: toText(profile.name, "Agent IA"),
    }));
  }

  if (isRecord(data)) {
    return [{
      id: data.id ?? null,
      name: toText(data.name, "Agent IA"),
    }];
  }

  return [] as Array<{ id: string | number | null; name: string }>;
}

function normalizeWorkspace(data: unknown): NormalizedWorkspace {
  const workspace = isRecord(data) ? data : {};
  const profileSummary = isRecord(workspace.profileSummary) ? workspace.profileSummary : {};
  const trainingSnapshot = isRecord(workspace.trainingSnapshot) ? workspace.trainingSnapshot : {};

  const messages = Array.isArray(workspace.messages)
    ? workspace.messages.filter(isRecord).map((message, index) => ({
      id: toText(message.id, `message-${index}`),
      role: message.role === "user" ? "user" : "assistant",
      text: toText(message.text, ""),
    }))
    : [];

  const suggestions = Array.isArray(workspace.suggestions)
    ? workspace.suggestions.map((item) => toText(item, "")).filter(Boolean)
    : [];

  const recentConversations = Array.isArray(workspace.recentConversations)
    ? workspace.recentConversations.filter(isRecord).map((conversation, conversationIndex) => ({
      conversationId: toText(conversation.conversationId, `conversation-${conversationIndex}`),
      contactName: toText(conversation.contactName, "Contato"),
      status: toText(conversation.status, "ativo"),
      issueHint: toText(conversation.issueHint, "") || null,
      recentMessages: Array.isArray(conversation.recentMessages)
        ? conversation.recentMessages.filter(isRecord).map((message, messageIndex) => ({
          id: toText(message.id, `recent-${conversationIndex}-${messageIndex}`),
          from: toText(message.from, "client"),
          text: toText(message.text, ""),
        }))
        : [],
    }))
    : [];

  return {
    assistantName: toText(workspace.assistantName, "Nexo bot"),
    introMessage: toText(
      workspace.introMessage,
      "Ola, tudo bem? Sou a Nexo bot. Me conte o erro que voce identificou no Agent IA.",
    ),
    businessName: toText(profileSummary.businessName, ""),
    criticSummary: toText(trainingSnapshot.criticSummary, "") || null,
    averageScore: toNumberOrNull(trainingSnapshot.averageScore),
    passedScenarios: toNumberOrNull(trainingSnapshot.passedScenarios),
    scenarioCount: toNumberOrNull(trainingSnapshot.scenarioCount),
    suggestions,
    messages,
    recentConversations,
  };
}

function scoreLabel(score: number | null) {
  if (score === null) {
    return "Sem treino";
  }

  return `${score.toFixed(1)} / 100`;
}

export default function NexoBot() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [wideMode, setWideMode] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState("");

  const profileQuery = useAiAgentProfile(true);
  const profiles = useMemo(() => normalizeProfiles(profileQuery.data), [profileQuery.data]);

  useEffect(() => {
    if (selectedProfileId !== null) {
      return;
    }

    const firstProfileId = profiles[0]?.id ?? null;
    if (firstProfileId !== null) {
      setSelectedProfileId(firstProfileId);
    }
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    setSelectedConversationId("");
    setSelectedMessageId("");
  }, [selectedProfileId]);

  const workspaceQuery = useAiAgentAssistantWorkspace(
    {
      profileId: selectedProfileId,
      conversationId: selectedConversationId || null,
    },
    Boolean(selectedProfileId),
  );
  const workspace = useMemo(() => normalizeWorkspace(workspaceQuery.data), [workspaceQuery.data]);
  const chatMutation = useAiAgentAssistantChat();
  const resetMutation = useAiAgentAssistantReset();

  const selectedConversation = useMemo(
    () => workspace.recentConversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null,
    [workspace.recentConversations, selectedConversationId],
  );

  useEffect(() => {
    if (!selectedConversation) {
      if (selectedMessageId !== "") {
        setSelectedMessageId("");
      }
      return;
    }

    const exists = selectedConversation.recentMessages.some((message) => message.id === selectedMessageId);
    if (!exists && selectedMessageId !== "") {
      setSelectedMessageId("");
    }
  }, [selectedConversation, selectedMessageId]);

  const pageTitle = workspace.businessName ? `Nexo bot • ${workspace.businessName}` : workspace.assistantName;

  const submit = () => {
    const message = input.trim();

    if (!message || !selectedProfileId) {
      return;
    }

    chatMutation.mutate(
      {
        profileId: selectedProfileId,
        conversationId: selectedConversationId || null,
        messageId: selectedMessageId || null,
        message,
      },
      {
        onSuccess: () => setInput(""),
        onError: (error) => {
          toast({
            title: "Falha no Nexo bot",
            description: getApiErrorMessage(error, "Nao foi possivel processar o ajuste do Agent IA."),
            variant: "destructive",
          });
        },
      },
    );
  };

  const clearConversation = () => {
    if (!selectedProfileId) {
      return;
    }

    resetMutation.mutate(
      { profileId: selectedProfileId },
      {
        onSuccess: () => {
          toast({
            title: "Nexo bot limpo",
            description: "O historico do chat foi limpo. As regras aprendidas continuam salvas.",
          });
        },
        onError: (error) => {
          toast({
            title: "Falha ao limpar o Nexo bot",
            description: getApiErrorMessage(error, "Nao foi possivel limpar o historico agora."),
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className={`mx-auto flex w-full flex-col gap-6 ${wideMode ? "max-w-[1600px]" : "max-w-7xl"}`}>
      <Card className="border-border/60 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 text-white">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{pageTitle}</h2>
              <p className="text-sm text-muted-foreground">
                Ajustes finos, leitura de erros reais e aprendizado operacional do seu Agent IA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearConversation} disabled={resetMutation.isPending || !selectedProfileId}>
              {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
              Limpar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setWideMode((current) => !current)}>
              <Expand className="h-4 w-4" />
              {wideMode ? "Largura normal" : "Expandir area"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card className="border-border/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Treino atual</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{scoreLabel(workspace.averageScore)}</Badge>
              {workspace.passedScenarios !== null && workspace.scenarioCount !== null ? (
                <Badge variant="outline">
                  {workspace.passedScenarios}/{workspace.scenarioCount} cenarios
                </Badge>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {workspace.criticSummary ?? "Use este chat para ensinar o Agent sem mexer em prompt manual."}
            </p>
          </Card>

          <Card className="border-border/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sugestoes</p>
            <div className="mt-3 space-y-2">
              {(workspace.suggestions.length ? workspace.suggestions : examplePhrases).slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="block w-full rounded-2xl border border-border/60 px-3 py-2 text-left text-sm leading-6 text-foreground transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-border/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Exemplo real opcional</p>
            <select
              value={selectedConversationId}
              onChange={(event) => {
                setSelectedConversationId(event.target.value);
                setSelectedMessageId("");
              }}
              className="mt-3 h-11 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm text-foreground"
            >
              <option value="">Sem conversa anexada</option>
              {workspace.recentConversations.map((conversation) => (
                <option key={conversation.conversationId} value={conversation.conversationId}>
                  {conversation.contactName}
                </option>
              ))}
            </select>

            <select
              value={selectedMessageId}
              onChange={(event) => setSelectedMessageId(event.target.value)}
              disabled={!selectedConversation}
              className="mt-3 h-11 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:bg-muted"
            >
              <option value="">Usar a conversa inteira</option>
              {(selectedConversation?.recentMessages ?? [])
                .filter((message) => message.from === "bot" || message.from === "agent")
                .map((message) => (
                  <option key={message.id} value={message.id}>
                    {message.text.slice(0, 80)}
                  </option>
                ))}
            </select>

            {selectedConversation ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Vou usar essa conversa como exemplo, mas o ajuste sera geral para o Agent inteiro.
              </p>
            ) : null}
          </Card>
        </div>

        <Card className="flex min-h-[70vh] flex-col border-border/60 p-0">
          <div className="border-b border-border/60 px-5 py-4">
            <p className="text-sm font-medium text-foreground">{workspace.introMessage}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Exemplos: &quot;isso significa sim&quot;, &quot;nao repita essa frase&quot;, &quot;quando enviar o link espere confirmacao&quot;.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {profileQuery.isLoading || workspaceQuery.isLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted px-4 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando o contexto do Agent IA...
              </div>
            ) : null}

            {profileQuery.isError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                {getApiErrorMessage(profileQuery.error, "Nao foi possivel carregar os perfis do Agent IA.")}
              </div>
            ) : null}

            {workspaceQuery.isError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                {getApiErrorMessage(workspaceQuery.error, "Nao foi possivel carregar o chat de ajuste agora.")}
              </div>
            ) : null}

            {!profileQuery.isLoading && profiles.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                Nenhum Agent IA foi encontrado ainda. Crie ou salve um perfil na aba Agent IA para começar os ajustes finos.
              </div>
            ) : null}

            <div className="space-y-4">
              {workspace.messages.map((message) => (
                <div key={message.id} className={message.role === "assistant" ? "mr-10" : "ml-10"}>
                  <div
                    className={
                      message.role === "assistant"
                        ? "rounded-[24px] rounded-tl-md border border-border/60 bg-muted px-4 py-3 text-sm leading-7 text-foreground"
                        : "rounded-[24px] rounded-br-md bg-gradient-to-br from-blue-600 to-cyan-500 px-4 py-3 text-sm leading-7 text-white"
                    }
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {selectedConversation ? (
                <div className="rounded-3xl border border-border/60 bg-muted px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Trecho anexado para diagnostico</p>
                  <div className="mt-3 space-y-3">
                    {selectedConversation.recentMessages.map((message) => {
                      const selected = selectedMessageId === message.id;

                      return (
                        <button
                          key={message.id}
                          type="button"
                          onClick={() => setSelectedMessageId(selected ? "" : message.id)}
                          className={`block w-full rounded-2xl border px-3 py-3 text-left text-sm leading-6 transition ${
                            selected ? "border-cyan-300 bg-cyan-50" : "border-border/60 bg-background hover:border-cyan-200"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-foreground">
                              {message.from === "bot" || message.from === "agent" ? "Agent" : "Cliente"}
                            </span>
                            {(message.from === "bot" || message.from === "agent") ? <Badge variant="outline">Pode marcar</Badge> : null}
                          </div>
                          <p className="mt-2 text-foreground">{message.text}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {chatMutation.isPending ? (
                <div className="mr-10">
                  <div className="flex items-center gap-2 rounded-[24px] rounded-tl-md border border-border/60 bg-muted px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ajustando o Agent com base no seu feedback...
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border/60 px-5 py-4">
            <div className="rounded-3xl border border-border/60 bg-muted p-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder='Ex.: "Quando o cliente disser fechou, isso significa sim" ou "nao repita a frase me fala como prefere seguir agora".'
                className="min-h-[110px] resize-none border-0 bg-transparent p-0 text-sm leading-7 shadow-none focus-visible:ring-0"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Esse chat conhece o perfil, o treino e as conversas recentes da empresa para corrigir o Agent de forma geral.
                </div>
                <Button
                  onClick={submit}
                  disabled={chatMutation.isPending || input.trim() === "" || !selectedProfileId}
                  className="rounded-full px-5"
                >
                  {chatMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
