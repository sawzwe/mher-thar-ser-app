import { create } from "zustand";
import { Booking } from "@/types";

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  pendingOffer: {
    waitlistEntryId: string;
    restaurantId: string;
    date: string;
    time: string;
    partySize: number;
    name: string;
  } | null;
  loadBookings: () => Promise<void>;
  book: (
    params: Omit<Booking, "id" | "bookingRef" | "status" | "createdAt">
  ) => Promise<{ success: true; booking: Booking } | { success: false; error: string }>;
  cancel: (
    id: string
  ) => Promise<{ success: true; booking: Booking } | { success: false; error: string }>;
  reschedule: (
    id: string,
    newDate: string,
    newTime: string
  ) => Promise<{ success: true; booking: Booking } | { success: false; error: string }>;
  clearOffer: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: false,
  pendingOffer: null,

  loadBookings: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      const json = await res.json() as { bookings: Booking[] };
      set({ bookings: json.bookings, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  book: async (params) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: params.restaurantId,
          date: params.date,
          time: params.time,
          party_size: params.partySize,
          customer_name: params.customerName,
          contact: params.contact,
          notes: params.notes,
          deal_id: params.dealId,
        }),
      });
      const json = await res.json() as { booking?: Booking; error?: string };
      if (!res.ok) return { success: false, error: json.error ?? "Booking failed" };
      await get().loadBookings();
      return { success: true, booking: json.booking! };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },

  cancel: async (id) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json() as { booking?: Booking; error?: string };
      if (!res.ok) return { success: false, error: json.error ?? "Cancel failed" };
      await get().loadBookings();
      return { success: true, booking: json.booking! };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },

  reschedule: async (id, newDate, newTime) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", new_date: newDate, new_time: newTime }),
      });
      const json = await res.json() as { booking?: Booking; error?: string };
      if (!res.ok) return { success: false, error: json.error ?? "Reschedule failed" };
      await get().loadBookings();
      return { success: true, booking: json.booking! };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },

  clearOffer: () => set({ pendingOffer: null }),
}));
