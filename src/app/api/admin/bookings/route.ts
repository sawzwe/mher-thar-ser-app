import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_ref, customer_name, date, time, status, restaurant_id")
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(100);

    return NextResponse.json({ bookings: bookings ?? [] });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
