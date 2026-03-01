-- ══════════════════════════════════════════════════════════════════
-- Migration 011: Supabase Storage bucket for restaurant images
-- Creates a public bucket so images can be served without auth.
-- RLS policies: authenticated users can upload/update/delete,
-- anyone can read (public bucket).
-- ══════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-images',
  'restaurant-images',
  true,
  5242880, -- 5 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
DROP POLICY IF EXISTS "Public read restaurant images" ON storage.objects;
CREATE POLICY "Public read restaurant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-images');

-- Authenticated users can upload
DROP POLICY IF EXISTS "Auth users upload restaurant images" ON storage.objects;
CREATE POLICY "Auth users upload restaurant images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'restaurant-images');

-- Authenticated users can update their uploads
DROP POLICY IF EXISTS "Auth users update restaurant images" ON storage.objects;
CREATE POLICY "Auth users update restaurant images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'restaurant-images');

-- Authenticated users can delete
DROP POLICY IF EXISTS "Auth users delete restaurant images" ON storage.objects;
CREATE POLICY "Auth users delete restaurant images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'restaurant-images');
