-- SEO metadata per page (landing, per-restaurant)
CREATE TABLE IF NOT EXISTS seo_pages (
  page_key        TEXT PRIMARY KEY,        -- "landing" | "restaurant:{id}"
  title           TEXT,                    -- <title>
  description     TEXT,                    -- <meta name="description">
  og_title        TEXT,                    -- og:title (falls back to title)
  og_description  TEXT,                    -- og:description (falls back to description)
  og_image        TEXT,                    -- og:image URL
  keywords        TEXT,                    -- comma-separated keywords
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Only admins may write; public may read
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_public_read"  ON seo_pages FOR SELECT USING (true);
CREATE POLICY "seo_admin_write"  ON seo_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
    )
  );

-- Seed default landing page SEO
INSERT INTO seo_pages (page_key, title, description, og_title, og_description, keywords)
VALUES (
  'landing',
  'Mher Thar Ser — Find Myanmar Restaurants in Bangkok',
  'Discover authentic Myanmar restaurants in Bangkok, Thailand. Menus, prices, promotions, and table booking in one place.',
  'Mher Thar Ser — Myanmar Restaurants in Bangkok',
  'Find the best Myanmar food near you in Bangkok. Browse menus, check deals, and book a table instantly.',
  'myanmar restaurant bangkok, burmese food thailand, myanmar food near me'
)
ON CONFLICT (page_key) DO NOTHING;
