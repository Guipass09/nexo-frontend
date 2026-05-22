import { useEffect, useMemo, useState } from "react";
import { Bot, Eraser, Expand, Loader2, MessageCircle, Minimize2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAiAgentAssistantChat, useAiAgentAssistantReset, useAiAgentAssistantWorkspace, useAiAgentProfile } from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuthUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api/client";

const NEXO_AI_ASSISTANT_OPEN_EVENT = "nexo-ai-assistant-open";

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
  const authUser = getStoredAuthUser();
  const canRenderAssistant = Boolean(authUser);
  const { data: profileData } = useAiAgentProfile(canRenderAssistant);
  const profiles = Array.isArray((profileData as { profiles?: unknown } | undefined)?.profiles)
    ? ((profileData as { profiles: Array<{ id?: string | number | null }> }).profiles ?? [])
    : (profileData ? [profileData] : []);
  const [selectedProfileId, setSelectedProfileId] = useState<string | number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const assistantWorkspaceQuery = useAiAgentAssistantWorkspace(
    { profileId: selectedProfileId, conversationId: selectedConversationId },
    open,
  );
  const assistantChatMutation = useAiAgentAssistantChat();
  const assistantResetMutation = useAiAgentAssistantReset();
  const examplePhrases = [
    'Quando o cliente disser "fechou", isso significa sim.',
    'Nao repita a frase "me fala como prefere seguir agora".',
    "Quando enviar este link, espere confirmacao como pronto ou feito.",
    "Se perguntarem preco, responda primeiro a pergunta e so depois conduza o proximo passo.",
    "Neste caso, quarta a noite significa disponibilidade valida para agenda.",
  ];

  useEffect(() => {
    if (selectedProfileId !== null || profiles.length === 0) {
      return;
    }

    setSelectedProfileId(profiles[0]?.id ?? null);
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
    };

    window.addEventListener(NEXO_AI_ASSISTANT_OPEN_EVENT, handleOpen);

    return () => {
      window.removeEventListener(NEXO_AI_ASSISTANT_OPEN_EVENT, handleOpen);
    };
  }, []);

  useEffect(() => {
    setSelectedConversationId(null);
    setSelectedMessageId(null);
  }, [selectedProfileId]);

  const workspace = assistantWorkspaceQuery.data;
  const trainingSnapshot = workspace?.trainingSnapshot ?? null;
  const recentConversations = Array.isArray(workspace?.recentConversations) ? workspace.recentConversations : [];
  const suggestions = Array.isArray(workspace?.suggestions) ? workspace.suggestions : [];
  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) {
      return null;
    }

    return recentConversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null;
  }, [recentConversations, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversation) {
      setSelectedMessageId(null);
      return;
    }

    const stillExists = selectedConversation.recentMessages.some((message) => message.id === selectedMessageId);

    if (!stillExists) {
      setSelectedMessageId(null);
    }
  }, [selectedConversation, selectedMessageId]);

  const title = useMemo(() => {
    if (!workspace) {
      return "Nexo bot";
    }

    const businessName = typeof workspace.profileSummary?.businessName === "string"
      ? workspace.profileSummary.businessName.trim()
      : "";

    return businessName !== "" ? `Nexo bot • ${businessName}` : workspace.assistantName;
  }, [workspace]);

  if (!canRenderAssistant) {
    return null;
  }

  const submit = () => {
    const message = input.trim();

    if (message === "") {
      return;
    }

    assistantChatMutation.mutate(
      {
        profileId: selectedProfileId,
        conversationId: selectedConversationId,
        messageId: selectedMessageId,
        message,
      },
      {
        onSuccess: () => {
          setInput("");
        },
        onError: (error) => {
          toast({
            title: "Falha no Nexo bot",
            description: getApiErrorMessage(error, "Não foi possível processar o ajuste do Agent IA."),
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

    assistantResetMutation.mutate(
      { profileId: selectedProfileId },
      {
        onSuccess: () => {
          toast({
            title: "Nexo bot limpo",
            description: "O historico do chat foi limpo. As regras aprendidas do Agent continuam salvas.",
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
    <div className="fixed bottom-5 right-5 z-[70]">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="h-14 rounded-full border-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-4 text-white shadow-2xl shadow-cyan-500/25 hover:opacity-95"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold">Nexo bot</span>
          </Button>
        </DialogTrigger>
        <DialogContent
          className={`overflow-hidden rounded-3xl border-slate-200 p-0 ${
            maximized
              ? "h-[92vh] w-[calc(100vw-2rem)] max-w-[min(1400px,calc(100vw-2rem))]"
              : "w-[calc(100vw-2rem)] max-w-4xl"
          }`}
        >
          <div className="grid max-h-[82vh] md:grid-cols-[320px_1fr]">
            <div className="border-b border-slate-200 bg-slate-50/80 p-5 md:border-b-0 md:border-r">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <DialogDescription>
                      Ajustes finos, leitura de conversas e aprendizado operacional do seu Agent IA.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Treino atual</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{scoreLabel(workspace?.trainingSnapshot.averageScore ?? null)}</Badge>
                    {trainingSnapshot?.passedScenarios !== null && trainingSnapshot?.scenarioCount !== null ? (
                      <Badge variant="outline">
                        {trainingSnapshot.passedScenarios}/{trainingSnapshot.scenarioCount} cenários
                      </Badge>
                    ) : null}
                  </div>
                  {trainingSnapshot?.criticSummary ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{trainingSnapshot.criticSummary}</p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      O Nexo bot usa o perfil, o treino e as conversas recentes para transformar seu feedback em regras reais do Agent.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sugestões úteis</p>
                  <div className="mt-3 space-y-2">
                    {suggestions.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInput(suggestion)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-left text-sm leading-6 text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {recentConversations.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conversas recentes</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Você pode anexar uma conversa real para eu diagnosticar o erro na origem e transformar isso em regra geral do Agent.
                    </p>
                    <div className="mt-3 space-y-3">
                      {recentConversations.slice(0, 3).map((conversation) => (
                        <button
                          key={conversation.conversationId}
                          type="button"
                          onClick={() => {
                            setSelectedConversationId(conversation.conversationId);
                            setSelectedMessageId(null);
                          }}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                            selectedConversationId === conversation.conversationId
                              ? "border-cyan-300 bg-cyan-50"
                              : "border-slate-100 bg-slate-50 hover:border-cyan-200"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{conversation.contactName}</p>
                            <Badge variant="outline">{conversation.status}</Badge>
                          </div>
                          {conversation.issueHint ? (
                            <p className="mt-2 text-sm leading-6 text-rose-700">{conversation.issueHint}</p>
                          ) : null}
                          {conversation.lastCustomerMessage ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Cliente: {conversation.lastCustomerMessage}
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Frases que eu entendo bem</p>
                  <div className="mt-3 space-y-2">
                    {examplePhrases.map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => setInput(phrase)}
                        className="w-full rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-left text-sm leading-6 text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-[68vh] flex-col bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="mb-3 flex items-center justify-end gap-2 pr-10">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearConversation}
                    disabled={assistantResetMutation.isPending}
                    className="rounded-full"
                  >
                    {assistantResetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
                    Limpar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMaximized((current) => !current)}
                    className="rounded-full"
                  >
                    <Expand className="h-4 w-4" />
                    {maximized ? "Tela normal" : "Maximizar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="rounded-full"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Minimizar
                  </Button>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {workspace?.introMessage ?? "Olá, tudo bem? Sou a Nexo bot, responsável pelos ajustes finos do seu Agent IA."}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Me diga o erro percebido, a frase que deve evitar, como interpretar um sinal do cliente ou qual deve ser o proximo passo correto.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Exemplo real opcional</p>
                    <Select
                      value={selectedConversationId ?? "none"}
                      onValueChange={(value) => {
                        setSelectedConversationId(value === "none" ? null : value);
                        setSelectedMessageId(null);
                      }}
                    >
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Selecionar conversa com erro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem conversa anexada</SelectItem>
                        {recentConversations.map((conversation) => (
                          <SelectItem key={conversation.conversationId} value={conversation.conversationId}>
                            {conversation.contactName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mensagem problemática</p>
                    <Select
                      value={selectedMessageId ?? "none"}
                      onValueChange={(value) => setSelectedMessageId(value === "none" ? null : value)}
                      disabled={!selectedConversation}
                    >
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder={selectedConversation ? "Selecionar resposta com erro" : "Escolha uma conversa primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Usar a conversa inteira</SelectItem>
                        {(selectedConversation?.recentMessages ?? [])
                          .filter((message) => message.from === "bot" || message.from === "agent")
                          .map((message) => (
                            <SelectItem key={message.id} value={message.id}>
                              {message.text.slice(0, 72)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedConversation ? (
                  <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Exemplo anexado: {selectedConversation.contactName}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Vou usar essa conversa para ir direto ao erro, mas a correção será aplicada como regra geral do Agent para não se repetir em outros atendimentos.
                    </p>
                    {selectedConversation.issueHint ? (
                      <p className="mt-2 text-sm leading-6 text-rose-700">{selectedConversation.issueHint}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <ScrollArea className="flex-1 px-5 py-5">
                <div className="space-y-4">
                  {assistantWorkspaceQuery.isLoading && !workspace ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando o contexto completo do Agent IA...
                    </div>
                  ) : null}

                  {(workspace?.messages ?? []).map((message) => (
                    <div
                      key={message.id}
                      className={message.role === "assistant" ? "mr-10" : "ml-10"}
                    >
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
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trecho anexado para diagnóstico</p>
                      <div className="mt-3 space-y-3">
                        {selectedConversation.recentMessages.map((message) => {
                          const isSelected = selectedMessageId === message.id;
                          const isAgent = message.from === "bot" || message.from === "agent";

                          return (
                            <button
                              key={message.id}
                              type="button"
                              onClick={() => setSelectedMessageId(isSelected ? null : message.id)}
                              className={`block w-full rounded-2xl border px-3 py-3 text-left text-sm leading-6 transition ${
                                isSelected
                                  ? "border-cyan-300 bg-cyan-50"
                                  : "border-slate-200 bg-white hover:border-cyan-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-slate-900">
                                  {isAgent ? "Agent" : "Cliente"}
                                </span>
                                {isAgent ? <Badge variant="outline">Pode marcar</Badge> : null}
                              </div>
                              <p className="mt-2 text-slate-700">{message.text}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {assistantChatMutation.isPending ? (
                    <div className="mr-10">
                      <div className="flex items-center gap-2 rounded-[24px] rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ajustando o Agent com base no seu feedback...
                      </div>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>

              <div className="border-t border-slate-200 px-5 py-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder='Ex.: "Quando o cliente disser fechou, isso significa sim", "nao repita a frase me fala como prefere seguir agora" ou "quando enviar o link, espere confirmacao como pronto ou feito".'
                    className="min-h-[110px] resize-none border-0 bg-transparent p-0 text-sm leading-7 shadow-none focus-visible:ring-0"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MessageCircle className="h-4 w-4" />
                      Esse chat conhece o perfil, o treino e as conversas recentes da empresa para corrigir o Agent de forma geral.
                    </div>
                    <Button
                      onClick={submit}
                      disabled={assistantChatMutation.isPending || input.trim() === ""}
                      className="rounded-full px-5"
                    >
                      {assistantChatMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
