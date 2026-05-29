import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/nexo/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/App";
import { getApiErrorMessage } from "@/lib/api/client";
import { consumeAuthNotice, setAuthSession } from "@/lib/auth";
import { login } from "@/services/auth";

const highlights = [
  "Atendimento inteligente",
  "Automações avançadas",
  "Memória contextual",
];

const particles = [
  { top: "9%", left: "11%", size: "h-2 w-2", color: "bg-cyan-300/80" },
  { top: "18%", left: "42%", size: "h-1.5 w-1.5", color: "bg-white/70" },
  { top: "23%", right: "18%", size: "h-2.5 w-2.5", color: "bg-fuchsia-300/75" },
  { top: "38%", left: "8%", size: "h-1.5 w-1.5", color: "bg-violet-300/70" },
  { top: "44%", right: "36%", size: "h-2 w-2", color: "bg-cyan-200/75" },
  { top: "62%", left: "47%", size: "h-2 w-2", color: "bg-fuchsia-300/75" },
  { top: "71%", left: "14%", size: "h-1.5 w-1.5", color: "bg-white/60" },
  { top: "79%", right: "20%", size: "h-2.5 w-2.5", color: "bg-violet-300/75" },
  { top: "86%", left: "38%", size: "h-1.5 w-1.5", color: "bg-cyan-300/75" },
];

function CircuitBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(13,91,255,0.26),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(255,79,216,0.18),transparent_26%),radial-gradient(circle_at_52%_72%,rgba(122,60,255,0.22),transparent_30%),linear-gradient(135deg,#050A2B_0%,#081238_33%,#0C1C4A_58%,#130B34_78%,#20092D_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:88px_88px]" />
      <div className="absolute -left-20 top-20 h-[26rem] w-[26rem] rounded-full bg-[#0D5BFF]/24 blur-3xl" />
      <div className="absolute right-[-10rem] top-[-5rem] h-[28rem] w-[28rem] rounded-full bg-[#FF4FD8]/18 blur-3xl" />
      <div className="absolute bottom-[-10rem] left-[28%] h-[24rem] w-[24rem] rounded-full bg-[#7A3CFF]/22 blur-3xl" />
      <div className="absolute bottom-[8%] right-[8%] h-[14rem] w-[14rem] rounded-full bg-cyan-400/10 blur-3xl" />

      <svg className="absolute left-[3%] top-[10%] h-[36rem] w-[36rem] opacity-[0.24]" viewBox="0 0 560 560" fill="none">
        <path d="M86 322L162 208L250 264L354 138L456 222M162 208L238 112L354 138M250 264L324 372L456 222M86 322L184 430L324 372L438 462" stroke="url(#nexo-line-a)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M182 430L182 352L228 306M324 372L324 316L374 270M456 222L456 156" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4" strokeLinecap="round" />
        {[86, 162, 250, 354, 456, 238, 324, 184, 438].map((cx, index) => {
          const cy = [322, 208, 264, 138, 222, 112, 372, 430, 462][index];
          const radius = [6, 5, 7, 5, 6, 4.5, 5.5, 5, 4.5][index];
          return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} fill="url(#nexo-dot-a)" />;
        })}
        <defs>
          <linearGradient id="nexo-line-a" x1="84" y1="112" x2="456" y2="462" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8DD8FF" />
            <stop offset="0.37" stopColor="#0D5BFF" />
            <stop offset="0.72" stopColor="#7A3CFF" />
            <stop offset="1" stopColor="#FF4FD8" />
          </linearGradient>
          <radialGradient id="nexo-dot-a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(280 280) rotate(90) scale(220)">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.4" stopColor="#C7B8FF" />
            <stop offset="1" stopColor="#FF4FD8" />
          </radialGradient>
        </defs>
      </svg>

      <svg className="absolute bottom-[8%] right-[6%] h-[24rem] w-[24rem] opacity-[0.18]" viewBox="0 0 360 360" fill="none">
        <path d="M48 220L122 132L184 176L256 84L314 164M122 132L170 64M184 176L248 270L314 164M48 220L116 300L248 270" stroke="url(#nexo-line-b)" strokeWidth="1.7" strokeLinecap="round" />
        {[48, 122, 184, 256, 314, 170, 248, 116].map((cx, index) => {
          const cy = [220, 132, 176, 84, 164, 64, 270, 300][index];
          return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill="url(#nexo-dot-b)" />;
        })}
        <defs>
          <linearGradient id="nexo-line-b" x1="48" y1="64" x2="314" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0D5BFF" />
            <stop offset="0.58" stopColor="#7A3CFF" />
            <stop offset="1" stopColor="#FF4FD8" />
          </linearGradient>
          <radialGradient id="nexo-dot-b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 180) rotate(90) scale(144)">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#A67AFF" />
          </radialGradient>
        </defs>
      </svg>

      {particles.map((particle, index) => (
        <span
          key={`${particle.top}-${particle.left ?? particle.right}-${index}`}
          className={`absolute rounded-full shadow-[0_0_18px_rgba(255,255,255,0.35)] ${particle.size} ${particle.color}`}
          style={{
            top: particle.top,
            left: particle.left,
            right: particle.right,
          }}
        />
      ))}
    </div>
  );
}

function BrandSignature() {
  return (
    <div className="relative flex max-w-[34rem] flex-col gap-6 sm:flex-row sm:items-center sm:gap-7">
      <div className="relative flex h-[8.5rem] w-[8.5rem] shrink-0 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(13,91,255,0.22),transparent_62%)] blur-3xl" />
        <div className="absolute inset-[14%] rounded-full border border-white/12 bg-white/[0.03] backdrop-blur" />
        <svg className="absolute -inset-8 opacity-[0.72]" viewBox="0 0 180 180" fill="none">
          <path d="M26 108L58 66L92 86L124 46L154 76" stroke="url(#hero-line-a)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M58 66L58 124L88 150M92 86L116 118L146 108" stroke="rgba(255,255,255,0.24)" strokeWidth="1.2" strokeLinecap="round" />
          {[26, 58, 92, 124, 154, 88, 146].map((cx, index) => {
            const cy = [108, 66, 86, 46, 76, 150, 108][index];
            const radius = [4.5, 4.5, 5, 4.5, 4.5, 4, 4][index];
            return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} fill="url(#hero-dot-a)" />;
          })}
          <defs>
            <linearGradient id="hero-line-a" x1="26" y1="46" x2="154" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0D5BFF" />
              <stop offset="0.52" stopColor="#7A3CFF" />
              <stop offset="1" stopColor="#FF4FD8" />
            </linearGradient>
            <radialGradient id="hero-dot-a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(90 90) rotate(90) scale(72)">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#FF4FD8" />
            </radialGradient>
          </defs>
        </svg>
        <BrandMark className="relative h-[5.4rem] w-[5.4rem] rounded-[1.9rem] shadow-[0_26px_70px_-28px_rgba(255,79,216,0.7)]" letterClassName="text-[2.3rem]" />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3 text-[clamp(2.7rem,7vw,4.4rem)] font-light leading-none tracking-[-0.08em] text-white">
          <span className="font-display">Ne</span>
          <span className="bg-[linear-gradient(135deg,#FFFFFF_0%,#FF4FD8_100%)] bg-clip-text font-display text-transparent">x</span>
          <span className="font-display">o</span>
          <span className="hidden h-10 w-px self-center bg-gradient-to-b from-white/0 via-white/35 to-white/0 sm:block" />
          <span className="bg-[linear-gradient(135deg,#D7C8FF_0%,#7A3CFF_46%,#FF4FD8_100%)] bg-clip-text font-display text-transparent">IA</span>
        </div>
        <p className="pl-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-violet-200/72">
          Inteligência que conecta
        </p>
      </div>
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
      queryClient.clear();
      setAuthSession(response.data.token, response.data.user, response.data.expiresAt);
      navigate((location.state as { from?: string } | null)?.from ?? "/dashboard");
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, "Nao foi possivel entrar com essas credenciais."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050A2B] text-white">
      <CircuitBackdrop />

      <main className="relative mx-auto grid min-h-screen w-full max-w-[1540px] items-center gap-12 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)] lg:px-12 xl:px-16">
        <section className="flex flex-col justify-center space-y-9 lg:pr-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/82 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
            Plataforma Nexo IA
          </div>

          <BrandSignature />

          <div className="max-w-2xl space-y-5">
            <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-6xl xl:text-7xl">
              Inteligência artificial para empresas que querem atender melhor.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-white/68 md:text-xl">
              Conversas, contexto, automações e memória em uma única plataforma.
            </p>
          </div>

          <div className="grid max-w-xl gap-4 pt-2">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-medium text-white/82 md:text-base">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-white/[0.08] backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-[31rem]">
            <div className="absolute inset-x-12 top-4 h-24 rounded-full bg-[radial-gradient(circle,rgba(13,91,255,0.24),transparent_70%)] blur-3xl" />
            <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-[#FF4FD8]/16 blur-3xl" />
            <div className="absolute -left-12 bottom-6 h-36 w-36 rounded-full bg-[#7A3CFF]/14 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.08] p-6 shadow-[0_44px_120px_-56px_rgba(0,0,0,0.92)] backdrop-blur-[22px] md:p-8">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05)_24%,rgba(255,255,255,0.03)_100%)]" />
              <div className="absolute inset-[1px] rounded-[1.95rem] border border-white/8" />
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/65 to-transparent" />

              <div className="relative">
                <div className="mb-8 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/84">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Acesso seguro
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-white md:text-[2.6rem]">
                      Entrar no painel
                    </h2>
                    <p className="max-w-sm text-sm leading-6 text-white/62">
                      Entre para operar atendimento, fluxos e inteligência em tempo real.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-medium text-white/86">
                      E-mail corporativo
                    </Label>
                    <div className="group relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-cyan-300 group-hover:text-white/48" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nome@empresa.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-14 rounded-2xl border-white/10 bg-white/[0.06] pl-12 text-[15px] text-white shadow-none placeholder:text-white/30 hover:border-white/18 hover:bg-white/[0.075] focus-visible:border-[#7A3CFF] focus-visible:ring-[rgba(13,91,255,0.55)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="password" className="text-sm font-medium text-white/86">
                        Senha
                      </Label>
                      <button type="button" className="text-xs font-semibold text-white/52 transition-colors hover:text-cyan-200">
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="group relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-cyan-300 group-hover:text-white/48" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-14 rounded-2xl border-white/10 bg-white/[0.06] pl-12 text-[15px] text-white shadow-none placeholder:text-white/30 hover:border-white/18 hover:bg-white/[0.075] focus-visible:border-[#7A3CFF] focus-visible:ring-[rgba(13,91,255,0.55)]"
                      />
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-rose-300/18 bg-rose-400/12 px-4 py-3 text-sm font-medium text-rose-100">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#0D5BFF_0%,#7A3CFF_52%,#FF4FD8_100%)] text-[15px] text-white shadow-[0_26px_72px_-28px_rgba(122,60,255,0.88)] hover:scale-[1.01] hover:shadow-[0_34px_90px_-22px_rgba(255,79,216,0.95)]"
                  >
                    {loading ? "Entrando..." : "Entrar no painel"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-6 text-white/46">
                    Ao continuar, você concorda com os{" "}
                    <Link to="/termos" className="font-semibold text-white/78 transition-colors hover:text-cyan-200">
                      Termos
                    </Link>{" "}
                    e a{" "}
                    <Link to="/politica-de-privacidade" className="font-semibold text-white/78 transition-colors hover:text-cyan-200">
                      Política de privacidade
                    </Link>
                    .
                  </div>

                  <p className="text-center text-sm text-white/56">
                    Ainda não tem conta?{" "}
                    <Link to="/cadastro" className="font-semibold text-white transition-colors hover:text-cyan-200">
                      Criar acesso
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
