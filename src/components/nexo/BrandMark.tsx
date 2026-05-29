import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  letterClassName?: string;
}

export function BrandMark({ className, letterClassName }: BrandMarkProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl gradient-primary shadow-glow",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,hsl(0_0%_100%_/_0.36),transparent_42%)]" />
      <div className="absolute -left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-white/30" />
      <span className={cn("relative z-10 font-display text-base font-black tracking-[-0.12em] text-primary-foreground", letterClassName)}>
        N
      </span>
      <span className="absolute left-1.5 top-2 h-1.5 w-1.5 rounded-full bg-white/90" />
      <span className="absolute bottom-1.5 left-2.5 h-1.5 w-1.5 rounded-full bg-cyan-200" />
      <span className="absolute right-1.5 top-2.5 h-1.5 w-1.5 rounded-full bg-cyan-300" />
      <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_hsl(var(--accent))]" />
    </div>
  );
}
