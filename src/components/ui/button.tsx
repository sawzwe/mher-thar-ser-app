import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] cursor-pointer transition-all duration-[var(--dur-base)] ease-[var(--ease-out)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white hover:bg-brand-hover hover:shadow-[var(--shadow-brand)] hover:-translate-y-px active:translate-y-0 active:shadow-none",
        secondary:
          "bg-card-hover text-text-primary border border-border-strong hover:bg-card-active hover:border-text-muted",
        ghost:
          "bg-transparent text-text-secondary border border-border-strong hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary",
        brandGhost:
          "bg-brand-dim text-brand-light border border-brand-border hover:bg-brand-dim-hover hover:border-brand",
        danger:
          "bg-danger-dim text-danger border border-danger-border hover:bg-[rgba(232,64,64,0.22)]",
      },
      size: {
        xs: "text-[11px] h-7 px-3 rounded-[var(--radius-sm)]",
        sm: "text-[13px] h-[34px] px-4",
        md: "text-[13px] h-[42px] px-[22px]",
        lg: "text-[15px] h-[50px] px-7 rounded-[var(--radius-lg)]",
        xl: "text-[17px] h-[58px] px-9 rounded-[var(--radius-lg)]",
        icon: "h-[42px] w-[42px] p-0",
        "icon-sm": "h-[34px] w-[34px] p-0 text-sm",
        "icon-lg": "h-[50px] w-[50px] p-0 text-lg rounded-[var(--radius-lg)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size, className }),
        loading && "pointer-events-none"
      )}
      disabled={disabled || loading}
      {...props}
    >
      {children}
      {loading && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white animate-spin shrink-0" />
      )}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
