"use client";

import { useState } from "react";
import { t } from "@/lib/i18n/translations";
import { useLanguageStore } from "@/stores/languageStore";

const RADIUS_OPTIONS = [1, 3, 5, 10, 20] as const;

interface MobileRadiusFloatProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
}

export function MobileRadiusFloat({ radiusKm, onRadiusChange }: MobileRadiusFloatProps) {
  const lang = useLanguageStore((s) => s.lang);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`radius-float ${expanded ? "radius-float-expanded" : "radius-float-collapsed"}`}>
      {RADIUS_OPTIONS.map((km) => (
        <button
          key={km}
          type="button"
          onClick={() => {
            if (!expanded && radiusKm === km) {
              setExpanded(true);
              return;
            }
            onRadiusChange(km);
            setExpanded(false);
          }}
          className={`ropt ${radiusKm === km ? "active" : ""}`}
          aria-expanded={radiusKm === km ? expanded : undefined}
        >
          {km} {t(lang, "km")}
        </button>
      ))}
    </div>
  );
}
