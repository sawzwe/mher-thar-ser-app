import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, format } from "date-fns";
import { generateTimeSlotsForRestaurant } from "@/lib/slotUtils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const admin = createAdminClient();

    // Fetch restaurant open/close times for default schedule
    const { data: restaurant, error: rErr } = await admin
      .from("restaurants")
      .select("open_time, close_time")
      .eq("id", id)
      .single();

    if (rErr || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const openTime = restaurant.open_time?.slice(0, 5) ?? "11:00";
    const closeTime = restaurant.close_time?.slice(0, 5) ?? "22:00";
    const times = generateTimeSlotsForRestaurant(openTime, closeTime);
    const defaultSlots = times.map((time) => ({ time, capacity: 20 }));

    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      { time: string; capacity: number }[]
    >;

    const start = new Date();
    const end = addDays(start, 60);
    const rows: {
      restaurant_id: string;
      date: string;
      time: string;
      capacity: number;
      remaining: number;
    }[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayKey = format(d, "EEEE").toLowerCase();
      const daySlots = body[dayKey] ?? defaultSlots;
      for (const s of daySlots) {
        rows.push({
          restaurant_id: id,
          date: format(d, "yyyy-MM-dd"),
          time: s.time,
          capacity: s.capacity,
          remaining: s.capacity,
        });
      }
    }

    const { error } = await admin.from("slots").upsert(rows, {
      onConflict: "restaurant_id,date,time",
      ignoreDuplicates: false,
    });

    if (error) throw error;
    return NextResponse.json({ success: true, count: rows.length });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
