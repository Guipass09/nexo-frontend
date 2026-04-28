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
        "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl gradient-primary shadow-glow",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(0_0%_100%_/_0.34),transparent_55%)]" />
      <span className={cn("relative text-base font-black tracking-[-0.12em] text-primary-foreground", letterClassName)}>N</span>
      <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}
