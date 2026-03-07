/**
 * Pin color and emoji by cuisine type for map markers.
 */
export const CUISINE_PIN_COLORS: Record<string, string> = {
  burmese: "#D32424",
  mohinga: "#D32424",
  curries: "#3DAA6E",
  "tea shops": "#4A9FD4",
  "street food": "#E09B2D",
  salads: "#9B59B6",
  noodles: "#D32424",
  thai: "#5C5B54",
  default: "#5C5B54",
};

export const CUISINE_EMOJIS: Record<string, string> = {
  burmese: "🍜",
  mohinga: "🍜",
  noodles: "🍜",
  curries: "🫕",
  "tea shops": "🍵",
  salads: "🥗",
  "street food": "🧆",
  default: "🍴",
};

export function getPinColor(cuisineTags: string[], cuisine?: string): string {
  const combined = [
    cuisine?.toLowerCase(),
    ...cuisineTags.map((t) => t.toLowerCase()),
  ].filter(Boolean) as string[];

  for (const key of Object.keys(CUISINE_PIN_COLORS)) {
    if (key === "default") continue;
    if (combined.some((c) => c.includes(key) || key.includes(c))) {
      return CUISINE_PIN_COLORS[key];
    }
  }
  return CUISINE_PIN_COLORS.default;
}

export function getPinEmoji(
  cuisineTags: string[],
  cuisine?: string,
  emoji?: string
): string {
  if (emoji) return emoji;
  const combined = [
    cuisine?.toLowerCase(),
    ...cuisineTags.map((t) => t.toLowerCase()),
  ].filter(Boolean) as string[];

  for (const key of Object.keys(CUISINE_EMOJIS)) {
    if (key === "default") continue;
    if (combined.some((c) => c.includes(key) || key.includes(c))) {
      return CUISINE_EMOJIS[key];
    }
  }
  return CUISINE_EMOJIS.default;
}
