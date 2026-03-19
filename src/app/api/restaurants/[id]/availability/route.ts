import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTimeSlotsForRestaurant } from "@/lib/slotUtils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date query param required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch real slots from DB
    const { data: dbSlots, error: slotsErr } = await admin
      .from("slots")
      .select("date, time, capacity, remaining")
      .eq("restaurant_id", restaurantId)
      .eq("date", date)
      .order("time");

    if (slotsErr) throw slotsErr;

    // If real slots exist, return them (normalize time to HH:mm)
    if (dbSlots && dbSlots.length > 0) {
      const slots = dbSlots.map((s) => ({
        ...s,
        time: typeof s.time === "string" ? s.time.slice(0, 5) : s.time,
      }));
      return NextResponse.json({ slots });
    }

    // Fallback: generate from restaurant open/close times
    const { data: restaurant, error: rErr } = await admin
      .from("restaurants")
      .select("open_time, close_time")
      .eq("id", restaurantId)
      .single();

    if (rErr || !restaurant) {
      return NextResponse.json({ slots: [] });
    }

    const openTime = restaurant.open_time ?? "11:00";
    const closeTime = restaurant.close_time ?? "22:00";
    const times = generateTimeSlotsForRestaurant(openTime, closeTime);
    const fallbackSlots = times.map((time) => ({
      date,
      time,
      capacity: 20,
      remaining: 20,
    }));

    return NextResponse.json({ slots: fallbackSlots });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
