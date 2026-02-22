"use client";

import { useState } from "react";
import { Geo } from "@/types";
import { Button } from "@/components/ui/button";

interface MapSectionProps { geo: Geo; address: string; name: string; }

export function MapSection({ geo, address, name }: MapSectionProps) {
  const [copied, setCopied] = useState(false);
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${geo.lng - 0.005},${geo.lat - 0.003},${geo.lng + 0.005},${geo.lat + 0.003}&layer=mapnik&marker=${geo.lat},${geo.lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`;

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
      <h2 className="font-serif text-[24px] font-bold text-text-primary tracking-[-0.5px] mb-3">Location</h2>
      <div className="rounded-[var(--radius-lg)] overflow-hidden border border-border">
        <iframe title={`Map of ${name}`} width="100%" height="250" src={osmUrl} className="border-0" loading="lazy" />
      </div>
      <p className="text-[13px] text-text-muted mt-3">{address}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Open in Google Maps
          </Button>
        </a>
        <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          {copied ? "Copied!" : "Copy address"}
        </Button>
      </div>
    </section>
  );
}
