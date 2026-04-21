import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Bell, Globe, Moon } from "lucide-react";

export default function Perfil() {
  const nav = useNavigate();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-elegant">
              <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">AD</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card border-2 border-background shadow-md flex items-center justify-center hover:scale-110 transition-smooth">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold">Admin Nexo</h2>
            <p className="text-sm text-muted-foreground mb-2">admin@nexo.com.br</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Administrador</span>
          </div>
          <Button variant="outline" onClick={() => nav("/")} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold mb-5 pb-5 border-b border-border/60">Informações pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome completo</Label><Input defaultValue="Admin Nexo" /></div>
          <div className="space-y-2"><Label>E-mail</Label><Input type="email" defaultValue="admin@nexo.com.br" /></div>
          <div className="space-y-2"><Label>Cargo</Label><Input defaultValue="Administrador do sistema" /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input defaultValue="+55 11 99000-0000" /></div>
        </div>
        <div className="flex justify-end mt-5">
          <Button className="gradient-primary text-primary-foreground">Salvar alterações</Button>
        </div>
      </Card>

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold mb-5 pb-5 border-b border-border/60">Preferências</h3>
        <div className="space-y-4">
          {[
            { icon: Globe, title: "Idioma", desc: "Português (Brasil)" },
            { icon: Moon, title: "Tema escuro", desc: "Reduz fadiga visual à noite", toggle: true },
            { icon: Bell, title: "Notificações por e-mail", desc: "Resumos e alertas importantes", toggle: true, on: true },
          ].map((p) => (
            <div key={p.title} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <p.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              {p.toggle ? <Switch defaultChecked={p.on} /> : <Button variant="ghost" size="sm">Alterar</Button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}