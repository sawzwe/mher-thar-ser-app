-- ══════════════════════════════════════════════════════════════════
-- Migration 003: Auth trigger — auto-bootstrap new users
-- Run once in Supabase SQL editor (or via CLI migration)
-- ══════════════════════════════════════════════════════════════════

-- ── Function: called on every new auth.users INSERT ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_role_id UUID;
BEGIN
  -- Look up the customer role (must exist from seed migration)
  SELECT id INTO customer_role_id
  FROM public.roles
  WHERE slug = 'customer'
  LIMIT 1;

  IF customer_role_id IS NULL THEN
    RAISE EXCEPTION 'handle_new_user: customer role not found — run seed migration first';
  END IF;

  -- Assign customer role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, customer_role_id)
  ON CONFLICT DO NOTHING;

  -- Create customer profile with defaults
  INSERT INTO public.customer_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── Trigger on auth.users ─────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════
-- Seed: roles, permissions, and role→permission mappings
-- Safe to re-run (ON CONFLICT DO NOTHING).
-- ══════════════════════════════════════════════════════════════════

-- ROLES
INSERT INTO public.roles (slug, name, description) VALUES
  ('customer', 'Customer',           'Registered diner'),
  ('vendor',   'Restaurant Vendor',  'Restaurant owner / CMS user'),
  ('admin',    'Platform Admin',     'Hmar Thar Sar operator')
ON CONFLICT (slug) DO NOTHING;

-- PERMISSIONS
INSERT INTO public.permissions (slug, action, resource) VALUES
  ('restaurant:read',   'read',   'restaurant'),
  ('restaurant:create', 'create', 'restaurant'),
  ('restaurant:update', 'update', 'restaurant'),
  ('restaurant:delete', 'delete', 'restaurant'),
  ('restaurant:manage', 'manage', 'restaurant'),
  ('booking:create',    'create', 'booking'),
  ('booking:read',      'read',   'booking'),
  ('booking:update',    'update', 'booking'),
  ('booking:manage',    'manage', 'booking'),
  ('deal:manage',       'manage', 'deal'),
  ('review:create',     'create', 'review'),
  ('review:manage',     'manage', 'review'),
  ('slot:manage',       'manage', 'slot'),
  ('menu:manage',       'manage', 'menu'),
  ('user:manage',       'manage', 'user'),
  ('analytics:read',    'read',   'analytics')
ON CONFLICT (slug) DO NOTHING;

-- ROLE → PERMISSION: customer
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'all'
FROM public.roles r, public.permissions p
WHERE r.slug = 'customer' AND p.slug = 'restaurant:read'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'own'
FROM public.roles r, public.permissions p
WHERE r.slug = 'customer'
  AND p.slug IN ('booking:create', 'booking:read', 'booking:update', 'review:create')
ON CONFLICT DO NOTHING;

-- ROLE → PERMISSION: vendor (own-scoped for their venues)
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'own'
FROM public.roles r, public.permissions p
WHERE r.slug = 'vendor'
  AND p.slug IN (
    'restaurant:read',
    'restaurant:update',
    'booking:read',
    'booking:update',
    'deal:manage',
    'slot:manage',
    'menu:manage',
    'analytics:read'
  )
ON CONFLICT DO NOTHING;

-- ROLE → PERMISSION: admin (all-scoped, full platform access)
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'all'
FROM public.roles r, public.permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;
