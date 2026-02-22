import { Slot } from "@/types";
import { storageGet, storageSet } from "./storage";
import { format, addDays, parse, isAfter, isBefore } from "date-fns";

const SLOTS_KEY = "slots";

const DEFAULT_SLOT_CAPACITY = 20;
const SLOT_INTERVAL_MINUTES = 30;

function generateTimeSlotsForRestaurant(
  openTime: string,
  closeTime: string
): string[] {
  const times: string[] = [];
  const open = parse(openTime, "HH:mm", new Date());
  let close = parse(closeTime, "HH:mm", new Date());

  // If close is midnight or after, treat as end of day
  if (closeTime === "00:00" || isBefore(close, open)) {
    close = parse("23:30", "HH:mm", new Date());
  }

  // Last booking slot is 1 hour before close
  const lastSlot = new Date(close.getTime() - 60 * 60 * 1000);

  let current = new Date(open.getTime());
  while (!isAfter(current, lastSlot)) {
    times.push(format(current, "HH:mm"));
    current = new Date(current.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);
  }
  return times;
}

export function generateSlotsForRestaurant(
  restaurantId: string,
  openTime: string,
  closeTime: string,
  days: number = 14
): Slot[] {
  const times = generateTimeSlotsForRestaurant(openTime, closeTime);
  const slots: Slot[] = [];
  const today = new Date();

  for (let d = 0; d < days; d++) {
    const date = format(addDays(today, d), "yyyy-MM-dd");
    for (const time of times) {
      slots.push({
        restaurantId,
        date,
        time,
        capacity: DEFAULT_SLOT_CAPACITY,
        remaining: DEFAULT_SLOT_CAPACITY,
      });
    }
  }
  return slots;
}

export function getAllSlots(): Slot[] {
  return storageGet<Slot[]>(SLOTS_KEY, []);
}

export function saveAllSlots(slots: Slot[]): void {
  storageSet(SLOTS_KEY, slots);
}

export function getSlotsByRestaurant(restaurantId: string): Slot[] {
  return getAllSlots().filter((s) => s.restaurantId === restaurantId);
}

export function getSlot(
  restaurantId: string,
  date: string,
  time: string
): Slot | undefined {
  return getAllSlots().find(
    (s) =>
      s.restaurantId === restaurantId && s.date === date && s.time === time
  );
}

export function updateSlotRemaining(
  restaurantId: string,
  date: string,
  time: string,
  delta: number
): Slot | null {
  const slots = getAllSlots();
  const idx = slots.findIndex(
    (s) =>
      s.restaurantId === restaurantId && s.date === date && s.time === time
  );
  if (idx === -1) return null;

  const newRemaining = slots[idx].remaining + delta;
  if (newRemaining < 0) return null;
  if (newRemaining > slots[idx].capacity) {
    slots[idx].remaining = slots[idx].capacity;
  } else {
    slots[idx].remaining = newRemaining;
  }

  saveAllSlots(slots);
  return slots[idx];
}

export function initializeSlotsIfNeeded(
  restaurants: { id: string; openTime: string; closeTime: string }[]
): void {
  const existing = getAllSlots();
  if (existing.length > 0) return;

  const allSlots: Slot[] = [];
  for (const r of restaurants) {
    allSlots.push(...generateSlotsForRestaurant(r.id, r.openTime, r.closeTime));
  }
  saveAllSlots(allSlots);
}

export function getSlotsForDate(
  restaurantId: string,
  date: string
): Slot[] {
  return getAllSlots().filter(
    (s) => s.restaurantId === restaurantId && s.date === date
  );
}
