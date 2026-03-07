import type { Lang } from "@/stores/languageStore";
import en from "./en.json";
import my from "./my.json";

const locales: Record<string, Record<string, string>> = { en, my };

export type TranslationKey = keyof typeof en;

export function t(lang: Lang, key: TranslationKey): string {
  return locales[lang]?.[key] ?? locales.en[key] ?? key;
}

// To add a new language:
// 1. Create src/lib/i18n/<lang>.json with the same keys as en.json
// 2. Import it here and add to the locales map
// 3. Add the lang option to src/stores/languageStore.ts (Lang type)
// 4. Add the flag + label to the AppShell LANG_OPTIONS array
