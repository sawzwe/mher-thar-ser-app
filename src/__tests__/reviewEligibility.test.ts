import { describe, it, expect } from "vitest";
import { canReview } from "@/lib/reviewEligibility";
import { Booking, Review } from "@/types";

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "bk_1",
    bookingRef: "TD-XXXXX",
    restaurantId: "r1",
    date: "2026-02-10",
    time: "18:00",
    partySize: 2,
    customerName: "Test User",
    contact: "test@test.com",
    notes: "",
    status: "confirmed",
    createdAt: "2026-02-09T10:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "rv_1",
    restaurantId: "r1",
    bookingId: "bk_1",
    customerName: "Test User",
    rating: 5,
    comment: "Great!",
    createdAt: "2026-02-11T10:00:00Z",
    ...overrides,
  };
}

describe("canReview", () => {
  const now = new Date("2026-02-18T12:00:00Z");

  it("allows review for completed booking", () => {
    const booking = makeBooking({ status: "completed" });
    const result = canReview("r1", [booking], [], now);
    expect(result.eligible).toBe(true);
    expect(result.eligibleBooking?.id).toBe("bk_1");
  });

  it("allows review for confirmed booking in the past", () => {
    const booking = makeBooking({
      status: "confirmed",
      date: "2026-02-15",
      time: "18:00",
    });
    const result = canReview("r1", [booking], [], now);
    expect(result.eligible).toBe(true);
  });

  it("rejects review for confirmed booking in the future", () => {
    const booking = makeBooking({
      status: "confirmed",
      date: "2026-02-20",
      time: "18:00",
    });
    const result = canReview("r1", [booking], [], now);
    expect(result.eligible).toBe(false);
  });

  it("rejects review for cancelled booking", () => {
    const booking = makeBooking({ status: "cancelled" });
    const result = canReview("r1", [booking], [], now);
    expect(result.eligible).toBe(false);
  });

  it("rejects review if booking already reviewed", () => {
    const booking = makeBooking({ status: "completed" });
    const review = makeReview({ bookingId: "bk_1" });
    const result = canReview("r1", [booking], [review], now);
    expect(result.eligible).toBe(false);
  });

  it("rejects review if no matching restaurant booking exists", () => {
    const booking = makeBooking({ restaurantId: "r2", status: "completed" });
    const result = canReview("r1", [booking], [], now);
    expect(result.eligible).toBe(false);
  });

  it("returns eligible for second unrevealed booking", () => {
    const b1 = makeBooking({ id: "bk_1", status: "completed" });
    const b2 = makeBooking({
      id: "bk_2",
      status: "completed",
      createdAt: "2026-02-12T10:00:00Z",
    });
    const review = makeReview({ bookingId: "bk_1" });
    const result = canReview("r1", [b1, b2], [review], now);
    expect(result.eligible).toBe(true);
    expect(result.eligibleBooking?.id).toBe("bk_2");
  });

  it("handles empty bookings", () => {
    const result = canReview("r1", [], [], now);
    expect(result.eligible).toBe(false);
  });
});
