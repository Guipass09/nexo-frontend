import { CheckCircle2, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buildExecutiveSummary, type AgentBrainForm } from "@/lib/agent-brain";

export function AgentExecutivePreview({ value }: { value: AgentBrainForm }) {
  const summary = buildExecutiveSummary(value);

  return (
    <Card className="nexo-premium-surface relative overflow-hidden p-5 md:p-6">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(37,99,255,0.18),rgba(124,58,237,0.16))] text-primary shadow-[0_16px_36px_-28px_rgba(37,99,255,0.68)]">
          <Rocket className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-950">{summary.headline}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerado automaticamente a partir das suas respostas. Sem precisar preencher textos longos.
          </p>
        </div>
      </div>

      {summary.lines.length > 0 ? (
        <ul className="relative mt-4 grid gap-2">
          {summary.lines.map((line) => (
            <li key={line} className="flex items-start gap-2.5 rounded-2xl border border-white/55 bg-white/55 px-3.5 py-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-sm leading-6 text-slate-700">{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="relative mt-4 rounded-2xl border border-dashed border-border/70 bg-white/40 px-4 py-3 text-sm text-slate-500">
          Responda as perguntas do “Cérebro do atendimento” acima e veja aqui, em tempo real, como seu atendente vai trabalhar.
        </p>
      )}
    </Card>
  );
}
