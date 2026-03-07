"use client";

import { t } from "@/lib/i18n/translations";
import { useLanguageStore } from "@/stores/languageStore";

const RADIUS_OPTIONS = [1, 3, 5, 10, 20] as const;

interface MobileRadiusFloatProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
}

export function MobileRadiusFloat({ radiusKm, onRadiusChange }: MobileRadiusFloatProps) {
  const lang = useLanguageStore((s) => s.lang);

  return (
    <div className="radius-float">
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
  );
}
