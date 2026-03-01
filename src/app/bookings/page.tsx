"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBookingStore } from "@/stores/bookingStore";
import { useWaitlistStore } from "@/stores/waitlistStore";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { getRestaurantPath } from "@/lib/restaurants/url";
import { Booking } from "@/types";
import { RescheduleModal } from "@/components/RescheduleModal";
import { Button } from "@/components/ui/button";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusVariant: Record<string, "success" | "danger" | "gold" | "warning"> = {
  confirmed: "success", cancelled: "danger", completed: "gold", rescheduled: "warning",
};

export default function BookingsPage() {
  const { bookings, loading, loadBookings, cancel } = useBookingStore();
  const restaurants = useRestaurantStore((s) => s.restaurants);

  const getRestaurantName = (id: string) =>
    restaurants.find((r) => r.id === id)?.name ?? "Unknown";
  const getRestaurantPathForId = (id: string) => {
    const r = restaurants.find((x) => x.id === id);
    return r ? getRestaurantPath(r) : id;
  };
  const { entries: waitlistEntries, loadWaitlist, remove: removeWaitlist } = useWaitlistStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

  useEffect(() => { loadBookings(); loadWaitlist(); }, [loadBookings, loadWaitlist]);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(id); await cancel(id); setCancellingId(null);
  };

  const activeBookings = bookings.filter((b) => b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status !== "confirmed");
  const activeWaitlist = waitlistEntries.filter((e) => !e.notified);

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <h1 className="text-[38px] font-bold text-text-primary tracking-[-1px] mb-8">My Bookings</h1>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-card border border-border rounded-[var(--radius-lg)] p-5"><div className="h-5 bg-surface rounded w-1/3 mb-3" /><div className="h-4 bg-surface rounded w-2/3 mb-2" /><div className="h-4 bg-surface rounded w-1/2" /></div>)}</div>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-[20px] font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full" /> Upcoming ({activeBookings.length})
            </h2>
            {activeBookings.length === 0 ? (
              <Card><CardContent className="text-center py-10"><p className="text-text-muted mb-4">No upcoming bookings</p><Link href="/"><Button variant="ghost" size="sm">Discover restaurants</Button></Link></CardContent></Card>
            ) : (
              <div className="space-y-4">
                {activeBookings.map((booking) => (
                  <Card key={booking.id} className="animate-fade-in">
                    <CardContent className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Link href={`/restaurant/${getRestaurantPathForId(booking.restaurantId)}`} className="font-bold text-lg text-text-primary hover:text-brand-light transition-colors duration-[var(--dur-fast)]">{getRestaurantName(booking.restaurantId)}</Link>
                          <Badge variant={statusVariant[booking.status]}>
                            <BadgeDot />
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-text-secondary">{booking.date} at {booking.time} · {booking.partySize} guests</p>
                        <p className="text-[11px] text-text-muted font-mono">Ref: {booking.bookingRef}</p>
                        {booking.dealId && <p className="text-[11px] text-brand-light">Deal applied</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setRescheduleBooking(booking)}>Reschedule</Button>
                        <Button variant="danger" size="sm" disabled={cancellingId === booking.id} onClick={() => handleCancel(booking.id)}>
                          {cancellingId === booking.id ? "..." : "Cancel"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {activeWaitlist.length > 0 && (
            <section className="mb-10">
              <h2 className="text-[20px] font-semibold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-warning rounded-full" /> Waitlist ({activeWaitlist.length})
              </h2>
              <div className="space-y-3">
                {activeWaitlist.map((entry) => (
                  <div key={entry.id} className="bg-warning-dim border border-warning-border rounded-[var(--radius-lg)] p-4 flex items-center justify-between">
                    <div><p className="font-medium text-text-primary">{getRestaurantName(entry.restaurantId)}</p><p className="text-[13px] text-text-muted">{entry.date} at {entry.time} · {entry.partySize} guests</p></div>
                    <Button variant="danger" size="xs" onClick={() => removeWaitlist(entry.id)}>Leave</Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pastBookings.length > 0 && (
            <section>
              <h2 className="text-[20px] font-semibold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-text-muted rounded-full" /> Past & Cancelled ({pastBookings.length})
              </h2>
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="opacity-60">
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2"><span className="font-medium text-text-primary">{getRestaurantName(booking.restaurantId)}</span><Badge variant={statusVariant[booking.status]}>{booking.status}</Badge></div>
                          <p className="text-[13px] text-text-muted">{booking.date} at {booking.time} · {booking.partySize} guests</p>
                          <p className="text-[11px] text-text-muted font-mono">Ref: {booking.bookingRef}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {bookings.length === 0 && activeWaitlist.length === 0 && (
            <div className="text-center py-24">
              <p className="text-lg text-text-secondary mb-4">You haven&apos;t made any bookings yet.</p>
              <Link href="/"><Button size="lg">Find a Restaurant</Button></Link>
            </div>
          )}
        </>
      )}

      {rescheduleBooking && (
        <RescheduleModal booking={rescheduleBooking} onClose={() => setRescheduleBooking(null)} onSuccess={() => { setRescheduleBooking(null); loadBookings(); }} />
      )}
    </div>
  );
}
