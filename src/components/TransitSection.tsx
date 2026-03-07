"use client";

import { useEffect, useState } from "react";
import { TransitStop, Geo, TransitType } from "@/types";
import { haversineDistance, formatDistance } from "@/lib/geo";
import { Badge } from "@/components/ui/badge";
import type { Lang } from "@/stores/languageStore";
import { t } from "@/lib/i18n/translations";

const transitBadge: Record<TransitType, "bts" | "mrt" | "arl"> = {
  BTS: "bts",
  MRT: "mrt",
  ARL: "arl",
};
const transitIcon: Record<TransitType, string> = {
  BTS: "🚆",
  MRT: "🚇",
  ARL: "🚈",
};

interface TransitSectionProps {
  transitNearby: TransitStop[];
  restaurantGeo: Geo;
  lang: Lang;
}

export function TransitSection({
  transitNearby,
  restaurantGeo,
  lang,
}: TransitSectionProps) {
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "loading" | "granted" | "denied"
  >("idle");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      queueMicrotask(() => setGeoStatus("denied"));
      return;
    }
    queueMicrotask(() => setGeoStatus("loading"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDistanceKm(haversineDistance(g, restaurantGeo));
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [restaurantGeo]);

  return (
    <section>
      <h2 className="text-[18px] font-semibold text-text-primary mb-3">
        {t(lang, "nearbyTransit")}
      </h2>
      {geoStatus === "granted" && distanceKm !== null && (
        <div className="mb-3 px-3 py-2 bg-brand-dim border border-brand-border rounded-[var(--radius-md)] text-[13px] text-brand-light flex items-center gap-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            {formatDistance(distanceKm)} {t(lang, "fromYourLocation")}{" "}
            <span className="text-brand-light/70 text-[11px]">
              {t(lang, "straightLine")}
            </span>
          </span>
        </div>
      )}
      {geoStatus === "loading" && (
        <p className="text-[11px] text-text-muted mb-3">
          {t(lang, "checkingLocation")}
        </p>
      )}
      {geoStatus === "denied" && (
        <p className="text-[12px] text-text-muted mb-3 italic">
          {t(lang, "allowLocation")}
        </p>
      )}
      <div className="space-y-2">
        {transitNearby.map((stop) => (
          <div
            key={`${stop.type}-${stop.name}`}
            className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border border-border bg-surface transition-colors duration-[var(--dur-fast)] hover:bg-card"
          >
            <div className="flex items-center gap-2.5">
              <Badge variant={transitBadge[stop.type]}>
                {transitIcon[stop.type]} {stop.type} · {stop.name}
              </Badge>
            </div>
            <span className="text-[12px] text-text-muted">
              {stop.walkingMinutes} {t(lang, "minWalk")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
