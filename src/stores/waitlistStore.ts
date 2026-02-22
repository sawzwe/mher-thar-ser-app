import { create } from "zustand";
import { WaitlistEntry } from "@/types";
import {
  joinWaitlist as apiJoinWaitlist,
  fetchWaitlist,
  removeWaitlistEntry,
} from "@/lib/mockApi/waitlist";

interface WaitlistState {
  entries: WaitlistEntry[];
  loading: boolean;
  loadWaitlist: () => Promise<void>;
  join: (
    params: Omit<WaitlistEntry, "id" | "createdAt" | "notified">
  ) => Promise<WaitlistEntry>;
  remove: (id: string) => Promise<void>;
}

export const useWaitlistStore = create<WaitlistState>((set, get) => ({
  entries: [],
  loading: false,

  loadWaitlist: async () => {
    set({ loading: true });
    const data = await fetchWaitlist();
    set({ entries: data, loading: false });
  },

  join: async (params) => {
    const entry = await apiJoinWaitlist(params);
    await get().loadWaitlist();
    return entry;
  },

  remove: async (id) => {
    await removeWaitlistEntry(id);
    await get().loadWaitlist();
  },
}));
