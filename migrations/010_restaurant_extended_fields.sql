-- ══════════════════════════════════════════════════════════════════
-- Migration 010: Extended restaurant fields
-- Adds contact, social, media, classification, Google Maps data,
-- and structured attributes for imported restaurant data.
-- All columns are nullable — no breaking changes to existing rows.
-- ══════════════════════════════════════════════════════════════════

-- ── Contact & social ──────────────────────────────────────────────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- ── Location ──────────────────────────────────────────────────────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- ── Media ─────────────────────────────────────────────────────────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS street_view_url TEXT;

-- ── Classification ────────────────────────────────────────────────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS restaurant_type TEXT;

-- ── Structured attributes (service options, amenities, etc.) ─────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';

-- ── Google Maps integration (admin-only) ──────────────────────────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- ── External ratings (admin-only, imported) ───────────────────────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS google_review_count INTEGER,
  ADD COLUMN IF NOT EXISTS google_reviews_per_score JSONB;

-- ── Other Google identifiers ──────────────────────────────────────
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS google_ids JSONB;
