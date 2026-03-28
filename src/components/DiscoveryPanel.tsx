"use client";

/* eslint-disable @typescript-eslint/no-require-imports -- Leaflet loaded dynamically for SSR */
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Map, Marker, Circle, TileLayer } from "leaflet";
import type { Restaurant } from "@/types";
import { useLanguageStore } from "@/stores/languageStore";
import { useThemeStore } from "@/stores/themeStore";
import { t } from "@/lib/i18n/translations";
import { isOpenNow } from "@/lib/hours";
import { getRestaurantPath } from "@/lib/restaurants/url";
import { getPinColor, getPinEmoji } from "@/lib/map/cuisine";
import { getDistanceKm, formatDistance } from "@/lib/map/distance";
import { getTileUrl } from "@/lib/map/tiles";
import { registerLeafletGestureHandling } from "@/lib/map/registerLeafletGestureHandling";
import { cn } from "@/lib/utils";

const BANGKOK = { lat: 13.7563, lng: 100.5018 } as const;
const RADIUS_OPTIONS = [1, 3, 5, 10, 20] as const;
const BANGKOK_BOUNDS = { sw: [13.45, 100.25] as [number, number], ne: [14.0, 100.95] as [number, number] };

const STATUS_STYLES = {
  open: { bg: "rgba(61,170,110,0.14)", color: "#3DAA6E" },
  busy: { bg: "rgba(224,155,45,0.14)", color: "#E09B2D" },
  closed: { bg: "rgba(232,64,64,0.14)", color: "#E84040" },
} as const;

function getStatus(r: Restaurant): "open" | "busy" | "closed" {
  const { open } = isOpenNow(r.openingHours);
  return open ? "open" : "closed";
}

interface DiscoveryPanelProps {
  userLat: number | null;
  userLng: number | null;
  loading: boolean;
  restaurants: Restaurant[];
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  /** Mobile map-first layout */
  mobile?: boolean;
  /** Called when a map pin is clicked (mobile) */
  onMarkerClick?: (id: string) => void;
  /** Externally selected restaurant (e.g. from bottom sheet card) */
  selectedId?: string | null;
  /** Called when a list/sheet card is clicked (mobile) */
  onCardSelect?: (r: Restaurant) => void;
}

export function DiscoveryPanel({
  userLat,
  userLng,
  loading,
  restaurants,
  radiusKm,
  onRadiusChange,
  mobile: _mobile = false,
  onMarkerClick,
  selectedId: externalSelectedId,
  onCardSelect,
}: DiscoveryPanelProps) {
  const lang = useLanguageStore((s) => s.lang);
  const theme = useThemeStore((s) => s.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = externalSelectedId ?? internalSelectedId;

  const centerLat = userLat ?? BANGKOK.lat;
  const centerLng = userLng ?? BANGKOK.lng;

  const filteredRestaurants = restaurants
    .filter((r) => getDistanceKm(centerLat, centerLng, r.geo.lat, r.geo.lng) <= radiusKm)
    .sort(
      (a, b) =>
        getDistanceKm(centerLat, centerLng, a.geo.lat, a.geo.lng) -
        getDistanceKm(centerLat, centerLng, b.geo.lat, b.geo.lng)
    );

  const initMap = useCallback(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const L = require("leaflet");
    registerLeafletGestureHandling();
    const stored = useThemeStore.getState().theme;
    const docTheme = document.documentElement.getAttribute("data-theme");
    const currentTheme = (docTheme === "dark" || docTheme === "light" ? docTheme : stored) as "light" | "dark";
    const tileUrl = getTileUrl(currentTheme);

    const langAtInit = useLanguageStore.getState().lang;
    const gestureOpts = _mobile
      ? {
          gestureHandling: true as const,
          gestureHandlingOptions: {
            duration: 1200,
            text: {
              touch: t(langAtInit, "mapGestureTwoFingers"),
              scroll: t(langAtInit, "mapGestureScrollCtrl"),
              scrollMac: t(langAtInit, "mapGestureScrollMac"),
            },
          },
        }
      : {};

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 11,
      maxZoom: 18,
      ...gestureOpts,
    }).setView([BANGKOK.lat, BANGKOK.lng], 12);

    const bounds = L.latLngBounds(
      L.latLng(BANGKOK_BOUNDS.sw[0], BANGKOK_BOUNDS.sw[1]),
      L.latLng(BANGKOK_BOUNDS.ne[0], BANGKOK_BOUNDS.ne[1])
    );
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 1.0;

    const tileLayer = L.tileLayer(tileUrl, { attribution: "" }).addTo(map);
    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    queueMicrotask(() => setMapReady(true));
  }, [_mobile]);

  useEffect(() => {
    initMap();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      circleRef.current = null;
      userMarkerRef.current = null;
      markersRef.current = {};
    };
  }, [initMap]);

  /** Keep gesture hint copy in sync with app language (mobile map). */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !_mobile || !mapReady) return;
    const mac =
      typeof navigator !== "undefined" &&
      (navigator.platform?.toUpperCase().includes("MAC") ?? false);
    el.setAttribute("data-gesture-handling-touch-content", t(lang, "mapGestureTwoFingers"));
    el.setAttribute(
      "data-gesture-handling-scroll-content",
      mac ? t(lang, "mapGestureScrollMac") : t(lang, "mapGestureScrollCtrl"),
    );
  }, [lang, mapReady, _mobile, t]);

  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L || !mapReady) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    const tileUrl = getTileUrl(theme);
    const tileLayer = L.tileLayer(tileUrl, { attribution: "" }).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [theme, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setView([centerLat, centerLng], 12);
  }, [centerLat, centerLng, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L || !mapReady) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userLat != null && userLng != null) {
      const icon = L.divIcon({
        className: "user-location-marker",
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 0 0 6px rgba(74,144,226,0.22);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([userLat, userLng], { icon }).addTo(map);
      userMarkerRef.current = marker;
    }
  }, [userLat, userLng, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L || !mapReady) return;

    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    const circle = L.circle([centerLat, centerLng], {
      color: "#E0052D",
      weight: 1.5,
      dashArray: "8 5",
      fillColor: "#E0052D",
      fillOpacity: 0.05,
      radius: radiusKm * 1000,
    }).addTo(map);
    circleRef.current = circle;
  }, [centerLat, centerLng, radiusKm, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L || !mapReady) return;

    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    filteredRestaurants.forEach((r) => {
      const cuisine = r.cuisineTags[0];
      const color = getPinColor(r.cuisineTags, cuisine);
      const emoji = getPinEmoji(r.cuisineTags, cuisine);
      const icon = L.divIcon({
        className: "restaurant-pin",
        html: `<div style="width:34px;height:34px;position:relative;display:flex;align-items:center;justify-content:center;"><div style="width:30px;height:30px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.35);"></div><span style="position:absolute;font-size:13px;">${emoji}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 30],
        popupAnchor: [0, -32],
      });

      const dist = getDistanceKm(centerLat, centerLng, r.geo.lat, r.geo.lng);
      const status = getStatus(r);
      const statusStyle = STATUS_STYLES[status];
      const displayRating = r.googleRating ?? r.rating;

      const popupContent = document.createElement("div");
      popupContent.style.cssText = "font-family:'DM Sans',sans-serif;padding:14px 16px;min-width:200px;border-radius:16px;";
      popupContent.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px;">
          <div style="font-family:'DM Sans',system-ui,sans-serif;font-size:15px;font-weight:700;color:#F5F4EF;">${r.name}</div>
          <div style="font-size:12px;font-weight:700;color:#E09B2D;">★ ${displayRating.toFixed(1)}</div>
        </div>
        <div style="font-size:11px;color:#5C5B54;margin-bottom:10px;">${r.cuisineTags.join(", ") || r.area}</div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
          <span style="font-size:10px;font-weight:600;padding:3px 9px;border-radius:100px;background:#1a1a1a;color:#A09F97;">${formatDistance(dist)} ${t(lang, "away")}</span>
          <span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;background:${statusStyle.bg};color:${statusStyle.color};">${t(lang, status)}</span>
        </div>
        <a href="/restaurant/${getRestaurantPath(r) || r.id}" style="display:block;text-align:center;background:#E0052D;color:white;padding:9px 16px;border-radius:100px;font-size:12px;font-weight:700;text-decoration:none;">${t(lang, "viewDetails")}</a>
      `;

      const marker = L.marker([r.geo.lat, r.geo.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent)
        .on("click", () => {
          setInternalSelectedId(r.id);
          onMarkerClick?.(r.id);
          const card = listRef.current?.querySelector(`[data-restaurant-id="${r.id}"]`);
          card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });

      markersRef.current[r.id] = marker;
    });
  }, [filteredRestaurants, centerLat, centerLng, mapReady, lang, onMarkerClick]);

  // When external selectedId changes (e.g. from bottom sheet card), pan and open popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !externalSelectedId) return;
    const marker = markersRef.current[externalSelectedId];
    if (marker) {
      const r = filteredRestaurants.find((x) => x.id === externalSelectedId);
      if (r) {
        map.panTo([r.geo.lat, r.geo.lng], { animate: true });
        marker.openPopup();
      }
    }
  }, [externalSelectedId, mapReady, filteredRestaurants]);

  const handleCardClick = useCallback(
    (r: Restaurant) => {
      setInternalSelectedId(r.id);
      onCardSelect?.(r);
      const map = mapRef.current;
      const marker = markersRef.current[r.id];
      if (map && marker) {
        map.panTo([r.geo.lat, r.geo.lng], { animate: true });
        marker.openPopup();
      }
    },
    [onCardSelect]
  );

  return (
    <section id="mts-discovery-panel" className="discovery-panel">
      <div className="map-col">
        <div
          ref={containerRef}
          className={cn("map-inner", _mobile && lang === "my" && "font-my")}
        />
        {loading && (
          <div className="map-loading">
            <div className="map-loading-spinner" />
          </div>
        )}
        <div className="map-overlay-ui">
          <div className="radius-row">
            {RADIUS_OPTIONS.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => onRadiusChange(km)}
                className={`ropt ${radiusKm === km ? "active" : ""}`}
              >
                {km} {t(lang, "km")}
              </button>
            ))}
          </div>
          <div className="found-badge">
            <div className="found-dot" />
            <span className="found-n">
              {loading ? t(lang, "locating") : `${filteredRestaurants.length} ${t(lang, "restaurantsNearby")}`}
            </span>
            <span className="found-sub">{t(lang, "tapPin")}</span>
          </div>
        </div>
      </div>

      <div ref={listRef} className="list-col" id="restaurant-list">
        {filteredRestaurants.map((r) => {
          const status = getStatus(r);
          const dist = getDistanceKm(centerLat, centerLng, r.geo.lat, r.geo.lng);
          const displayRating = r.googleRating ?? r.rating;
          const emoji = getPinEmoji(r.cuisineTags, r.cuisineTags[0]);
          const hasImage = r.imageUrl?.trim().length > 0;
          const isActive = selectedId === r.id;

          return (
            <div
              key={r.id}
              data-restaurant-id={r.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(r)}
              onKeyDown={(e) => e.key === "Enter" && handleCardClick(r)}
              className={`list-card ${isActive ? "active" : ""}`}
            >
              <div className="lc-img">
                {hasImage ? (
                  <Image src={r.imageUrl} alt={r.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <span>{emoji}</span>
                )}
              </div>
              <div className="lc-body">
                <div className="lc-top">
                  <div className="lc-name">{r.name}</div>
                  <div className="lc-rating">★ {displayRating.toFixed(1)}</div>
                </div>
                <div className="lc-meta">
                  {r.cuisineTags[0] || r.area} · {formatDistance(dist)}
                </div>
                <div className="lc-footer">
                  <span className={`lc-status ${status}`}>{t(lang, status)}</span>
                  <Link
                    href={`/restaurant/${getRestaurantPath(r) || r.id}`}
                    className="lc-btn"
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
    </section>
  );
}
