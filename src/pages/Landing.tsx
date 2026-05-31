import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  GitBranch,
  HeadphonesIcon,
  Menu,
  MessageSquare,
  Network,
  Smartphone,
  Users,
  Workflow,
  X,
  Zap,
  BarChart3,
  Shield,
} from "lucide-react";
import { BrandMark } from "@/components/nexo/BrandMark";
import { Button } from "@/components/ui/button";

// ─── Circuit Backdrop ─────────────────────────────────────────────────────────
const landingParticles = [
  { top: "7%", left: "8%", size: "h-2 w-2", color: "bg-cyan-300/80" },
  { top: "15%", left: "38%", size: "h-1.5 w-1.5", color: "bg-white/70" },
  { top: "21%", right: "14%", size: "h-2.5 w-2.5", color: "bg-fuchsia-300/75" },
  { top: "34%", left: "6%", size: "h-1.5 w-1.5", color: "bg-violet-300/70" },
  { top: "48%", right: "32%", size: "h-2 w-2", color: "bg-cyan-200/75" },
  { top: "58%", left: "44%", size: "h-2 w-2", color: "bg-fuchsia-300/75" },
  { top: "68%", left: "12%", size: "h-1.5 w-1.5", color: "bg-white/60" },
  { top: "76%", right: "18%", size: "h-2.5 w-2.5", color: "bg-violet-300/75" },
  { top: "88%", left: "35%", size: "h-1.5 w-1.5", color: "bg-cyan-300/75" },
];

function LandingBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(13,91,255,0.28),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(255,79,216,0.22),transparent_24%),radial-gradient(circle_at_58%_76%,rgba(122,60,255,0.24),transparent_30%),radial-gradient(circle_at_74%_52%,rgba(13,91,255,0.12),transparent_20%),linear-gradient(135deg,#050A2B_0%,#081238_29%,#0C1C4A_54%,#130B34_76%,#20092D_100%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:88px_88px]" />
      <div className="absolute left-[10%] top-[8%] h-[28rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(13,91,255,0.18),transparent_62%)] blur-3xl" />
      <div className="absolute right-[-6rem] top-[-3rem] h-[28rem] w-[28rem] rounded-full bg-[#FF4FD8]/18 blur-3xl" />
      <div className="absolute bottom-[-8rem] left-[22%] h-[24rem] w-[24rem] rounded-full bg-[#7A3CFF]/22 blur-3xl" />
      <div className="absolute bottom-[8%] right-[8%] h-[14rem] w-[14rem] rounded-full bg-cyan-400/10 blur-3xl" />
      <svg className="absolute left-[3%] top-[10%] h-[32rem] w-[32rem] opacity-[0.2]" viewBox="0 0 560 560" fill="none">
        <path d="M86 322L162 208L250 264L354 138L456 222M162 208L238 112L354 138M250 264L324 372L456 222M86 322L184 430L324 372L438 462" stroke="url(#lnd-line-a)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M182 430L182 352L228 306M324 372L324 316L374 270M456 222L456 156" stroke="rgba(255,255,255,0.28)" strokeWidth="1.4" strokeLinecap="round" />
        {[86, 162, 250, 354, 456, 238, 324, 184, 438].map((cx, i) => {
          const cy = [322, 208, 264, 138, 222, 112, 372, 430, 462][i];
          const r = [6, 5, 7, 5, 6, 4.5, 5.5, 5, 4.5][i];
          return <circle key={cx} cx={cx} cy={cy} r={r} fill="url(#lnd-dot-a)" />;
        })}
        <defs>
          <linearGradient id="lnd-line-a" x1="84" y1="112" x2="456" y2="462" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8DD8FF" /><stop offset="0.37" stopColor="#0D5BFF" /><stop offset="0.72" stopColor="#7A3CFF" /><stop offset="1" stopColor="#FF4FD8" />
          </linearGradient>
          <radialGradient id="lnd-dot-a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(280 280) rotate(90) scale(220)">
            <stop stopColor="#FFFFFF" /><stop offset="0.4" stopColor="#C7B8FF" /><stop offset="1" stopColor="#FF4FD8" />
          </radialGradient>
        </defs>
      </svg>
      <svg className="absolute bottom-[6%] right-[4%] h-[22rem] w-[22rem] opacity-[0.15]" viewBox="0 0 360 360" fill="none">
        <path d="M48 220L122 132L184 176L256 84L314 164M122 132L170 64M184 176L248 270L314 164M48 220L116 300L248 270" stroke="url(#lnd-line-b)" strokeWidth="1.7" strokeLinecap="round" />
        {[48, 122, 184, 256, 314, 170, 248, 116].map((cx, i) => {
          const cy = [220, 132, 176, 84, 164, 64, 270, 300][i];
          return <circle key={cx} cx={cx} cy={cy} r="4.5" fill="url(#lnd-dot-b)" />;
        })}
        <defs>
          <linearGradient id="lnd-line-b" x1="48" y1="64" x2="314" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0D5BFF" /><stop offset="0.58" stopColor="#7A3CFF" /><stop offset="1" stopColor="#FF4FD8" />
          </linearGradient>
          <radialGradient id="lnd-dot-b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 180) rotate(90) scale(144)">
            <stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#A67AFF" />
          </radialGradient>
        </defs>
      </svg>
      {landingParticles.map((p, i) => (
        <span
          key={i}
          className={`absolute rounded-full shadow-[0_0_16px_rgba(255,255,255,0.32)] ${p.size} ${p.color}`}
          style={{ top: p.top, left: p.left, right: p.right }}
        />
      ))}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[rgba(5,10,43,0.88)] backdrop-blur-[20px]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight text-white">Nexo IA</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/60">
              Inteligência que conecta
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { label: "Como funciona", href: "#como-funciona" },
            { label: "Agent IA", href: "#agent-ia" },
            { label: "Benefícios", href: "#beneficios" },
            { label: "Planos", href: "#planos" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-white/68 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login">
            <Button variant="ghost" className="border border-white/12 bg-white/[0.05] text-white hover:bg-white/10 hover:text-white">
              Entrar no painel
            </Button>
          </Link>
          <Link to="/cadastro">
            <Button className="bg-[linear-gradient(135deg,#0D5BFF_0%,#7A3CFF_52%,#FF4FD8_100%)] text-white shadow-[0_18px_50px_-26px_rgba(122,60,255,0.85)] hover:scale-[1.02] hover:shadow-[0_24px_64px_-22px_rgba(255,79,216,0.9)]">
              Criar conta <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[rgba(5,10,43,0.96)] px-5 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4 mb-6">
            {[
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Agent IA", href: "#agent-ia" },
              { label: "Benefícios", href: "#beneficios" },
              { label: "Planos", href: "#planos" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-white/72 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full border border-white/12 bg-white/[0.05] text-white hover:bg-white/10 hover:text-white">
                Entrar no painel
              </Button>
            </Link>
            <Link to="/cadastro" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-[linear-gradient(135deg,#0D5BFF_0%,#7A3CFF_52%,#FF4FD8_100%)] text-white">
                Criar conta <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-32 text-center md:pb-32 md:pt-40">
      <LandingBackdrop />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/82 shadow-[0_18px_60px_-42px_rgba(34,211,238,0.78)] backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
          Plataforma Nexo IA
        </div>

        <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white md:text-6xl lg:text-7xl xl:text-[5.25rem]">
          Automatize seu WhatsApp
          <br className="hidden sm:block" />
          <span className="bg-[linear-gradient(135deg,#8DD8FF_0%,#0D5BFF_30%,#7A3CFF_65%,#FF4FD8_100%)] bg-clip-text text-transparent">
            {" "}com IA, memória e
            <br className="hidden sm:block" />
            fluxos inteligentes.
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg leading-8 text-white/62 md:text-xl">
          Crie atendentes virtuais treinados com as regras da sua empresa, capazes de responder
          dúvidas, conduzir conversas e organizar atendimentos em tempo real.
        </p>

        <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row sm:justify-center">
          <Link to="/cadastro">
            <Button
              size="lg"
              className="h-14 min-w-[200px] rounded-2xl bg-[linear-gradient(135deg,#0D5BFF_0%,#7A3CFF_52%,#FF4FD8_100%)] text-base text-white shadow-[0_26px_72px_-28px_rgba(122,60,255,0.88)] hover:scale-[1.02] hover:shadow-[0_34px_90px_-22px_rgba(255,79,216,0.95)]"
            >
              Criar conta <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="ghost"
              className="h-14 min-w-[200px] rounded-2xl border border-white/16 bg-white/[0.06] text-base text-white backdrop-blur hover:bg-white/[0.1] hover:text-white"
            >
              Entrar no painel
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-white/52">
          {["Sem cartão de crédito", "Setup em minutos", "Suporte incluído"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              {item}
            </span>
          ))}
        </div>

        {/* Hero mockup */}
        <div className="relative mx-auto mt-8 max-w-4xl">
          <div className="absolute inset-x-16 -top-4 h-24 rounded-full bg-[radial-gradient(circle,rgba(13,91,255,0.32),transparent_68%)] blur-3xl" />
          <div className="overflow-hidden rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] shadow-[0_52px_140px_-48px_rgba(0,0,0,0.9)] backdrop-blur-[16px]">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
            <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF4FD8]/70" />
                <span className="h-3 w-3 rounded-full bg-[#7A3CFF]/70" />
                <span className="h-3 w-3 rounded-full bg-cyan-400/70" />
              </div>
              <div className="mx-auto rounded-lg border border-white/10 bg-white/[0.05] px-4 py-1 text-xs text-white/40">
                app.nexoia.com.br/conversas
              </div>
            </div>
            <HeroAppPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroAppPreview() {
  return (
    <div className="grid h-[22rem] grid-cols-[220px_1fr_240px] divide-x divide-white/8 overflow-hidden md:h-[28rem]">
      {/* Sidebar */}
      <div className="hidden flex-col gap-1 overflow-hidden p-3 md:flex">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/36">Conversas</div>
        {[
          { name: "João Silva", msg: "Oi, preciso de ajuda com...", time: "agora", badge: 3, active: true },
          { name: "Maria Costa", msg: "Meu pedido chegou!", time: "2m", badge: 0, active: false },
          { name: "Pedro Lima", msg: "Qual o horário de...", time: "5m", badge: 1, active: false },
          { name: "Ana Souza", msg: "Obrigada pelo atend...", time: "12m", badge: 0, active: false },
          { name: "Carlos Rocha", msg: "Gostaria de saber so...", time: "1h", badge: 0, active: false },
        ].map((c) => (
          <div
            key={c.name}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl p-2.5 transition-colors ${
              c.active ? "bg-white/[0.12]" : "hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-bold text-white">
              {c.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/86 truncate">{c.name}</span>
                <span className="text-[10px] text-white/36">{c.time}</span>
              </div>
              <span className="block truncate text-[10px] text-white/46">{c.msg}</span>
            </div>
            {c.badge > 0 && (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF4FD8] text-[9px] font-bold text-white">
                {c.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-bold text-white">J</div>
          <div>
            <div className="text-xs font-semibold text-white">João Silva</div>
            <div className="flex items-center gap-1.5 text-[10px] text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
            <Bot className="h-3 w-3" /> Agent IA ativo
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4 text-xs">
          <div className="flex justify-start">
            <div className="max-w-[72%] rounded-2xl rounded-tl-sm bg-white/[0.08] px-3 py-2 text-white/82">
              Olá! Preciso de informações sobre os planos disponíveis
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[72%] rounded-2xl rounded-tr-sm bg-[linear-gradient(135deg,#0D5BFF,#7A3CFF)] px-3 py-2 text-white">
              Olá, João! Tenho 3 opções para você. O Básico por R$ 97/mês, o Médio por R$ 197 com Agent IA, e o Avançado com múltiplos agentes por R$ 397.
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[72%] rounded-2xl rounded-tl-sm bg-white/[0.08] px-3 py-2 text-white/82">
              Qual tem melhor custo-benefício?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[72%] rounded-2xl rounded-tr-sm bg-[linear-gradient(135deg,#0D5BFF,#7A3CFF)] px-3 py-2 text-white">
              Para a maioria dos negócios, o Plano Médio é o mais recomendado! Inclui Agent IA com memória de conversa e IA treinada com o contexto da sua empresa. 🚀
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-white/8 px-3 py-3">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] text-white/28">
            Digite uma mensagem...
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0D5BFF,#FF4FD8)]">
            <ArrowRight className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Context panel */}
      <div className="hidden flex-col gap-4 overflow-hidden p-4 md:flex">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/36">Contexto do contato</div>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-cyan-300/80">
              <Database className="h-3 w-3" /> Memória ativa
            </div>
            <div className="space-y-1.5 text-[10px] text-white/52">
              <p>• Consultou planos em 3 interações</p>
              <p>• Interesse: automação WhatsApp</p>
              <p>• Segmento: varejo</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-violet-300/80">
              <Brain className="h-3 w-3" /> Agent IA
            </div>
            <div className="space-y-1.5 text-[10px] text-white/52">
              <p>Respondendo com base na ficha da empresa</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-green-400">Confiança 98%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const steps = [
  {
    num: "01",
    icon: Smartphone,
    title: "Conecte seu WhatsApp",
    desc: "Escaneie o QR Code ou configure a Cloud API para começar a receber e enviar mensagens pela plataforma.",
    color: "from-cyan-500 to-blue-600",
    glow: "rgba(13,91,255,0.6)",
  },
  {
    num: "02",
    icon: Workflow,
    title: "Crie fluxos por organograma",
    desc: "Monte fluxos de atendimento visuais com nós de decisão, ramificações condicionais e ações automáticas.",
    color: "from-blue-500 to-violet-600",
    glow: "rgba(122,60,255,0.6)",
  },
  {
    num: "03",
    icon: Network,
    title: "Configure a ficha da empresa",
    desc: "Cadastre as regras, produtos, FAQs e identidade da sua empresa. Essa base alimenta a IA.",
    color: "from-violet-500 to-purple-600",
    glow: "rgba(122,60,255,0.5)",
  },
  {
    num: "04",
    icon: Bot,
    title: "Ative o Agent IA",
    desc: "Ligue o agente inteligente que responde com base na ficha, mantém contexto e aprende com as conversas.",
    color: "from-purple-500 to-fuchsia-600",
    glow: "rgba(255,79,216,0.6)",
  },
  {
    num: "05",
    icon: MessageSquare,
    title: "Acompanhe em tempo real",
    desc: "Monitore conversas, veja o que a IA responde, intervenha quando quiser e analise métricas ao vivo.",
    color: "from-fuchsia-500 to-pink-600",
    glow: "rgba(255,79,216,0.7)",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="relative overflow-hidden px-5 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,91,255,0.12),transparent_56%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
            Processo simples
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-5xl">
            Como funciona
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/56">
            Do zero ao atendimento inteligente em poucos passos. Sem precisar de equipe técnica.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((step, i) => (
            <div key={step.num} className="group relative">
              {i < steps.length - 1 && (
                <div className="absolute right-[-0.875rem] top-8 z-10 hidden h-px w-7 bg-gradient-to-r from-white/20 to-white/10 md:block" />
              )}
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 backdrop-blur transition-all duration-300 hover:border-white/18 hover:-translate-y-1 hover:shadow-[0_28px_72px_-36px_rgba(122,60,255,0.45)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-[0_16px_40px_-20px_var(--glow)]`} style={{ "--glow": step.glow } as React.CSSProperties}>
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                <div className="mb-2 font-display text-[11px] font-bold tracking-[0.2em] text-white/30">
                  {step.num}
                </div>
                <h3 className="mb-2 font-display text-sm font-semibold leading-snug text-white">
                  {step.title}
                </h3>
                <p className="text-[12px] leading-5 text-white/50">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Agent IA Features ────────────────────────────────────────────────────────
const agentFeatures = [
  {
    icon: Network,
    title: "Interpreta a ficha da empresa",
    desc: "A IA lê e processa toda a base de conhecimento da sua empresa: produtos, regras, FAQs e muito mais.",
  },
  {
    icon: Brain,
    title: "Responde com o que sabe",
    desc: "Utiliza apenas informações validadas da sua empresa, sem inventar ou dar respostas incorretas.",
  },
  {
    icon: Database,
    title: "Mantém memória da conversa",
    desc: "Lembra do contexto de cada interação, mantendo coerência ao longo de toda a jornada do cliente.",
  },
  {
    icon: Zap,
    title: "Nunca perde o fio da meada",
    desc: "Mesmo com interrupções ou mudanças de assunto, o agente retoma o contexto sem precisar recomeçar.",
  },
  {
    icon: HeadphonesIcon,
    title: "Encaminha com inteligência",
    desc: "Quando não sabe ou identifica urgência, conduz o cliente com segurança até um atendente humano.",
  },
];

function AgentFeatures() {
  return (
    <section id="agent-ia" className="relative overflow-hidden px-5 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(122,60,255,0.14),transparent_52%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/82">
              <Bot className="h-3.5 w-3.5" /> Agent IA
            </div>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-5xl">
              IA que entende seu negócio{" "}
              <span className="bg-[linear-gradient(135deg,#D7C8FF_0%,#7A3CFF_46%,#FF4FD8_100%)] bg-clip-text text-transparent">
                de verdade.
              </span>
            </h2>
            <p className="max-w-lg text-base leading-7 text-white/58">
              Diferente de chatbots genéricos, o Agent Nexo é treinado com as informações reais da sua empresa
              e responde como um funcionário que conhece o negócio por dentro.
            </p>
            <div className="space-y-4 pt-2">
              {agentFeatures.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/12 shadow-[0_12px_32px_-20px_rgba(122,60,255,0.55)]">
                    <f.icon className="h-4 w-4 text-violet-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                    <p className="mt-0.5 text-sm leading-6 text-white/52">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Agent visual */}
          <div className="relative">
            <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_40%,rgba(122,60,255,0.28),transparent_62%)] blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-6 backdrop-blur-[20px] shadow-[0_48px_120px_-52px_rgba(0,0,0,0.9)]">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />
              {/* Agent header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7A3CFF,#FF4FD8)] shadow-[0_16px_40px_-20px_rgba(255,79,216,0.7)]">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Agent IA — Nexo</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
                      Processando em tempo real
                    </div>
                  </div>
                </div>
                <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                  Ativo
                </div>
              </div>

              {/* Thinking animation */}
              <div className="mb-5 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
                  Análise em tempo real
                </div>
                {[
                  { label: "Ficha da empresa carregada", done: true, color: "bg-cyan-400" },
                  { label: "Contexto da conversa lido", done: true, color: "bg-violet-400" },
                  { label: "Memória de 4 interações anteriores", done: true, color: "bg-violet-400" },
                  { label: "Gerando resposta contextual…", done: false, color: "bg-fuchsia-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${item.color} ${!item.done ? "animate-pulse" : ""}`} />
                    <span className={`text-xs ${item.done ? "text-white/68" : "text-white/46"}`}>{item.label}</span>
                    {item.done && <Check className="ml-auto h-3 w-3 text-green-400" />}
                  </div>
                ))}
              </div>

              {/* Response preview */}
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(13,91,255,0.12),rgba(122,60,255,0.12))] p-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/70">
                  Resposta gerada pelo Agent IA
                </div>
                <p className="text-[13px] leading-6 text-white/76">
                  "Olá! Com base no histórico de pedidos, posso ver que você comprou 3 vezes conosco. Para o plano Enterprise, oferecemos desconto de 20% para clientes recorrentes. Quer que eu envie os detalhes?"
                </p>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { val: "98%", label: "Precisão" },
                  { val: "1.2s", label: "Resposta" },
                  { val: "100%", label: "Contexto" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-center">
                    <div className="font-display text-base font-bold text-white">{s.val}</div>
                    <div className="text-[10px] text-white/42">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Product Carousel ─────────────────────────────────────────────────────────
const carouselSlides = [
  {
    title: "Conversas",
    sub: "Central de atendimento em tempo real",
    gradient: "from-cyan-500 to-blue-600",
    content: <ConversasSlide />,
  },
  {
    title: "Fluxos",
    sub: "Automação visual por organograma",
    gradient: "from-blue-500 to-violet-600",
    content: <FluxosSlide />,
  },
  {
    title: "Agent IA",
    sub: "Inteligência treinada por empresa",
    gradient: "from-violet-500 to-fuchsia-600",
    content: <AgentSlide />,
  },
  {
    title: "Jornada",
    sub: "Rastreamento da jornada do cliente",
    gradient: "from-fuchsia-500 to-pink-600",
    content: <JornadaSlide />,
  },
  {
    title: "Dashboard",
    sub: "Métricas e KPIs em tempo real",
    gradient: "from-pink-500 to-rose-600",
    content: <DashboardSlide />,
  },
  {
    title: "Memória & Contexto",
    sub: "Histórico inteligente por cliente",
    gradient: "from-rose-500 to-violet-600",
    content: <MemoriaSlide />,
  },
];

function ConversasSlide() {
  return (
    <div className="flex h-full flex-col gap-2 p-4 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Conversas ativas</span>
        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-300">12 online</span>
      </div>
      {[
        { name: "João S.", msg: "Quero saber sobre planos", badge: 2, time: "agora" },
        { name: "Maria C.", msg: "Pedido #4521 aprovado!", badge: 0, time: "1m" },
        { name: "Pedro L.", msg: "Qual o horário?", badge: 1, time: "3m" },
        { name: "Ana M.", msg: "Preciso de suporte...", badge: 4, time: "7m" },
      ].map((c) => (
        <div key={c.name} className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-[11px] font-bold text-white">
            {c.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-white truncate">{c.name}</span>
              <span className="text-[9px] text-white/32 shrink-0 ml-1">{c.time}</span>
            </div>
            <span className="text-[10px] text-white/46 truncate block">{c.msg}</span>
          </div>
          {c.badge > 0 && (
            <span className="flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-[#FF4FD8] px-1 text-[9px] font-bold text-white">
              {c.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function FluxosSlide() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <svg viewBox="0 0 280 180" className="w-full max-w-[280px]" fill="none">
        {/* Connections */}
        <path d="M70 38 L120 75" stroke="rgba(122,60,255,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M70 38 L90 110" stroke="rgba(13,91,255,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M120 75 L170 45" stroke="rgba(255,79,216,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M120 75 L175 110" stroke="rgba(122,60,255,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M90 110 L140 145" stroke="rgba(13,91,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M175 110 L220 145" stroke="rgba(255,79,216,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Nodes */}
        {[
          { x: 35, y: 22, label: "Início", color: "#0D5BFF", w: 70 },
          { x: 85, y: 58, label: "Saudação", color: "#7A3CFF", w: 72 },
          { x: 55, y: 95, label: "Dúvidas", color: "#7A3CFF", w: 70 },
          { x: 135, y: 28, label: "Agent IA", color: "#FF4FD8", w: 72 },
          { x: 140, y: 95, label: "Decisão", color: "#7A3CFF", w: 70 },
          { x: 105, y: 130, label: "Humano", color: "#0D5BFF", w: 70 },
          { x: 185, y: 130, label: "Finalizar", color: "#FF4FD8", w: 72 },
        ].map((n) => (
          <g key={n.label}>
            <rect x={n.x} y={n.y} width={n.w} height={24} rx={6} fill={n.color} fillOpacity="0.18" stroke={n.color} strokeOpacity="0.5" strokeWidth="1.2" />
            <text x={n.x + n.w / 2} y={n.y + 15} textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="9" fontWeight="600">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AgentSlide() {
  return (
    <div className="flex h-full flex-col gap-3 p-4 text-xs">
      <div className="flex items-center gap-2.5 rounded-xl bg-[rgba(122,60,255,0.15)] border border-violet-400/20 p-3">
        <Bot className="h-5 w-5 text-violet-300 shrink-0" />
        <div>
          <div className="text-[11px] font-semibold text-white">Agent Nexo — Empresa XYZ</div>
          <div className="text-[10px] text-violet-300/70">Ficha carregada · 847 regras ativas</div>
        </div>
        <div className="ml-auto h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Perguntas respondidas", val: "2.847", icon: "💬" },
          { label: "Taxa de acerto", val: "97.4%", icon: "🎯" },
          { label: "Escaladas", val: "89", icon: "👤" },
          { label: "Tempo médio", val: "1.1s", icon: "⚡" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/[0.05] border border-white/8 p-2.5">
            <div className="text-base">{s.icon}</div>
            <div className="text-sm font-bold text-white mt-1">{s.val}</div>
            <div className="text-[9px] text-white/42">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/[0.04] border border-white/8 p-2.5">
        <div className="text-[10px] text-white/40 mb-1">Último raciocínio</div>
        <p className="text-[11px] leading-4 text-white/64">"Identificado interesse em upgrade. Acionando ficha comercial para oferta personalizada..."</p>
      </div>
    </div>
  );
}

function JornadaSlide() {
  const stages = [
    { label: "Lead", count: 247, pct: 100, color: "bg-cyan-400" },
    { label: "Contato", count: 198, pct: 80, color: "bg-blue-400" },
    { label: "Qualif.", count: 142, pct: 57, color: "bg-violet-400" },
    { label: "Proposta", count: 86, pct: 35, color: "bg-fuchsia-400" },
    { label: "Fechado", count: 41, pct: 17, color: "bg-pink-400" },
  ];
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Funil de atendimento</div>
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-12 text-[11px] text-white/60 shrink-0">{s.label}</span>
          <div className="flex-1 rounded-full bg-white/[0.06] h-5 overflow-hidden">
            <div
              className={`h-full rounded-full ${s.color} transition-all duration-700`}
              style={{ width: `${s.pct}%`, opacity: 0.7 }}
            />
          </div>
          <span className="w-8 text-right text-[11px] font-semibold text-white/70">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardSlide() {
  const bars = [42, 68, 55, 88, 72, 95, 63, 78, 84, 91, 70, 58];
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: "1.284", label: "Msgs hoje", color: "text-cyan-300" },
          { val: "97%", label: "Resolvidas", color: "text-green-300" },
          { val: "1.3s", label: "Resp. média", color: "text-violet-300" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white/[0.05] border border-white/8 p-2 text-center">
            <div className={`text-sm font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[9px] text-white/40">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex items-end gap-1 rounded-xl bg-white/[0.04] border border-white/8 p-3">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-violet-500 to-fuchsia-400" style={{ height: `${h}%`, opacity: 0.7 }} />
        ))}
      </div>
      <div className="text-[10px] text-center text-white/30">Mensagens por hora — hoje</div>
    </div>
  );
}

function MemoriaSlide() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Database className="h-3.5 w-3.5 text-fuchsia-300" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Memória contextual</span>
      </div>
      {[
        { label: "Visitou o site 3x esta semana", tag: "comportamento", color: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20" },
        { label: "Perguntou sobre plano Enterprise", tag: "intenção", color: "text-violet-300 bg-violet-400/10 border-violet-400/20" },
        { label: "Cliente desde Jan/2024", tag: "histórico", color: "text-blue-300 bg-blue-400/10 border-blue-400/20" },
        { label: "Preferência: atendimento via WhatsApp", tag: "perfil", color: "text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/20" },
        { label: "Ticket médio: R$ 580/mês", tag: "financeiro", color: "text-green-300 bg-green-400/10 border-green-400/20" },
      ].map((m) => (
        <div key={m.label} className="flex items-start gap-2">
          <span className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${m.color}`}>{m.tag}</span>
          <span className="text-[11px] leading-4 text-white/64">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProductCarousel() {
  const [active, setActive] = useState(0);
  const total = carouselSlides.length;

  const prev = useCallback(() => setActive((a) => (a - 1 + total) % total), [total]);
  const next = useCallback(() => setActive((a) => (a + 1) % total), [total]);

  useEffect(() => {
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [next]);

  const slide = carouselSlides[active];

  return (
    <section className="relative overflow-hidden px-5 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(122,60,255,0.16),transparent_52%)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-100/70">
            Produto
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-5xl">
            Veja o Nexo IA em ação
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/56">
            Uma plataforma completa, integrada e pensada para escalar seu atendimento.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {carouselSlides.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setActive(i)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                i === active
                  ? "border-white/20 bg-white/[0.12] text-white"
                  : "border-white/8 bg-white/[0.03] text-white/46 hover:bg-white/[0.07] hover:text-white/72"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Slide */}
        <div className="relative mx-auto max-w-2xl">
          <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_30%,rgba(122,60,255,0.26),transparent_62%)] blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] shadow-[0_52px_140px_-48px_rgba(0,0,0,0.88)] backdrop-blur-[20px]">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${slide.gradient} flex items-center justify-center`}>
                  <BarChart3 className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{slide.title}</div>
                  <div className="text-[10px] text-white/42">{slide.sub}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="h-[22rem]">{slide.content}</div>
          </div>

          {/* Dots */}
          <div className="mt-5 flex justify-center gap-2">
            {carouselSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all ${
                  i === active ? "h-2 w-6 bg-white/70" : "h-2 w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────
const benefits = [
  { icon: Clock, title: "Atendimento 24h com automação", desc: "Responda clientes a qualquer hora, sem custo de plantão humano.", color: "from-cyan-500 to-blue-600", glow: "rgba(13,91,255,0.6)" },
  { icon: MessageSquare, title: "Menos mensagens perdidas", desc: "Nenhum cliente fica sem resposta, mesmo em picos de atendimento.", color: "from-blue-500 to-violet-600", glow: "rgba(122,60,255,0.6)" },
  { icon: GitBranch, title: "Mais organização", desc: "Centralize todas as conversas e filas em uma única visão.", color: "from-violet-500 to-fuchsia-600", glow: "rgba(122,60,255,0.55)" },
  { icon: Workflow, title: "Fluxos inteligentes", desc: "Automatize processos de atendimento com lógica visual e sem código.", color: "from-fuchsia-500 to-pink-600", glow: "rgba(255,79,216,0.6)" },
  { icon: Brain, title: "IA treinada por empresa", desc: "Cada negócio tem seu próprio Agent com regras e personalidade únicas.", color: "from-pink-500 to-rose-600", glow: "rgba(255,79,216,0.65)" },
  { icon: Users, title: "Histórico e contexto por cliente", desc: "Cada cliente tem um perfil com memória completa das interações.", color: "from-rose-500 to-violet-600", glow: "rgba(122,60,255,0.55)" },
];

function Benefits() {
  return (
    <section id="beneficios" className="relative overflow-hidden px-5 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(13,91,255,0.12),transparent_48%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
            Por que escolher
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-5xl">
            Tudo que você precisa para{" "}
            <span className="bg-[linear-gradient(135deg,#8DD8FF_0%,#0D5BFF_40%,#FF4FD8_100%)] bg-clip-text text-transparent">
              escalar.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/56">
            Funcionalidades pensadas para empresas que querem crescer sem perder a qualidade do atendimento.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-6 backdrop-blur transition-all duration-300 hover:border-white/18 hover:-translate-y-1 hover:shadow-[0_28px_72px_-36px_var(--glow)]"
              style={{ "--glow": b.glow } as React.CSSProperties}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${b.color} shadow-[0_16px_40px_-20px_var(--glow)]`}>
                <b.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 font-display text-base font-semibold text-white">{b.title}</h3>
              <p className="text-sm leading-6 text-white/52">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Básico",
    price: "97",
    period: "/mês",
    desc: "Ideal para começar com automação no WhatsApp.",
    recommended: false,
    features: [
      "Conexão via QR Code",
      "Fluxos por organograma",
      "Decisão IA básica",
      "Aba de conversas",
      "Organização de atendimentos",
    ],
    cta: "Começar agora",
    gradient: "from-cyan-500 to-blue-600",
    glow: "rgba(13,91,255,0.55)",
  },
  {
    name: "Médio",
    price: "197",
    period: "/mês",
    desc: "Para negócios que querem IA real com memória e contexto.",
    recommended: true,
    features: [
      "Tudo do Básico",
      "1 Agent IA automatizado",
      "IA treinada com o contexto da empresa",
      "Memória de conversa",
      "Respostas com base na ficha da empresa",
      "Ideal para pequenos negócios inteligentes",
    ],
    cta: "Escolher Médio",
    gradient: "from-violet-500 to-fuchsia-600",
    glow: "rgba(122,60,255,0.75)",
  },
  {
    name: "Avançado",
    price: "397",
    period: "/mês",
    desc: "Para equipes com alto volume e múltiplos agentes.",
    recommended: false,
    features: [
      "Tudo do Médio",
      "QR Code + Cloud API",
      "Até 3 Agents IA ativos",
      "Atendimento simultâneo por agentes",
      "Mais automações e capacidade",
      "Ideal para equipes e alto volume",
    ],
    cta: "Escolher Avançado",
    gradient: "from-fuchsia-500 to-pink-600",
    glow: "rgba(255,79,216,0.6)",
  },
];

function Pricing() {
  return (
    <section id="planos" className="relative overflow-hidden px-5 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(122,60,255,0.12),transparent_56%)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-100/70">
            Planos e preços
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-5xl">
            Simples e transparente.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/56">
            Sem surpresas. Cancele quando quiser. Mude de plano a qualquer momento.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-[1.75rem] border transition-all duration-300 hover:-translate-y-1 ${
                plan.recommended
                  ? "border-violet-400/40 bg-[linear-gradient(180deg,rgba(122,60,255,0.18),rgba(122,60,255,0.06))] shadow-[0_40px_100px_-40px_rgba(122,60,255,0.6)]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]"
              } p-7 backdrop-blur`}
            >
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${plan.recommended ? "via-violet-300/60" : "via-white/14"} to-transparent`} />

              {plan.recommended && (
                <div className="absolute right-5 top-5 rounded-full bg-[linear-gradient(135deg,#7A3CFF,#FF4FD8)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_24px_-10px_rgba(122,60,255,0.8)]">
                  Mais recomendado
                </div>
              )}

              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} shadow-[0_16px_40px_-18px_var(--glow)]`} style={{ "--glow": plan.glow } as React.CSSProperties}>
                <Shield className="h-5 w-5 text-white" />
              </div>

              <div className="mb-1 font-display text-lg font-bold text-white">{plan.name}</div>
              <div className="mb-2 flex items-end gap-1">
                <span className="font-display text-4xl font-bold text-white">R$ {plan.price}</span>
                <span className="mb-1 text-sm text-white/46">{plan.period}</span>
              </div>
              <p className="mb-6 text-sm leading-6 text-white/52">{plan.desc}</p>

              <Link to="/cadastro">
                <Button
                  className={`mb-6 h-12 w-full rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] ${
                    plan.recommended
                      ? "bg-[linear-gradient(135deg,#0D5BFF_0%,#7A3CFF_52%,#FF4FD8_100%)] shadow-[0_20px_56px_-24px_rgba(122,60,255,0.88)]"
                      : "border border-white/14 bg-white/[0.07] hover:bg-white/[0.12]"
                  }`}
                >
                  {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-gradient-to-br ${plan.gradient}`}>
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-white/68">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-5 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(13,91,255,0.2),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(255,79,216,0.16),transparent_38%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/80 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
          Comece hoje mesmo
        </div>

        <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-0.045em] text-white md:text-5xl lg:text-6xl">
          Pronto para transformar seu WhatsApp em uma{" "}
          <span className="bg-[linear-gradient(135deg,#8DD8FF_0%,#7A3CFF_50%,#FF4FD8_100%)] bg-clip-text text-transparent">
            central inteligente de atendimento?
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/58">
          Junte-se a empresas que já usam IA, memória e fluxos inteligentes para atender melhor e crescer mais.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/cadastro">
            <Button
              size="lg"
              className="h-14 min-w-[220px] rounded-2xl bg-[linear-gradient(135deg,#0D5BFF_0%,#7A3CFF_52%,#FF4FD8_100%)] text-base text-white shadow-[0_26px_72px_-28px_rgba(122,60,255,0.88)] hover:scale-[1.02] hover:shadow-[0_34px_90px_-22px_rgba(255,79,216,0.95)]"
            >
              Criar conta <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="ghost"
              className="h-14 min-w-[220px] rounded-2xl border border-white/16 bg-white/[0.06] text-base text-white backdrop-blur hover:bg-white/[0.1] hover:text-white"
            >
              Entrar no painel
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-white/36">
          Sem cartão de crédito · Cancele quando quiser · Suporte incluído
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/8 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="font-display text-sm font-bold text-white/72">Nexo IA</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
          <Link to="/termos" className="hover:text-white/70 transition-colors">Termos de uso</Link>
          <Link to="/politica-de-privacidade" className="hover:text-white/70 transition-colors">Política de privacidade</Link>
          <Link to="/login" className="hover:text-white/70 transition-colors">Entrar no painel</Link>
          <Link to="/cadastro" className="hover:text-white/70 transition-colors">Criar conta</Link>
        </div>
        <p className="text-xs text-white/28">© 2025 Nexo IA. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050A2B] text-white">
      <Navbar />
      <Hero />
      <HowItWorks />
      <AgentFeatures />
      <ProductCarousel />
      <Benefits />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
