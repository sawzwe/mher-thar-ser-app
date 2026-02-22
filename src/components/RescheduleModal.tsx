"use client";

import { useState, useEffect } from "react";
import { Booking, Slot } from "@/types";
import { getSlotsForDate } from "@/lib/slots";
import { useBookingStore } from "@/stores/bookingStore";
import { restaurants } from "@/data/seed";
import { format, addDays } from "date-fns";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RescheduleModalProps { booking: Booking; onClose: () => void; onSuccess: () => void; }

export function RescheduleModal({ booking, onClose, onSuccess }: RescheduleModalProps) {
  const reschedule = useBookingStore((s) => s.reschedule);
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const restaurant = restaurants.find((r) => r.id === booking.restaurantId);

  useEffect(() => { setSlots(getSlotsForDate(booking.restaurantId, date)); setTime(""); }, [date, booking.restaurantId]);

  const availableDates = Array.from({ length: 14 }, (_, i) => { const d = addDays(new Date(), i); return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d") }; });

  const handleSubmit = async () => {
    if (!time) { setError("Please select a new time"); return; }
    setSubmitting(true); setError("");
    const result = await reschedule(booking.id, date, time);
    if (result.success) onSuccess(); else setError(result.error);
    setSubmitting(false);
  };

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title="Reschedule Booking" onClose={onClose} />
      <ModalBody className="space-y-5">
        <div className="bg-surface rounded-[var(--radius-md)] p-3 text-[13px] border border-border text-text-muted">
          <span className="font-medium text-text-primary">{restaurant?.name}</span> · Ref: {booking.bookingRef}
          <br />Current: {booking.date} at {booking.time} · {booking.partySize} guests
        </div>
        <Select label="New Date" labelMy="/ ရက်" value={date} onChange={(e) => setDate(e.target.value)} className="w-full">
          {availableDates.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Select>
        <div>
          <label className="text-[13px] font-semibold text-text-secondary mb-2 block">New Time</label>
          {slots.length === 0 ? <p className="text-[13px] text-text-muted">No slots for this date.</p> : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {slots.map((slot) => {
                const full = slot.remaining < booking.partySize;
                const selected = time === slot.time;
                const isCurrent = slot.time === booking.time && date === booking.date;
                return (
                  <button key={slot.time} onClick={() => !full && !isCurrent && setTime(slot.time)} disabled={full || isCurrent}
                    className={cn(
                      "px-3.5 py-2 rounded-[var(--radius-md)] text-[13px] font-medium border transition-all duration-[var(--dur-fast)] cursor-pointer",
                      isCurrent ? "bg-surface text-text-muted border-text-muted opacity-50"
                        : selected ? "bg-brand text-white border-brand"
                        : full ? "bg-surface text-text-muted border-border opacity-35 line-through cursor-not-allowed"
                        : "bg-card text-text-primary border-border-strong hover:border-brand hover:text-brand-light hover:bg-brand-dim"
                    )}>
                    {slot.time}
                    {isCurrent && <span className="block text-[10px]">Current</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {error && <p className="text-[13px] text-danger bg-danger-dim px-4 py-2 rounded-[var(--radius-md)] border border-danger-border">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" disabled={!time} loading={submitting} onClick={handleSubmit}>Confirm Reschedule</Button>
      </ModalFooter>
    </Modal>
  );
}
