"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import type { Restaurant } from "@/types";
import { getDistanceKm } from "@/lib/map/distance";
import { DiscoveryPanel } from "@/components/DiscoveryPanel";
import { MobileRadiusFloat } from "./MobileRadiusFloat";
import {
  MobileBottomSheet,
  type SheetSnap,
} from "./MobileBottomSheet";

const BANGKOK = { lat: 13.7563, lng: 100.5018 } as const;

interface MobileLandingViewProps {
  userLat: number | null;
  userLng: number | null;
  loading: boolean;
  restaurants: Restaurant[];
  radiusKm: number;
  onRadiusChange: (km: number) => void;
}

export function MobileLandingView({
  userLat,
  userLng,
  loading,
  restaurants,
  radiusKm,
  onRadiusChange,
}: MobileLandingViewProps) {
  const centerLat = userLat ?? BANGKOK.lat;
  const centerLng = userLng ?? BANGKOK.lng;

  const [snap, setSnap] = useState<SheetSnap>("peek");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerClickedRef = useRef(false);

  const { radiusMatched, sheetRestaurants } = useMemo(() => {
    const distSort = (a: Restaurant, b: Restaurant) =>
      getDistanceKm(centerLat, centerLng, a.geo.lat, a.geo.lng) -
      getDistanceKm(centerLat, centerLng, b.geo.lat, b.geo.lng);

    const inRadius = restaurants
      .filter((r) => getDistanceKm(centerLat, centerLng, r.geo.lat, r.geo.lng) <= radiusKm)
      .sort(distSort);

    if (inRadius.length > 0) {
      return { radiusMatched: inRadius, sheetRestaurants: inRadius };
    }
    if (restaurants.length === 0) {
      return { radiusMatched: [] as Restaurant[], sheetRestaurants: [] as Restaurant[] };
    }
    return {
      radiusMatched: [] as Restaurant[],
      sheetRestaurants: [...restaurants].sort(distSort),
    };
  }, [restaurants, centerLat, centerLng, radiusKm]);

  const handleMapClick = useCallback(() => {
    if (markerClickedRef.current) {
      markerClickedRef.current = false;
      return;
    }
    if (snap === "full") setSnap("half");
    else if (snap === "half") setSnap("peek");
  }, [snap]);

  const handleMarkerClick = useCallback((id: string) => {
    markerClickedRef.current = true;
    setSelectedId(id);
    setSnap("half");
    setTimeout(() => {
      const card = cardsRef.current?.querySelector(
        `[data-restaurant-id="${id}"]`,
      );
      card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 100);
  }, []);

  const handleCardSelect = useCallback((r: Restaurant) => {
    setSelectedId(r.id);
    // DiscoveryPanel reacts to selectedId and pans + opens popup
  }, []);

  return (
    <div className="mobile-landing">
      <div ref={mapContainerRef} className="mobile-map-container" onClick={handleMapClick}>
        <DiscoveryPanel
          userLat={userLat}
          userLng={userLng}
          loading={loading}
          restaurants={restaurants}
          radiusKm={radiusKm}
          onRadiusChange={onRadiusChange}
          mobile
          onMarkerClick={handleMarkerClick}
          selectedId={selectedId}
          onCardSelect={handleCardSelect}
        />
      </div>
      <MobileRadiusFloat radiusKm={radiusKm} onRadiusChange={onRadiusChange} />
      <MobileBottomSheet
        restaurants={sheetRestaurants}
        radiusMatchCount={radiusMatched.length}
        centerLat={centerLat}
        centerLng={centerLng}
        loading={loading}
        snap={snap}
        onSnapChange={setSnap}
        selectedId={selectedId}
        onCardSelect={handleCardSelect}
        onMapClick={handleMapClick}
        sheetRef={sheetRef}
        cardsRef={cardsRef}
      />
    </div>
  );
}
