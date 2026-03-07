"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CaretDown, Sun, Moon } from "@phosphor-icons/react";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { useBookingStore } from "@/stores/bookingStore";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useThemeStore } from "@/stores/themeStore";
import { initializeSlotsIfNeeded } from "@/lib/slots";
import { runMigrations } from "@/lib/storage";
import { t } from "@/lib/i18n/translations";
import { Logo } from "@/components/Logo";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
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
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const hydrate = useLanguageStore((s) => s.hydrate);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  const [authModal, setAuthModal] = useState<"sign-in" | "sign-up" | null>(
    null,
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const LANG_OPTIONS = [
    { value: "en" as const, label: "English", flag: "🇬🇧" },
    { value: "my" as const, label: "မြန်မာ", flag: "🇲🇲" },
  ] as const;

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    runMigrations();
    loadAllReviews();
    initialize();
    loadRestaurants().then(() => {
      const { restaurants } = useRestaurantStore.getState();
      if (restaurants.length > 0) {
        initializeSlotsIfNeeded(
          restaurants.map((r) => ({
            id: r.id,
            openTime: r.openTime,
            closeTime: r.closeTime,
          })),
        );
      }
    });
  }, [loadRestaurants, loadAllReviews, initialize]);

  const navItems = [
    { href: "/", label: t(lang, "discover") },
    { href: "/restaurants", label: t(lang, "seeAllRestaurants") },
    { href: "/chat", label: t(lang, "whatToEat") },
    { href: "/bookings", label: t(lang, "bookings") },
  ];

  const isChat = pathname === "/chat";
  const isCms =
    pathname?.startsWith("/vendor") || pathname?.startsWith("/admin");
  const isHome = pathname === "/";

  if (isCms) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-bg",
        isChat && "h-screen overflow-hidden",
      )}
    >
        <nav className="desktop-nav fixed top-4 left-4 right-4 md:left-8 md:right-8 z-[var(--z-nav)] flex items-center justify-between px-5 md:px-6 h-14 rounded-2xl bg-surface/95 backdrop-blur-xl backdrop-saturate-150 border border-brand/20 shadow-[var(--shadow-lg)] shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className={cn(
              "shrink-0 flex items-center justify-center overflow-hidden",
              isHome ? "w-[30px] h-[30px] rounded-[7px]" : "w-[30px] h-[30px] rounded-[7px]",
            )}
          >
            <Logo size={30} />
          </div>
          <span
            className={cn(
              "font-sans font-bold text-text-primary whitespace-nowrap",
              isHome ? "text-[15px] tracking-[-0.3px]" : "text-[16px] tracking-[-0.3px]"
            )}
          >
            Mher Thar Ser
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-full)] border border-border-strong text-text-muted hover:text-text-primary hover:border-brand transition-all bg-transparent cursor-pointer shrink-0"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={18} weight="regular" /> : <Sun size={18} weight="regular" />}
          </button>
          <div className="relative mr-2 md:mr-3">
            <button
              type="button"
              onClick={() => setLangDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-full)] border border-border-strong text-[13px] font-medium text-text-primary hover:border-brand hover:text-text-primary transition-all bg-transparent cursor-pointer"
            >
              <span className="text-base leading-none">
                {LANG_OPTIONS.find((o) => o.value === lang)?.flag ?? "🌐"}
              </span>
              <span className={cn(lang === "my" && "font-my")}>
                {LANG_OPTIONS.find((o) => o.value === lang)?.label ?? lang}
              </span>
              <CaretDown
                size={12}
                weight="bold"
                className={cn(
                  "text-text-muted transition-transform",
                  langDropdownOpen && "rotate-180",
                )}
              />
            </button>
            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-[var(--z-overlay)]"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 min-w-[140px] bg-surface border border-border-strong rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] z-[calc(var(--z-overlay)+1)] overflow-hidden">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setLang(opt.value);
                        setLangDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium transition-all cursor-pointer border-none",
                        lang === opt.value
                          ? "bg-brand-dim text-brand-light"
                          : "text-text-secondary hover:bg-card hover:text-text-primary",
                      )}
                    >
                      <span className="text-base leading-none">{opt.flag}</span>
                      <span className={opt.value === "my" ? "font-my" : ""}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {isHome ? (
            <>
              {user && user.isAuthenticated() ? (
                <Link
                  href="/bookings"
                  className="hidden md:flex px-4 py-2 rounded-[100px] border border-border-strong text-[13px] font-medium text-text-secondary hover:text-text-primary transition-all"
                >
                  {t(lang, "bookings")}
                </Link>
              ) : (
                <button
                  onClick={() => setAuthModal("sign-in")}
                  className="hidden md:flex px-4 py-2 rounded-[100px] border border-border-strong text-[13px] font-medium text-text-muted hover:text-text-primary transition-all bg-transparent cursor-pointer"
                >
                  {t(lang, "signIn")}
                </button>
              )}
              {user?.isAuthenticated() ? (
                <Link
                  href="/restaurants"
                  className="flex items-center gap-1 px-4 py-2 rounded-[100px] bg-brand text-white text-[13px] font-semibold hover:bg-brand-hover transition-all"
                >
                  {t(lang, "seeAllRestaurants")}
                  <span className="hidden sm:inline">→</span>
                </Link>
              ) : (
                <Link
                  href="/restaurants"
                  className="flex items-center gap-1 px-4 py-2 rounded-[100px] bg-brand text-white text-[13px] font-semibold hover:bg-brand-hover transition-all"
                >
                  {t(lang, "seeAllRestaurants")}
                  <span className="hidden sm:inline">→</span>
                </Link>
              )}
            </>
          ) : (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-[5px] rounded-[var(--radius-full)] text-[13px] font-medium transition-all duration-[var(--dur-fast)]",
                    pathname === item.href
                      ? "bg-brand-dim text-brand-light"
                      : "text-text-muted hover:text-text-primary",
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
                      <p className="text-[12px] font-semibold text-text-primary truncate">
                        {user.name}
                      </p>
                      {user.email && (
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                      <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-dim text-brand-light border border-brand-border">
                        {user.type}
                      </span>
                      {user.type === "vendor" && (
                        <Link
                          href="/vendor"
                          className="block mt-2 text-[12px] font-medium text-brand-light hover:underline"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          🏪 Vendor Dashboard
                        </Link>
                      )}
                      {user.type === "admin" && (
                        <Link
                          href="/admin"
                          className="block mt-2 text-[12px] font-medium text-[#9B7CF5] hover:underline"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          ⚙️ Admin Panel
                        </Link>
                      )}
                      {user.type === "customer" && (
                        <Link
                          href="/claim"
                          className="block mt-2 text-[12px] font-medium text-brand-light hover:underline"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          🏪 Claim your restaurant
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        setSignOutLoading(true);
                        try {
                          await signOut();
                        } finally {
                          setSignOutLoading(false);
                        }
                      }}
                      disabled={signOutLoading}
                      className="w-full text-left px-4 py-3 text-[13px] text-text-secondary hover:bg-card hover:text-danger transition-colors duration-[var(--dur-fast)] cursor-pointer bg-transparent border-none disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {signOutLoading ? "Signing out…" : "Sign out"}
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
              {t(lang, "signIn")}
            </button>
          )}
            </>
          )}
        </div>
        </nav>

      <div className="mobile-topbar-wrapper">
        <MobileTopBar />
      </div>

      <main className={cn("flex-1", !isChat && "pt-20 main-with-nav", isChat && "overflow-hidden")}>
        {children}
      </main>

      {!isChat && !isHome && (
        <footer className="border-t border-border py-6 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-sans text-[15px] font-bold text-text-primary">
              Mher Thar Ser
            </span>
            <span className="text-[12px] text-text-muted ml-2">
              &copy; {new Date().getFullYear()}
            </span>
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
        <AuthModal defaultMode={authModal} onClose={() => setAuthModal(null)} />
      )}
    </div>
  );
}
