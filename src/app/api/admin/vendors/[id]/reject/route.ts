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

    await admin
      .from("vendor_restaurants")
      .delete()
      .eq("vendor_id", vendorUserId);

    await admin
      .from("vendor_profiles")
      .delete()
      .eq("user_id", vendorUserId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
