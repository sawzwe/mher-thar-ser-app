import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const { data: pending } = await supabase
      .from("vendor_profiles")
      .select("user_id")
      .is("verified_at", null)
      .order("created_at", { ascending: true });

    return NextResponse.json({ pending: pending ?? [] });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
