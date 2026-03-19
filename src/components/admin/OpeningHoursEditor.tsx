"use client";

import type { DayHours } from "@/types";
import { Input } from "@/components/ui/input";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_INTERVAL = { open: "11:00", close: "22:00" };

interface OpeningHoursEditorProps {
  value: DayHours[];
  onChange: (hours: DayHours[]) => void;
}

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  const hours = value.length === 7 ? value : DAYS.map((day) => {
    const existing = value.find((h) => h.day === day);
    return (
      existing ?? {
        day,
        intervals: [DEFAULT_INTERVAL],
        closed: false,
      }
    );
  });

  const _updateDay = (dayIndex: number, updates: Partial<DayHours>) => {
    const next = [...hours];
    next[dayIndex] = { ...next[dayIndex], ...updates };
    onChange(next);
  };

  const setClosed = (dayIndex: number, closed: boolean) => {
    const next = [...hours];
    if (closed) {
      next[dayIndex] = { day: next[dayIndex].day, intervals: [], closed: true };
    } else {
      next[dayIndex] = {
        day: next[dayIndex].day,
        intervals: [DEFAULT_INTERVAL],
        closed: false,
      };
    }
    onChange(next);
  };

  const setInterval = (dayIndex: number, field: "open" | "close", time: string) => {
    const next = [...hours];
    const day = next[dayIndex];
    const intervals = [...(day.intervals ?? [DEFAULT_INTERVAL])];
    if (intervals.length === 0) intervals.push({ ...DEFAULT_INTERVAL });
    intervals[0] = { ...intervals[0], [field]: time };
    next[dayIndex] = { ...day, intervals, closed: false };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {DAYS.map((day, i) => {
        const dayHours = hours[i];
        const isClosed = dayHours?.closed ?? (dayHours?.intervals?.length ?? 0) === 0;
        const open = dayHours?.intervals?.[0]?.open ?? "11:00";
        const close = dayHours?.intervals?.[0]?.close ?? "22:00";

        return (
          <div
            key={day}
            className="flex items-center gap-4 p-3 rounded-[var(--radius-md)] border border-border bg-surface"
          >
            <div className="w-28 shrink-0 text-sm font-medium text-text-primary">
              {day}
            </div>
            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => setClosed(i, e.target.checked)}
                className="rounded border-border accent-brand"
              />
              <span className="text-xs text-text-muted">Closed</span>
            </label>
            {!isClosed && (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={open}
                  onChange={(e) => setInterval(i, "open", e.target.value)}
                  className="w-28"
                />
                <span className="text-text-muted text-sm">–</span>
                <Input
                  type="time"
                  value={close}
                  onChange={(e) => setInterval(i, "close", e.target.value)}
                  className="w-28"
                />
              </div>
            )}
            {isClosed && (
              <span className="text-xs text-text-muted italic">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
