"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { useBookingStore } from "@/stores/bookingStore";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuthStore } from "@/stores/authStore";
import { initializeSlotsIfNeeded } from "@/lib/slots";
import { runMigrations } from "@/lib/storage";
import { restaurants as seedRestaurants } from "@/data/seed";
import { Toast } from "./Toast";
import { AuthModal } from "./AuthModal";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const loadRestaurants = useRestaurantStore((s) => s.loadRestaurants);
  const loadAllReviews = useReviewStore((s) => s.loadAllReviews);
  const pendingOffer = useBookingStore((s) => s.pendingOffer);
  const clearOffer = useBookingStore((s) => s.clearOffer);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const initialize = useAuthStore((s) => s.initialize);

  const [authModal, setAuthModal] = useState<"sign-in" | "sign-up" | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    runMigrations();
    initializeSlotsIfNeeded(seedRestaurants);
    loadRestaurants();
    loadAllReviews();
    initialize();
  }, [loadRestaurants, loadAllReviews, initialize]);

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

          {user && user.isAuthenticated() ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-[5px] rounded-[var(--radius-full)] border border-border-strong text-[13px] font-medium text-text-secondary hover:border-brand hover:text-text-primary transition-all duration-[var(--dur-fast)] bg-transparent cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-brand-dim border border-brand-border flex items-center justify-center text-[10px] font-bold text-brand-light shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[var(--z-overlay)]"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border-strong rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] z-[calc(var(--z-overlay)+1)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-[12px] font-semibold text-text-primary truncate">{user.name}</p>
                      {user.email && (
                        <p className="text-[11px] text-text-muted truncate mt-0.5">{user.email}</p>
                      )}
                      <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-dim text-brand-light border border-brand-border">
                        {user.type}
                      </span>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className="w-full text-left px-4 py-3 text-[13px] text-text-secondary hover:bg-card hover:text-danger transition-colors duration-[var(--dur-fast)] cursor-pointer bg-transparent border-none"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModal("sign-in")}
              className="px-3 py-[5px] rounded-[var(--radius-full)] border border-border-strong text-[13px] font-medium text-text-muted hover:border-brand hover:text-text-primary transition-all duration-[var(--dur-fast)] bg-transparent cursor-pointer"
            >
              Sign in
            </button>
          )}
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

      {authModal && (
        <AuthModal
          defaultMode={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </div>
  );
}
