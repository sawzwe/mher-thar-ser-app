"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-0 border-b border-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-5 py-2.5 text-[13px] font-medium cursor-pointer bg-transparent border-none border-b-2 border-transparent -mb-px transition-all duration-[var(--dur-fast)]",
            tab.id === activeTab
              ? "text-brand-light border-b-brand font-semibold"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
