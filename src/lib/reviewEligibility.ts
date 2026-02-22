import { Booking, Review } from "@/types";

/**
 * A user can review a restaurant if they have a booking that:
 * 1. Matches the restaurantId
 * 2. Has status "completed" OR status "confirmed" with date+time in the past
 * 3. Has not already been used for a review
 */
export function canReview(
  restaurantId: string,
  bookings: Booking[],
  existingReviews: Review[],
  now: Date = new Date()
): { eligible: boolean; eligibleBooking?: Booking } {
  const reviewedBookingIds = new Set(existingReviews.map((r) => r.bookingId));

  const candidates = bookings.filter((b) => {
    if (b.restaurantId !== restaurantId) return false;
    if (reviewedBookingIds.has(b.id)) return false;

    if (b.status === "completed") return true;

    if (b.status === "confirmed") {
      const bookingDateTime = new Date(`${b.date}T${b.time}:00`);
      return bookingDateTime < now;
    }

    return false;
  });

  if (candidates.length === 0) return { eligible: false };

  candidates.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { eligible: true, eligibleBooking: candidates[0] };
}
