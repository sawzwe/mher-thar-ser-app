"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[6px] animate-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-surface border border-border-strong rounded-[var(--radius-xl)] w-full max-w-[480px] overflow-hidden shadow-[var(--shadow-xl)] animate-slide-up",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  titleMy?: string;
  onClose?: () => void;
}

export function ModalHeader({ title, titleMy, onClose }: ModalHeaderProps) {
  return (
    <div className="px-6 py-6 border-b border-border flex items-start justify-between">
      <div>
        <h2 className="text-[24px] font-bold text-text-primary tracking-[-0.5px]">
          {title}
        </h2>
        {titleMy && (
          <p className="font-my text-[13px] text-text-muted mt-[3px]">{titleMy}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-muted text-base cursor-pointer flex items-center justify-center transition-all duration-[var(--dur-fast)] hover:bg-card hover:text-text-primary"
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-6", className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-border bg-[rgba(0,0,0,0.2)] flex gap-3 justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}
