-- ══════════════════════════════════════════════════════════════════
-- Migration 006: Grant admin role to admin@hmertharsar.com
-- Run AFTER that user has signed up (Supabase Auth → sign up or invite).
-- In Supabase SQL Editor: run this once. If the user doesn't exist yet,
-- sign up with admin@hmertharsar.com first, then run this.
-- ══════════════════════════════════════════════════════════════════

-- Grant admin role to admin@hmertharsar.com
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.email = 'admin@hmertharsar.com'
  AND r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Ensure admin_profiles row exists (for access_level / superadmin)
INSERT INTO public.admin_profiles (user_id, access_level)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'admin@hmertharsar.com'
ON CONFLICT (user_id) DO UPDATE SET access_level = 'superadmin';
