import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Mail, Lock, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate("/dashboard"), 600);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden p-12 flex-col justify-between text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, hsl(217 91% 65% / 0.5), transparent 50%), radial-gradient(circle at 80% 70%, hsl(160 84% 45% / 0.4), transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Bot className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Nexo</div>
              <div className="text-[11px] uppercase tracking-widest text-primary-foreground/70">Bot Manager</div>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold tracking-tight leading-tight mb-3">
              O cérebro do seu atendimento no WhatsApp.
            </h2>
            <p className="text-primary-foreground/70 text-lg max-w-md">
              Gerencie conversas, fluxos e automações em um único painel inteligente.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Sparkles, text: "Automações com IA contextual" },
              { icon: Zap, text: "Sequências de mensagens e áudios" },
              { icon: Shield, text: "Segurança corporativa e LGPD" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
                  <f.icon className="h-4 w-4" />
                </div>
                <span className="text-primary-foreground/90">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-primary-foreground/50">
          © 2025 Nexo · Plataforma de atendimento inteligente
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Bot className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">Nexo</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta 👋</h1>
            <p className="text-muted-foreground mt-2">Entre na sua conta para gerenciar o robô.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="voce@nexo.com.br" defaultValue="admin@nexo.com.br" className="pl-10 h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button type="button" className="text-xs text-primary hover:underline">Esqueci minha senha</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" defaultValue="demo1234" className="pl-10 h-11" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 gradient-primary text-primary-foreground font-medium shadow-md hover:shadow-glow transition-smooth gap-2">
              {loading ? "Entrando..." : "Entrar no painel"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com os <a className="text-foreground hover:underline">Termos</a> e <a className="text-foreground hover:underline">Política de privacidade</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}