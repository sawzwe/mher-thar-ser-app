-- Address taxonomy tables for admin-managed Province -> District -> Subdistrict.
-- Enforces hierarchical linkage and case-insensitive uniqueness.

-- Shared helper for admin RLS (matches user_roles + roles.slug = 'admin' pattern in 004, 008, 013, 015).
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uid IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = uid
        AND r.slug = 'admin'
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

CREATE TABLE IF NOT EXISTS public.address_provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_address_provinces_name_norm
  ON public.address_provinces ((LOWER(BTRIM(name))));

CREATE TABLE IF NOT EXISTS public.address_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id UUID NOT NULL REFERENCES public.address_provinces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_address_districts_parent_name_norm
  ON public.address_districts (province_id, (LOWER(BTRIM(name))));

CREATE TABLE IF NOT EXISTS public.address_subdistricts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES public.address_districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_address_subdistricts_parent_name_norm
  ON public.address_subdistricts (district_id, (LOWER(BTRIM(name))));

ALTER TABLE public.address_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_subdistricts ENABLE ROW LEVEL SECURITY;

-- Admin-only management through API guard.
DROP POLICY IF EXISTS "Admin can manage address_provinces" ON public.address_provinces;
CREATE POLICY "Admin can manage address_provinces"
  ON public.address_provinces
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage address_districts" ON public.address_districts;
CREATE POLICY "Admin can manage address_districts"
  ON public.address_districts
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage address_subdistricts" ON public.address_subdistricts;
CREATE POLICY "Admin can manage address_subdistricts"
  ON public.address_subdistricts
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
