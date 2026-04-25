import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const effectiveDate = "25 de abril de 2026";

export default function PoliticaPrivacidade() {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            Politica publica do app
          </div>
        </div>

        <Card className="border-border/60 p-6 md:p-8">
          <div className="space-y-3 border-b border-border/70 pb-6">
            <h1 className="text-3xl font-bold tracking-tight">Politica de Privacidade</h1>
            <p className="text-sm text-muted-foreground">
              Esta politica descreve como o Nexo Manager coleta, usa, armazena e protege dados pessoais
              relacionados ao uso da plataforma e da integracao com o WhatsApp Business.
            </p>
            <p className="text-sm text-muted-foreground">
              O Nexo Manager e um produto operado por Sementes da Fala.
            </p>
            <p className="text-xs text-muted-foreground">Vigencia: {effectiveDate}</p>
          </div>

          <div className="mt-6 space-y-8 text-sm leading-7 text-foreground/90">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">1. Quem somos</h2>
              <p>
                O Nexo Manager e uma plataforma web operada por Sementes da Fala, usada para conectar
                contas do WhatsApp Business, gerenciar mensagens, templates, fluxos e configuracoes
                operacionais de atendimento.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">2. Dados que podemos tratar</h2>
              <p>Dependendo da funcionalidade utilizada, podemos tratar:</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>dados de identificacao da conta e do usuario da plataforma;</li>
                <li>dados da conta WhatsApp Business, como WABA ID e phone number ID;</li>
                <li>conteudo de mensagens, templates, historico de conversas e eventos de webhook;</li>
                <li>dados tecnicos de acesso, registros de integracao, erros e logs operacionais;</li>
                <li>tokens e credenciais tecnicas necessarias para manter a integracao autorizada.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">3. Como usamos os dados</h2>
              <p>Os dados tratados sao usados para:</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>autenticar usuarios e proteger o acesso ao sistema;</li>
                <li>conectar e manter a integracao com o WhatsApp Business e a Meta;</li>
                <li>permitir envio, recebimento e organizacao de mensagens e templates;</li>
                <li>operar fluxos, automacoes, atendimento e acompanhamento das conversas;</li>
                <li>monitorar estabilidade, seguranca, auditoria e prevencao de uso indevido.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">4. Base de tratamento e autorizacao</h2>
              <p>
                O tratamento ocorre para execucao dos servicos da plataforma, cumprimento de obrigacoes
                operacionais e mediante autorizacao explicita do usuario ou da empresa cliente quando
                houver integracao com o ecossistema da Meta e do WhatsApp Business.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">5. Compartilhamento de dados</h2>
              <p>
                Os dados podem ser compartilhados apenas quando necessario para a operacao da plataforma,
                incluindo provedores de infraestrutura, hospedagem, processamento e os servicos oficiais
                da Meta/WhatsApp utilizados pela integracao. Nao vendemos dados pessoais.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">6. Armazenamento e seguranca</h2>
              <p>
                Adotamos medidas tecnicas e organizacionais razoaveis para proteger os dados contra acesso
                nao autorizado, perda, alteracao ou divulgacao indevida. O acesso e restrito a pessoas e
                sistemas necessarios para a operacao do servico.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">7. Retencao e exclusao</h2>
              <p>
                Mantemos os dados pelo tempo necessario para prestar os servicos, cumprir obrigacoes
                legais, garantir seguranca e preservar historico operacional. Solicitacoes de exclusao
                podem ser avaliadas conforme a natureza dos dados e eventuais obrigacoes legais aplicaveis.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">8. Direitos do titular</h2>
              <p>
                Titulares de dados podem solicitar informacoes sobre tratamento, correcao, atualizacao e,
                quando aplicavel, exclusao de dados, observadas as obrigacoes legais e contratuais da
                plataforma.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">9. Contato</h2>
              <p>
                Para assuntos relacionados a esta politica, integracao, privacidade ou solicitacoes sobre
                dados, entre em contato pelo e-mail informado nas configuracoes publicas do aplicativo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">10. Atualizacoes</h2>
              <p>
                Esta politica pode ser atualizada periodicamente para refletir mudancas legais, tecnicas
                ou operacionais. A versao publicada nesta pagina sera considerada a versao vigente.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
