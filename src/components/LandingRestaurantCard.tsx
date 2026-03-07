"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "@phosphor-icons/react";
import type { Restaurant } from "@/types";
import { getRestaurantPath } from "@/lib/restaurants/url";
import { isOpenNow } from "@/lib/hours";
import { getPinEmoji } from "@/lib/map/cuisine";
import { getDistanceKm, formatDistance } from "@/lib/map/distance";

const STATUS_STYLES = {
  open: { bg: "rgba(61,170,110,0.14)", color: "#3DAA6E" },
  busy: { bg: "rgba(224,155,45,0.14)", color: "#E09B2D" },
  closed: { bg: "rgba(232,64,64,0.14)", color: "#E84040" },
} as const;

function getStatus(r: Restaurant): "open" | "busy" | "closed" {
  const { open } = isOpenNow(r.openingHours);
  return open ? "open" : "closed";
}

interface LandingRestaurantCardProps {
  restaurant: Restaurant;
  userLat: number;
  userLng: number;
}

export function LandingRestaurantCard({
  restaurant,
  userLat,
  userLng,
}: LandingRestaurantCardProps) {
  const r = restaurant;
  const status = getStatus(r);
  const statusStyle = STATUS_STYLES[status];
  const emoji = getPinEmoji(r.cuisineTags, r.cuisineTags[0]);
  const dist = getDistanceKm(userLat, userLng, r.geo.lat, r.geo.lng);
  const displayRating = r.googleRating ?? r.rating;
  const hasImage = r.imageUrl?.trim().length > 0;
  const href = `/restaurant/${getRestaurantPath(r) || r.id}`;

  const cardContent = (
    <>
      <div className="relative h-[130px] overflow-hidden bg-card">
        {hasImage ? (
          <Image
            src={r.imageUrl}
            alt={r.name}
            fill
            className="object-cover"
            sizes="220px"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-surface"
            style={{
              background: "linear-gradient(135deg, var(--surface), var(--card))",
            }}
          >
            <span className="text-5xl">{emoji}</span>
          </div>
        )}
        <span
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-[100px] text-[11px] font-bold"
          style={{
            background: "var(--warning-dim)",
            color: "var(--warning)",
          }}
        >
          <Star weight="fill" size={12} />
          {displayRating.toFixed(1)}
        </span>
        <span
          className="absolute top-2 left-2 px-2 py-1 rounded-[100px] text-[10px] font-bold"
          style={{ background: statusStyle.bg, color: statusStyle.color }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="font-sans font-bold text-[16px] text-text-primary mb-1">
          {r.name}
        </h3>
        <div className="flex items-center justify-between gap-2 mb-2 text-[12px] text-text-muted">
          <span>{r.cuisineTags[0] || r.area}</span>
          <span
            className="px-2 py-0.5 rounded-[100px] text-[11px] font-semibold bg-card text-text-secondary"
          >
            {formatDistance(dist)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {r.cuisineTags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] text-text-muted">
                {t}
              </span>
            ))}
          </div>
          <span className="px-3 py-2 rounded-[100px] bg-brand text-white text-[11px] font-bold min-h-[44px] flex items-center justify-center">
            Book →
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={href}
      className="group block shrink-0 w-[220px] md:w-auto rounded-[16px] overflow-hidden bg-card border border-border hover:border-border-strong transition-all touch-manipulation"
    >
      {cardContent}
    </Link>
  );
}
