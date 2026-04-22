import { createClient } from "@/lib/supabase/server";
import { normalizeGtmIdOrNull } from "@/lib/integrations/validateGtmId";

export type SiteIntegrations = {
  gtmContainerId: string | null;
  customScripts: string | null;
};

/**
 * Fetch integrations for the root layout on every request.
 * DB value wins over NEXT_PUBLIC_GTM_ID; falls back to env if table is missing.
 */
export async function getIntegrationsForLayout(): Promise<SiteIntegrations> {
  const fromEnv = normalizeGtmIdOrNull(process.env.NEXT_PUBLIC_GTM_ID);
  const fallback: SiteIntegrations = { gtmContainerId: fromEnv, customScripts: null };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_integrations")
      .select("gtm_container_id, custom_scripts")
      .eq("id", 1)
      .maybeSingle();
    if (error) return fallback;
    return {
      gtmContainerId: normalizeGtmIdOrNull(data?.gtm_container_id ?? null) ?? fromEnv,
      customScripts: (data?.custom_scripts as string | null | undefined) ?? null,
    };
  } catch {
    return fallback;
  }
}
