import { describe, it, expect, beforeEach } from "vitest";
import {
  createBooking,
  fetchBookings,
  cancelBooking,
  rescheduleBooking,
} from "@/lib/mockApi/bookings";
import { generateSlotsForRestaurant, saveAllSlots, getSlot } from "@/lib/slots";
import { storageClear } from "@/lib/storage";
import { format } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

function setupSlots() {
  const slots = generateSlotsForRestaurant("r1", "11:00", "22:00", 3);
  saveAllSlots(slots);
}

beforeEach(() => {
  storageClear();
  setupSlots();
});

describe("Create booking", () => {
  it("creates a booking and returns a reference code", async () => {
    const result = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 4,
      customerName: "Alice",
      contact: "alice@test.com",
      notes: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.booking.bookingRef).toMatch(/^TD-[A-Z0-9]{5}$/);
      expect(result.booking.status).toBe("confirmed");
      expect(result.booking.partySize).toBe(4);
    }
  });

  it("reduces slot remaining after booking", async () => {
    await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 6,
      customerName: "Bob",
      contact: "bob@test.com",
      notes: "",
    });

    const slot = getSlot("r1", today, "18:00");
    expect(slot!.remaining).toBe(14);
  });

  it("rejects booking when not enough capacity", async () => {
    // First fill up the slot
    await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 18,
      customerName: "Big Party",
      contact: "big@test.com",
      notes: "",
    });

    const result = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 5,
      customerName: "Late",
      contact: "late@test.com",
      notes: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("remaining");
    }
  });

  it("supports optional dealId", async () => {
    const result = await createBooking({
      restaurantId: "r1",
      dealId: "d1",
      date: today,
      time: "12:00",
      partySize: 2,
      customerName: "Carol",
      contact: "carol@test.com",
      notes: "Window seat",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.booking.dealId).toBe("d1");
      expect(result.booking.notes).toBe("Window seat");
    }
  });
});

describe("Fetch bookings", () => {
  it("retrieves all bookings", async () => {
    await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 2,
      customerName: "User1",
      contact: "u1@test.com",
      notes: "",
    });
    await createBooking({
      restaurantId: "r1",
      date: today,
      time: "19:00",
      partySize: 3,
      customerName: "User2",
      contact: "u2@test.com",
      notes: "",
    });

    const bookings = await fetchBookings();
    expect(bookings.length).toBe(2);
  });
});

describe("Cancel booking", () => {
  it("cancels a confirmed booking", async () => {
    const createResult = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 4,
      customerName: "CancelMe",
      contact: "cancel@test.com",
      notes: "",
    });

    if (!createResult.success) throw new Error("Setup failed");

    const cancelResult = await cancelBooking(createResult.booking.id);
    expect(cancelResult.success).toBe(true);
    if (cancelResult.success) {
      expect(cancelResult.booking.status).toBe("cancelled");
    }
  });

  it("restores slot capacity on cancel", async () => {
    const createResult = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 4,
      customerName: "RestoreSlot",
      contact: "restore@test.com",
      notes: "",
    });

    if (!createResult.success) throw new Error("Setup failed");

    const slotBefore = getSlot("r1", today, "18:00");
    expect(slotBefore!.remaining).toBe(16);

    await cancelBooking(createResult.booking.id);

    const slotAfter = getSlot("r1", today, "18:00");
    expect(slotAfter!.remaining).toBe(20);
  });

  it("rejects cancelling a non-confirmed booking", async () => {
    const createResult = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 2,
      customerName: "DoubleCx",
      contact: "double@test.com",
      notes: "",
    });

    if (!createResult.success) throw new Error("Setup failed");

    await cancelBooking(createResult.booking.id);
    const secondCancel = await cancelBooking(createResult.booking.id);

    expect(secondCancel.success).toBe(false);
  });
});

describe("Reschedule booking", () => {
  it("moves booking to new date/time", async () => {
    const createResult = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 3,
      customerName: "Resched",
      contact: "resched@test.com",
      notes: "",
    });

    if (!createResult.success) throw new Error("Setup failed");

    const result = await rescheduleBooking(
      createResult.booking.id,
      today,
      "19:00"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.booking.time).toBe("19:00");
      expect(result.booking.status).toBe("confirmed");
    }
  });

  it("restores old slot and reserves new slot", async () => {
    const createResult = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 5,
      customerName: "SlotSwap",
      contact: "swap@test.com",
      notes: "",
    });

    if (!createResult.success) throw new Error("Setup failed");

    expect(getSlot("r1", today, "18:00")!.remaining).toBe(15);
    expect(getSlot("r1", today, "19:00")!.remaining).toBe(20);

    await rescheduleBooking(createResult.booking.id, today, "19:00");

    expect(getSlot("r1", today, "18:00")!.remaining).toBe(20);
    expect(getSlot("r1", today, "19:00")!.remaining).toBe(15);
  });

  it("rejects reschedule if new slot is full", async () => {
    // Fill up 19:00 slot
    await createBooking({
      restaurantId: "r1",
      date: today,
      time: "19:00",
      partySize: 20,
      customerName: "BigGroup",
      contact: "big@test.com",
      notes: "",
    });

    const createResult = await createBooking({
      restaurantId: "r1",
      date: today,
      time: "18:00",
      partySize: 2,
      customerName: "Move",
      contact: "move@test.com",
      notes: "",
    });

    if (!createResult.success) throw new Error("Setup failed");

    const result = await rescheduleBooking(
      createResult.booking.id,
      today,
      "19:00"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("remaining");
    }
  });
});
