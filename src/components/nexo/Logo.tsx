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
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">Nexo</span>
          <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">Atendimento inteligente</span>
        </div>
      )}
    </div>
  );
}
