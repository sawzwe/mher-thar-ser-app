import { Booking, BookingStatus } from "@/types";
import { storageGet, storageSet } from "../storage";
import { updateSlotRemaining, getSlot } from "../slots";

const BOOKINGS_KEY = "bookings";

function delay(ms: number = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TD-${code}`;
}

function generateId(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getBookings(): Booking[] {
  return storageGet<Booking[]>(BOOKINGS_KEY, []);
}

function saveBookings(bookings: Booking[]): void {
  storageSet(BOOKINGS_KEY, bookings);
}

export async function createBooking(
  params: Omit<Booking, "id" | "bookingRef" | "status" | "createdAt">
): Promise<{ success: true; booking: Booking } | { success: false; error: string }> {
  await delay();

  const slot = getSlot(params.restaurantId, params.date, params.time);
  if (!slot) return { success: false, error: "Time slot not found" };
  if (slot.remaining < params.partySize) {
    return {
      success: false,
      error: `Only ${slot.remaining} seats remaining for this slot`,
    };
  }

  const updated = updateSlotRemaining(
    params.restaurantId,
    params.date,
    params.time,
    -params.partySize
  );
  if (!updated) {
    return { success: false, error: "Failed to reserve slot" };
  }

  const booking: Booking = {
    ...params,
    id: generateId(),
    bookingRef: generateRef(),
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);

  return { success: true, booking };
}

export async function fetchBookings(): Promise<Booking[]> {
  await delay();
  return getBookings();
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  await delay();
  return getBookings().find((b) => b.id === id) ?? null;
}

export async function cancelBooking(
  id: string
): Promise<{ success: true; booking: Booking } | { success: false; error: string }> {
  await delay();
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return { success: false, error: "Booking not found" };

  const booking = bookings[idx];
  if (booking.status !== "confirmed") {
    return { success: false, error: "Can only cancel confirmed bookings" };
  }

  booking.status = "cancelled" as BookingStatus;
  bookings[idx] = booking;
  saveBookings(bookings);

  updateSlotRemaining(
    booking.restaurantId,
    booking.date,
    booking.time,
    booking.partySize
  );

  return { success: true, booking };
}

export async function rescheduleBooking(
  id: string,
  newDate: string,
  newTime: string
): Promise<{ success: true; booking: Booking } | { success: false; error: string }> {
  await delay();
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return { success: false, error: "Booking not found" };

  const booking = bookings[idx];
  if (booking.status !== "confirmed") {
    return { success: false, error: "Can only reschedule confirmed bookings" };
  }

  const newSlot = getSlot(booking.restaurantId, newDate, newTime);
  if (!newSlot) return { success: false, error: "New time slot not found" };
  if (newSlot.remaining < booking.partySize) {
    return {
      success: false,
      error: `Only ${newSlot.remaining} seats remaining for the new slot`,
    };
  }

  // Free old slot
  updateSlotRemaining(
    booking.restaurantId,
    booking.date,
    booking.time,
    booking.partySize
  );

  // Reserve new slot
  updateSlotRemaining(booking.restaurantId, newDate, newTime, -booking.partySize);

  booking.date = newDate;
  booking.time = newTime;
  booking.status = "confirmed";
  bookings[idx] = booking;
  saveBookings(bookings);

  return { success: true, booking };
}
