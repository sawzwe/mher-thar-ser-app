-- ══════════════════════════════════════════════════════════════════
-- Migration 012: Twitter/X and TikTok URL for restaurants
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
