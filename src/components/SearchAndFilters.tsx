"use client";

import { useRestaurantStore, SortOption } from "@/stores/restaurantStore";
import { AREAS, CUISINES } from "@/data/seed";
import { cn } from "@/lib/utils";

function Pill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-[7px] rounded-[var(--radius-full)] border text-[13px] font-medium transition-all duration-[var(--dur-fast)] cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
        active
          ? "bg-brand-dim border-brand text-brand-light font-semibold"
          : "border-border-strong text-text-secondary bg-transparent hover:border-brand hover:text-text-primary hover:bg-brand-dim"
      )}
    >
      {children}
    </button>
  );
}

export function SearchAndFilters() {
  const { filters, sort, setFilter, setSort, resetFilters } = useRestaurantStore();

  const hasActiveFilters =
    filters.search || filters.area || filters.cuisine || filters.priceTier !== null || filters.hasDeals;

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="max-w-[720px] flex items-center gap-0 bg-card border border-border-strong rounded-[var(--radius-lg)] overflow-hidden py-2 pl-5 pr-2 transition-[border-color] duration-[var(--dur-fast)] focus-within:border-brand">
        <span className="text-text-muted text-[15px] mr-3 shrink-0">🔍</span>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="Restaurant, cuisine, or area..."
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-muted"
        />
        <div className="w-px h-6 bg-border-strong mx-4" />
        <span className="text-[13px] text-text-secondary whitespace-nowrap flex items-center gap-1.5 mr-3">📍 Bangkok</span>
        <button
          className="px-6 py-2.5 rounded-[var(--radius-md)] bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:bg-brand-hover hover:shadow-[var(--shadow-brand)] transition-all duration-[var(--dur-base)] whitespace-nowrap"
          onClick={() => {}}
        >
          Search
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em] mr-1">Filter</span>

        <Pill active={!filters.area} onClick={() => setFilter("area", "")}>All</Pill>

        {AREAS.slice(0, 4).map((a) => (
          <Pill key={a} active={filters.area === a} onClick={() => setFilter("area", filters.area === a ? "" : a)}>
            {a} <span className="text-[9px] text-text-muted">▾</span>
          </Pill>
        ))}

        {CUISINES.slice(0, 2).map((c) => (
          <Pill key={c} active={filters.cuisine === c} onClick={() => setFilter("cuisine", filters.cuisine === c ? "" : c)}>
            {c} <span className="text-[9px] text-text-muted">▾</span>
          </Pill>
        ))}

        <Pill active={filters.hasDeals} onClick={() => setFilter("hasDeals", !filters.hasDeals)}>
          Has Deals
        </Pill>

        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-[12px] text-brand-light hover:text-brand font-medium cursor-pointer ml-1 transition-colors duration-[var(--dur-fast)] bg-transparent border-none">
            Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 text-[13px] text-text-muted">
          Sort:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-card border border-border-strong text-text-secondary text-[13px] px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer outline-none focus:border-brand"
          >
            <option value="recommended">Recommended</option>
            <option value="rating">Top Rated</option>
            <option value="best_value">Best Value</option>
          </select>
        </div>
      </div>
    </div>
  );
}
