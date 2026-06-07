import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { id: vendorUserId } = await params;

    const { data: role } = await admin
      .from("roles")
      .select("id")
      .eq("slug", "vendor")
      .single();

    await Promise.all([
      admin
        .from("vendor_profiles")
        .update({ verified_at: new Date().toISOString() })
        .eq("user_id", vendorUserId),
      role
        ? admin
            .from("user_roles")
            .upsert(
              { user_id: vendorUserId, role_id: role.id },
              { onConflict: "user_id,role_id" }
            )
        : Promise.resolve(),
    ]);

    const { data: vr } = await admin
      .from("vendor_restaurants")
      .select("restaurant_id")
      .eq("vendor_id", vendorUserId);

    if (vr?.length) {
      const ids = vr.map((r: { restaurant_id: string }) => r.restaurant_id);
      await admin
        .from("restaurants")
        .update({ status: "active" })
        .in("id", ids);
    }

    const { data: vp } = await admin
      .from("vendor_profiles")
      .select("restaurant_ids")
      .eq("user_id", vendorUserId)
      .single();

    if (vp?.restaurant_ids?.length) {
      await admin
        .from("vendor_profiles")
        .update({ restaurant_ids: vp.restaurant_ids })
        .eq("user_id", vendorUserId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
