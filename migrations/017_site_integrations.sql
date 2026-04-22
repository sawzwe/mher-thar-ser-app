-- Global marketing integrations; single row id = 1
CREATE TABLE IF NOT EXISTS site_integrations (
  id                 SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  gtm_container_id   TEXT,     -- e.g. GTM-XXXXXXX, null to disable
  custom_scripts     TEXT,     -- raw <script> / HTML tags injected before </body>
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- If table was created from an earlier partial run, ensure column exists
ALTER TABLE site_integrations
  ADD COLUMN IF NOT EXISTS custom_scripts TEXT;

ALTER TABLE site_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_integrations_public_read" ON site_integrations;
CREATE POLICY "site_integrations_public_read" ON site_integrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_integrations_admin_write" ON site_integrations;
CREATE POLICY "site_integrations_admin_write" ON site_integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
    )
  );

INSERT INTO site_integrations (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;
