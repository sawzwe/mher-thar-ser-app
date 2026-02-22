import { describe, it, expect } from "vitest";
import { isOpenNow, formatDayHours } from "@/lib/hours";
import { DayHours } from "@/types";

function makeHours(overrides: Partial<Record<string, { open: string; close: string }[] | "closed">> = {}): DayHours[] {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days.map((day) => {
    if (overrides[day] === "closed") return { day, intervals: [], closed: true };
    if (overrides[day]) return { day, intervals: overrides[day] as { open: string; close: string }[] };
    return { day, intervals: [{ open: "11:00", close: "22:00" }] };
  });
}

describe("isOpenNow", () => {
  it("returns open when current time is within an interval", () => {
    const hours = makeHours();
    // Wednesday at 14:00
    const wed = new Date("2026-02-18T14:00:00");
    const result = isOpenNow(hours, wed);
    expect(result.open).toBe(true);
    expect(result.nextChange).toBe("Closes at 22:00");
  });

  it("returns closed when current time is before opening", () => {
    const hours = makeHours();
    const wed = new Date("2026-02-18T08:00:00");
    const result = isOpenNow(hours, wed);
    expect(result.open).toBe(false);
    expect(result.nextChange).toBe("Opens at 11:00");
  });

  it("returns closed when current time is after closing", () => {
    const hours = makeHours();
    const wed = new Date("2026-02-18T23:00:00");
    const result = isOpenNow(hours, wed);
    expect(result.open).toBe(false);
  });

  it("handles closed days", () => {
    const hours = makeHours({ Monday: "closed" });
    // Monday
    const mon = new Date("2026-02-16T14:00:00");
    const result = isOpenNow(hours, mon);
    expect(result.open).toBe(false);
    expect(result.nextChange).toContain("Opens");
    expect(result.nextChange).toContain("Tuesday");
  });

  it("handles multiple intervals per day (lunch + dinner)", () => {
    const hours = makeHours({
      Saturday: [
        { open: "12:00", close: "15:00" },
        { open: "17:00", close: "23:00" },
      ],
    });

    // Saturday at 13:00 (in first interval)
    const satLunch = new Date("2026-02-21T13:00:00");
    expect(isOpenNow(hours, satLunch).open).toBe(true);

    // Saturday at 16:00 (between intervals)
    const satGap = new Date("2026-02-21T16:00:00");
    const gapResult = isOpenNow(hours, satGap);
    expect(gapResult.open).toBe(false);
    expect(gapResult.nextChange).toBe("Opens at 17:00");

    // Saturday at 20:00 (in second interval)
    const satDinner = new Date("2026-02-21T20:00:00");
    expect(isOpenNow(hours, satDinner).open).toBe(true);
  });

  it("handles midnight closing time", () => {
    const hours = makeHours({
      Friday: [{ open: "11:00", close: "00:00" }],
    });
    // Friday at 23:30 should be open (00:00 is midnight)
    const fri = new Date("2026-02-20T23:30:00");
    expect(isOpenNow(hours, fri).open).toBe(true);
  });
});

describe("formatDayHours", () => {
  it("formats single interval", () => {
    expect(formatDayHours({ day: "Monday", intervals: [{ open: "11:00", close: "22:00" }] }))
      .toBe("11:00 – 22:00");
  });

  it("formats multiple intervals", () => {
    expect(
      formatDayHours({
        day: "Saturday",
        intervals: [
          { open: "12:00", close: "15:00" },
          { open: "17:00", close: "23:00" },
        ],
      })
    ).toBe("12:00 – 15:00, 17:00 – 23:00");
  });

  it("shows Closed for closed days", () => {
    expect(formatDayHours({ day: "Monday", intervals: [], closed: true })).toBe("Closed");
  });
});
