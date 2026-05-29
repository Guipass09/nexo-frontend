import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "gradient-primary text-primary-foreground shadow-[0_20px_44px_-28px_rgba(37,99,255,0.56)] hover:-translate-y-0.5 hover:shadow-glow",
        premium: "gradient-primary text-primary-foreground shadow-[0_20px_44px_-28px_rgba(37,99,255,0.56)] hover:-translate-y-0.5 hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-md",
        outline: "border border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(240,245,253,0.74))] text-foreground shadow-[0_14px_32px_-28px_rgba(5,8,22,0.28)] backdrop-blur hover:-translate-y-0.5 hover:border-primary/28 hover:text-primary",
        secondary: "border border-border/65 bg-[linear-gradient(180deg,rgba(243,246,252,0.92),rgba(235,241,250,0.82))] text-secondary-foreground shadow-[0_14px_32px_-28px_rgba(5,8,22,0.2)] hover:-translate-y-0.5 hover:bg-secondary",
        soft: "border border-primary/16 bg-[linear-gradient(135deg,rgba(37,99,255,0.12),rgba(124,58,237,0.08))] text-primary shadow-[0_14px_32px_-28px_rgba(37,99,255,0.28)] hover:-translate-y-0.5 hover:border-primary/24 hover:bg-[linear-gradient(135deg,rgba(37,99,255,0.16),rgba(124,58,237,0.12))]",
        ghost: "text-muted-foreground hover:bg-[linear-gradient(135deg,rgba(37,99,255,0.08),rgba(124,58,237,0.08))] hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-xl px-3.5",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
