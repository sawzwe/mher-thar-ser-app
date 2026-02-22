import { DayHours } from "@/types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function isOpenNow(
  openingHours: DayHours[],
  now: Date = new Date()
): { open: boolean; nextChange?: string } {
  const dayName = DAY_NAMES[now.getDay()];
  const dayEntry = openingHours.find((d) => d.day === dayName);

  if (!dayEntry || dayEntry.closed || dayEntry.intervals.length === 0) {
    const nextOpenDay = findNextOpenDay(openingHours, now);
    return {
      open: false,
      nextChange: nextOpenDay
        ? `Opens ${nextOpenDay.day} at ${nextOpenDay.intervals[0].open}`
        : undefined,
    };
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const interval of dayEntry.intervals) {
    const openMin = timeToMinutes(interval.open);
    let closeMin = timeToMinutes(interval.close);

    // Handle midnight crossover (e.g. close at 00:00 or 01:00)
    if (closeMin <= openMin) closeMin += 24 * 60;

    if (nowMinutes >= openMin && nowMinutes < closeMin) {
      const closeHour = interval.close === "00:00" ? "midnight" : interval.close;
      return { open: true, nextChange: `Closes at ${closeHour}` };
    }
  }

  // Not in any interval — find next opening
  const upcomingToday = dayEntry.intervals.find(
    (i) => timeToMinutes(i.open) > nowMinutes
  );
  if (upcomingToday) {
    return { open: false, nextChange: `Opens at ${upcomingToday.open}` };
  }

  const nextOpenDay = findNextOpenDay(openingHours, now);
  return {
    open: false,
    nextChange: nextOpenDay
      ? `Opens ${nextOpenDay.day} at ${nextOpenDay.intervals[0].open}`
      : undefined,
  };
}

function findNextOpenDay(
  openingHours: DayHours[],
  now: Date
): DayHours | null {
  const currentDayIdx = now.getDay();
  for (let offset = 1; offset <= 7; offset++) {
    const idx = (currentDayIdx + offset) % 7;
    const dayName = DAY_NAMES[idx];
    const entry = openingHours.find((d) => d.day === dayName);
    if (entry && !entry.closed && entry.intervals.length > 0) {
      return entry;
    }
  }
  return null;
}

export function formatDayHours(dh: DayHours): string {
  if (dh.closed || dh.intervals.length === 0) return "Closed";
  return dh.intervals.map((i) => `${i.open} – ${i.close}`).join(", ");
}
