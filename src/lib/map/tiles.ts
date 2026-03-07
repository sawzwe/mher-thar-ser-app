import type { Theme } from "@/stores/themeStore";

const LIGHT_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";

export function getTileUrl(theme: Theme): string {
  return theme === "light" ? LIGHT_TILE_URL : DARK_TILE_URL;
}
