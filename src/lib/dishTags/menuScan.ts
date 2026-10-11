/**
 * Menu-derived dish detection.
 *
 * Used by the backfill script (scripts/backfill-dish-tags.mjs) and by the
 * admin "suggested from menu" hint. This is a *suggestion* source only:
 * `restaurant_dish_tags.source = 'manual'` always wins, because only ~14%
 * of restaurants currently have menu data, so absence of a menu match
 * proves nothing.
 */

/** Substring aliases per dish slug, matched case-insensitively. */
export const DISH_MENU_ALIASES: Record<string, readonly string[]> = {
  "moh-hin-gar": [
    "mohinga",
    "moh hin gar",
    "moh hin gah",
    "mont hin gar",
    "monhinga",
    "mohhinga",
    "မုန့်ဟင်းခါး",
  ],
};

/** Normalize for loose matching: lowercase, collapse non-alphanumerics. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\u1000-\u109f]+/g, " ").trim();
}

/**
 * Does this menu item name indicate the given dish?
 * Returns false for an unknown slug.
 */
export function menuItemMatchesDish(
  itemName: string,
  dishSlug: string,
): boolean {
  const aliases = DISH_MENU_ALIASES[dishSlug];
  if (!aliases) return false;

  const haystack = normalize(itemName);
  if (!haystack) return false;

  return aliases.some((alias) => haystack.includes(normalize(alias)));
}

/** All dish slugs suggested by a single menu item name. */
export function dishSlugsForMenuItem(itemName: string): string[] {
  return Object.keys(DISH_MENU_ALIASES).filter((slug) =>
    menuItemMatchesDish(itemName, slug),
  );
}
