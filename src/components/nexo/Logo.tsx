import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/nexo/BrandMark";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-tight text-white">Nexo IA</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">Inteligência que conecta</span>
        </div>
      )}
    </div>
  );
}
