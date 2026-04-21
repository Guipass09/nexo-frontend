import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Bot className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-sidebar animate-pulse-dot" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">Nexo</span>
          <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">Bot Manager</span>
        </div>
      )}
    </div>
  );
}