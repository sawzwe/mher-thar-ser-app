import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TD-${code}`;
}

// GET /api/bookings — returns bookings for the signed-in user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ bookings: [] });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, booking_ref, restaurant_id, deal_id, date, time, party_size, customer_name, contact, notes, status, created_at"
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (error) throw error;

    const bookings = (data ?? []).map((b) => ({
      id: b.id,
      bookingRef: b.booking_ref,
      restaurantId: b.restaurant_id,
      dealId: b.deal_id ?? undefined,
      date: b.date,
      time: b.time,
      partySize: b.party_size,
      customerName: b.customer_name,
      contact: b.contact,
      notes: b.notes ?? "",
      status: b.status,
      createdAt: b.created_at,
    }));

    return NextResponse.json({ bookings });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}

// POST /api/bookings — create a new booking (guest or signed-in)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurant_id,
      date,
      time,
      party_size,
      customer_name,
      contact,
      notes,
      deal_id,
    } = body as {
      restaurant_id: string;
      date: string;
      time: string;
      party_size: number;
      customer_name: string;
      contact: string;
      notes?: string;
      deal_id?: string;
    };

    if (!restaurant_id || !date || !time || !party_size || !customer_name || !contact) {
      return NextResponse.json(
        { error: "restaurant_id, date, time, party_size, customer_name, and contact are required" },
        { status: 400 }
      );
    }

    // Get auth user (optional — guest bookings have user_id = null)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();

    // Validate slot availability
    const { data: slot, error: slotErr } = await admin
      .from("slots")
      .select("remaining")
      .eq("restaurant_id", restaurant_id)
      .eq("date", date)
      .eq("time", time)
      .maybeSingle();

    if (slotErr) throw slotErr;

    if (slot && slot.remaining < party_size) {
      return NextResponse.json(
        { error: `Only ${slot.remaining} seat(s) remaining for this slot` },
        { status: 409 }
      );
    }

    const booking_ref = generateRef();

    // Insert booking
    const { data: newBooking, error: insertErr } = await admin
      .from("bookings")
      .insert({
        restaurant_id,
        date,
        time,
        party_size,
        customer_name,
        contact,
        notes: notes ?? null,
        deal_id: deal_id ?? null,
        booking_ref,
        user_id: user?.id ?? null,
        status: "confirmed",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Decrement slot remaining if a real slot exists
    if (slot) {
      await admin
        .from("slots")
        .update({ remaining: slot.remaining - party_size })
        .eq("restaurant_id", restaurant_id)
        .eq("date", date)
        .eq("time", time);
    }

    return NextResponse.json({
      booking: {
        id: newBooking.id,
        bookingRef: newBooking.booking_ref,
        restaurantId: newBooking.restaurant_id,
        dealId: newBooking.deal_id ?? undefined,
        date: newBooking.date,
        time: newBooking.time,
        partySize: newBooking.party_size,
        customerName: newBooking.customer_name,
        contact: newBooking.contact,
        notes: newBooking.notes ?? "",
        status: newBooking.status,
        createdAt: newBooking.created_at,
      },
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
