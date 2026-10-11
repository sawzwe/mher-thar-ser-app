#!/usr/bin/env node
/**
 * Backfill restaurant_dish_tags by scanning menu_items for known dish names.
 *
 * Requires migration 019 to have been applied.
 *
 * Usage:
 *   node scripts/backfill-dish-tags.mjs            # dry run, prints a plan
 *   node scripts/backfill-dish-tags.mjs --apply    # writes rows
 *
 * Notes:
 *   - Only inserts rows with source='menu_scan'. Existing rows (including
 *     'manual' ones created by migration 019) are never modified or deleted,
 *     so admin decisions always win.
 *   - Menu coverage is partial (~14% of restaurants have menu items), so the
 *     absence of a match proves nothing. This only ever *adds* tags.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Aliases. Keep in sync with src/lib/dishTags/menuScan.ts ──────────
const DISH_MENU_ALIASES = {
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

const normalize = (text) =>
  text.toLowerCase().replace(/[^a-z0-9\u1000-\u109f]+/g, " ").trim();

function dishSlugsForMenuItem(itemName) {
  const haystack = normalize(itemName);
  if (!haystack) return [];
  return Object.keys(DISH_MENU_ALIASES).filter((slug) =>
    DISH_MENU_ALIASES[slug].some((alias) => haystack.includes(normalize(alias))),
  );
}

// ── Env ──────────────────────────────────────────────────────────────
function readEnv(key) {
  const env = readFileSync(resolve(ROOT, ".env.local"), "utf8");
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? readEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${await res.text()}`);
  }
  // Inserts return 201 with an empty body unless Prefer: return=representation.
  const body = await res.text();
  return body ? JSON.parse(body) : null;
}

/**
 * GET every row, paging past PostgREST's max-rows cap (1000 by default).
 * Without this the scan silently sees only the first page.
 */
const PAGE_SIZE = 1000;

async function restAll(path) {
  const all = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await rest(path, {
      headers: { Range: `${offset}-${offset + PAGE_SIZE - 1}` },
    });
    all.push(...page);
    if (page.length < PAGE_SIZE) return all;
  }
}

// ── Main ─────────────────────────────────────────────────────────────
const APPLY = process.argv.includes("--apply");

async function main() {
  // 1. Dish tag slug -> id
  const dishTagRows = await rest("dish_tags?select=id,slug");
  if (dishTagRows.length === 0) {
    console.error("No dish_tags found. Apply migration 019 first.");
    process.exit(1);
  }
  const dishIdBySlug = new Map(dishTagRows.map((d) => [d.slug, d.id]));

  // 2. Menu items -> category -> restaurant
  const [menuItems, categories, restaurants] = await Promise.all([
    restAll("menu_items?select=name,category_id&order=id"),
    restAll("menu_categories?select=id,restaurant_id&order=id"),
    restAll("restaurants?select=id,name&order=id"),
  ]);

  const restaurantIdByCategory = new Map(
    categories.map((c) => [c.id, c.restaurant_id]),
  );
  const nameById = new Map(restaurants.map((r) => [r.id, r.name]));

  // 3. restaurantId -> Set<dishSlug>
  const detected = new Map();
  for (const item of menuItems) {
    const slugs = dishSlugsForMenuItem(item.name ?? "");
    if (slugs.length === 0) continue;
    const restaurantId = restaurantIdByCategory.get(item.category_id);
    if (!restaurantId) continue;
    const set = detected.get(restaurantId) ?? new Set();
    slugs.forEach((s) => set.add(s));
    detected.set(restaurantId, set);
  }

  // 4. Skip pairings that already exist
  const existing = await restAll(
    "restaurant_dish_tags?select=restaurant_id,dish_tag_id&order=restaurant_id",
  );
  const existingKeys = new Set(
    existing.map((r) => `${r.restaurant_id}:${r.dish_tag_id}`),
  );

  const toInsert = [];
  for (const [restaurantId, slugs] of detected) {
    for (const slug of slugs) {
      const dishTagId = dishIdBySlug.get(slug);
      if (!dishTagId) continue;
      if (existingKeys.has(`${restaurantId}:${dishTagId}`)) continue;
      toInsert.push({
        restaurant_id: restaurantId,
        dish_tag_id: dishTagId,
        source: "menu_scan",
        _name: nameById.get(restaurantId) ?? restaurantId,
        _slug: slug,
      });
    }
  }

  console.log(`Restaurants with a menu-detected dish: ${detected.size}`);
  console.log(`Already tagged (skipped):              ${existing.length}`);
  console.log(`New pairings to insert:                ${toInsert.length}\n`);

  for (const row of toInsert) {
    console.log(`  + ${row._slug.padEnd(14)} ${row._name}`);
  }

  if (toInsert.length === 0) {
    console.log("\nNothing to do.");
    return;
  }

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write these rows.");
    return;
  }

  const payload = toInsert.map((row) => ({
    restaurant_id: row.restaurant_id,
    dish_tag_id: row.dish_tag_id,
    source: row.source,
  }));
  await rest("restaurant_dish_tags", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify(payload),
  });

  console.log(`\nInserted ${payload.length} pairings.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
