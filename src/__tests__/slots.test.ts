import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSlotsForRestaurant,
  getAllSlots,
  saveAllSlots,
  getSlot,
  updateSlotRemaining,
  getSlotsForDate,
} from "@/lib/slots";
import { storageClear } from "@/lib/storage";
import { format } from "date-fns";

beforeEach(() => {
  storageClear();
});

describe("Slot generation", () => {
  it("generates slots for 14 days by default", () => {
    const slots = generateSlotsForRestaurant("r1", "11:00", "22:00");
    const dates = new Set(slots.map((s) => s.date));
    expect(dates.size).toBe(14);
  });

  it("generates correct time intervals (30min)", () => {
    const slots = generateSlotsForRestaurant("r1", "11:00", "14:00", 1);
    const times = slots.map((s) => s.time);
    // Last booking is 1h before close = 13:00
    expect(times).toContain("11:00");
    expect(times).toContain("11:30");
    expect(times).toContain("12:00");
    expect(times).toContain("12:30");
    expect(times).toContain("13:00");
    expect(times).not.toContain("13:30");
  });

  it("all slots start with default capacity of 20", () => {
    const slots = generateSlotsForRestaurant("r1", "18:00", "23:00", 1);
    for (const slot of slots) {
      expect(slot.capacity).toBe(20);
      expect(slot.remaining).toBe(20);
    }
  });

  it("handles midnight close time", () => {
    const slots = generateSlotsForRestaurant("r1", "11:00", "00:00", 1);
    const times = slots.map((s) => s.time);
    expect(times).toContain("11:00");
    expect(times).toContain("22:30");
    expect(times).not.toContain("23:30");
  });
});

describe("Slot storage and retrieval", () => {
  it("saves and retrieves slots", () => {
    const slots = generateSlotsForRestaurant("r1", "18:00", "22:00", 1);
    saveAllSlots(slots);
    const retrieved = getAllSlots();
    expect(retrieved.length).toBe(slots.length);
  });

  it("finds specific slot by restaurant, date, time", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const slots = generateSlotsForRestaurant("r1", "18:00", "22:00", 1);
    saveAllSlots(slots);

    const slot = getSlot("r1", today, "18:00");
    expect(slot).toBeDefined();
    expect(slot!.restaurantId).toBe("r1");
    expect(slot!.time).toBe("18:00");
  });

  it("returns undefined for nonexistent slot", () => {
    saveAllSlots([]);
    const slot = getSlot("r999", "2099-01-01", "18:00");
    expect(slot).toBeUndefined();
  });

  it("filters slots by date", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const slots = generateSlotsForRestaurant("r1", "18:00", "22:00", 3);
    saveAllSlots(slots);

    const todaySlots = getSlotsForDate("r1", today);
    expect(todaySlots.length).toBeGreaterThan(0);
    for (const s of todaySlots) {
      expect(s.date).toBe(today);
    }
  });
});

describe("Slot capacity management", () => {
  it("decreases remaining when booking", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const slots = generateSlotsForRestaurant("r1", "18:00", "22:00", 1);
    saveAllSlots(slots);

    const updated = updateSlotRemaining("r1", today, "18:00", -4);
    expect(updated).not.toBeNull();
    expect(updated!.remaining).toBe(16);
  });

  it("increases remaining when cancelling", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const slots = generateSlotsForRestaurant("r1", "18:00", "22:00", 1);
    saveAllSlots(slots);

    updateSlotRemaining("r1", today, "18:00", -4);
    const updated = updateSlotRemaining("r1", today, "18:00", 4);
    expect(updated!.remaining).toBe(20);
  });

  it("prevents overbooking (returns null if remaining would go negative)", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const slots = generateSlotsForRestaurant("r1", "18:00", "22:00", 1);
    saveAllSlots(slots);

    const result = updateSlotRemaining("r1", today, "18:00", -25);
    expect(result).toBeNull();
  });

  it("caps remaining at capacity", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const slots = generateSlotsForRestaurant("r1", "18:00", "22:00", 1);
    saveAllSlots(slots);

    const updated = updateSlotRemaining("r1", today, "18:00", 5);
    expect(updated!.remaining).toBe(20); // capped at capacity
  });
});
