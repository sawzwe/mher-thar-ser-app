import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MobileHomeView = "map" | "list";

export const useMobileHomeViewStore = create<{
  view: MobileHomeView;
  setView: (v: MobileHomeView) => void;
}>()(
  persist(
    (set) => ({
      view: "map",
      setView: (view) => set({ view }),
    }),
    { name: "mher_thar_ser:mobile_home_view" }
  )
);
