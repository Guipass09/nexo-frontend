import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import { conversations, conversationMessages } from "@/data/mocks";
import { Search, Filter, Phone, MoreVertical, Send, Paperclip, Mic, Play, Bot, User, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Conversas() {
  const [selected, setSelected] = useState(conversations[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-9rem)]">
      {/* List */}
      <Card className="flex flex-col border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contatos..." className="pl-9 bg-secondary/40" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
            {["Todos", "Ativos", "Aguardando", "Humano", "Finalizado"].map((f, i) => (
              <button key={f} className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-smooth",
                i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}>{f}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={cn(
                "w-full text-left p-3 border-b border-border/60 hover:bg-secondary/40 transition-smooth flex items-start gap-3",
                selected.id === c.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{c.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1.5">{c.lastMessage}</p>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={c.status} className="text-[10px] py-0" />
                  {c.unread > 0 && (
                    <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Chat */}
      <Card className="flex flex-col border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{selected.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{selected.name}</h3>
              <StatusBadge status={selected.status} withDot />
            </div>
            <p className="text-xs text-muted-foreground truncate">{selected.phone} · {selected.flow}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/jornada"><Button variant="outline" size="sm" className="gap-1.5 hidden md:inline-flex"><Workflow className="h-3.5 w-3.5" /> Ver jornada</Button></Link>
            <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-3 bg-secondary/20">
          {conversationMessages.map((m) => {
            if (m.type === "event") {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-medium border border-accent/20 inline-flex items-center gap-1.5">
                    <Workflow className="h-3 w-3" /> {m.text}
                  </div>
                </div>
              );
            }
            const isClient = m.from === "client";
            return (
              <div key={m.id} className={cn("flex gap-2", isClient ? "justify-end" : "justify-start")}>
                {!isClient && (
                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                  isClient
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                )}>
                  {m.type === "audio" ? (
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <button className={cn("h-8 w-8 rounded-full flex items-center justify-center", isClient ? "bg-primary-foreground/20" : "bg-primary/10")}>
                        <Play className={cn("h-3.5 w-3.5", isClient ? "text-primary-foreground" : "text-primary")} />
                      </button>
                      <div className="flex-1">
                        <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 gradient-primary rounded-full" />
                        </div>
                        <span className="text-[10px] opacity-70">{(m as { duration: string }).duration}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  )}
                  <span className={cn("text-[10px] mt-1 block", isClient ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.time}</span>
                </div>
                {isClient && (
                  <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
            <Input placeholder="Digite uma mensagem ou intervir no atendimento..." className="bg-secondary/40 border-border" />
            <Button variant="ghost" size="icon"><Mic className="h-4 w-4" /></Button>
            <Button size="icon" className="gradient-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}