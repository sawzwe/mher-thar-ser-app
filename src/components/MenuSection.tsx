"use client";

import { useState } from "react";
import { MenuCategory } from "@/types";
import { cn } from "@/lib/utils";

interface MenuSectionProps { menu: MenuCategory[]; }

export function MenuSection({ menu }: MenuSectionProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(menu.length > 0 ? [menu[0].name] : []));

  const toggle = (name: string) => {
    setOpenCategories((prev) => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next; });
  };

  if (menu.length === 0) return null;

  return (
    <section>
      <h2 className="text-[18px] font-semibold text-text-primary mb-3">Menu</h2>
      <div className="space-y-2">
        {menu.map((cat) => {
          const isOpen = openCategories.has(cat.name);
          return (
            <div key={cat.name} className="border border-border rounded-[var(--radius-lg)] overflow-hidden bg-surface">
              <button onClick={() => toggle(cat.name)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-card transition-colors duration-[var(--dur-fast)] cursor-pointer">
                <span className="font-semibold text-[13px] text-text-primary">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-text-muted">{cat.items.length} item{cat.items.length !== 1 && "s"}</span>
                  <svg className={cn("w-4 h-4 text-text-muted transition-transform duration-[var(--dur-fast)]", isOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {cat.items.map((item) => (
                    <div key={item.name} className="px-4 py-3 flex items-start justify-between gap-4 transition-colors duration-[var(--dur-fast)] hover:bg-card">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-text-primary">{item.name}</p>
                        {item.description && <p className="text-[12px] text-text-muted mt-0.5 line-clamp-2">{item.description}</p>}
                      </div>
                      <span className="text-[13px] font-semibold text-brand-light shrink-0">฿{item.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
