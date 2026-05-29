import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Bot, CheckCircle2, Lock, Mail, MessageCircle, Network, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/App";
import { getApiErrorMessage } from "@/lib/api/client";
import { consumeAuthNotice, setAuthSession } from "@/lib/auth";
import { login } from "@/services/auth";

const logoSrc = "/Nexo%20IA%20Logo%20v2.png";

const trustPoints = [
  "Atendimento inteligente",
  "Conversas em tempo real",
  "Fluxos automatizados",
  "Memória contextual",
];

const signalCards = [
  { icon: MessageCircle, label: "WhatsApp", detail: "centralizado" },
  { icon: Bot, label: "Agent IA", detail: "contextual" },
  { icon: Network, label: "Fluxos", detail: "automatizados" },
];

function NeuralBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute left-[5%] top-[9%] h-[36rem] w-[36rem] opacity-[0.18]" viewBox="0 0 520 520" fill="none">
        <path d="M82 294L145 188L236 252L318 151L421 222M145 188L219 86L318 151M236 252L304 351L421 222M82 294L171 407L304 351L426 429" stroke="url(#networkGradient)" strokeWidth="2" />
        {[82, 145, 236, 318, 421, 219, 304, 171, 426].map((cx, index) => {
          const cy = [294, 188, 252, 151, 222, 86, 351, 407, 429][index];
          const r = [7, 5, 8, 6, 7, 5, 6, 7, 5][index];
          return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="url(#dotGradient)" />;
        })}
        <defs>
          <linearGradient id="networkGradient" x1="74" y1="86" x2="430" y2="429" gradientUnits="userSpaceOnUse">
            <stop stopColor="#16D7FF" />
            <stop offset="0.55" stopColor="#2878FF" />
            <stop offset="1" stopColor="#0A2A6C" />
          </linearGradient>
          <radialGradient id="dotGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(260 260) rotate(90) scale(185)">
            <stop stopColor="#67E8F9" />
            <stop offset="1" stopColor="#1D4ED8" />
          </radialGradient>
        </defs>
      </svg>
      <svg className="absolute bottom-[6%] right-[7%] h-[24rem] w-[24rem] opacity-[0.12]" viewBox="0 0 360 360" fill="none">
        <path d="M54 218L118 124L190 182L263 82L310 176M118 124L178 42M190 182L254 278L310 176M54 218L133 308L254 278" stroke="#49D9FF" strokeWidth="1.6" />
        {[54, 118, 190, 263, 310, 178, 254, 133].map((cx, index) => {
          const cy = [218, 124, 182, 82, 176, 42, 278, 308][index];
          return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill="#49D9FF" />;
        })}
      </svg>
    </div>
  );
}

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
    <div className="relative min-h-screen overflow-hidden bg-[#041027] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(22,215,255,0.26),transparent_28%),radial-gradient(circle_at_78%_22%,rgba(37,99,235,0.34),transparent_31%),linear-gradient(135deg,#041027_0%,#071C48_48%,#0A2A6C_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-300/10 to-transparent" />
      <div className="absolute -left-32 top-10 h-[34rem] w-[34rem] rounded-full bg-cyan-400/16 blur-3xl" />
      <div className="absolute right-[-12rem] top-[-8rem] h-[40rem] w-[40rem] rounded-full bg-blue-600/28 blur-3xl" />
      <div className="absolute bottom-[-12rem] left-1/2 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="absolute inset-0 nexo-grid-surface opacity-[0.055]" />
      <NeuralBackdrop />

      <main className="relative mx-auto grid min-h-screen w-full max-w-[1480px] items-center gap-10 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_500px] lg:px-12 xl:px-16">
        <section className="animate-fade-in-up space-y-10">
          <div className="relative inline-flex">
            <div className="absolute -inset-8 rounded-full bg-cyan-300/20 blur-3xl" />
            <img src={logoSrc} alt="Nexo IA - Inteligência que conecta" className="relative h-auto w-[300px] max-w-[72vw] object-contain drop-shadow-[0_24px_50px_rgba(34,211,238,0.22)] md:w-[390px]" />
          </div>

          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100 shadow-[0_18px_60px_-40px_rgba(34,211,238,0.8)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
              IA Conversacional
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-white text-balance md:text-6xl xl:text-7xl">
                Inteligência artificial para empresas que querem atender melhor.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-blue-50/76 md:text-xl">
                Automações, contexto, memória e IA conversacional em um único lugar.
              </p>
            </div>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-semibold text-blue-50/88 backdrop-blur-xl">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-200" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden max-w-3xl gap-3 lg:grid lg:grid-cols-3">
            {signalCards.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="group rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition-smooth hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.09]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100 shadow-[0_20px_48px_-30px_rgba(34,211,238,0.9)] transition-smooth group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/64">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[500px] animate-fade-in-up [animation-delay:90ms]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/18 bg-white/[0.84] p-6 text-foreground shadow-[0_42px_130px_-56px_rgba(0,0,0,0.9)] backdrop-blur-2xl md:p-8">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/24 blur-3xl" />
              <div className="absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-blue-500/12 blur-3xl" />

              <div className="relative">
                <div className="mb-7 flex items-start justify-between gap-5">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#0A2A6C]/10 bg-[#0A2A6C]/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#0A2A6C]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Acesso seguro
                    </div>
                    <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-[#07152F] md:text-4xl">
                      Entrar no painel
                    </h2>
                    <p className="max-w-sm text-sm leading-6 text-slate-600">
                      Entre para operar atendimento, fluxos e inteligência em tempo real.
                    </p>
                  </div>
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#07152F] via-[#0A2A6C] to-cyan-400 text-white shadow-glow sm:flex">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-[#07152F]">
                      E-mail corporativo
                    </Label>
                    <div className="group relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seuemail@empresa.com.br"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-13 rounded-2xl border-slate-200/90 bg-white/78 pl-12 shadow-[0_14px_28px_-24px_rgba(5,10,43,0.55)] transition-smooth hover:border-cyan-200 focus-visible:border-cyan-300 focus-visible:ring-cyan-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="password" className="text-sm font-semibold text-[#07152F]">
                        Senha
                      </Label>
                      <button type="button" className="text-xs font-bold text-[#0A2A6C] transition-colors hover:text-cyan-600">
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="group relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-13 rounded-2xl border-slate-200/90 bg-white/78 pl-12 shadow-[0_14px_28px_-24px_rgba(5,10,43,0.55)] transition-smooth hover:border-cyan-200 focus-visible:border-cyan-300 focus-visible:ring-cyan-300"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="h-13 w-full rounded-2xl bg-[linear-gradient(135deg,#050A2B_0%,#0D5BFF_45%,#7A3CFF_75%,#FF4FD8_100%)] text-[15px] shadow-[0_22px_56px_-24px_rgba(122,60,255,0.78)] hover:scale-[1.01] hover:shadow-[0_28px_70px_-22px_rgba(255,79,216,0.92)]">
                    {loading ? "Entrando..." : "Entrar no painel"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/55 p-4 text-xs leading-5 text-slate-500">
                    Ao continuar, você concorda com os{" "}
                    <Link to="/termos" className="font-bold text-[#07152F] transition-colors hover:text-cyan-600">
                      Termos
                    </Link>{" "}
                    e a{" "}
                    <Link to="/politica-de-privacidade" className="font-bold text-[#07152F] transition-colors hover:text-cyan-600">
                      Política de privacidade
                    </Link>
                    .
                  </div>

                  <p className="text-center text-sm text-slate-500">
                    Ainda não tem conta?{" "}
                    <Link to="/cadastro" className="font-bold text-[#07152F] transition-colors hover:text-cyan-600">
                      Criar acesso
                    </Link>
                  </p>
                </form>
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-semibold text-blue-50/52">
              Nexo IA · Inteligência que conecta
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
