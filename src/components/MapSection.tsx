"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, TileLayer } from "leaflet";
import { Geo } from "@/types";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/stores/languageStore";
import { useThemeStore } from "@/stores/themeStore";
import { t } from "@/lib/i18n/translations";
import { getTileUrl } from "@/lib/map/tiles";

interface MapSectionProps { geo: Geo; address: string; name: string; lang: Lang; }

export function MapSection({ geo, address, name, lang }: MapSectionProps) {
  const theme = useThemeStore((s) => s.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const [copied, setCopied] = useState(false);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`;

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    if (mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const stored = useThemeStore.getState().theme;
    const docTheme = document.documentElement.getAttribute("data-theme");
    const currentTheme = (docTheme === "dark" || docTheme === "light" ? docTheme : stored) as "light" | "dark";
    const tileUrl = getTileUrl(currentTheme);

    const map = L.map(containerRef.current, {
      zoomControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    }).setView([geo.lat, geo.lng], 16);

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const icon = L.divIcon({
      className: "restaurant-pin",
      html: `<div style="width:34px;height:34px;position:relative;display:flex;align-items:center;justify-content:center;"><div style="width:30px;height:30px;background:#D32424;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.35);"></div><span style="position:absolute;font-size:14px;">📍</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 30],
    });

    L.marker([geo.lat, geo.lng], { icon }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [geo.lat, geo.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const L = typeof window !== "undefined" ? require("leaflet") : null;
    if (!map || !L) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    const tileLayer = L.tileLayer(getTileUrl(theme), {
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [theme]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea"); el.value = address;
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section>
      <h2 className="text-[18px] font-semibold text-text-primary mb-3">
        {t(lang, "location")}
      </h2>
      <div
        ref={containerRef}
        className="rounded-[var(--radius-md)] overflow-hidden border border-border"
        style={{ height: 220 }}
        title={`Map of ${name}`}
      />
      <p className="text-[13px] text-text-secondary mt-2">{address}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t(lang, "openInGoogleMaps")}
          </Button>
        </a>
        <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          {copied ? t(lang, "copied") : t(lang, "copyAddress")}
        </Button>
      </div>
    </section>
  );
}
