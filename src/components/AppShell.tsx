"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { useBookingStore } from "@/stores/bookingStore";
import { useReviewStore } from "@/stores/reviewStore";
import { initializeSlotsIfNeeded } from "@/lib/slots";
import { runMigrations } from "@/lib/storage";
import { restaurants as seedRestaurants } from "@/data/seed";
import { Toast } from "./Toast";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const loadRestaurants = useRestaurantStore((s) => s.loadRestaurants);
  const loadAllReviews = useReviewStore((s) => s.loadAllReviews);
  const pendingOffer = useBookingStore((s) => s.pendingOffer);
  const clearOffer = useBookingStore((s) => s.clearOffer);

  useEffect(() => {
    runMigrations();
    initializeSlotsIfNeeded(seedRestaurants);
    loadRestaurants();
    loadAllReviews();
  }, [loadRestaurants, loadAllReviews]);

  const navItems = [
    { href: "/", label: "Discover" },
    { href: "/chat", label: "What to eat?" },
    { href: "/bookings", label: "Bookings" },
  ];

  const isChat = pathname === "/chat";

  return (
    <div className={cn("min-h-screen flex flex-col bg-bg", isChat && "h-screen overflow-hidden")}>
      <nav className="sticky top-0 z-[var(--z-nav)] flex items-center justify-between px-6 md:px-8 h-14 bg-[rgba(10,10,8,0.88)] backdrop-blur-[24px] border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-brand flex items-center justify-center font-serif text-[13px] font-bold text-white">
            H
          </div>
          <span className="font-serif text-[16px] font-bold text-text-primary tracking-[-0.3px] whitespace-nowrap">
            Hmar Thar Sar
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-[5px] rounded-[var(--radius-full)] text-[13px] font-medium transition-all duration-[var(--dur-fast)]",
                pathname === item.href
                  ? "bg-brand-dim text-brand-light"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="w-px h-4 bg-border-strong mx-2" />
          <button className="px-3 py-[5px] rounded-[var(--radius-full)] border border-border-strong text-[13px] font-medium text-text-muted hover:border-brand hover:text-text-primary transition-all duration-[var(--dur-fast)] bg-transparent cursor-pointer">
            Sign in
          </button>
        </div>
      </nav>

      <main className={cn("flex-1", isChat && "overflow-hidden")}>{children}</main>

      {!isChat && (
        <footer className="border-t border-border py-6 px-6 md:px-8 flex items-center justify-between">
          <div>
            <span className="font-serif text-[15px] font-bold text-text-primary">Hmar Thar Sar</span>
            <span className="text-[12px] text-text-muted ml-2">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="text-[12px] text-text-muted">
            Dark-first &middot; EN + MY
          </div>
        </footer>
      )}

      {pendingOffer && (
        <Toast
          message={`A spot opened up! ${pendingOffer.name} (party of ${pendingOffer.partySize}) can now book for ${pendingOffer.date} at ${pendingOffer.time}.`}
          type="success"
          onClose={clearOffer}
          actionLabel="View Bookings"
          actionHref="/bookings"
        />
      )}
    </div>
  );
}
