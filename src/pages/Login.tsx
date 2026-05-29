import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/App";
import { getApiErrorMessage } from "@/lib/api/client";
import { consumeAuthNotice, setAuthSession } from "@/lib/auth";
import { login } from "@/services/auth";
import { BrandMark } from "@/components/nexo/BrandMark";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => consumeAuthNotice());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(email, password);
      console.debug("[auth] login succeeded", {
        email,
        hasToken: Boolean(response.data.token),
        expiresAt: response.data.expiresAt,
        role: response.data.user.role,
      });
      queryClient.clear();
      setAuthSession(response.data.token, response.data.user, response.data.expiresAt);
      navigate((location.state as { from?: string } | null)?.from ?? "/dashboard");
    } catch (error) {
      console.error("[auth] login failed", error);
      setError(getApiErrorMessage(error, "Nao foi possivel entrar com essas credenciais."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden p-12 text-primary-foreground lg:flex lg:w-1/2 lg:flex-col lg:justify-between gradient-hero">
        <div className="absolute inset-0 nexo-grid-surface opacity-20" />
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-6 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <BrandMark className="h-11 w-11" letterClassName="text-lg" />
            <div>
              <div className="font-display text-xl font-bold tracking-tight">Nexo IA</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/70">Inteligência que conecta</div>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="mb-4 max-w-xl font-display text-5xl font-bold leading-tight tracking-tight text-balance">
              Atendimento inteligente com cara de conversa real.
            </h2>
            <p className="max-w-md text-lg text-primary-foreground/70">
              Una IA, automações e operação humana em uma central premium para vender, atender e acompanhar melhor.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Sparkles, text: "Automações com IA contextual" },
              { icon: Zap, text: "Sequências de mensagens e áudios" },
              { icon: Shield, text: "Segurança corporativa e LGPD" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur">
                  <f.icon className="h-4 w-4" />
                </div>
                <span className="text-primary-foreground/90">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-primary-foreground/50">
          © 2025 Nexo IA · Inteligência que conecta
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center bg-gradient-subtle p-6 md:p-12">
        <div className="w-full max-w-md animate-fade-in-up rounded-[1.75rem] border border-border/70 bg-white/85 p-7 shadow-elegant backdrop-blur-xl md:p-9">
          <div className="lg:hidden flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <div>
              <span className="font-display text-xl font-bold tracking-tight">Nexo IA</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inteligência que conecta</p>
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <h1 className="font-display text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-2 text-muted-foreground">Entre para gerenciar conversas, automações e inteligência do atendimento.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seuemail@empresa.com.br" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button type="button" className="text-xs text-primary hover:underline">Esqueci minha senha</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="h-11 w-full gap-2">
              {loading ? "Entrando..." : "Entrar no painel"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com os{" "}
              <Link to="/termos" className="text-foreground hover:underline">
                Termos
              </Link>{" "}
              e{" "}
              <Link to="/politica-de-privacidade" className="text-foreground hover:underline">
                Politica de privacidade
              </Link>
              .
            </p>

            <p className="text-center text-sm text-muted-foreground">
              Ainda nao tem conta?{" "}
              <Link to="/cadastro" className="font-medium text-foreground transition-colors hover:text-primary">
                Criar acesso
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
