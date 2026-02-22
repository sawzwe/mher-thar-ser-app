-- ══════════════════════════════════════════════════════════════════
-- Migration 007: Add open_time and close_time to restaurants
-- Run in Supabase SQL Editor if your schema doesn't have these columns.
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS open_time TIME,
  ADD COLUMN IF NOT EXISTS close_time TIME;
