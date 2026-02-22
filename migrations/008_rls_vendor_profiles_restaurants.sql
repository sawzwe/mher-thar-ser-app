-- ══════════════════════════════════════════════════════════════════
-- Migration 008: RLS for vendor_profiles and vendor_restaurants
-- Admins need to see pending claims; vendors see their own rows.
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_restaurants ENABLE ROW LEVEL SECURITY;

-- vendor_profiles: vendors see own, admins see all (for pending verification)
DROP POLICY IF EXISTS "vendor_profiles_own" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_own" ON public.vendor_profiles
  FOR ALL USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
    )
  );

-- vendor_restaurants: vendors see own, admins see all
DROP POLICY IF EXISTS "vendor_restaurants_own" ON public.vendor_restaurants;
CREATE POLICY "vendor_restaurants_own" ON public.vendor_restaurants
  FOR ALL USING (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
    )
  );
