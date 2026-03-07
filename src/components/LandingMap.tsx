"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map, Marker, Circle, TileLayer } from "leaflet";
import type { Restaurant } from "@/types";
import { isOpenNow } from "@/lib/hours";
import { getRestaurantPath } from "@/lib/restaurants/url";
import { getPinColor, getPinEmoji } from "@/lib/map/cuisine";
import { getDistanceKm, formatDistance } from "@/lib/map/distance";
import { getTileUrl } from "@/lib/map/tiles";
import { useThemeStore } from "@/stores/themeStore";

const BANGKOK = { lat: 13.7563, lng: 100.5018 } as const;
const RADIUS_OPTIONS = [1, 3, 5, 10, 20] as const;
const BANGKOK_BOUNDS = {
  sw: [13.45, 100.25] as [number, number],
  ne: [14.0, 100.95] as [number, number],
};

const STATUS_STYLES = {
  open: { bg: "rgba(61,170,110,0.12)", color: "#3DAA6E" },
  busy: { bg: "rgba(224,155,45,0.12)", color: "#E09B2D" },
  closed: { bg: "rgba(232,64,64,0.12)", color: "#E84040" },
} as const;

function getStatus(restaurant: Restaurant): "open" | "busy" | "closed" {
  const { open } = isOpenNow(restaurant.openingHours);
  return open ? "open" : "closed";
}

interface LandingMapProps {
  userLat: number | null;
  userLng: number | null;
  loading: boolean;
  restaurants: Restaurant[];
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onLocationUpdate: (lat: number, lng: number) => void;
}

export function LandingMap({
  userLat,
  userLng,
  loading,
  restaurants,
  radiusKm,
  onRadiusChange,
  onLocationUpdate,
}: LandingMapProps) {
  const theme = useThemeStore((s) => s.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const restaurantMarkersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const centerLat = userLat ?? BANGKOK.lat;
  const centerLng = userLng ?? BANGKOK.lng;
  const zoom = 13;

  const filteredRestaurants = restaurants.filter((r) => {
    const d = getDistanceKm(centerLat, centerLng, r.geo.lat, r.geo.lng);
    return d <= radiusKm;
  });

  const initMap = useCallback(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const stored = useThemeStore.getState().theme;
    const docTheme = document.documentElement.getAttribute("data-theme");
    const currentTheme = (docTheme === "dark" || docTheme === "light" ? docTheme : stored) as "light" | "dark";
    const tileUrl = getTileUrl(currentTheme);

    const map = L.map(containerRef.current, {
      zoomControl: false,
      minZoom: 11,
      maxZoom: 18,
    }).setView([BANGKOK.lat, BANGKOK.lng], 13);

    const bounds = L.latLngBounds(
      L.latLng(BANGKOK_BOUNDS.sw[0], BANGKOK_BOUNDS.sw[1]),
      L.latLng(BANGKOK_BOUNDS.ne[0], BANGKOK_BOUNDS.ne[1])
    );
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 1.0;

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    initMap();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      circleRef.current = null;
      userMarkerRef.current = null;
      restaurantMarkersRef.current = [];
    };
  }, []);

  // Swap tile layer when theme changes
  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L || !mapReady) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    const tileLayer = L.tileLayer(getTileUrl(theme), {
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [theme, mapReady]);

  // Update center when user location changes (initial load)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setView([centerLat, centerLng], zoom);
  }, [centerLat, centerLng, zoom, mapReady]);

  // User location marker (blue pulsing dot)
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
        html: `<div style="
          width:20px;height:20px;border-radius:50%;
          background:#4A90E2;border:3px solid white;
          box-shadow:0 0 0 6px rgba(74,144,226,0.22);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([userLat, userLng], { icon }).addTo(map);
      userMarkerRef.current = marker;
    }
  }, [userLat, userLng, mapReady]);

  // Radius circle
  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L || !mapReady) return;

    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    const circle = L.circle([centerLat, centerLng], {
      color: "#D32424",
      weight: 1.5,
      dashArray: "8 5",
      fillColor: "#D32424",
      fillOpacity: 0.05,
      radius: radiusKm * 1000,
    }).addTo(map);
    circleRef.current = circle;
  }, [centerLat, centerLng, radiusKm, mapReady]);

  // Restaurant pins
  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L || !mapReady) return;

    restaurantMarkersRef.current.forEach((m) => map.removeLayer(m));
    restaurantMarkersRef.current = [];

    filteredRestaurants.forEach((r) => {
      const cuisine = r.cuisineTags[0];
      const color = getPinColor(r.cuisineTags, cuisine);
      const emoji = getPinEmoji(r.cuisineTags, cuisine);

      const icon = L.divIcon({
        className: "restaurant-pin",
        html: `<div style="width:34px;height:34px;position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="width:30px;height:30px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);"></div>
          <span style="position:absolute;font-size:13px;">${emoji}</span>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 30],
        popupAnchor: [0, -30],
      });

      const marker = L.marker([r.geo.lat, r.geo.lng], { icon })
        .addTo(map)
        .on("click", () => {});

      const dist = getDistanceKm(centerLat, centerLng, r.geo.lat, r.geo.lng);
      const status = getStatus(r);
      const statusStyle = STATUS_STYLES[status];
      const displayRating = r.googleRating ?? r.rating;

      const popupContent = document.createElement("div");
      popupContent.className = "map-popup-content";
      popupContent.style.cssText = `
        font-family: var(--font-sans), sans-serif;
        padding: 14px 16px;
        min-width: 200px;
        border-radius: 16px;
        color: var(--text-primary);
      `;
      popupContent.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px;">
          <div style="font-family:var(--font-sans),system-ui,sans-serif;font-size:15px;font-weight:700;color:var(--text-primary);">${r.name}</div>
          <div style="font-size:12px;font-weight:700;color:var(--gold);">★ ${displayRating.toFixed(1)}</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">${r.cuisineTags.join(", ") || r.area}</div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
          <span style="font-size:10px;font-weight:600;padding:3px 9px;border-radius:100px;background:var(--card);color:var(--text-secondary);">${formatDistance(dist)} away</span>
          <span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;background:${statusStyle.bg};color:${statusStyle.color};">${status}</span>
        </div>
        <a href="/restaurant/${getRestaurantPath(r) || r.id}" style="display:block;text-align:center;background:var(--brand);color:white;padding:9px 16px;border-radius:100px;font-size:12px;font-weight:700;text-decoration:none;">View Details →</a>
      `;

      marker.bindPopup(popupContent);
      restaurantMarkersRef.current.push(marker);
    });
  }, [filteredRestaurants, centerLat, centerLng, mapReady]);

  return (
    <div className="landing-map-wrapper relative w-full h-full min-h-[380px] rounded-t-[20px] md:rounded-none overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="map-loading-overlay">
          <div className="map-loading-overlay-spinner" />
        </div>
      )}

      {/* Map overlay UI - radius + found badge */}
      <div className="map-overlay-ui">
        <div className="radius-row">
          {RADIUS_OPTIONS.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadiusChange(km)}
              className={`ropt ${radiusKm === km ? "active" : ""}`}
            >
              {km} km
            </button>
          ))}
        </div>
        <div className="found-badge">
          <div className="found-dot" />
          <div>
            <span className="found-n" id="found-text">
              {loading ? "Locating..." : `${filteredRestaurants.length} restaurants nearby`}
            </span>
            <span className="found-sub">
              {loading ? "" : " · tap a pin to preview"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
