// Feature flags, env-driven.
//
// Booking: temporarily DISABLED by default. The "Book a Table" option is
// hidden across the app until this is turned back on.
// To re-enable later, set NEXT_PUBLIC_BOOKING_ENABLED=true in your env.
const BOOKING_ENABLED =
  process.env.NEXT_PUBLIC_BOOKING_ENABLED === "true";

export const featureConfig = {
  /** Whether restaurant table booking/reservation is available to users. */
  bookingEnabled: BOOKING_ENABLED,
};
