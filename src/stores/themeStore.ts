import { create } from "zustand";

const STORAGE_KEY = "mher_thar_ser:theme";

export type Theme = "light" | "dark";

function getStored(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {}
  return "light";
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  setTheme: (theme) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, theme);
        document.documentElement.setAttribute("data-theme", theme);
      }
    } catch {}
    set({ theme });
  },
  hydrate: () => set({ theme: getStored() }),
}));
