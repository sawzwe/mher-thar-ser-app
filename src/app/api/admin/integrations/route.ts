import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { parseGtmIdInput } from "@/lib/integrations/validateGtmId";

type IntegrationsRow = {
  gtm_container_id: string | null;
  updated_at: string | null;
};

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("site_integrations")
      .select("gtm_container_id, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    const row = data as IntegrationsRow | null;
    return NextResponse.json({
      gtmContainerId: row?.gtm_container_id ?? null,
      updatedAt: row?.updated_at ?? null,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const body = await req.json();
    const raw = (body as { gtmContainerId?: string | null }).gtmContainerId;
    const gtm_container_id = parseGtmIdInput(raw);

    const { data, error } = await supabase
      .from("site_integrations")
      .upsert(
        { id: 1, gtm_container_id, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      )
      .select("gtm_container_id, updated_at")
      .single();
    if (error) throw error;

    revalidatePath("/", "layout");

    return NextResponse.json({
      gtmContainerId: data.gtm_container_id,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    const status = e.status ?? (e.message.startsWith("GTM ID") ? 400 : 500);
    return NextResponse.json({ error: e.message }, { status });
  }
}
