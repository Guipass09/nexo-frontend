import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const effectiveDate = "25 de abril de 2026";

export default function TermosUso() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.35))] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Termos publicos do app
          </div>
        </div>

        <Card className="border-border/60 p-6 md:p-8">
          <div className="space-y-3 border-b border-border/70 pb-6">
            <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground">
              Estes termos regulam o acesso e o uso do Nexo Manager, incluindo recursos de integracao com
              WhatsApp Business e ferramentas de atendimento.
            </p>
            <p className="text-xs text-muted-foreground">Vigencia: {effectiveDate}</p>
          </div>

          <div className="mt-6 space-y-8 text-sm leading-7 text-foreground/90">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">1. Objeto</h2>
              <p>
                O Nexo Manager disponibiliza recursos para conectar contas do WhatsApp Business, operar
                mensagens, gerenciar templates, fluxos e rotinas de atendimento.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">2. Uso autorizado</h2>
              <p>
                O usuario deve utilizar a plataforma de forma legitima, observando as politicas da Meta,
                do WhatsApp Business e a legislacao aplicavel. E proibido utilizar o sistema para spam,
                fraude, conteudo ilegal ou qualquer uso indevido.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">3. Credenciais e acesso</h2>
              <p>
                O usuario e responsavel por manter o sigilo das credenciais de acesso e por todas as
                atividades realizadas em sua conta, inclusive configuracoes e integracoes autorizadas.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">4. Integracoes de terceiros</h2>
              <p>
                Algumas funcionalidades dependem de servicos de terceiros, incluindo a plataforma Meta e o
                WhatsApp Business. A disponibilidade desses servicos pode afetar o funcionamento do sistema.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">5. Responsabilidades do usuario</h2>
              <p>
                O usuario deve garantir que possui autorizacao para tratar os dados e se comunicar com seus
                contatos, bem como cumprir obrigacoes legais, regulatórias e contratuais relacionadas ao
                uso do WhatsApp e da plataforma.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">6. Disponibilidade</h2>
              <p>
                Empregamos esforcos razoaveis para manter a plataforma disponivel, mas nao garantimos
                funcionamento ininterrupto, especialmente quando houver dependencia de servicos externos,
                manutencoes, falhas de rede ou indisponibilidades de terceiros.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">7. Suspensao e encerramento</h2>
              <p>
                O acesso pode ser suspenso ou encerrado em caso de uso indevido, violacao de politicas,
                exigencia legal ou risco tecnico e operacional para a plataforma ou para terceiros.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">8. Privacidade</h2>
              <p>
                O tratamento de dados pessoais relacionados ao uso da plataforma segue a Politica de
                Privacidade publicada e as regras aplicaveis aos servicos integrados.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">9. Alteracoes</h2>
              <p>
                Estes termos podem ser atualizados para refletir mudancas legais, tecnicas ou operacionais.
                A versao publicada nesta pagina sera considerada a versao vigente.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
