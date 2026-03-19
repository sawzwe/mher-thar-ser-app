import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();

    const { searchParams } = new URL(_req.url);
    const from = searchParams.get("from");
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("slots")
      .select("date, time, capacity, remaining")
      .eq("restaurant_id", id)
      .gte("date", from ?? today)
      .order("date")
      .order("time")
      .limit(200);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
