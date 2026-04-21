import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Bot, Clock, MessageSquare, Bell, Webhook, Key, Palette } from "lucide-react";

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

const Toggle = ({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <Switch defaultChecked={defaultChecked} />
  </div>
);

export default function Configuracoes() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Section icon={Building2} title="Dados da empresa" desc="Identificação do sistema e da empresa">
        <Field label="Nome da empresa"><Input defaultValue="Nexo Tecnologia Ltda." /></Field>
        <Field label="Nome do sistema"><Input defaultValue="Nexo Bot Manager" /></Field>
        <Field label="WhatsApp principal"><Input defaultValue="+55 11 99000-0000" /></Field>
      </Section>

      <Section icon={Bot} title="Comportamento do robô" desc="Estado operacional e regras">
        <Field label="Status atual">
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>Ativo</option><option>Pausado</option><option>Manutenção</option>
          </select>
        </Field>
        <Toggle label="Resposta automática 24h" desc="Robô responde fora do horário comercial" defaultChecked />
        <Toggle label="Transferência inteligente para humano" desc="Detecta solicitação e transfere automaticamente" defaultChecked />
      </Section>

      <Section icon={Clock} title="Horário de funcionamento" desc="Janela de atendimento humano">
        <Field label="Início"><Input type="time" defaultValue="08:00" /></Field>
        <Field label="Fim"><Input type="time" defaultValue="18:00" /></Field>
        <Field label="Dias">
          <div className="flex gap-1.5 flex-wrap">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
              <button key={d} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-smooth ${i < 5 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{d}</button>
            ))}
          </div>
        </Field>
      </Section>

      <Section icon={MessageSquare} title="Mensagens padrão" desc="Respostas automáticas do sistema">
        <Field label="Saudação"><Textarea rows={2} defaultValue="Olá! Sou o assistente virtual da Nexo. Como posso ajudar?" /></Field>
        <Field label="Fora do horário"><Textarea rows={2} defaultValue="Estamos fora do horário. Retornaremos em breve!" /></Field>
      </Section>

      <Section icon={Bell} title="Notificações" desc="Alertas internos da equipe">
        <Toggle label="Notificar transferência para humano" desc="E-mail + push" defaultChecked />
        <Toggle label="Alerta de erro de fluxo" desc="Falhas em automações" defaultChecked />
        <Toggle label="Resumo diário" desc="Relatório enviado às 18h" />
      </Section>

      <Section icon={Webhook} title="Integrações & Webhooks" desc="Conexões externas">
        <Field label="Webhook URL"><Input placeholder="https://api.suaempresa.com/webhook" /></Field>
        <Field label="API Key"><div className="flex gap-2"><Input type="password" defaultValue="nx_sk_••••••••••••••••" readOnly /><Button variant="outline">Regenerar</Button></div></Field>
      </Section>

      <Section icon={Palette} title="Aparência" desc="Tema visual do painel">
        <Field label="Tema">
          <div className="flex gap-2">
            {["Claro", "Escuro", "Sistema"].map((t, i) => (
              <button key={t} className={`flex-1 h-10 rounded-md border-2 text-sm font-medium transition-smooth ${i === 0 ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
        </Field>
      </Section>

      <div className="flex justify-end gap-2 pb-4">
        <Button variant="outline">Cancelar</Button>
        <Button className="gradient-primary text-primary-foreground">Salvar alterações</Button>
      </div>
    </div>
  );
}