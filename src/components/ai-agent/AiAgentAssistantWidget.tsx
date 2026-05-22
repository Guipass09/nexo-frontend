import { useEffect, useMemo, useState } from "react";
import { Bot, Eraser, Expand, Loader2, Minimize2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAiAgentAssistantChat, useAiAgentAssistantReset, useAiAgentAssistantWorkspace, useAiAgentProfile } from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuthUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api/client";

const NEXO_AI_ASSISTANT_OPEN_EVENT = "nexo-ai-assistant-open";

type ConversationInsight = {
  conversationId: string;
  contactName: string;
  status: string;
  issueHint?: string | null;
  lastCustomerMessage?: string | null;
  recentMessages: Array<{
    id: string;
    from: string;
    text: string;
    sentAt?: string | null;
  }>;
};

function scoreLabel(score: number | null) {
  if (score === null) {
    return "Sem treino";
  }

  return `${score.toFixed(1)} / 100`;
}

export function AiAgentAssistantWidget() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const authUser = getStoredAuthUser();
  const canRenderAssistant = Boolean(authUser);

  const { data: profileData } = useAiAgentProfile(canRenderAssistant && open);
  const profiles = Array.isArray((profileData as { profiles?: unknown } | undefined)?.profiles)
    ? ((profileData as { profiles: Array<{ id?: string | number | null }> }).profiles ?? [])
    : (profileData ? [profileData] : []);

  useEffect(() => {
    if (selectedProfileId !== null || profiles.length === 0) {
      return;
    }

    setSelectedProfileId(profiles[0]?.id ?? null);
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(NEXO_AI_ASSISTANT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(NEXO_AI_ASSISTANT_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    setSelectedConversationId("");
    setSelectedMessageId("");
  }, [selectedProfileId]);

  const workspaceQuery = useAiAgentAssistantWorkspace(
    {
      profileId: selectedProfileId,
      conversationId: selectedConversationId !== "" ? selectedConversationId : null,
    },
    canRenderAssistant && open && Boolean(selectedProfileId),
  );
  const chatMutation = useAiAgentAssistantChat();
  const resetMutation = useAiAgentAssistantReset();

  const workspace = workspaceQuery.data;
  const trainingSnapshot = typeof workspace?.trainingSnapshot === "object" && workspace?.trainingSnapshot !== null
    ? workspace.trainingSnapshot
    : null;
  const suggestions = Array.isArray(workspace?.suggestions) ? workspace.suggestions : [];
  const messages = Array.isArray(workspace?.messages) ? workspace.messages : [];
  const recentConversations: ConversationInsight[] = Array.isArray(workspace?.recentConversations)
    ? workspace.recentConversations.map((conversation) => ({
      conversationId: String(conversation.conversationId ?? ""),
      contactName: String(conversation.contactName ?? "Contato"),
      status: String(conversation.status ?? "ativo"),
      issueHint: typeof conversation.issueHint === "string" ? conversation.issueHint : null,
      lastCustomerMessage: typeof conversation.lastCustomerMessage === "string" ? conversation.lastCustomerMessage : null,
      recentMessages: Array.isArray(conversation.recentMessages)
        ? conversation.recentMessages.map((message) => ({
          id: String(message.id ?? ""),
          from: String(message.from ?? ""),
          text: String(message.text ?? ""),
          sentAt: typeof message.sentAt === "string" ? message.sentAt : null,
        }))
        : [],
    }))
    : [];

  const selectedConversation = useMemo(() => {
    if (selectedConversationId === "") {
      return null;
    }

    return recentConversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null;
  }, [recentConversations, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversation) {
      setSelectedMessageId("");
      return;
    }

    if (!selectedConversation.recentMessages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId("");
    }
  }, [selectedConversation, selectedMessageId]);

  const title = typeof workspace?.profileSummary?.businessName === "string" && workspace.profileSummary.businessName.trim() !== ""
    ? `Nexo bot • ${workspace.profileSummary.businessName.trim()}`
    : "Nexo bot";

  const examplePhrases = [
    'Quando o cliente disser "fechou", isso significa sim.',
    'Nao repita a frase "me fala como prefere seguir agora".',
    "Quando enviar este link, espere confirmacao como pronto ou feito.",
    "Se perguntarem preco, responda primeiro a pergunta e so depois conduza o proximo passo.",
    "Quarta a noite significa disponibilidade valida para agenda.",
  ];

  if (!canRenderAssistant) {
    return null;
  }

  const submit = () => {
    const message = input.trim();

    if (message === "" || !selectedProfileId) {
      return;
    }

    chatMutation.mutate(
      {
        profileId: selectedProfileId,
        conversationId: selectedConversationId !== "" ? selectedConversationId : null,
        messageId: selectedMessageId !== "" ? selectedMessageId : null,
        message,
      },
      {
        onSuccess: () => {
          setInput("");
        },
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
    <div className="fixed bottom-5 right-5 z-[90]">
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-14 rounded-full border-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-4 text-white shadow-2xl shadow-cyan-500/25 hover:opacity-95"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold">Nexo bot</span>
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-[91] bg-black/45" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 bottom-4 top-4 z-[92] flex items-center justify-center md:inset-8">
            <div className={`flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ${maximized ? "" : "max-w-5xl"}`}>
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <p className="text-sm text-slate-500">Ajustes finos e leitura de erros reais do Agent IA.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={clearConversation} disabled={resetMutation.isPending}>
                    {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
                    Limpar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setMaximized((current) => !current)}>
                    <Expand className="h-4 w-4" />
                    {maximized ? "Normal" : "Maximizar"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    <Minimize2 className="h-4 w-4" />
                    Minimizar
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr]">
                <aside className="overflow-y-auto border-b border-slate-200 bg-slate-50 p-5 md:border-b-0 md:border-r">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Treino atual</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{scoreLabel(trainingSnapshot?.averageScore ?? null)}</Badge>
                      {trainingSnapshot?.passedScenarios !== null && trainingSnapshot?.scenarioCount !== null ? (
                        <Badge variant="outline">
                          {trainingSnapshot.passedScenarios}/{trainingSnapshot.scenarioCount} cenarios
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {trainingSnapshot?.criticSummary ?? "Use este chat para ensinar o Agent sem mexer em prompt manual."}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sugestoes</p>
                    <div className="mt-3 space-y-2">
                      {(suggestions.length ? suggestions : examplePhrases).slice(0, 5).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setInput(suggestion)}
                          className="block w-full rounded-2xl border border-slate-200 px-3 py-2 text-left text-sm leading-6 text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Exemplo real opcional</p>
                    <select
                      value={selectedConversationId}
                      onChange={(event) => {
                        setSelectedConversationId(event.target.value);
                        setSelectedMessageId("");
                      }}
                      className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      <option value="">Sem conversa anexada</option>
                      {recentConversations.map((conversation) => (
                        <option key={conversation.conversationId} value={conversation.conversationId}>
                          {conversation.contactName}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedMessageId}
                      onChange={(event) => setSelectedMessageId(event.target.value)}
                      disabled={!selectedConversation}
                      className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Vou usar essa conversa como exemplo, mas o ajuste sera geral para o Agent inteiro.
                      </p>
                    ) : null}
                  </div>
                </aside>

                <section className="flex min-h-0 flex-col bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {workspace?.introMessage ?? "Ola, tudo bem? Sou a Nexo bot. Me conte o erro que voce identificou no Agent IA."}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Exemplos: "isso significa sim", "nao repita essa frase", "quando enviar o link espere confirmacao", "neste caso deveria seguir para agenda".
                    </p>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                    {workspaceQuery.isLoading ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando o contexto do Agent IA...
                      </div>
                    ) : null}

                    {workspaceQuery.isError ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                        {getApiErrorMessage(workspaceQuery.error, "Nao foi possivel carregar o chat de ajuste agora.")}
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className={message.role === "assistant" ? "mr-10" : "ml-10"}>
                          <div
                            className={
                              message.role === "assistant"
                                ? "rounded-[24px] rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700"
                                : "rounded-[24px] rounded-br-md bg-gradient-to-br from-blue-600 to-cyan-500 px-4 py-3 text-sm leading-7 text-white"
                            }
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}

                      {selectedConversation ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trecho anexado para diagnostico</p>
                          <div className="mt-3 space-y-3">
                            {selectedConversation.recentMessages.map((message) => {
                              const selected = selectedMessageId === message.id;
                              return (
                                <button
                                  key={message.id}
                                  type="button"
                                  onClick={() => setSelectedMessageId(selected ? "" : message.id)}
                                  className={`block w-full rounded-2xl border px-3 py-3 text-left text-sm leading-6 transition ${
                                    selected ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white hover:border-cyan-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-slate-900">
                                      {message.from === "bot" || message.from === "agent" ? "Agent" : "Cliente"}
                                    </span>
                                    {(message.from === "bot" || message.from === "agent") ? <Badge variant="outline">Pode marcar</Badge> : null}
                                  </div>
                                  <p className="mt-2 text-slate-700">{message.text}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {chatMutation.isPending ? (
                        <div className="mr-10">
                          <div className="flex items-center gap-2 rounded-[24px] rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Ajustando o Agent com base no seu feedback...
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 px-5 py-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                      <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder='Ex.: "Quando o cliente disser fechou, isso significa sim" ou "nao repita a frase me fala como prefere seguir agora".'
                        className="min-h-[110px] resize-none border-0 bg-transparent p-0 text-sm leading-7 shadow-none focus-visible:ring-0"
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
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
                </section>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
