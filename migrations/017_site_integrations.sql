-- Global marketing integrations (GTM container id, etc.); single row id = 1
CREATE TABLE IF NOT EXISTS site_integrations (
  id                 SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  gtm_container_id   TEXT, -- e.g. GTM-XXXXXXX, null to disable
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_integrations_public_read" ON site_integrations
  FOR SELECT USING (true);

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
