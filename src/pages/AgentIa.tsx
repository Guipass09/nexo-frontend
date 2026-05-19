import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Bot,
  Building2,
  Clock,
  Handshake,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAiAgentProfile, useUpdateAiAgentProfile } from "@/hooks/use-app-data";
import type { AiAgentVirtualAgent } from "@/types/domain";

const emptyVirtualAgent: AiAgentVirtualAgent = {
  agentName: "",
  roleTitle: "Atendente virtual",
  businessName: "",
  segment: "",
  primaryGoal: "",
  tone: "acolhedor, claro, profissional e natural no WhatsApp",
  businessDescription: "",
  services: "",
  faq: "",
  operatingHours: "",
  pricingPolicy: "",
  schedulingInstructions: "",
  handoffRules: "",
  boundaries: "",
  extraKnowledge: "",
};

type FieldKey = keyof AiAgentVirtualAgent;

function mergeVirtualAgent(value?: Partial<AiAgentVirtualAgent> | null): AiAgentVirtualAgent {
  return {
    ...emptyVirtualAgent,
    ...(value ?? {}),
  };
}

export default function AgentIa() {
  const { toast } = useToast();
  const { data, isLoading, error, isError } = useAiAgentProfile();
  const updateMutation = useUpdateAiAgentProfile();
  const [enabled, setEnabled] = useState(false);
  const [virtualAgent, setVirtualAgent] = useState<AiAgentVirtualAgent>(emptyVirtualAgent);

  useEffect(() => {
    if (!data) {
      return;
    }

    setEnabled(data.enabled);
    setVirtualAgent(mergeVirtualAgent(data.virtualAgent));
  }, [data]);

  const filledFieldsCount = useMemo(() => {
    return Object.values(virtualAgent).filter((value) => value.trim() !== "").length;
  }, [virtualAgent]);

  const contextPreview = useMemo(() => {
    const lines = [
      virtualAgent.agentName && `Nome da pessoa virtual: ${virtualAgent.agentName}`,
      virtualAgent.roleTitle && `Papel: ${virtualAgent.roleTitle}`,
      virtualAgent.businessName && `Empresa/profissional: ${virtualAgent.businessName}`,
      virtualAgent.segment && `Segmento: ${virtualAgent.segment}`,
      virtualAgent.primaryGoal && `Objetivo principal: ${virtualAgent.primaryGoal}`,
      virtualAgent.tone && `Tom: ${virtualAgent.tone}`,
      virtualAgent.businessDescription && `Sobre o negocio:\n${virtualAgent.businessDescription}`,
      virtualAgent.services && `Servicos/produtos:\n${virtualAgent.services}`,
      virtualAgent.operatingHours && `Horario:\n${virtualAgent.operatingHours}`,
      virtualAgent.pricingPolicy && `Valores:\n${virtualAgent.pricingPolicy}`,
      virtualAgent.schedulingInstructions && `Agendamento:\n${virtualAgent.schedulingInstructions}`,
      virtualAgent.faq && `Duvidas frequentes:\n${virtualAgent.faq}`,
      virtualAgent.handoffRules && `Quando chamar humano:\n${virtualAgent.handoffRules}`,
      virtualAgent.boundaries && `Limites:\n${virtualAgent.boundaries}`,
      virtualAgent.extraKnowledge && `Conhecimento extra:\n${virtualAgent.extraKnowledge}`,
    ].filter(Boolean);

    return lines.join("\n\n");
  }, [virtualAgent]);

  const updateField = (field: FieldKey, value: string) => {
    setVirtualAgent((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      enabled,
      prompts: [],
      virtualAgent,
    }, {
      onSuccess: () => {
        toast({
          title: "Agent IA atualizado",
          description: enabled
            ? "A pessoa virtual esta ligada e vai responder usando contexto, memoria e historico."
            : "A pessoa virtual foi salva e esta desligada no momento.",
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_55%,_#ecfdf5_100%)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Pessoa virtual do atendimento
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Agent IA que entende contexto, memoria e conversa.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Preencha fatos sobre o negocio. O Nexo ja entra com a personalidade humana, e a OpenAI decide a melhor resposta sem depender de frases prontas.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm min-w-[260px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Atendimento automatico</p>
                <p className="text-xs text-slate-500">Prioridade sobre fluxos</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <Badge variant={enabled ? "default" : "secondary"} className="w-fit">
              {enabled ? "Ligado" : "Desligado"}
            </Badge>
            <Button className="gap-2" onClick={handleSave} disabled={updateMutation.isPending || isLoading}>
              <Save className="h-4 w-4" />
              Salvar Agent IA
            </Button>
          </div>
        </div>
      </section>

      {isError && (
        <Card className="border-destructive/40 p-4 text-sm text-destructive">
          Erro ao carregar Agent IA: {getApiErrorMessage(error)}
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <div className="space-y-6">
          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={UserRound}
              title="Identidade da pessoa virtual"
              description="Defina quem ela representa. Isso nao vira texto fixo, vira contexto para a IA agir com naturalidade."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nome da pessoa virtual">
                <Input
                  value={virtualAgent.agentName}
                  onChange={(event) => updateField("agentName", event.target.value)}
                  placeholder="Ex.: Sofia, Nexo IA, Atendimento Sementes"
                />
              </Field>
              <Field label="Papel no atendimento">
                <Input
                  value={virtualAgent.roleTitle}
                  onChange={(event) => updateField("roleTitle", event.target.value)}
                  placeholder="Ex.: Atendente virtual, consultora inicial"
                />
              </Field>
              <Field label="Nome da empresa ou profissional">
                <Input
                  value={virtualAgent.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  placeholder="Ex.: Sementes da Fala"
                />
              </Field>
              <Field label="Segmento">
                <Input
                  value={virtualAgent.segment}
                  onChange={(event) => updateField("segment", event.target.value)}
                  placeholder="Ex.: Fonoaudiologia online infantil"
                />
              </Field>
              <Field label="Objetivo principal" className="md:col-span-2">
                <Input
                  value={virtualAgent.primaryGoal}
                  onChange={(event) => updateField("primaryGoal", event.target.value)}
                  placeholder="Ex.: Acolher familias, tirar duvidas e conduzir para agendamento da avaliacao gratuita."
                />
              </Field>
              <Field label="Tom de voz" className="md:col-span-2">
                <Input
                  value={virtualAgent.tone}
                  onChange={(event) => updateField("tone", event.target.value)}
                  placeholder="Ex.: acolhedor, simples, profissional, leve e seguro"
                />
              </Field>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Building2}
              title="Negocio e conhecimento"
              description="Coloque fatos objetivos. A IA interpreta a pergunta do cliente e escolhe o que usar."
            />
            <div className="mt-5 space-y-4">
              <Field label="Resumo do negocio">
                <Textarea
                  rows={5}
                  value={virtualAgent.businessDescription}
                  onChange={(event) => updateField("businessDescription", event.target.value)}
                  placeholder="O que a empresa faz, para quem atende, como funciona o atendimento e quais pontos nao podem ser esquecidos."
                />
              </Field>
              <Field label="Servicos, produtos ou etapas do atendimento">
                <Textarea
                  rows={6}
                  value={virtualAgent.services}
                  onChange={(event) => updateField("services", event.target.value)}
                  placeholder="Liste servicos, processo, criterios, etapas, diferenciais e o que a IA pode explicar quando perguntarem."
                />
              </Field>
              <Field label="Perguntas frequentes e respostas importantes">
                <Textarea
                  rows={7}
                  value={virtualAgent.faq}
                  onChange={(event) => updateField("faq", event.target.value)}
                  placeholder="Ex.: Se perguntar valores, explique que sao orientados na avaliacao. Se perguntar idade minima, informar a regra correta."
                />
              </Field>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Clock}
              title="Operacao e condução"
              description="Essas regras ajudam a IA a tomar decisoes praticas sem virar menu fechado."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Horario de atendimento">
                <Textarea
                  rows={4}
                  value={virtualAgent.operatingHours}
                  onChange={(event) => updateField("operatingHours", event.target.value)}
                  placeholder="Dias, horarios, excecoes e como responder fora do horario."
                />
              </Field>
              <Field label="Politica de valores">
                <Textarea
                  rows={4}
                  value={virtualAgent.pricingPolicy}
                  onChange={(event) => updateField("pricingPolicy", event.target.value)}
                  placeholder="O que pode ou nao falar sobre preco, planos, consulta gratuita, orcamento etc."
                />
              </Field>
              <Field label="Como conduzir agendamento" className="md:col-span-2">
                <Textarea
                  rows={5}
                  value={virtualAgent.schedulingInstructions}
                  onChange={(event) => updateField("schedulingInstructions", event.target.value)}
                  placeholder="Quais dados coletar, ordem ideal, como confirmar interesse e quando encaminhar para humano."
                />
              </Field>
              <Field label="Quando chamar humano">
                <Textarea
                  rows={4}
                  value={virtualAgent.handoffRules}
                  onChange={(event) => updateField("handoffRules", event.target.value)}
                  placeholder="Casos sensiveis, reclamacoes, pedidos especificos, duvidas que precisam de especialista."
                />
              </Field>
              <Field label="Limites e proibicoes">
                <Textarea
                  rows={4}
                  value={virtualAgent.boundaries}
                  onChange={(event) => updateField("boundaries", event.target.value)}
                  placeholder="O que a IA nao pode prometer, diagnosticar, inventar, garantir ou responder."
                />
              </Field>
              <Field label="Conhecimento extra" className="md:col-span-2">
                <Textarea
                  rows={6}
                  value={virtualAgent.extraKnowledge}
                  onChange={(event) => updateField("extraKnowledge", event.target.value)}
                  placeholder="Informacoes extras da plataforma, links, observacoes comerciais, exemplos de linguagem e excecoes."
                />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Wand2}
              title="Como a IA vai pensar"
              description="A OpenAI recebe personalidade global, memoria, historico e esta ficha para criar uma resposta nova a cada mensagem."
            />
            <div className="mt-5 space-y-3 text-sm">
              <InfoBlock title="Sem resposta pronta">
                O texto salvo aqui e conhecimento. A IA deve formular a frase conforme a pergunta, a etapa e o historico.
              </InfoBlock>
              <InfoBlock title="Memoria antes de repeticao">
                Ela usa o que ja foi dito para nao reiniciar, nao repetir abertura e nao perguntar o que o cliente ja respondeu.
              </InfoBlock>
              <InfoBlock title="Fluxos em segundo plano">
                Quando ligado, o Agent IA responde primeiro. Quando desligado, seus fluxos voltam a assumir normalmente.
              </InfoBlock>
            </div>
          </Card>

          <Card className="border-border/60 p-5 md:p-6">
            <SectionHeader
              icon={Handshake}
              title="Qualidade do contexto"
              description={`${filledFieldsCount} campos preenchidos`}
            />
            <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4">
              <pre className="max-h-[520px] whitespace-pre-wrap break-words text-xs leading-6 text-foreground/90">
                {contextPreview || "Preencha a ficha da pessoa virtual para formar o contexto do atendimento."}
              </pre>
            </div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/70 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-950">Base humana do Nexo</h2>
                <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                  Mesmo com pouco contexto, o Nexo ja orienta a IA a acolher, responder a pergunta, manter continuidade e conduzir sem parecer robo.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
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

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <Label>{label}</Label>
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
