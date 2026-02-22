import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, restaurant_id, rating, comment, created_at")
      .order("rating", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
