-- ══════════════════════════════════════════════════════════════════
-- Migration 015: RLS policies for user booking insert and select
-- Run once in Supabase SQL editor.
-- ══════════════════════════════════════════════════════════════════

-- Ensure no_show is a valid status (ALTER only if the constraint exists under the old name)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'cancelled', 'completed', 'rescheduled', 'no_show'));

-- ── Allow any caller (anon or authenticated) to INSERT bookings ────
-- The API route validates and sets user_id server-side; we use
-- service role key there so RLS is bypassed.  This policy exists
-- as a safety net if the anon key is ever used directly.
DROP POLICY IF EXISTS "allow_booking_insert" ON public.bookings;
CREATE POLICY "allow_booking_insert" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- ── Authenticated users can SELECT their own bookings ─────────────
DROP POLICY IF EXISTS "user_own_bookings_select" ON public.bookings;
CREATE POLICY "user_own_bookings_select" ON public.bookings
  FOR SELECT USING (
    -- own booking
    user_id = auth.uid()
    -- vendor owns the restaurant
    OR restaurant_id IN (
      SELECT restaurant_id FROM public.vendor_restaurants
      WHERE vendor_id = auth.uid()
    )
    -- admin
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
    )
  );

-- ── Authenticated users can UPDATE (cancel/reschedule) own confirmed bookings ──
DROP POLICY IF EXISTS "user_own_bookings_update" ON public.bookings;
CREATE POLICY "user_own_bookings_update" ON public.bookings
  FOR UPDATE USING (
    user_id = auth.uid()
    OR restaurant_id IN (
      SELECT restaurant_id FROM public.vendor_restaurants
      WHERE vendor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
    )
  );

-- ── Allow public read on slots (for availability display) ─────────
DROP POLICY IF EXISTS "public_slots_read" ON public.slots;
CREATE POLICY "public_slots_read" ON public.slots
  FOR SELECT USING (true);
