import type { SupabaseClient } from "@supabase/supabase-js";
import type { DishTag } from "./index";
import { dishSlugsForMenuItem } from "./menuScan";

/**
 * Fallback dish tags for when migration 019 has not been applied yet.
 *
 * The dish filter is a primary way users find a restaurant serving a given
 * dish, so it must never silently disappear. When the `dish_tags` table is
 * missing we still render the pills and derive the per-restaurant mapping
 * from data we already have:
 *
 *   1. `menu_items` names matched against known aliases (authoritative where
 *      menu data exists), plus
 *   2. a legacy hard-coded name list, which covers restaurants that have no
 *      menu rows (currently ~86% of them).
 *
 * Once 019 is applied the real table takes over and none of this runs.
 */

/** Dishes offered as filters before the taxonomy table exists. */
export const FALLBACK_DISH_TAGS: readonly DishTag[] = [
  {
    id: "fallback-moh-hin-gar",
    slug: "moh-hin-gar",
    nameEn: "Moh Hin Gar",
    nameMy: "မုန့်ဟင်းခါး",
    sortOrder: 10,
  },
];

/**
 * Restaurants historically flagged as serving Moh Hin Gar.
 *
 * Superseded by `restaurant_dish_tags`; retained only so the filter keeps
 * working pre-migration. Matching is by normalized name.
 */
const LEGACY_DISH_RESTAURANT_NAMES: Record<string, readonly string[]> = {
  "moh-hin-gar": [
    "Alinga Tea & Dining-Ramma 9",
    "Asian Taste by Mhway Mhway Lay",
    "Hometown Burmese Restaurant",
    "Kitchen Ayeyarwady",
    "Mandalay Food House",
    "Shwe Tea House & Noodles",
    "The Burma Food House",
    "The Daily Dish",
    "YGN Tea & Food - On Nut",
  ],
};

/** Normalize a restaurant name for resilient matching. */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const LEGACY_NAME_SETS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(LEGACY_DISH_RESTAURANT_NAMES).map(([slug, names]) => [
    slug,
    new Set(names.map(normalizeName)),
  ]),
);

/**
 * Build restaurantId -> dish slugs without using the dish tag tables.
 *
 * `restaurants` must supply id and name so the legacy list can be applied.
 */
export async function buildFallbackDishTagMap(
  supabase: SupabaseClient,
  restaurants: { id: string; name: string }[],
): Promise<Map<string, string[]>> {
  const byRestaurant = new Map<string, Set<string>>();

  const add = (restaurantId: string, slug: string) => {
    const set = byRestaurant.get(restaurantId);
    if (set) set.add(slug);
    else byRestaurant.set(restaurantId, new Set([slug]));
  };

  // 1. Legacy name list - covers restaurants with no menu data.
  for (const r of restaurants) {
    const normalized = normalizeName(r.name ?? "");
    for (const [slug, names] of Object.entries(LEGACY_NAME_SETS)) {
      if (names.has(normalized)) add(r.id, slug);
    }
  }

  // 2. Menu scan - catches restaurants the legacy list missed.
  try {
    const ids = restaurants.map((r) => r.id);
    if (ids.length > 0) {
      const { data: categories } = await supabase
        .from("menu_categories")
        .select("id, restaurant_id")
        .in("restaurant_id", ids);

      const categoryRows = (categories ?? []) as {
        id: string;
        restaurant_id: string;
      }[];

      if (categoryRows.length > 0) {
        const restaurantIdByCategory = new Map(
          categoryRows.map((c) => [c.id, c.restaurant_id]),
        );

        const { data: items } = await supabase
          .from("menu_items")
          .select("name, category_id")
          .in(
            "category_id",
            categoryRows.map((c) => c.id),
          );

        for (const item of (items ?? []) as {
          name: string;
          category_id: string;
        }[]) {
          const restaurantId = restaurantIdByCategory.get(item.category_id);
          if (!restaurantId) continue;
          for (const slug of dishSlugsForMenuItem(item.name ?? "")) {
            add(restaurantId, slug);
          }
        }
      }
    }
  } catch {
    // Menu tables unavailable; the legacy list alone still powers the filter.
  }

  return new Map(
    [...byRestaurant].map(([id, slugs]) => [id, [...slugs]]),
  );
}
