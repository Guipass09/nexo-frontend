import { BookOpenText, Brain, Building2, Globe2, HelpCircle, IdCard, ListChecks, MessageCircle, ShieldAlert, Sparkles, Target, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ADVANCE_STEP_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  FALLBACK_OPTIONS,
  FORBIDDEN_CLAIM_OPTIONS,
  HANDOFF_TRIGGER_OPTIONS,
  MAIN_GOAL_OPTIONS,
  PACING_OPTIONS,
  PRESENTATION_OPTIONS,
  PRICE_ON_REQUEST_TEXT,
  SERVICE_MODE_OPTIONS,
  SUPPORTED_TOPIC_OPTIONS,
  buildAgentBrainPreview,
  buildGreetingPreview,
  completionSignalsForStep,
  type AgentBrainForm,
  type BrainFacts,
} from "@/lib/agent-brain";

type Option = { value: string; label: string };

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "border-primary/40 bg-[linear-gradient(135deg,rgba(37,99,255,0.14),rgba(124,58,237,0.14))] text-slate-950 shadow-[0_10px_24px_-18px_rgba(37,99,255,0.7)]"
          : "border-border bg-white/70 text-slate-600 hover:border-primary/30 hover:text-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Question({
  icon: Icon,
  index,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  index: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/55 bg-white/55 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(37,99,255,0.16),rgba(124,58,237,0.14))] text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">
            <span className="mr-1 text-primary">{index}.</span>
            {title}
          </p>
          {hint && <p className="mt-0.5 text-xs leading-5 text-slate-500">{hint}</p>}
          <div className="mt-3 flex flex-wrap gap-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AgentBrainSection({
  value,
  onChange,
  companyName,
  assistantName,
  onIdentityChange,
  facts,
  onFactChange,
}: {
  value: AgentBrainForm;
  onChange: (next: AgentBrainForm) => void;
  companyName: string;
  assistantName: string;
  onIdentityChange: (field: "companyName" | "assistantName", value: string) => void;
  facts: BrainFacts;
  onFactChange: (field: keyof BrainFacts, value: string) => void;
}) {
  const set = (patch: Partial<AgentBrainForm>) => onChange({ ...value, ...patch });

  const toggleIn = (list: string[], item: string): string[] =>
    list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];

  const single = (options: Option[], current: string, onPick: (value: string) => void) =>
    options.map((option) => (
      <Chip
        key={option.value}
        label={option.label}
        active={current === option.value}
        onClick={() => onPick(current === option.value ? "" : option.value)}
      />
    ));

  const multi = (options: Option[], current: string[], key: keyof AgentBrainForm) =>
    options.map((option) => (
      <Chip
        key={option.value}
        label={option.label}
        active={current.includes(option.value)}
        onClick={() => set({ [key]: toggleIn(current, option.value) } as Partial<AgentBrainForm>)}
      />
    ));

  const suggestedSignals = completionSignalsForStep(value.advanceStep);
  const preview = buildAgentBrainPreview(value);

  return (
    <Card className="nexo-premium-surface p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(37,99,255,0.18),rgba(124,58,237,0.16))] text-primary shadow-[0_16px_36px_-28px_rgba(37,99,255,0.68)]">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Cérebro do atendimento</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Responda em linguagem simples. O Nexo monta a estratégia do atendente automaticamente.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/55 bg-white/55 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(37,99,255,0.16),rgba(124,58,237,0.14))] text-primary">
            <IdCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950">Identidade do atendente</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">Como ele se chama e como deve se apresentar ao cliente.</p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">Nome da empresa</label>
                <Input
                  value={companyName}
                  onChange={(event) => onIdentityChange("companyName", event.target.value)}
                  placeholder="Ex.: Sementes da Fala"
                  className="mt-1 bg-white/80"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Nome do assistente</label>
                <Input
                  value={assistantName}
                  onChange={(event) => onIdentityChange("assistantName", event.target.value)}
                  placeholder="Ex.: Nina, Sofia, Atendimento"
                  className="mt-1 bg-white/80"
                />
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-slate-600">Como o assistente deve se apresentar?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESENTATION_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={value.presentationStyle === option.value}
                  onClick={() =>
                    set({
                      presentationStyle: value.presentationStyle === option.value ? "" : option.value,
                      mentionAi: option.value === "natural" ? false : option.value === "virtual_assistant" ? true : value.mentionAi,
                    })
                  }
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Chip
                label="Pode dizer que é assistente virtual"
                active={value.mentionAi}
                onClick={() => set({ mentionAi: true })}
              />
              <Chip
                label="Não mencionar IA/robô, atender naturalmente"
                active={!value.mentionAi}
                onClick={() => set({ mentionAi: false })}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-200/50 bg-cyan-50/40 px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <MessageCircle className="h-3.5 w-3.5" />
                Assim o cliente verá sua primeira mensagem:
              </p>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">{buildGreetingPreview(value, companyName, assistantName)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <Question
          icon={Building2}
          index={1}
          title="Que tipo de negócio é o seu?"
          hint="Saiba mais: define seu segmento. O Nexo usa isto para adaptar o vocabulário e o fluxo ao seu tipo de negócio."
        >
          {single(BUSINESS_TYPE_OPTIONS, value.businessType, (next) => set({ businessType: next as AgentBrainForm["businessType"] }))}
        </Question>

        <Question
          icon={Target}
          index={2}
          title="Qual o objetivo principal do atendimento?"
          hint="Saiba mais: é o que guia a conversa inteira. Ex.: 'Atendimento geral' = só tirar dúvidas, sem agendar nem pedir cadastro."
        >
          {single(MAIN_GOAL_OPTIONS, value.mainGoal, (next) => set({ mainGoal: next as AgentBrainForm["mainGoal"] }))}
        </Question>

        <Question
          icon={Sparkles}
          index={3}
          title="Como o cliente avança?"
          hint="Saiba mais: define a etapa de conversão (cadastro, reserva, matrícula…) e ajuda o Nexo a reconhecer quando o cliente concluiu a etapa."
        >
          {single(ADVANCE_STEP_OPTIONS, value.advanceStep, (next) => set({ advanceStep: next as AgentBrainForm["advanceStep"] }))}
        </Question>

        {suggestedSignals.length > 0 && (
          <div className="rounded-2xl border border-cyan-200/50 bg-cyan-50/40 px-4 py-3">
            <p className="text-xs font-semibold text-primary">Frases que indicam que o cliente concluiu (sugeridas):</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestedSignals.map((signal) => (
                <span key={signal} className="rounded-full border border-primary/20 bg-white/70 px-2.5 py-1 text-xs text-slate-600">
                  “{signal}”
                </span>
              ))}
            </div>
          </div>
        )}

        <Question
          icon={Globe2}
          index={4}
          title="Como é o atendimento?"
          hint="Saiba mais: online, presencial ou os dois — ajusta como a IA fala de acesso, localização e link."
        >
          {single(SERVICE_MODE_OPTIONS, value.serviceMode, (next) => set({ serviceMode: next as AgentBrainForm["serviceMode"] }))}
        </Question>

        <Question
          icon={ListChecks}
          index={5}
          title="Sobre quais assuntos a IA pode responder?"
          hint="Saiba mais: são os temas liberados. Fora deles, a IA encaminha em vez de inventar."
        >
          {multi(SUPPORTED_TOPIC_OPTIONS, value.supportedTopics, "supportedTopics")}
        </Question>

        <Question
          icon={ShieldAlert}
          index={6}
          title="O que a IA nunca deve prometer?"
          hint="Saiba mais: o que a IA NUNCA pode afirmar/prometer. Use o campo aberto para regras suas (ex.: 'não garantir prazo', 'não dar diagnóstico')."
        >
          {multi(FORBIDDEN_CLAIM_OPTIONS, value.forbiddenClaims, "forbiddenClaims")}
          <div className="mt-2 w-full">
            <Textarea
              value={value.forbiddenClaimsExtra}
              onChange={(event) => set({ forbiddenClaimsExtra: event.target.value })}
              placeholder="Outro (opcional): escreva o que mais a IA nunca deve prometer"
              className="min-h-[64px] bg-white/70"
            />
          </div>
        </Question>

        <Question
          icon={UserCog}
          index={7}
          title="Quando a IA deve chamar uma pessoa?"
          hint="Saiba mais: situações em que a IA transfere para um humano (ex.: caso sensível, pedido explícito, fora do escopo)."
        >
          {multi(HANDOFF_TRIGGER_OPTIONS, value.handoffTriggers, "handoffTriggers")}
        </Question>

        <Question
          icon={HelpCircle}
          index={8}
          title="O que a IA deve fazer quando não souber?"
          hint="Saiba mais: o comportamento quando a resposta não está na ficha (perguntar mais, responder só com a ficha, ou chamar uma pessoa)."
        >
          {single(FALLBACK_OPTIONS, value.fallbackBehavior, (next) => set({ fallbackBehavior: next as AgentBrainForm["fallbackBehavior"] }))}
        </Question>

        <Question
          icon={Sparkles}
          index={9}
          title="Como a IA deve se despedir?"
          hint="Saiba mais: a mensagem que a IA usa para encerrar quando o cliente agradece ou se despede. Deixe vazio para usar a despedida padrão."
        >
          <div className="mt-1 w-full">
            <Textarea
              value={value.farewellMessage}
              onChange={(event) => set({ farewellMessage: event.target.value })}
              placeholder="Ex.: Foi um prazer falar com você! Qualquer coisa, é só chamar. Até logo 💙"
              className="min-h-[64px] bg-white/70"
            />
          </div>
        </Question>

        <Question
          icon={MessageCircle}
          index={10}
          title="Quanto a IA deve perguntar antes de avançar?"
          hint="Saiba mais: controla o ritmo da conversa. O GPT-5 segue isto — direto ao objetivo com poucas perguntas, equilibrado, ou coletando mais contexto antes de avançar."
        >
          <div className="mt-1 flex flex-wrap gap-2">
            {PACING_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={value.conversationPacing === option.value}
                onClick={() =>
                  set({ conversationPacing: value.conversationPacing === option.value ? "" : option.value })
                }
              />
            ))}
          </div>
          {value.conversationPacing ? (
            <p className="mt-2 text-xs text-slate-500">
              {PACING_OPTIONS.find((option) => option.value === value.conversationPacing)?.hint}
            </p>
          ) : null}
        </Question>
      </div>

      <div className="mt-3 rounded-2xl border border-white/55 bg-white/55 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(37,99,255,0.16),rgba(124,58,237,0.14))] text-primary">
            <BookOpenText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950">O que seu atendente precisa saber</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Os fatos que ele usa para responder com segurança. Quanto melhor aqui, menos ele inventa.
            </p>

            <div className="mt-3 grid gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">O que sua empresa oferece?</label>
                <p className="text-[11px] leading-4 text-slate-400">Saiba mais: serviços, soluções e o que você entrega. A IA usa para explicar o negócio.</p>
                <Textarea
                  value={facts.services}
                  onChange={(event) => onFactChange("services", event.target.value)}
                  placeholder="Ex.: avaliação inicial, sessões online, pacotes mensais, relatórios."
                  className="mt-1 min-h-[64px] bg-white/80"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-600">Como funcionam preços, planos ou pagamentos?</label>
                  <button
                    type="button"
                    onClick={() => onFactChange("pricing", PRICE_ON_REQUEST_TEXT)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Preço sob consulta
                  </button>
                </div>
                <p className="text-[11px] leading-4 text-slate-400">Saiba mais: a IA usa para responder "quanto custa?". Pode ser "sob consulta" se preferir não fixar valores.</p>
                <Textarea
                  value={facts.pricing}
                  onChange={(event) => onFactChange("pricing", event.target.value)}
                  placeholder="Ex.: a avaliação é gratuita; os planos são apresentados depois."
                  className="mt-1 min-h-[64px] bg-white/80"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Quais são os horários ou disponibilidade?</label>
                <p className="text-[11px] leading-4 text-slate-400">Saiba mais: a IA responde "que horas funciona?" a partir daqui.</p>
                <Textarea
                  value={facts.hours}
                  onChange={(event) => onFactChange("hours", event.target.value)}
                  placeholder="Ex.: segunda a sexta, das 8h às 19h."
                  className="mt-1 min-h-[56px] bg-white/80"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Quais dúvidas os clientes mais fazem?</label>
                <p className="text-[11px] leading-4 text-slate-400">
                  Saiba mais: <strong>é AQUI</strong> que você coloca uma pergunta importante + a resposta certa. Se houver
                  algo que a IA precisa responder de um jeito específico durante a conversa, escreva como pergunta e resposta.
                </p>
                <Textarea
                  value={facts.faq}
                  onChange={(event) => onFactChange("faq", event.target.value)}
                  placeholder="Ex.: atende a partir de que idade? é online? como começa?"
                  className="mt-1 min-h-[64px] bg-white/80"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(37,99,255,0.06),rgba(124,58,237,0.05))] px-4 py-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-slate-700">{preview}</p>
        </div>
      </div>
    </Card>
  );
}
