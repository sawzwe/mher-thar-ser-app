import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("id, name, slug, area, status")
      .order("name");

    return NextResponse.json({ restaurants: restaurants ?? [] });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
