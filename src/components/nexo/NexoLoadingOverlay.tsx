import { BrandMark } from "@/components/nexo/BrandMark";
import { cn } from "@/lib/utils";

interface NexoLoadingOverlayProps {
  active?: boolean;
  label?: string;
  className?: string;
}

const defaultLabels = [
  "Carregando inteligência...",
  "Preparando atendimento...",
  "Conectando dados...",
];

export function NexoLoadingOverlay({ active, label, className }: NexoLoadingOverlayProps) {
  if (!active) {
    return null;
  }

  const safeLabel = label || defaultLabels[Math.floor(Date.now() / 3500) % defaultLabels.length];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-nexo-navy/15 backdrop-blur-[3px]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/40 bg-white/90 px-7 py-6 text-center shadow-elegant backdrop-blur-xl">
        <div className="absolute inset-0 nexo-grid-surface opacity-30" />
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-300/55" />
          <div className="absolute inset-1 animate-nexo-orbit rounded-full border border-dashed border-primary/45" />
          <BrandMark className="h-11 w-11" />
        </div>
        <div className="relative">
          <p className="font-display text-sm font-bold text-nexo-navy">Nexo IA</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{safeLabel}</p>
          <div className="mt-4 flex justify-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan-400 [animation-delay:0.16s]" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary [animation-delay:0.32s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
