import { create } from "zustand";
import { Booking } from "@/types";
import {
  createBooking,
  fetchBookings,
  cancelBooking as apiCancelBooking,
  rescheduleBooking as apiRescheduleBooking,
} from "@/lib/mockApi/bookings";
import {
  getEarliestWaitlistEntry,
  markWaitlistNotified,
} from "@/lib/mockApi/waitlist";

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
    const data = await fetchBookings();
    set({ bookings: data, loading: false });
  },

  book: async (params) => {
    const result = await createBooking(params);
    if (result.success) {
      await get().loadBookings();
    }
    return result;
  },

  cancel: async (id) => {
    const result = await apiCancelBooking(id);
    if (result.success) {
      await get().loadBookings();

      // Check waitlist for auto-offer
      const { restaurantId, date, time } = result.booking;
      const entry = await getEarliestWaitlistEntry(restaurantId, date, time);
      if (entry) {
        await markWaitlistNotified(entry.id);
        set({
          pendingOffer: {
            waitlistEntryId: entry.id,
            restaurantId: entry.restaurantId,
            date: entry.date,
            time: entry.time,
            partySize: entry.partySize,
            name: entry.name,
          },
        });
      }
    }
    return result;
  },

  reschedule: async (id, newDate, newTime) => {
    const result = await apiRescheduleBooking(id, newDate, newTime);
    if (result.success) {
      await get().loadBookings();
    }
    return result;
  },

  clearOffer: () => set({ pendingOffer: null }),
}));
