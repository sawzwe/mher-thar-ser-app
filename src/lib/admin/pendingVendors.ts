import type { SupabaseClient } from "@supabase/supabase-js";

/** Matches live `vendor_profiles` columns (no created_at on this table). */
type VendorProfileRow = {
  user_id: string;
  company_name: string | null;
  restaurant_ids: string[] | null;
};

export type PendingVendorClaim = {
  user_id: string;
  company_name: string;
  email: string | null;
  /** Earliest claim timestamp from `vendor_restaurants.created_at`. */
  submitted_at: string;
  restaurant_count: number;
};

function earliestClaimTime(
  claims: { vendor_id: string; created_at: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const claim of claims) {
    const prev = map.get(claim.vendor_id);
    if (!prev || claim.created_at < prev) {
      map.set(claim.vendor_id, claim.created_at);
    }
  }
  return map;
}

/**
 * Pending vendor verifications: `vendor_profiles.verified_at IS NULL`.
 * Submission time comes from `vendor_restaurants.created_at`, not vendor_profiles.
 */
export async function listPendingVendorClaims(
  admin: SupabaseClient,
  emailById?: Map<string, string | null>,
): Promise<PendingVendorClaim[]> {
  const { data: pending, error } = await admin
    .from("vendor_profiles")
    .select("user_id, company_name, restaurant_ids")
    .is("verified_at", null);

  if (error) throw error;

  const profiles = (pending ?? []) as VendorProfileRow[];
  if (!profiles.length) return [];

  const userIds = profiles.map((p) => p.user_id);
  const { data: claims, error: claimsError } = await admin
    .from("vendor_restaurants")
    .select("vendor_id, created_at")
    .in("vendor_id", userIds);

  if (claimsError) throw claimsError;

  const submittedAtByVendor = earliestClaimTime(claims ?? []);

  return profiles
    .map((p) => ({
      user_id: p.user_id,
      company_name: p.company_name ?? "",
      email: emailById?.get(p.user_id) ?? null,
      submitted_at: submittedAtByVendor.get(p.user_id) ?? "",
      restaurant_count: Array.isArray(p.restaurant_ids)
        ? p.restaurant_ids.length
        : 0,
    }))
    .sort((a, b) => {
      if (!a.submitted_at) return 1;
      if (!b.submitted_at) return -1;
      return a.submitted_at.localeCompare(b.submitted_at);
    });
}

export async function countPendingVendorClaims(
  admin: SupabaseClient,
): Promise<number> {
  const { count, error } = await admin
    .from("vendor_profiles")
    .select("user_id", { count: "exact", head: true })
    .is("verified_at", null);

  if (error) throw error;
  return count ?? 0;
}
