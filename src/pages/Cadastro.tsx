import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Lock, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/App";
import { setAuthSession } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { register } from "@/services/auth";
import { BrandMark } from "@/components/nexo/BrandMark";

export default function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        name,
        email,
        company_name: companyName.trim() || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });

      queryClient.clear();
      setAuthSession(response.data.token, response.data.user, response.data.expiresAt);
      navigate((location.state as { from?: string } | null)?.from ?? "/perfil");
    } catch (signupError) {
      setError(getApiErrorMessage(signupError, "Nao foi possivel criar sua conta agora."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/60 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.14),transparent_28%),linear-gradient(180deg,hsl(var(--secondary)/0.35),hsl(var(--background)))] p-12">
          <div className="flex items-center gap-3">
            <BrandMark className="h-11 w-11" letterClassName="text-lg" />
            <div>
              <div className="text-xl font-bold tracking-tight">Nexo</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Trial orientado a resultado</div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight">
                Crie sua conta e teste o robo com seu proprio fluxo em poucos minutos.
              </h1>
              <p className="max-w-lg text-base text-muted-foreground">
                Entre, conecte o canal, gere seus primeiros QR codes e acompanhe as conversas reais no mesmo painel.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                {
                  icon: Building2,
                  title: "Conta da empresa pronta para operar",
                  description: "O primeiro usuario entra como administrador e prepara fluxos, equipe e QR codes.",
                },
                {
                  icon: Sparkles,
                  title: "Teste rapido sem friccao",
                  description: "Cadastre-se e comece o trial vendo conversa, fluxo e entrada funcionando juntos.",
                },
                {
                  icon: ShieldCheck,
                  title: "Controle total no painel",
                  description: "Depois voce podera criar outros perfis e liberar ou bloquear acessos da equipe.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border/70 bg-card/70 p-4 backdrop-blur">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">© 2026 Nexo · Atendimento inteligente para operacao real</p>
        </div>

        <div className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden flex items-center gap-3">
              <BrandMark className="h-10 w-10" />
              <span className="text-xl font-bold tracking-tight">Nexo</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Criar conta</h2>
              <p className="text-sm text-muted-foreground">
                Abra seu ambiente inicial e entre direto no painel para configurar o primeiro fluxo.
              </p>
            </div>

            <div className="glass rounded-[2rem] border border-white/60 p-6 shadow-[0_32px_90px_-56px_rgba(5,10,43,0.46)] backdrop-blur-2xl md:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Seu nome</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Darissa Freitas"
                    className="h-11 pl-10"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@empresa.com.br"
                    className="h-11 pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-company">Empresa ou negocio</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-company"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Minha empresa"
                    className="h-11 pl-10"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimo 8 caracteres"
                      className="h-11 pl-10"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password-confirmation">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password-confirmation"
                      type="password"
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      placeholder="Repita a senha"
                      className="h-11 pl-10"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full gap-2 gradient-primary text-primary-foreground font-medium shadow-md transition-smooth hover:shadow-glow"
              >
                {loading ? "Criando conta..." : "Criar conta e entrar"}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Ja tem conta?{" "}
                <Link to="/" className="font-medium text-foreground transition-colors hover:text-primary">
                  Entrar no painel
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Depois do cadastro, voce sera levado ao Perfil para conectar seu WhatsApp e comecar do zero.
              </p>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
