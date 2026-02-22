"use client";

import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  interactive = false,
  onChange,
  size = "default",
  className,
}: RatingStarsProps) {
  const sizeClass = {
    sm: "text-[11px]",
    default: "text-[14px]",
    lg: "text-[20px]",
  }[size];

  return (
    <div className={cn("flex gap-[2px]", className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <span
          key={i}
          className={cn(
            sizeClass,
            "transition-colors duration-[var(--dur-fast)]",
            i < Math.round(rating) ? "text-gold" : "text-text-muted",
            interactive && "cursor-pointer hover:text-gold"
          )}
          onClick={interactive ? () => onChange?.(i + 1) : undefined}
          role={interactive ? "button" : undefined}
          aria-label={interactive ? `Rate ${i + 1} stars` : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}
