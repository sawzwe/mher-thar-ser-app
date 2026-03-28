/**
 * Loads leaflet-gesture-handling once. Must run after `require("leaflet")` so `window.L` exists.
 */
let loaded = false;

export function registerLeafletGestureHandling(): void {
  if (typeof window === "undefined" || loaded) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Leaflet only in browser
  require("leaflet");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- UMD registers on L.Map
  require("leaflet-gesture-handling/dist/leaflet-gesture-handling.js");
  loaded = true;
}
