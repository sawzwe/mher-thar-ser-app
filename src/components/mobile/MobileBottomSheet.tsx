"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Restaurant } from "@/types";
import { useLanguageStore } from "@/stores/languageStore";
import { t } from "@/lib/i18n/translations";
import { isOpenNow } from "@/lib/hours";
import { getRestaurantPath } from "@/lib/restaurants/url";
import { getPinEmoji } from "@/lib/map/cuisine";
import { getDistanceKm, formatDistance } from "@/lib/map/distance";
import { cn } from "@/lib/utils";

const SHEET_FILTERS = ["All", "Burmese", "Has Deals"] as const;

export type SheetSnap = "peek" | "half" | "full";

function getStatus(r: Restaurant): "open" | "busy" | "closed" {
  const { open } = isOpenNow(r.openingHours);
  return open ? "open" : "closed";
}

interface MobileBottomSheetProps {
  restaurants: Restaurant[];
  /** How many of `restaurants` are inside the map radius (0 if we fell back to “nearest”). */
  radiusMatchCount: number;
  centerLat: number;
  centerLng: number;
  loading: boolean;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  selectedId: string | null;
  onCardSelect: (r: Restaurant) => void;
  onMapClick: () => void;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  cardsRef: React.RefObject<HTMLDivElement | null>;
}

export function MobileBottomSheet({
  restaurants,
  radiusMatchCount,
  centerLat,
  centerLng,
  loading,
  snap,
  onSnapChange,
  selectedId,
  onCardSelect,
  onMapClick: _onMapClick,
  sheetRef,
  cardsRef,
}: MobileBottomSheetProps) {
  const lang = useLanguageStore((s) => s.lang);
  const [cuisineFilter, setCuisineFilter] = useState<typeof SHEET_FILTERS[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const startYRef = useRef(0);

  const filtered = restaurants.filter((r) => {
    if (cuisineFilter === "Burmese" && !r.cuisineTags.includes("Burmese")) return false;
    if (cuisineFilter === "Has Deals" && r.deals.length === 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.cuisineTags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const displayCards =
    filtered.length > 0 ? filtered : restaurants.length > 0 ? restaurants : [];

  const showingFilterFallback =
    filtered.length === 0 && restaurants.length > 0 && displayCards.length > 0;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startYRef.current = e.touches[0].clientY;
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const delta = startYRef.current - endY;

      if (delta > 60) {
        if (snap === "peek") onSnapChange("half");
        else if (snap === "half") onSnapChange("full");
      } else if (delta < -60) {
        if (snap === "full") onSnapChange("half");
        else if (snap === "half") onSnapChange("peek");
      }
    },
    [snap, onSnapChange]
  );

  const handleHandleTap = useCallback(() => {
    if (snap === "peek") onSnapChange("half");
    else if (snap === "half") onSnapChange("full");
    else onSnapChange("full");
  }, [snap, onSnapChange]);

  return (
    <div
      ref={sheetRef}
      className={cn("bottom-sheet", `snap-${snap}`)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        id="mts-mobile-sheet-handle"
        type="button"
        className="sheet-handle-btn"
        aria-label="Expand restaurant list"
        onClick={handleHandleTap}
      >
        <span className="sheet-handle" />
      </button>
      <div className="sheet-peek">
        <div className="sheet-search">
          <span className="search-icon-sm">🔍</span>
          <input
            type="text"
            className="sheet-input"
            placeholder={t(lang, "searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => onSnapChange("full")}
          />
        </div>
        <div className="found-row">
          <div className="found-dot" />
          <div className="found-row-text">
            <span id="found-text">
              {loading
                ? t(lang, "locating")
                : `${displayCards.length} ${t(lang, "restaurantsNearby")}`}
            </span>
            {!loading && showingFilterFallback && (
              <span
                className={cn("found-hint", lang === "my" && "my")}
                title={t(lang, "sheetShowingAllFilters")}
              >
                {t(lang, "sheetShowingAllFilters")}
              </span>
            )}
            {!loading &&
              !showingFilterFallback &&
              radiusMatchCount === 0 &&
              displayCards.length > 0 && (
                <span
                  className={cn("found-hint", lang === "my" && "my")}
                  title={t(lang, "sheetOutsideRadiusHint")}
                >
                  {t(lang, "sheetOutsideRadiusHint")}
                </span>
              )}
          </div>
        </div>
      </div>
      <div className="sheet-filters">
        {SHEET_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={cn("fpill", cuisineFilter === f && "active")}
            onClick={() => setCuisineFilter(f)}
          >
            {f === "All" ? t(lang, "all") : f === "Has Deals" ? t(lang, "hasDeals") : f}
          </button>
        ))}
      </div>
      <div ref={cardsRef} className="sheet-cards">
        {displayCards.map((r) => {
          const status = getStatus(r);
          const dist = getDistanceKm(centerLat, centerLng, r.geo.lat, r.geo.lng);
          const emoji = getPinEmoji(r.cuisineTags, r.cuisineTags[0]);
          const hasImage = r.imageUrl?.trim().length > 0;
          const isActive = selectedId === r.id;

          return (
            <div
              key={r.id}
              data-restaurant-id={r.id}
              role="button"
              tabIndex={0}
              onClick={() => onCardSelect(r)}
              onKeyDown={(e) => e.key === "Enter" && onCardSelect(r)}
              className={cn("sheet-card", isActive && "active")}
            >
              <div className="sc-img">
                {hasImage ? (
                  <Image src={r.imageUrl} alt={r.name} fill className="object-cover" sizes="(max-width: 768px) 82vw, 268px" />
                ) : (
                  <div className="sc-img-placeholder">{emoji}</div>
                )}
              </div>
              <div className="sc-body">
                <div className="sc-name">{r.name}</div>
                <div className="sc-meta">
                  {r.cuisineTags[0] || r.area} · {formatDistance(dist)}
                </div>
                <div className="sc-footer">
                  <span className={cn("sc-status", status)}>{t(lang, status)}</span>
                  <Link
                    href={`/restaurant/${getRestaurantPath(r) || r.id}`}
                    className="sc-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t(lang, "book")} →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && displayCards.length === 0 && (
          <div className="sheet-card sheet-card-empty">
            <div className="sc-body sc-body-empty">
              <div className="sc-name">{t(lang, "noRestaurantsFound")}</div>
              <div className="sc-meta">{t(lang, "tryDifferentFilters")}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
