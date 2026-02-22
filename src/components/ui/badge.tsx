import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-[5px] text-[11px] font-semibold px-2.5 py-[3px] rounded-[var(--radius-full)] whitespace-nowrap tracking-[0.02em]",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(255,255,255,0.07)] text-text-secondary border border-border",
        brand: "bg-brand text-white",
        brandSoft:
          "bg-brand-dim text-brand-light border border-brand-border",
        success:
          "bg-success-dim text-success border border-success-border",
        warning:
          "bg-warning-dim text-warning border border-warning-border",
        danger:
          "bg-danger-dim text-danger border border-danger-border",
        info: "bg-info-dim text-info border border-info-border",
        gold: "bg-gold-dim text-gold border border-[rgba(212,168,83,0.25)]",
        bts: "bg-[rgba(0,140,74,0.15)] text-[#4CD9A0] border border-[rgba(0,140,74,0.3)]",
        mrt: "bg-[rgba(90,90,200,0.15)] text-[#9B9BF5] border border-[rgba(90,90,200,0.3)]",
        arl: "bg-[rgba(180,40,40,0.15)] text-[#F5837A] border border-[rgba(180,40,40,0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export function BadgeDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "w-[5px] h-[5px] rounded-full bg-current shrink-0",
        className
      )}
    />
  );
}
