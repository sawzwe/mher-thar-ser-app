import { parse, isAfter, isBefore, format } from "date-fns";

const SLOT_INTERVAL_MINUTES = 30;

/**
 * Pure time-slot generator — safe to use on the server (no localStorage).
 * Returns HH:mm strings for every slot from openTime up to 1 hour before closeTime.
 */
export function generateTimeSlotsForRestaurant(
  openTime: string,
  closeTime: string
): string[] {
  const times: string[] = [];
  const open = parse(openTime, "HH:mm", new Date());
  let close = parse(closeTime, "HH:mm", new Date());

  if (closeTime === "00:00" || isBefore(close, open)) {
    close = parse("23:30", "HH:mm", new Date());
  }

  const lastSlot = new Date(close.getTime() - 60 * 60 * 1000);

  let current = new Date(open.getTime());
  while (!isAfter(current, lastSlot)) {
    times.push(format(current, "HH:mm"));
    current = new Date(current.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);
  }
  return times;
}
