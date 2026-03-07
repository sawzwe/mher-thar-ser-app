import { create } from "zustand";

const STORAGE_KEY = "mher_thar_ser:lang";

export type Lang = "en" | "my";

function getStored(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "my" || v === "en") return v;
  } catch {}
  return "en";
}

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  hydrate: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: "en",
  setLang: (lang) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch {}
    set({ lang });
  },
  hydrate: () => set({ lang: getStored() }),
}));
