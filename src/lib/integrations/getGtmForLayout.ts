import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeGtmIdOrNull } from "@/lib/integrations/validateGtmId";

async function fetchGtmIdFromDb(): Promise<string | null> {
  const fromEnv = normalizeGtmIdOrNull(process.env.NEXT_PUBLIC_GTM_ID);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_integrations")
      .select("gtm_container_id")
      .eq("id", 1)
      .maybeSingle();
    if (error) return fromEnv;
    const fromDb = normalizeGtmIdOrNull(data?.gtm_container_id ?? null);
    return fromDb ?? fromEnv;
  } catch {
    return fromEnv;
  }
}

/**
 * GTM id for the public layout: cached until the admin saves a new value
 * (the PATCH route calls revalidatePath("/", "layout") to bust the cache).
 * DB value wins over NEXT_PUBLIC_GTM_ID; falls back to env if table is missing.
 */
export const getGtmContainerIdForLayout = unstable_cache(
  fetchGtmIdFromDb,
  ["gtm-container-id"],
);
