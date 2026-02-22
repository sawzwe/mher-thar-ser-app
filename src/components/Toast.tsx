"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning";
  duration?: number;
  onClose: () => void;
  actionLabel?: string;
  actionHref?: string;
}

const iconMap = {
  success: { icon: "✅", bg: "bg-success-dim" },
  error: { icon: "❌", bg: "bg-danger-dim" },
  warning: { icon: "⚠️", bg: "bg-warning-dim" },
};

export function Toast({ message, type = "success", duration = 8000, onClose, actionLabel, actionHref }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { icon, bg } = iconMap[type];

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[var(--z-toast)] max-w-[360px] bg-card-hover border border-border-strong rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4 transition-all duration-[var(--dur-slow)]",
      visible ? "animate-slide-up opacity-100" : "opacity-0 translate-y-4"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-base shrink-0", bg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary mb-0.5">
            {type === "success" ? "Success" : type === "error" ? "Error" : "Notice"}
          </p>
          <p className="text-[13px] text-text-secondary leading-[1.5]">{message}</p>
          {actionLabel && actionHref && (
            <Link href={actionHref} onClick={onClose} className="mt-2 inline-block text-[13px] font-semibold text-brand-light hover:text-brand transition-colors">
              {actionLabel} →
            </Link>
          )}
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="text-text-muted text-sm cursor-pointer hover:text-text-primary transition-colors bg-transparent border-none p-0 self-start"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
