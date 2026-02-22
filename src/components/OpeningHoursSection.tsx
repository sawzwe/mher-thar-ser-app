"use client";

import { DayHours } from "@/types";
import { isOpenNow, formatDayHours } from "@/lib/hours";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OpeningHoursSectionProps { openingHours: DayHours[]; }

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function OpeningHoursSection({ openingHours }: OpeningHoursSectionProps) {
  const status = isOpenNow(openingHours);
  const today = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const sorted = DAY_ORDER.map((day) => openingHours.find((d) => d.day === day) ?? { day, intervals: [], closed: true });

  return (
    <section>
      <h2 className="font-serif text-[24px] font-bold text-text-primary tracking-[-0.5px] mb-3">Opening Hours</h2>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={status.open ? "success" : "danger"}>
          <BadgeDot />
          {status.open ? "Open Now" : "Closed"}
        </Badge>
        {status.nextChange && <span className="text-[13px] text-text-muted">{status.nextChange}</span>}
      </div>
      <div className="space-y-1">
        {sorted.map((dh) => {
          const isToday = dh.day === today;
          return (
            <div key={dh.day} className={cn("flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-[13px]", isToday && "bg-brand-dim border border-brand-border")}>
              <span className={isToday ? "text-brand-light font-medium" : "text-text-primary"}>
                {dh.day}{isToday && <span className="ml-1.5 text-[11px] opacity-70">(Today)</span>}
              </span>
              <span className={dh.closed || dh.intervals.length === 0 ? "text-danger" : "text-text-muted"}>
                {formatDayHours(dh)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
