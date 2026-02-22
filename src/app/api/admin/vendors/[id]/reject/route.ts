import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { id: vendorUserId } = await params;

    await supabase
      .from("vendor_restaurants")
      .delete()
      .eq("vendor_id", vendorUserId);

    await supabase
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
