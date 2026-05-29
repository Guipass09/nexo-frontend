import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-nexo-shimmer rounded-xl bg-[linear-gradient(90deg,hsl(var(--muted))_0%,hsl(var(--secondary))_44%,hsl(var(--muted))_100%)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
