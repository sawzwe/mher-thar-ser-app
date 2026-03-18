"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MenuCategory } from "@/types";
import { cn } from "@/lib/utils";

interface MenuSectionProps { menu: MenuCategory[]; }

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function MenuSection({ menu }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(menu.length > 0 ? [menu[0].name] : []));
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggle = (name: string) => {
    setOpenCategories((prev) => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next; });
  };

  const selectCategory = (name: string | null) => {
    setActiveCategory(name);
    if (name) {
      setOpenCategories((prev) => new Set([...prev, name]));
      // Scroll to category when filtering is off; when filtering, it's already in view
      const el = categoryRefs.current[name];
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  };

  useEffect(() => {
    if (menu.length > 0 && !openCategories.size) {
      setOpenCategories(new Set([menu[0].name]));
    }
  }, [menu]);

  if (menu.length === 0) return null;

  const filteredCategories = activeCategory
    ? menu.filter((c) => c.name === activeCategory)
    : menu;

  const totalItems = menu.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="text-[18px] font-semibold text-text-primary">Menu</h2>
        <span className="text-[13px] text-text-muted">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
          {menu.length > 1 && ` in ${menu.length} categories`}
        </span>
      </div>

      {/* Category tabs */}
      {menu.length >= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => selectCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
              activeCategory === null
                ? "bg-brand text-white"
                : "bg-surface border border-border text-text-secondary hover:bg-card hover:border-border-strong"
            )}
          >
            All
          </button>
          {menu.map((cat, idx) => (
            <button
              key={`${cat.name}-${idx}`}
              onClick={() => selectCategory(cat.name)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                activeCategory === cat.name
                  ? "bg-brand text-white"
                  : "bg-surface border border-border text-text-secondary hover:bg-card hover:border-border-strong"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filteredCategories.map((cat, idx) => {
          const isOpen = openCategories.has(cat.name);
          const catKey = `${cat.name}-${idx}`;
          return (
            <div
              key={catKey}
              ref={(el) => { categoryRefs.current[cat.name] = el; }}
              className="border border-border rounded-[var(--radius-lg)] overflow-hidden bg-surface"
            >
              <button
                onClick={() => toggle(cat.name)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-card transition-colors duration-[var(--dur-fast)] cursor-pointer"
              >
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
                  {cat.items.map((item, itemIdx) => (
                    <div
                      key={`${item.name}-${itemIdx}`}
                      className="px-4 py-3 flex items-start gap-4 transition-colors duration-[var(--dur-fast)] hover:bg-card"
                    >
                      {item.image_url && isValidHttpUrl(item.image_url) && (
                        <div className="relative w-20 h-20 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-card border border-border">
                          <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="80px" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
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
