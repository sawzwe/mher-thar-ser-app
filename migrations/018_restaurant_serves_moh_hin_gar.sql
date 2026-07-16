-- ══════════════════════════════════════════════════════════════════
-- Migration 018: "Serves Moh Hin Gar" (မုန့်ဟင်းခါး) flag for restaurants
-- ══════════════════════════════════════════════════════════════════

-- 1. Add the boolean column (defaults to false for all existing rows)
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS serves_moh_hin_gar BOOLEAN NOT NULL DEFAULT false;

-- 2. Seed the known restaurants that serve Moh Hin Gar.
--    Matched by name (case-insensitive, trimmed) to be resilient to slug format.
UPDATE public.restaurants
SET serves_moh_hin_gar = true
WHERE lower(trim(name)) IN (
  lower('Alinga Tea & Dining-Ramma 9'),
  lower('Asian Taste by Mhway Mhway Lay'),
  lower('Hometown Burmese Restaurant'),
  lower('Kitchen Ayeyarwady'),
  lower('Mandalay Food House'),
  lower('Shwe Tea House & Noodles'),
  lower('The Burma Food House'),
  lower('The Daily Dish'),
  lower('YGN Tea & Food - On Nut')
)
-- Also match by slug in case a name differs slightly from the display name.
OR slug IN (
  'kitchen-ayeyarwady'
);
