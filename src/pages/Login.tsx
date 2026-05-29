import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Bot, CheckCircle2, Lock, Mail, MessageCircle, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/App";
import { getApiErrorMessage } from "@/lib/api/client";
import { consumeAuthNotice, setAuthSession } from "@/lib/auth";
import { login } from "@/services/auth";

const logoSrc = "/1780012194868.png";

const platformHighlights = [
  { icon: MessageCircle, label: "Conversas", value: "WhatsApp em tempo real" },
  { icon: Bot, label: "Nexo IA", value: "Atendimento contextual" },
  { icon: Network, label: "Automação", value: "Fluxos e jornadas" },
];

const trustPoints = [
  "IA conversacional para atendimento e vendas",
  "Operação humana e automações no mesmo painel",
  "Fluxos, mídia, métricas e contexto por empresa",
];

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
    <div className="relative min-h-screen overflow-hidden bg-[#07152F] text-white">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute right-[-8rem] top-[-5rem] h-[30rem] w-[30rem] rounded-full bg-blue-500/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute inset-0 nexo-grid-surface opacity-[0.09]" />

      <main className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-screen flex-col justify-between px-10 py-10 lg:flex xl:px-16">
          <div className="flex items-center justify-between">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/95 p-3 shadow-[0_24px_80px_-42px_rgba(0,210,255,0.85)]">
              <img src={logoSrc} alt="Nexo IA - Inteligência que conecta" className="h-20 w-72 rounded-2xl object-contain" />
            </div>
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
              SaaS conversacional
            </div>
          </div>

          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm font-semibold text-cyan-50 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
              Inteligência que conecta
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] text-balance xl:text-6xl">
                Plataforma premium de IA para atendimento no WhatsApp.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-blue-50/80">
                Centralize conversas, automações e inteligência contextual em uma operação clara, rápida e preparada para empresas.
              </p>
            </div>

            <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
              {platformHighlights.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-3xl border border-white/12 bg-white/[0.08] p-4 shadow-[0_20px_60px_-38px_rgba(0,210,255,0.7)] backdrop-blur-xl transition-smooth hover:-translate-y-1 hover:bg-white/[0.11]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">{label}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid max-w-3xl gap-3 rounded-[2rem] border border-white/12 bg-white/[0.07] p-4 backdrop-blur-xl xl:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-3 text-sm leading-5 text-blue-50/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center p-5 md:p-8 lg:p-10">
          <div className="w-full max-w-[520px] animate-fade-in-up">
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="rounded-[1.4rem] border border-white/15 bg-white/95 p-2 shadow-glow">
                <img src={logoSrc} alt="Nexo IA - Inteligência que conecta" className="h-16 w-64 rounded-2xl object-contain" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/[0.96] p-6 text-foreground shadow-[0_30px_100px_-55px_rgba(0,0,0,0.75)] backdrop-blur-2xl md:p-8">
              <div className="absolute inset-x-0 top-0 h-1 gradient-primary" />
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />

              <div className="relative space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Acesso seguro
                </div>
                <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-[#07152F] md:text-4xl">
                  Acesse sua operação
                </h2>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                  Entre no painel para acompanhar conversas, fluxos e automações do Nexo IA.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="relative mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-[#07152F]">E-mail corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seuemail@empresa.com.br"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password" className="text-sm font-semibold text-[#07152F]">Senha</Label>
                    <button type="button" className="text-xs font-semibold text-primary transition-colors hover:text-cyan-600">
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl text-[15px]">
                  {loading ? "Entrando no painel..." : "Entrar no painel"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs leading-5 text-muted-foreground">
                  Ao continuar, você concorda com os{" "}
                  <Link to="/termos" className="font-semibold text-[#07152F] transition-colors hover:text-primary">
                    Termos
                  </Link>{" "}
                  e a{" "}
                  <Link to="/politica-de-privacidade" className="font-semibold text-[#07152F] transition-colors hover:text-primary">
                    Política de privacidade
                  </Link>
                  .
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Ainda não tem conta?{" "}
                  <Link to="/cadastro" className="font-bold text-[#07152F] transition-colors hover:text-primary">
                    Criar acesso
                  </Link>
                </p>
              </form>
            </div>

            <p className="mt-5 text-center text-xs font-medium text-blue-50/60">
              Nexo IA · Inteligência que conecta atendimento, dados e automação.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
