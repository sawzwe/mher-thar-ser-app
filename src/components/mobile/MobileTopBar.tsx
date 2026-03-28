"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Storefront,
  DotsThreeVertical,
  Sun,
  Moon,
  CaretDown,
  Globe,
  CalendarBlank,
} from "@phosphor-icons/react";
import Image from "next/image";
import { LOGO_HORIZONTAL_SRC } from "@/components/Logo";
import { useLanguageStore } from "@/stores/languageStore";
import { useThemeStore } from "@/stores/themeStore";
import { useMobileHomeViewStore } from "@/stores/mobileHomeViewStore";
import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const LANG_OPTIONS = [
  { value: "en" as const, label: "English", flag: "🇬🇧" },
  { value: "my" as const, label: "မြန်မာ", flag: "🇲🇲" },
] as const;

export function MobileTopBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const homeView = useMobileHomeViewStore((s) => s.view);
  const setHomeView = useMobileHomeViewStore((s) => s.setView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!menuOpen) {
      queueMicrotask(() => setMenuStyle(null));
      return;
    }
    if (typeof document === "undefined") return;
    const btn = menuBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    queueMicrotask(() =>
      setMenuStyle({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    );
  }, [menuOpen]);

  return (
    <div className="mobile-topbar">
      <Link href="/" className="topbar-left">
        <span className="topbar-logo-brand">
          <Image
            src={LOGO_HORIZONTAL_SRC}
            alt="Mher Thar Ser"
            width={2400}
            height={800}
            className="topbar-logo-wordmark-img"
            priority
            sizes="(max-width: 768px) 55vw, 240px"
          />
        </span>
      </Link>
      <div className="topbar-right">
        {isHome ? (
          <div className="topbar-segmented" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={homeView === "map"}
              onClick={() => setHomeView("map")}
              className={cn(
                "topbar-segmented-btn",
                homeView === "map" && "topbar-segmented-btn-active"
              )}
            >
              <MapPin size={18} weight="fill" />
              <span>{t(lang, "map")}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={homeView === "list"}
              onClick={() => setHomeView("list")}
              className={cn(
                "topbar-segmented-btn",
                homeView === "list" && "topbar-segmented-btn-active"
              )}
            >
              <Storefront size={18} weight="regular" />
              <span>{t(lang, "list")}</span>
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/"
              className="topbar-icon-btn"
              aria-label="Map"
            >
              <MapPin size={20} weight="fill" />
            </Link>
            <Link
              href="/restaurants"
              className="topbar-icon-btn"
              aria-label={t(lang, "seeAllRestaurants")}
            >
              <Storefront size={20} weight="regular" />
            </Link>
          </>
        )}
        <div className="relative">
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => {
              setMenuOpen((o) => !o);
              setLangOpen(false);
            }}
            className="topbar-icon-btn"
            aria-label="Menu"
          >
            <DotsThreeVertical size={20} weight="bold" />
          </button>
          {menuOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <>
                <div
                  className="fixed inset-0 z-[1040]"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="mobile-topbar-menu"
                  style={{
                    position: "fixed",
                    top: menuStyle?.top ?? 64,
                    right: menuStyle?.right ?? 16,
                    left: "auto",
                    zIndex: 1150,
                  }}
                >
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  className="mobile-menu-item"
                >
                  <Globe size={18} weight="regular" className="shrink-0 text-text-muted" />
                  <span className={cn(lang === "my" && "font-my")}>
                    {LANG_OPTIONS.find((o) => o.value === lang)?.label ?? lang}
                  </span>
                  <CaretDown
                    size={12}
                    weight="bold"
                    className={cn(
                      "ml-auto shrink-0 text-text-muted transition-transform",
                      langOpen && "rotate-180"
                    )}
                  />
                </button>
                {langOpen && (
                  <div className="mobile-menu-sublist">
                    {LANG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setLang(opt.value);
                          setLangOpen(false);
                          setMenuOpen(false);
                        }}
                        className={cn(
                          "mobile-menu-subitem",
                          lang === opt.value && "mobile-menu-subitem-active"
                        )}
                      >
                        <span className="text-base shrink-0">{opt.flag}</span>
                        <span className={opt.value === "my" ? "font-my" : ""}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <Link
                  href="/bookings"
                  className="mobile-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <CalendarBlank size={18} weight="regular" className="shrink-0 text-text-muted" />
                  {t(lang, "bookings")}
                </Link>
                <div className="mobile-menu-divider" />
                <div className="mobile-menu-section">{t(lang, "settings")}</div>
                <button
                  type="button"
                  onClick={() => {
                    setTheme(theme === "light" ? "dark" : "light");
                    setMenuOpen(false);
                  }}
                  className="mobile-menu-item"
                >
                  {theme === "light" ? (
                    <Moon size={18} weight="regular" className="shrink-0 text-text-muted" />
                  ) : (
                    <Sun size={18} weight="regular" className="shrink-0 text-text-muted" />
                  )}
                  <span>{theme === "light" ? t(lang, "darkMode") : t(lang, "lightMode")}</span>
                </button>
              </div>
            </>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}
