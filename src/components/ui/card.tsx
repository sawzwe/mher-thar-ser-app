import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden transition-all duration-[var(--dur-base)] ease-[var(--ease-out)]",
        interactive && "cursor-pointer hover:bg-card-hover hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] active:translate-y-0 active:shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 py-5 border-b border-border", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 py-5", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 py-4 border-t border-border bg-[rgba(0,0,0,0.2)]", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter };
