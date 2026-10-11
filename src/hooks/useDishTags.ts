"use client";

import { useEffect, useState } from "react";
import type { DishTag } from "@/lib/dishTags";
import { FALLBACK_DISH_TAGS } from "@/lib/dishTags/fallback";

/**
 * Active dish tags, loaded from /api/dish-tags.
 *
 * Seeded with the built-in defaults so the filter pills are present on the
 * very first render — they are a primary way users find a dish, so they must
 * not pop in late or vanish if the request fails. The fetched list replaces
 * the seed as soon as it arrives.
 */
export function useDishTags(): { dishTags: DishTag[]; loading: boolean } {
  const [dishTags, setDishTags] = useState<DishTag[]>([...FALLBACK_DISH_TAGS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/dish-tags");
        if (!res.ok) throw new Error("Failed to load dish tags");
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setDishTags(data);
      } catch {
        // Keep the seeded defaults rather than hiding the filter.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { dishTags, loading };
}
