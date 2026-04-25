import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStoredAuthUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAiVocabularyChat, useAiVocabularyMappings, useUpdateWhatsAppSettings, useWhatsAppSettings } from "@/hooks/use-app-data";
import type { AiVocabularyMapping } from "@/types/domain";
import { AlertCircle, Bot, CheckCircle2, KeyRound, MessageSquare, RefreshCcw, Send, ShieldCheck, Sparkles, Webhook } from "lucide-react";

const Section = ({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) => (
  <Card className="p-5 md:p-6 border-border/60">
    <div className="flex items-start gap-3 mb-5 pb-5 border-b border-border/60">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </Card>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 sm:items-center">
    <Label className="text-sm">{label}</Label>
    <div className="sm:col-span-2">{children}</div>
  </div>
);

type SettingsDraft = {
  phoneNumberId: string;
  businessAccountId: string;
  businessNumber: string;
  apiVersion: string;
  accessToken: string;
  webhookVerifyToken: string;
};

const emptyDraft: SettingsDraft = {
  phoneNumberId: "",
  businessAccountId: "",
  businessNumber: "",
  apiVersion: "v21.0",
  accessToken: "",
  webhookVerifyToken: "",
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const initialChatMessages: ChatMessage[] = [
  {
    id: "assistant:intro",
    role: "assistant",
    content: 'Ensine novas relacoes do fluxo com comandos como "ensine que podemos = sim" ou "quando eu disser home office, entenda online".',
  },
];

function formatMappingLabel(mapping: AiVocabularyMapping) {
  return `"${mapping.sourceTerm}" -> "${mapping.canonicalValue}"`;
}

export default function Configuracoes() {
  const { toast } = useToast();
  const { data, isLoading, error, isError } = useWhatsAppSettings();
  const updateSettingsMutation = useUpdateWhatsAppSettings();
  const { data: learnedMappings = [], isLoading: isLoadingMappings } = useAiVocabularyMappings();
  const aiVocabularyChatMutation = useAiVocabularyChat();
  const [draft, setDraft] = useState<SettingsDraft>(emptyDraft);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const currentUser = useMemo(() => getStoredAuthUser(), []);
  const isAdmin = currentUser?.role === "admin";
  const canManageCredentials = isAdmin && (data?.canManageCredentials ?? true);

  useEffect(() => {
    if (!data) {
      return;
    }

    setDraft({
      phoneNumberId: data.phoneNumberId ?? "",
      businessAccountId: data.businessAccountId ?? "",
      businessNumber: data.businessNumber ?? "",
      apiVersion: data.apiVersion || "v21.0",
      accessToken: "",
      webhookVerifyToken: "",
    });
  }, [data]);

  const saveSettings = () => {
    updateSettingsMutation.mutate({
      phone_number_id: draft.phoneNumberId.trim(),
      business_account_id: draft.businessAccountId.trim(),
      business_number: draft.businessNumber.trim(),
      api_version: draft.apiVersion.trim() || "v21.0",
      access_token: draft.accessToken.trim() || undefined,
      webhook_verify_token: draft.webhookVerifyToken.trim() || undefined,
    }, {
      onSuccess: () => {
        setDraft((current) => ({ ...current, accessToken: "", webhookVerifyToken: "" }));
        toast({
          title: "Configuracoes salvas",
          description: "O backend Laravel ja pode usar essas credenciais para envio e webhook.",
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Falha ao salvar configuracoes",
          description: getApiErrorMessage(mutationError),
          variant: "destructive",
        });
      },
    });
  };

  const sendLearningMessage = () => {
    const message = chatInput.trim();

    if (!message) {
      return;
    }

    setChatMessages((current) => [
      ...current,
      { id: `user:${Date.now()}`, role: "user", content: message },
    ]);
    setChatInput("");

    aiVocabularyChatMutation.mutate(message, {
      onSuccess: (result) => {
        setChatMessages((current) => [
          ...current,
          { id: `assistant:${Date.now()}`, role: "assistant", content: result.reply },
        ]);
        toast({
          title: result.action === "learned" ? "Aprendizado salvo" : "Resposta da IA",
          description: result.reply,
        });
      },
      onError: (mutationError) => {
        const description = getApiErrorMessage(mutationError);

        setChatMessages((current) => [
          ...current,
          { id: `assistant:error:${Date.now()}`, role: "assistant", content: description },
        ]);
        toast({
          title: "Falha ao ensinar a IA",
          description,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {isError && (
        <Card className="p-4 border-destructive/40 text-sm text-destructive">
          Erro ao carregar configuracoes: {getApiErrorMessage(error)}
        </Card>
      )}

      <Section icon={MessageSquare} title="Canal WhatsApp Cloud" desc="O backend usa as credenciais centrais para envio e recepcao via webhook sem expor os segredos no painel do usuario">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className={`p-4 border ${data?.ready ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {data?.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
              Backend pronto
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {data?.ready ? "Credenciais principais disponiveis para envio e validacao do webhook." : "Ainda faltam credenciais obrigatorias para operar tudo em modo real."}
            </p>
          </Card>
          <Card className="p-4 border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4 text-primary" />
              Integracao segura
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {canManageCredentials
                ? (data?.accessTokenMasked ?? "Nao configurado")
                : (data?.hasAccessToken ? "Token central ativo no backend" : "Token ainda nao configurado")}
            </p>
          </Card>
          <Card className="p-4 border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Webhook className="h-4 w-4 text-primary" />
              Webhook
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {canManageCredentials
                ? (data?.webhookVerifyTokenMasked ?? "Nao configurado")
                : (data?.hasWebhookVerifyToken ? "Verificacao ativa no backend" : "Webhook ainda nao configurado")}
            </p>
          </Card>
        </div>

        <Field label="Phone Number ID">
          <Input
            value={draft.phoneNumberId}
            onChange={(event) => setDraft((current) => ({ ...current, phoneNumberId: event.target.value }))}
            placeholder="1092499637275761"
            disabled={!canManageCredentials || isLoading}
          />
        </Field>
        <Field label="WABA ID">
          <Input
            value={draft.businessAccountId}
            onChange={(event) => setDraft((current) => ({ ...current, businessAccountId: event.target.value }))}
            placeholder="2378024445997462"
            disabled={!canManageCredentials || isLoading}
          />
        </Field>
        <Field label="Numero comercial">
          <Input
            value={draft.businessNumber}
            onChange={(event) => setDraft((current) => ({ ...current, businessNumber: event.target.value }))}
            placeholder="5513998080920"
            disabled={!canManageCredentials || isLoading}
          />
        </Field>
        <Field label="Versao da API">
          <Input
            value={draft.apiVersion}
            onChange={(event) => setDraft((current) => ({ ...current, apiVersion: event.target.value }))}
            placeholder="v21.0"
            disabled={!canManageCredentials || isLoading}
          />
        </Field>
      </Section>

      {canManageCredentials ? (
        <Section icon={ShieldCheck} title="Segredos de integracao" desc="Campos sensiveis ficam persistidos no backend e nao voltam em texto puro para a tela">
          <Field label="Access Token">
            <Input
              type="password"
              value={draft.accessToken}
              onChange={(event) => setDraft((current) => ({ ...current, accessToken: event.target.value }))}
              placeholder={data?.hasAccessToken ? `Atual: ${data.accessTokenMasked}` : "Cole aqui o token da Cloud API"}
              disabled={!canManageCredentials || isLoading}
            />
          </Field>
          <Field label="Verify Token">
            <Input
              type="password"
              value={draft.webhookVerifyToken}
              onChange={(event) => setDraft((current) => ({ ...current, webhookVerifyToken: event.target.value }))}
              placeholder={data?.hasWebhookVerifyToken ? `Atual: ${data.webhookVerifyTokenMasked}` : "Token usado pela Meta na verificacao do webhook"}
              disabled={!canManageCredentials || isLoading}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Deixe os campos de segredo em branco para manter o valor atual salvo no backend.
          </p>
        </Section>
      ) : (
        <Section icon={ShieldCheck} title="Integracao protegida" desc="Seu painel usa a integracao central sem expor access token ou verify token">
          <div className="rounded-xl border border-border/70 bg-secondary/20 px-4 py-4 text-sm text-muted-foreground">
            O canal oficial do WhatsApp esta configurado no backend da plataforma. Voce pode operar conversas, fluxos, templates e audios normalmente sem visualizar os segredos da integracao.
          </div>
        </Section>
      )}

      <Section icon={Webhook} title="Como usar agora" desc="Depois de salvar aqui, o painel de conversas ja passa a usar essas credenciais">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>1. Crie um contato com telefone real no formato internacional, como <code>5511999999999</code>.</li>
          <li>2. Abra ou crie uma conversa para esse contato.</li>
          <li>3. Envie mensagem manual pela tela de conversas ou template oficial fora da janela de 24h.</li>
          <li>4. Configure a Meta para apontar o webhook para <code>/api/webhook/whatsapp</code> do backend.</li>
        </ul>
      </Section>

      <Section
        icon={Sparkles}
        title="IA Ensinavel Do Fluxo"
        desc="Ensine equivalencias novas para que as condicoes do fluxo entendam respostas livres como se fossem o valor canonico"
      >
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-4 border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Chat de aprendizado</h4>
            </div>

            <ScrollArea className="h-72 rounded-md border border-border/60 bg-muted/20 px-3 py-3">
              <div className="space-y-3 pr-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                          : "max-w-[85%] rounded-2xl rounded-bl-md bg-background px-4 py-2 text-sm border border-border/60"
                      }
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  'ensine que podemos = sim',
                  'ensine que home office = online',
                  'ensine que fono = fonoaudiologa',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => setChatInput(example)}
                    disabled={!canManageCredentials}
                  >
                    {example}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder='Ex.: ensine que podemos = sim'
                  disabled={!canManageCredentials || aiVocabularyChatMutation.isPending}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendLearningMessage();
                    }
                  }}
                />
                <Button
                  type="button"
                  className="gradient-primary text-primary-foreground shrink-0"
                  onClick={sendLearningMessage}
                  disabled={!canManageCredentials || aiVocabularyChatMutation.isPending || chatInput.trim() === ""}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Dica: ensine termos que o cliente costuma usar e relacione com o valor que aparece na condicao do fluxo, como <code>sim</code>, <code>online</code> ou uma profissao.
              </p>
              <p className="text-xs text-muted-foreground">
                Cada novo ensino soma repertorio. Ele nao apaga significados anteriores; apenas adiciona novas formas de entender a resposta do cliente.
              </p>
            </div>
          </Card>

          <Card className="p-4 border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Aprendizados recentes</h4>
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {isLoadingMappings && (
                <p className="text-sm text-muted-foreground">Carregando aprendizados...</p>
              )}

              {!isLoadingMappings && learnedMappings.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum aprendizado salvo ainda. Ensine o primeiro comando no chat ao lado.
                </p>
              )}

              {learnedMappings.map((mapping) => (
                <div key={mapping.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-medium">{formatMappingLabel(mapping)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {mapping.createdBy ? `Criado por ${mapping.createdBy}` : "Criado no sistema"}
                    {mapping.createdAt ? ` • ${new Date(mapping.createdAt).toLocaleString("pt-BR")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <div className="flex justify-end gap-2 pb-4">
        <Button
          variant="outline"
          onClick={() => data && setDraft({
            phoneNumberId: data.phoneNumberId ?? "",
            businessAccountId: data.businessAccountId ?? "",
            businessNumber: data.businessNumber ?? "",
            apiVersion: data.apiVersion || "v21.0",
            accessToken: "",
            webhookVerifyToken: "",
          })}
          disabled={updateSettingsMutation.isPending || isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Recarregar
        </Button>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={saveSettings}
          disabled={!canManageCredentials || updateSettingsMutation.isPending || isLoading}
        >
          Salvar configuracoes
        </Button>
      </div>
      {!canManageCredentials && (
        <p className="text-xs text-muted-foreground">
          Apenas administradores podem alterar as credenciais reais do WhatsApp Cloud.
        </p>
      )}
    </div>
  );
}
