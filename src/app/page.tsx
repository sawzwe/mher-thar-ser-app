"use client";

import { useRestaurantStore } from "@/stores/restaurantStore";
import { RestaurantCard } from "@/components/RestaurantCard";
import { SearchAndFilters } from "@/components/SearchAndFilters";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { loading, filteredRestaurants } = useRestaurantStore();
  const restaurants = filteredRestaurants();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 md:px-8 pt-16 pb-14">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(232,66,26,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 0% 80%, rgba(212,168,83,0.06) 0%, transparent 50%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Label pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-full)] border border-border-strong bg-[rgba(255,255,255,0.04)] text-[11px] font-bold text-text-secondary tracking-[0.08em] uppercase mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            Bangkok · 7 areas · {restaurants.length}+ restaurants
          </div>

          <h1 className="font-serif text-[clamp(48px,7vw,88px)] font-black leading-[1.0] tracking-[-2px] text-text-primary max-w-[680px] mb-5">
            Find your next <em className="italic text-brand-light">great</em> meal
          </h1>
          <p className="text-[15px] text-text-secondary max-w-[460px] leading-[1.65] mb-10">
            Exclusive deals, handpicked restaurants, and table bookings — instantly confirmed.
          </p>

          <SearchAndFilters />
        </div>
      </section>

      {/* Results */}
      <div className="px-6 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-text-muted">
            Showing <strong className="text-text-secondary font-medium">{restaurants.length} restaurants</strong> · Bangkok
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-surface" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-surface rounded w-2/3" />
                  <div className="h-3 bg-surface rounded w-1/2" />
                  <div className="h-3 bg-surface rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-lg text-text-secondary mb-4">No restaurants found matching your criteria.</p>
            <Button variant="ghost" onClick={() => useRestaurantStore.getState().resetFilters()}>Clear all filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} featured={i === 0} />
            ))}
          </div>
        )}
      </div>

      <div className="h-16" />
    </>
  );
}
