"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Info,
  ForkKnife,
  Tag,
  CalendarBlank,
  CalendarCheck,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function VendorRestaurantTabs({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const pathname = usePathname();
  const base = `/vendor/restaurants/${restaurantId}`;

  const tabs = [
    { href: base, label: "Info", Icon: Info },
    { href: `${base}/menu`, label: "Menu", Icon: ForkKnife },
    { href: `${base}/deals`, label: "Deals", Icon: Tag },
    { href: `${base}/slots`, label: "Availability", Icon: CalendarBlank },
    { href: `${base}/bookings`, label: "Bookings", Icon: CalendarCheck },
  ];

  return (
    <nav className="flex gap-1 border-b border-border mb-8">
      {tabs.map((tab) => {
        const TabIcon = tab.Icon;
        const isActive =
          pathname === tab.href ||
          (tab.href !== base && pathname?.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "text-brand border-brand"
                : "text-text-secondary hover:text-text-primary border-transparent hover:border-brand",
            )}
          >
            <TabIcon size={16} weight="regular" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
