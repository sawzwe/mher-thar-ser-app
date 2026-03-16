"use client";

import { useState, useEffect, useCallback } from "react";
import { Restaurant, Deal } from "@/types";
import { useBookingStore } from "@/stores/bookingStore";
import { useWaitlistStore } from "@/stores/waitlistStore";
import { format, addDays } from "date-fns";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AvailabilitySlot {
  date: string;
  time: string;
  capacity: number;
  remaining: number;
}

interface BookingModalProps {
  restaurant: Restaurant;
  preselectedDeal?: Deal;
  onClose: () => void;
  onSuccess: (bookingRef: string) => void;
}

type Step = "datetime" | "details" | "confirm";

export function BookingModal({ restaurant, preselectedDeal, onClose, onSuccess }: BookingModalProps) {
  const book = useBookingStore((s) => s.book);
  const joinWaitlist = useWaitlistStore((s) => s.join);

  const [step, setStep] = useState<Step>("datetime");
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>(preselectedDeal);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const fetchSlots = useCallback(async (d: string) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/availability?date=${d}`);
      if (res.ok) {
        const json = await res.json() as { slots: AvailabilitySlot[] };
        setSlots(json.slots ?? []);
      }
    } finally {
      setSlotsLoading(false);
    }
  }, [restaurant.id]);

  useEffect(() => {
    fetchSlots(date);
  }, [date, fetchSlots]);

  const availableDates = Array.from({ length: 14 }, (_, i) => { const d = addDays(new Date(), i); return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d") }; });
  const selectedSlot = slots.find((s) => s.time === time);
  const isSlotFull = selectedSlot ? selectedSlot.remaining < partySize : false;
  const stepIndex = ["datetime", "details", "confirm"].indexOf(step);

  const handleJoinWaitlist = async () => {
    if (!time || !name) return;
    setSubmitting(true);
    await joinWaitlist({ restaurantId: restaurant.id, date, time, partySize, name, contact });
    setWaitlistJoined(true); setSubmitting(false);
  };

  const handleSubmit = async () => {
    setError("");
    if (!time) { setError("Please select a time slot"); return; }
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!contact.trim()) { setError("Please enter your contact info"); return; }
    setSubmitting(true);
    const result = await book({ restaurantId: restaurant.id, dealId: selectedDeal?.id, date, time, partySize, customerName: name, contact, notes });
    if (result.success) onSuccess(result.booking.bookingRef);
    else setError(result.error);
    setSubmitting(false);
  };

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title="Book a Table" titleMy="စားပွဲဘွတ်ကင်" onClose={onClose} />
      <ModalBody className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(["datetime", "details", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold",
                step === s ? "bg-brand text-white" : i < stepIndex ? "bg-success text-white" : "bg-surface text-text-muted"
              )}>
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-border rounded" />}
            </div>
          ))}
        </div>

        {step === "datetime" && (
          <>
            {restaurant.deals.length > 0 && (
              <div>
                <label className="text-[13px] font-semibold text-text-secondary mb-2 block">Select a Deal (optional)</label>
                <div className="space-y-2">
                  <button onClick={() => setSelectedDeal(undefined)} className={cn("w-full text-left p-3 rounded-[var(--radius-md)] border text-[13px] transition-all duration-[var(--dur-fast)] cursor-pointer", !selectedDeal ? "border-brand bg-brand-dim text-text-primary" : "border-border-strong text-text-muted hover:border-text-muted")}>
                    No deal — regular booking
                  </button>
                  {restaurant.deals.map((deal) => (
                    <button key={deal.id} onClick={() => setSelectedDeal(deal)} className={cn("w-full text-left p-3 rounded-[var(--radius-md)] border text-[13px] transition-all duration-[var(--dur-fast)] cursor-pointer", selectedDeal?.id === deal.id ? "border-brand bg-brand-dim" : "border-border-strong hover:border-text-muted")}>
                      <span className="font-semibold text-text-primary">{deal.title}</span>
                      {deal.price && <span className="ml-2 text-brand-light font-bold">฿{deal.price}</span>}
                      {deal.discount && <span className="ml-2 text-brand-light font-bold">{deal.discount}% off</span>}
                      <p className="text-text-muted mt-0.5">{deal.description}</p>
                      {deal.conditions && <p className="text-[11px] text-text-muted mt-0.5 italic">{deal.conditions}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Select label="Date" labelMy="/ ရက်" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); setSlots([]); }} className="w-full">
                {availableDates.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
                  Party size <span className="font-my text-[12px] text-text-muted">/ လူ</span>
                </label>
                <div className="flex items-center gap-3 h-11">
                  <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-9 h-9 rounded-full border border-border-strong flex items-center justify-center hover:bg-card text-text-primary transition-all duration-[var(--dur-fast)] cursor-pointer">−</button>
                  <span className="text-lg font-bold text-text-primary w-8 text-center">{partySize}</span>
                  <button onClick={() => setPartySize(Math.min(20, partySize + 1))} className="w-9 h-9 rounded-full border border-border-strong flex items-center justify-center hover:bg-card text-text-primary transition-all duration-[var(--dur-fast)] cursor-pointer">+</button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-text-secondary mb-2 block flex items-center gap-2">
                Select a time <span className="font-my text-[12px] text-text-muted">/ အချိန်</span>
              </label>
              {slotsLoading ? <p className="text-[13px] text-text-muted">Loading available times…</p> : slots.length === 0 ? <p className="text-[13px] text-text-muted">No slots available for this date.</p> : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {slots.map((slot) => {
                    const full = slot.remaining < partySize;
                    const selected = time === slot.time;
                    const fewLeft = !full && slot.remaining <= 4;
                    return (
                      <button key={slot.time} onClick={() => setTime(slot.time)} disabled={false}
                        className={cn(
                          "px-3.5 py-2 rounded-[var(--radius-md)] text-[13px] font-medium border transition-all duration-[var(--dur-fast)] cursor-pointer",
                          selected ? (full ? "bg-warning-dim text-warning border-warning-border" : "bg-brand text-white border-brand")
                            : full ? "bg-surface text-text-muted border-border opacity-50 line-through"
                            : fewLeft ? "bg-card text-warning border-warning-border"
                            : "bg-card text-text-primary border-border-strong hover:border-brand hover:text-brand-light hover:bg-brand-dim"
                        )}>
                        {slot.time}
                        {full && !selected && " ✕"}
                        {fewLeft && !selected && " ⚠"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {step === "details" && (
          <>
            <div className="bg-surface rounded-[var(--radius-lg)] p-4 text-[13px] space-y-1 border border-border">
              <p><span className="text-text-muted">Date:</span> <span className="font-medium text-text-primary">{date}</span></p>
              <p><span className="text-text-muted">Time:</span> <span className="font-medium text-text-primary">{time}</span></p>
              <p><span className="text-text-muted">Party:</span> <span className="font-medium text-text-primary">{partySize} guests</span></p>
              {selectedDeal && <p><span className="text-text-muted">Deal:</span> <span className="font-medium text-brand-light">{selectedDeal.title}</span></p>}
              {isSlotFull && <p className="text-warning font-medium">This slot is full — you can join the waitlist below.</p>}
            </div>
            <Input label="Full Name" labelMy="/ အမည်" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            <Input label="Contact" labelMy="/ ဖုန်းနံပါတ်" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="your@email.com or phone number" />
            <Textarea label="Special Requests" labelMy="/ အထူးတောင်းဆိုချက်" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, seating preference, celebration..." rows={3} />
          </>
        )}

        {step === "confirm" && (
          <div className="bg-surface rounded-[var(--radius-lg)] p-5 text-[13px] space-y-2 border border-border">
            <h3 className="font-bold text-base text-text-primary mb-3">Booking Summary</h3>
            <p><span className="text-text-muted">Restaurant:</span> <span className="font-medium text-text-primary">{restaurant.name}</span></p>
            <p><span className="text-text-muted">Date:</span> <span className="font-medium text-text-primary">{date}</span></p>
            <p><span className="text-text-muted">Time:</span> <span className="font-medium text-text-primary">{time}</span></p>
            <p><span className="text-text-muted">Party size:</span> <span className="font-medium text-text-primary">{partySize} guests</span></p>
            {selectedDeal && <p><span className="text-text-muted">Deal:</span> <span className="font-medium text-brand-light">{selectedDeal.title}</span></p>}
            <hr className="border-border my-2" />
            <p><span className="text-text-muted">Name:</span> <span className="font-medium text-text-primary">{name}</span></p>
            <p><span className="text-text-muted">Contact:</span> <span className="font-medium text-text-primary">{contact}</span></p>
            {notes && <p><span className="text-text-muted">Notes:</span> <span className="font-medium text-text-primary">{notes}</span></p>}
          </div>
        )}

        {error && <p className="text-[13px] text-danger bg-danger-dim px-4 py-2 rounded-[var(--radius-md)] border border-danger-border">{error}</p>}
      </ModalBody>

      <ModalFooter>
        {step === "datetime" && (
          <Button className="w-full" size="lg" disabled={!time} onClick={() => { if (!time) { setError("Please select a time"); return; } setError(""); setStep("details"); }}>
            Continue →
          </Button>
        )}
        {step === "details" && (
          <>
            <Button variant="ghost" onClick={() => setStep("datetime")}>Back</Button>
            {isSlotFull ? (
              waitlistJoined
                ? <div className="flex-1 py-3 rounded-[var(--radius-md)] text-center text-[13px] font-semibold bg-success-dim text-success">Joined waitlist!</div>
                : <Button variant="secondary" className="flex-1" disabled={submitting || !name} onClick={handleJoinWaitlist} loading={submitting}>Join Waitlist</Button>
            ) : (
              <Button className="flex-1" onClick={() => { if (!name.trim() || !contact.trim()) { setError("Name and contact are required"); return; } setError(""); setStep("confirm"); }}>Review Booking →</Button>
            )}
          </>
        )}
        {step === "confirm" && (
          <>
            <Button variant="ghost" onClick={() => setStep("details")}>Back</Button>
            <Button className="flex-1" loading={submitting} onClick={handleSubmit}>Confirm Booking →</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
