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
  centerLat,
  centerLng,
  loading,
  snap,
  onSnapChange,
  selectedId,
  onCardSelect,
  onMapClick,
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

  return (
    <div
      ref={sheetRef}
      className={cn("bottom-sheet", `snap-${snap}`)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sheet-handle" />
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
          <span id="found-text">
            {loading ? t(lang, "locating") : `${filtered.length} ${t(lang, "restaurantsNearby")}`}
          </span>
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
        {filtered.map((r) => {
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
                  <Image src={r.imageUrl} alt={r.name} fill className="object-cover" sizes="200px" />
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
      </div>
    </div>
  );
}
