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

const logoSrc = "/Nexo%20IA%20Logo%20v2.png";

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
        "pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-[#050A2B]/26 backdrop-blur-md",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-[#09122e]/78 px-7 py-6 text-center shadow-[0_30px_80px_-32px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,91,255,0.28),_transparent_34%),radial-gradient(circle_at_82%_12%,rgba(255,79,216,0.18),transparent_26%)]" />
        <div className="absolute inset-0 nexo-grid-surface opacity-15" />
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-300/35" />
          <div className="absolute inset-2 animate-nexo-orbit rounded-full border border-dashed border-primary/45" />
          <div className="absolute inset-0 rounded-full bg-cyan-400/18 blur-2xl" />
          <BrandMark className="h-14 w-14" />
        </div>
        <div className="relative">
          <img src={logoSrc} alt="Nexo IA" className="mx-auto h-auto w-[148px] max-w-full drop-shadow-[0_18px_40px_rgba(34,211,238,0.15)]" />
          <p className="mt-3 text-sm font-medium text-blue-50/78">{safeLabel}</p>
          <div className="mt-4 flex justify-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan-300" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary [animation-delay:0.16s]" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent [animation-delay:0.32s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
