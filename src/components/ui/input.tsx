import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-input/85 bg-[linear-gradient(180deg,rgba(248,250,252,0.78),rgba(240,245,253,0.72))] px-4 py-2.5 text-base shadow-[0_16px_38px_-30px_rgba(5,8,22,0.3)] ring-offset-background transition-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/72 hover:border-primary/28 hover:bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(241,245,255,0.82))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-secondary/50 disabled:opacity-60 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
