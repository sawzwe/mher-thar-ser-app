-- ══════════════════════════════════════════════════════════════════
-- Migration 019: Dish tags (replaces the single-purpose
--                restaurants.serves_moh_hin_gar boolean)
--
-- WHY
--   Migration 018 added a hard-coded boolean column for one dish.
--   Every additional dish would need another column + code deploy.
--   This replaces that with a taxonomy table + join table, mirroring
--   the existing address_* / cuisine_types pattern. Adding a new dish
--   filter then becomes a single INSERT - no migration, no deploy.
--
-- NOTE
--   Safe to run whether or not 018 was applied. The serves_moh_hin_gar
--   column is migrated across (if present) and then dropped.
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. Taxonomy: the set of dishes that can be used as a filter
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dish_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  name_my     TEXT,
  -- Controls whether the pill is offered in the public UI.
  is_active   BOOLEAN NOT NULL DEFAULT true,
  -- Lower sorts first; ties broken by name_en.
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive slug uniqueness (same approach as address taxonomy).
CREATE UNIQUE INDEX IF NOT EXISTS uq_dish_tags_slug_norm
  ON public.dish_tags ((LOWER(BTRIM(slug))));

CREATE INDEX IF NOT EXISTS idx_dish_tags_active_sort
  ON public.dish_tags (is_active, sort_order);

-- ──────────────────────────────────────────────────────────────────
-- 2. Join table: which restaurant serves which dish
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_dish_tags (
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  dish_tag_id   UUID NOT NULL REFERENCES public.dish_tags(id)   ON DELETE CASCADE,
  -- Provenance: 'manual' (admin set it) or 'menu_scan' (derived from
  -- menu_items). Manual always wins; the backfill must never overwrite it.
  source        TEXT NOT NULL DEFAULT 'manual'
                CHECK (source IN ('manual', 'menu_scan')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (restaurant_id, dish_tag_id)
);

-- Reverse lookup: "all restaurants serving dish X" (the public filter query).
CREATE INDEX IF NOT EXISTS idx_restaurant_dish_tags_dish
  ON public.restaurant_dish_tags (dish_tag_id);

-- ──────────────────────────────────────────────────────────────────
-- 3. Seed the first dish
-- ──────────────────────────────────────────────────────────────────
INSERT INTO public.dish_tags (slug, name_en, name_my, sort_order)
VALUES ('moh-hin-gar', 'Moh Hin Gar', 'မုန့်ဟင်းခါး', 10)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────
-- 4. Carry over existing data
--
--    4a. From the 018 boolean column, if that migration was applied.
--    4b. From the hard-coded name list that previously lived in
--        src/lib/restaurants/transform.ts, so behaviour is preserved
--        for installs where 018 was never run.
-- ──────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_dish_id UUID;
BEGIN
  SELECT id INTO v_dish_id
  FROM public.dish_tags
  WHERE LOWER(BTRIM(slug)) = 'moh-hin-gar';

  IF v_dish_id IS NULL THEN
    RAISE EXCEPTION 'dish_tags seed for moh-hin-gar is missing';
  END IF;

  -- 4a. Migrate the boolean column if it exists.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'restaurants'
      AND column_name  = 'serves_moh_hin_gar'
  ) THEN
    INSERT INTO public.restaurant_dish_tags (restaurant_id, dish_tag_id, source)
    SELECT r.id, v_dish_id, 'manual'
    FROM public.restaurants r
    WHERE r.serves_moh_hin_gar IS TRUE
    ON CONFLICT (restaurant_id, dish_tag_id) DO NOTHING;
  END IF;

  -- 4b. Migrate the former code-side name list.
  INSERT INTO public.restaurant_dish_tags (restaurant_id, dish_tag_id, source)
  SELECT r.id, v_dish_id, 'manual'
  FROM public.restaurants r
  WHERE LOWER(BTRIM(r.name)) IN (
      LOWER('Alinga Tea & Dining-Ramma 9'),
      LOWER('Asian Taste by Mhway Mhway Lay'),
      LOWER('Hometown Burmese Restaurant'),
      LOWER('Kitchen Ayeyarwady'),
      LOWER('Mandalay Food House'),
      LOWER('Shwe Tea House & Noodles'),
      LOWER('The Burma Food House'),
      LOWER('The Daily Dish'),
      LOWER('YGN Tea & Food - On Nut')
    )
    OR r.slug = 'kitchen-ayeyarwady'
  ON CONFLICT (restaurant_id, dish_tag_id) DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────────
-- 5. Drop the now-redundant boolean column
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.restaurants
  DROP COLUMN IF EXISTS serves_moh_hin_gar;

-- ──────────────────────────────────────────────────────────────────
-- 6. RLS
--    dish_tags            -> world readable (it is a public lookup list)
--    restaurant_dish_tags -> readable when the parent restaurant is
--                            active, mirroring public_read_deals_active
--                            in 005. Writes are admin-only.
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.dish_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_dish_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_dish_tags" ON public.dish_tags;
CREATE POLICY "public_read_dish_tags"
  ON public.dish_tags
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage dish_tags" ON public.dish_tags;
CREATE POLICY "Admin can manage dish_tags"
  ON public.dish_tags
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "public_read_restaurant_dish_tags" ON public.restaurant_dish_tags;
CREATE POLICY "public_read_restaurant_dish_tags"
  ON public.restaurant_dish_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_dish_tags.restaurant_id
        AND r.status = 'active'
    )
  );

-- Admins manage any pairing; vendors manage their own restaurants'
-- pairings (matches vendor_own_restaurants in 004).
DROP POLICY IF EXISTS "Admin can manage restaurant_dish_tags" ON public.restaurant_dish_tags;
CREATE POLICY "Admin can manage restaurant_dish_tags"
  ON public.restaurant_dish_tags
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Vendor can manage own restaurant_dish_tags" ON public.restaurant_dish_tags;
CREATE POLICY "Vendor can manage own restaurant_dish_tags"
  ON public.restaurant_dish_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendor_restaurants vr
      WHERE vr.restaurant_id = restaurant_dish_tags.restaurant_id
        AND vr.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.vendor_restaurants vr
      WHERE vr.restaurant_id = restaurant_dish_tags.restaurant_id
        AND vr.vendor_id = auth.uid()
    )
  );
