"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useMobileHomeViewStore } from "@/stores/mobileHomeViewStore";
import { t } from "@/lib/i18n/translations";
import { Logo } from "@/components/Logo";
import { DiscoveryPanel } from "@/components/DiscoveryPanel";
import { MobileLandingView } from "@/components/mobile/MobileLandingView";
import { RestaurantCard } from "@/components/RestaurantCard";
import type { Restaurant } from "@/types";

const BANGKOK = { lat: 13.7563, lng: 100.5018 } as const;
const _AREA_FILTERS = [
  "All",
  "Sukhumvit",
  "Silom",
  "Thonglor",
  "Burmese",
  "Has Deals",
] as const;

export function HomePageClient() {
  const { loadRestaurants } = useRestaurantStore();
  const lang = useLanguageStore((s) => s.lang);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [areaFilter, _setAreaFilter] = useState("All");

  const _centerLat = userLat ?? BANGKOK.lat;
  const _centerLng = userLng ?? BANGKOK.lng;

  useEffect(() => {
    loadRestaurants().then(() => {
      const { restaurants: r } = useRestaurantStore.getState();
      setRestaurants(r);
    });
  }, [loadRestaurants]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => setLocationLoading(true));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { timeout: 5000, enableHighAccuracy: false },
    );
  }, []);

  const filteredByArea =
    areaFilter === "All"
      ? restaurants
      : restaurants.filter(
          (r) =>
            r.area.toLowerCase().includes(areaFilter.toLowerCase()) ||
            r.cuisineTags.some((t) =>
              t.toLowerCase().includes(areaFilter.toLowerCase()),
            ),
        );

  const _totalRestaurants = restaurants.length;
  const _totalReviews = restaurants.reduce(
    (sum, r) => sum + (r.reviewCount ?? r.googleReviewCount ?? 0),
    0,
  );
  const _uniqueAreas = new Set(restaurants.map((r) => r.area)).size;

  const mobileHomeView = useMobileHomeViewStore((s) => s.view);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      {/* Mobile: map or list (interchangeable) */}
      <div className="mobile-landing-wrapper">
        {mobileHomeView === "map" ? (
          <MobileLandingView
            userLat={userLat}
            userLng={userLng}
            loading={locationLoading}
            restaurants={filteredByArea}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
          />
        ) : (
          <div className="mobile-restaurants-list">
            <div className="mobile-restaurants-list-inner">
              {filteredByArea.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: hero + discovery + footer */}
      <section className="hero desktop-only">
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot" />
            {t(lang, "heroBadge")}
          </div>

          <h2 className="hero-h2">{t(lang, "heroH2")}</h2>
          <h1 className="hero-h1">
            <em>{t(lang, "heroH1")}</em>
          </h1>

          <p className="hero-sub">{t(lang, "heroSub")}</p>

          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[100px] bg-brand text-white text-[15px] font-semibold hover:bg-brand-hover transition-all"
          >
            {t(lang, "seeAllRestaurants")}
            <span>→</span>
          </Link>

          {/* <div className="search-bar">
            <MagnifyingGlass
              className="search-icon shrink-0 w-5 h-5"
              weight="bold"
            />
            <input
              type="text"
              placeholder="Restaurant, cuisine, or area..."
              className="flex-1 min-w-0"
            />
            <div className="search-divider" />
            <span className="search-loc flex items-center gap-1.5">
              <MapPin className="w-4 h-4" weight="fill" />
              Bangkok
            </span>
            <button type="button" className="search-btn">
              Search
            </button>
          </div> */}

          {/* <div className="filter-row">
            {_AREA_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => _setAreaFilter(f)}
                className={`fpill ${areaFilter === f ? "active" : ""}`}
              >
                {f}
              </button>
            ))}
          </div> */}

          {/* <div className="stats-row">
            <div className="stat">
              <div className="stat-n">{_totalRestaurants}+</div>
              <div className="stat-l">Restaurants</div>
            </div>
            <div className="stat">
              <div className="stat-n">
                {_totalReviews >= 1000
                  ? `${(_totalReviews / 1000).toFixed(0)}k`
                  : _totalReviews}
              </div>
              <div className="stat-l">Reviews</div>
            </div>
            <div className="stat">
              <div className="stat-n">{_uniqueAreas}</div>
              <div className="stat-l">Thai Cities</div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Discovery panel - map + list */}
      <div id="discovery" className="desktop-only">
        <DiscoveryPanel
          userLat={userLat}
          userLng={userLng}
          loading={locationLoading}
          restaurants={filteredByArea}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
        />
      </div>

      {/* Footer */}
      <footer className="desktop-only border-t border-border py-6 px-6 md:px-8 flex items-center justify-between bg-bg">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-sans text-[15px] font-bold text-text-primary">
            Mher Thar Ser
          </span>
          <span className="text-[12px] text-text-muted ml-2">
            &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
