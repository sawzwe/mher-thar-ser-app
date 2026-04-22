/**
 * GTM public container id format: GTM- followed by alphanumerics.
 */
const GTM_PATTERN = /^GTM-[A-Z0-9]+$/i;

export function isValidGtmId(value: string): boolean {
  return GTM_PATTERN.test(value.trim());
}

/** Return trimmed id if valid, else null (for values from DB or env). */
export function normalizeGtmIdOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const s = value.trim();
  if (!s) return null;
  return isValidGtmId(s) ? s.toUpperCase() : null;
}

/**
 * @returns null when empty/whitespace; throws if non-empty and invalid
 */
export function parseGtmIdInput(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  if (!isValidGtmId(s)) {
    throw new Error("GTM ID must look like GTM-XXXXXXX (letters and numbers).");
  }
  return s.toUpperCase();
}
