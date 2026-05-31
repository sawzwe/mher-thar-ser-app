"use client";

import { useEffect, useMemo } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useRestaurantStore, SortOption } from "@/stores/restaurantStore";
import { useLanguageStore } from "@/stores/languageStore";
import { t } from "@/lib/i18n/translations";
import { RestaurantCard } from "@/components/RestaurantCard";
import { cn } from "@/lib/utils";

function FilterPill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-[var(--radius-full)] border text-[13px] font-medium transition-all duration-[var(--dur-fast)] cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
        active
          ? "bg-brand-dim border-brand text-brand-light font-semibold"
          : "border-border-strong text-text-secondary bg-transparent hover:border-brand hover:text-text-primary hover:bg-brand-dim"
      )}
    >
      {children}
    </button>
  );
}

export function RestaurantsPageClient() {
  const lang = useLanguageStore((s) => s.lang);
  const { restaurants, loading, filters, sort, setFilter, setSort, resetFilters, filteredRestaurants } =
    useRestaurantStore();

  useEffect(() => {
    useRestaurantStore.getState().loadRestaurants();
  }, []);

  // Unique, sorted list of districts present in the loaded restaurants.
  const districts = useMemo(() => {
    const set = new Set<string>();
    for (const r of restaurants) {
      const d = (r.district ?? "").trim();
      if (d) set.add(d);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  const results = filteredRestaurants();
  const hasActiveFilters = !!filters.search || filters.hasMenu || !!filters.district;

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
      <div className="mb-8">
        <h1 className="font-sans text-2xl md:text-3xl font-bold text-text-primary tracking-[-0.5px] mb-2">
          {t(lang, "seeAllRestaurants")}
        </h1>
        <p className="text-[14px] text-text-secondary">
          {t(lang, "restaurantsPageSub")}
        </p>
      </div>

      {/* Search bar */}
      <div className="max-w-[720px] flex items-center gap-0 bg-card border border-border-strong rounded-[var(--radius-lg)] overflow-hidden py-2 pl-5 pr-2 mb-6 transition-[border-color] duration-[var(--dur-fast)] focus-within:border-brand">
        <MagnifyingGlass className="w-5 h-5 text-text-muted shrink-0 mr-3" weight="bold" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder={t(lang, "searchPlaceholder")}
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-muted min-w-0"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.08em] mr-1">
          {t(lang, "filter")}
        </span>

        <FilterPill active={filters.hasMenu} onClick={() => setFilter("hasMenu", !filters.hasMenu)}>
          {t(lang, "hasMenu")}
        </FilterPill>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[12px] text-brand-light hover:text-brand font-medium cursor-pointer ml-1 transition-colors duration-[var(--dur-fast)] bg-transparent border-none"
          >
            {t(lang, "clear")}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 text-[13px] text-text-muted">
          {t(lang, "sort")}:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-card border border-border-strong text-text-secondary text-[13px] px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer outline-none focus:border-brand"
          >
            <option value="recommended">{t(lang, "sortRecommended")}</option>
            <option value="rating">{t(lang, "sortRating")}</option>
            <option value="best_value">{t(lang, "sortBestValue")}</option>
          </select>
        </div>
      </div>

      {/* Filter by district */}
      {districts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-text-primary mb-3">
            {t(lang, "filterByDistrict")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill
              active={!filters.district}
              onClick={() => setFilter("district", "")}
            >
              {t(lang, "all")}
            </FilterPill>
            {districts.map((d) => (
              <FilterPill
                key={d}
                active={filters.district === d}
                onClick={() => setFilter("district", filters.district === d ? "" : d)}
              >
                {d}
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden">
              <div className="aspect-[16/9] bg-surface" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface rounded w-3/4" />
                <div className="h-3 bg-surface rounded w-1/2" />
                <div className="h-3 bg-surface rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-[var(--radius-lg)]">
          <p className="text-text-secondary font-medium mb-2">{t(lang, "noRestaurantsFound")}</p>
          <p className="text-[13px] text-text-muted mb-4">{t(lang, "tryDifferentFilters")}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-[var(--radius-md)] bg-brand text-white text-[13px] font-semibold hover:bg-brand-hover transition-all"
          >
            {t(lang, "clearFilters")}
          </button>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-text-muted mb-4">
            {results.length} {t(lang, "restaurantsFound")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
