-- Create menu tables if they don't exist (documented in schema but may not have been migrated)
CREATE TABLE IF NOT EXISTS menu_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  price           INTEGER NOT NULL,
  image_url       TEXT,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

-- Add image_url if table existed from an older migration without it
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
