import type { SupabaseClient } from "@supabase/supabase-js";

/** A dish that can be used as a public filter (row of `dish_tags`). */
export interface DishTag {
  id: string;
  slug: string;
  nameEn: string;
  nameMy: string | null;
  sortOrder: number;
}

/** Shape of a `dish_tags` row as returned by PostgREST. */
export interface DishTagRow {
  id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export function transformDishTag(row: DishTagRow): DishTag {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameMy: row.name_my,
    sortOrder: row.sort_order ?? 0,
  };
}

/** Columns selected wherever dish tags are read. */
export const DISH_TAG_COLUMNS = "id, slug, name_en, name_my, sort_order";

/**
 * True when the error means the dish tag tables do not exist yet, i.e.
 * migration 019 has not been applied. PostgREST reports an unknown table
 * as PGRST205 (schema cache) and Postgres as 42P01 (undefined_table).
 */
function isMissingTableError(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

/**
 * Fetch the active dish tags, ordered for display.
 *
 * Returns `null` when the table does not exist yet, so callers can fall
 * back to the pre-migration defaults instead of hiding the filter. Any
 * other failure yields [] — the listing must not break.
 */
export async function fetchActiveDishTags(
  supabase: SupabaseClient,
): Promise<DishTag[] | null> {
  const { data, error } = await supabase
    .from("dish_tags")
    .select(DISH_TAG_COLUMNS)
    .eq("is_active", true)
    .order("sort_order")
    .order("name_en");

  if (isMissingTableError(error)) return null;
  if (error || !data) return [];
  return (data as DishTagRow[]).map(transformDishTag);
}

/**
 * Map restaurant id -> dish tag slugs, for the given restaurants.
 *
 * Pass `restaurantIds` to scope the query; omit it to fetch all pairings.
 * Returns `null` when the table does not exist yet (migration 019 not
 * applied) so callers can substitute the fallback mapping.
 */
export async function fetchDishTagSlugsByRestaurant(
  supabase: SupabaseClient,
  restaurantIds?: string[],
): Promise<Map<string, string[]> | null> {
  const byRestaurant = new Map<string, string[]>();

  if (restaurantIds && restaurantIds.length === 0) return byRestaurant;

  let query = supabase
    .from("restaurant_dish_tags")
    .select("restaurant_id, dish_tags(slug)");

  if (restaurantIds) {
    query = query.in("restaurant_id", restaurantIds);
  }

  const { data, error } = await query;
  if (isMissingTableError(error)) return null;
  if (error || !data) return byRestaurant;

  for (const row of data as {
    restaurant_id: string;
    // PostgREST returns an object for a to-one embed, but types vary by
    // client version, so accept either shape.
    dish_tags: { slug: string } | { slug: string }[] | null;
  }[]) {
    const embed = row.dish_tags;
    const slug = Array.isArray(embed) ? embed[0]?.slug : embed?.slug;
    if (!slug) continue;

    const existing = byRestaurant.get(row.restaurant_id);
    if (existing) existing.push(slug);
    else byRestaurant.set(row.restaurant_id, [slug]);
  }

  return byRestaurant;
}

/**
 * Replace a restaurant's dish tags with exactly `slugs`.
 *
 * Deletes removed pairings and inserts new ones. Unknown slugs are
 * ignored rather than erroring, so a stale client cannot break a save.
 */
export async function setRestaurantDishTags(
  supabase: SupabaseClient,
  restaurantId: string,
  slugs: string[],
): Promise<void> {
  const wanted = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];

  // Resolve slugs -> ids. Anything unrecognised is silently dropped.
  let wantedIds: string[] = [];
  if (wanted.length > 0) {
    const { data } = await supabase
      .from("dish_tags")
      .select("id, slug")
      .in("slug", wanted);
    wantedIds = ((data ?? []) as { id: string; slug: string }[]).map((d) => d.id);
  }

  const { data: currentRows } = await supabase
    .from("restaurant_dish_tags")
    .select("dish_tag_id")
    .eq("restaurant_id", restaurantId);

  const currentIds = ((currentRows ?? []) as { dish_tag_id: string }[]).map(
    (r) => r.dish_tag_id,
  );

  const toRemove = currentIds.filter((id) => !wantedIds.includes(id));
  const toAdd = wantedIds.filter((id) => !currentIds.includes(id));

  if (toRemove.length > 0) {
    await supabase
      .from("restaurant_dish_tags")
      .delete()
      .eq("restaurant_id", restaurantId)
      .in("dish_tag_id", toRemove);
  }

  if (toAdd.length > 0) {
    await supabase.from("restaurant_dish_tags").insert(
      toAdd.map((dish_tag_id) => ({
        restaurant_id: restaurantId,
        dish_tag_id,
        source: "manual",
      })),
    );
  }
}

/** Localised label for a dish tag. Falls back to English. */
export function dishTagLabel(tag: DishTag, lang: string): string {
  if (lang === "my" && tag.nameMy) return tag.nameMy;
  return tag.nameEn;
}

/**
 * Dish tags for display, falling back to the built-in defaults when
 * migration 019 has not been applied. Never returns null, so the filter
 * pills always render.
 */
export async function resolveDishTags(
  supabase: SupabaseClient,
): Promise<DishTag[]> {
  const tags = await fetchActiveDishTags(supabase);
  if (tags !== null) return tags;

  const { FALLBACK_DISH_TAGS } = await import("./fallback");
  return [...FALLBACK_DISH_TAGS];
}

/**
 * restaurantId -> dish slugs, falling back to menu-derived + legacy
 * matching when the dish tag tables are absent.
 */
export async function resolveDishTagSlugsByRestaurant(
  supabase: SupabaseClient,
  restaurants: { id: string; name: string }[],
): Promise<Map<string, string[]>> {
  const ids = restaurants.map((r) => r.id);
  const mapped = await fetchDishTagSlugsByRestaurant(supabase, ids);
  if (mapped !== null) return mapped;

  const { buildFallbackDishTagMap } = await import("./fallback");
  return buildFallbackDishTagMap(supabase, restaurants);
}
