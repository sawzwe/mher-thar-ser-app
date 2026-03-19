import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH /api/bookings/[id] — cancel or reschedule a booking
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { action, new_date, new_time } = body as {
      action: "cancel" | "reschedule";
      new_date?: string;
      new_time?: string;
    };

    if (!action || !["cancel", "reschedule"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'cancel' or 'reschedule'" },
        { status: 400 }
      );
    }

    // Resolve caller identity
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();

    // Fetch the booking
    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, user_id, restaurant_id, date, time, party_size, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Authorisation: must be the booking owner (or admin)
    const isOwner = user && booking.user_id === user.id;
    const isAdmin =
      user &&
      (await (async () => {
        const { data } = await supabase
          .from("user_roles")
          .select("roles(slug)")
          .eq("user_id", user.id);
        return (data ?? []).some(
          (r: { roles: { slug: string } | { slug: string }[] }) => {
            const roles = Array.isArray(r.roles) ? r.roles : [r.roles];
            return roles.some((x) => x.slug === "admin");
          }
        );
      })());

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Only confirmed bookings can be cancelled or rescheduled" },
        { status: 409 }
      );
    }

    if (action === "cancel") {
      const { data: updated, error: updateErr } = await admin
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", bookingId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Restore slot remaining
      try {
        await admin.rpc("increment_slot_remaining", {
          p_restaurant_id: booking.restaurant_id,
          p_date: booking.date,
          p_time: booking.time,
          p_delta: booking.party_size,
        });
      } catch {
        const { data: slot } = await admin
          .from("slots")
          .select("remaining, capacity")
          .eq("restaurant_id", booking.restaurant_id)
          .eq("date", booking.date)
          .eq("time", booking.time)
          .maybeSingle();
        if (slot) {
          await admin
            .from("slots")
            .update({
              remaining: Math.min(slot.remaining + booking.party_size, slot.capacity),
            })
            .eq("restaurant_id", booking.restaurant_id)
            .eq("date", booking.date)
            .eq("time", booking.time);
        }
      }

      return NextResponse.json({
        booking: {
          id: updated.id,
          bookingRef: updated.booking_ref,
          restaurantId: updated.restaurant_id,
          dealId: updated.deal_id ?? undefined,
          date: updated.date,
          time: updated.time,
          partySize: updated.party_size,
          customerName: updated.customer_name,
          contact: updated.contact,
          notes: updated.notes ?? "",
          status: updated.status,
          createdAt: updated.created_at,
        },
      });
    }

    // Reschedule
    if (!new_date || !new_time) {
      return NextResponse.json(
        { error: "new_date and new_time are required for rescheduling" },
        { status: 400 }
      );
    }

    // Check new slot availability
    const { data: newSlot, error: newSlotErr } = await admin
      .from("slots")
      .select("remaining")
      .eq("restaurant_id", booking.restaurant_id)
      .eq("date", new_date)
      .eq("time", new_time)
      .maybeSingle();

    if (newSlotErr) throw newSlotErr;

    if (newSlot && newSlot.remaining < booking.party_size) {
      return NextResponse.json(
        { error: `Only ${newSlot.remaining} seat(s) remaining for the new slot` },
        { status: 409 }
      );
    }

    const { data: updated, error: updateErr } = await admin
      .from("bookings")
      .update({
        date: new_date,
        time: new_time,
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Restore old slot remaining
    const { data: oldSlot } = await admin
      .from("slots")
      .select("remaining, capacity")
      .eq("restaurant_id", booking.restaurant_id)
      .eq("date", booking.date)
      .eq("time", booking.time)
      .maybeSingle();

    if (oldSlot) {
      await admin
        .from("slots")
        .update({
          remaining: Math.min(oldSlot.remaining + booking.party_size, oldSlot.capacity),
        })
        .eq("restaurant_id", booking.restaurant_id)
        .eq("date", booking.date)
        .eq("time", booking.time);
    }

    // Decrement new slot remaining
    if (newSlot) {
      await admin
        .from("slots")
        .update({ remaining: newSlot.remaining - booking.party_size })
        .eq("restaurant_id", booking.restaurant_id)
        .eq("date", new_date)
        .eq("time", new_time);
    }

    return NextResponse.json({
      booking: {
        id: updated.id,
        bookingRef: updated.booking_ref,
        restaurantId: updated.restaurant_id,
        dealId: updated.deal_id ?? undefined,
        date: updated.date,
        time: updated.time,
        partySize: updated.party_size,
        customerName: updated.customer_name,
        contact: updated.contact,
        notes: updated.notes ?? "",
        status: updated.status,
        createdAt: updated.created_at,
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
