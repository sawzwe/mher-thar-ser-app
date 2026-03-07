"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Restaurant, Deal } from "@/types";
import { fetchRestaurantById } from "@/lib/mockApi/restaurants";
import { getSlotsForDate } from "@/lib/slots";
import { BookingModal } from "@/components/BookingModal";
import { MapSection } from "@/components/MapSection";
import { TransitSection } from "@/components/TransitSection";
import { MenuSection } from "@/components/MenuSection";
import { OpeningHoursSection } from "@/components/OpeningHoursSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { isOpenNow } from "@/lib/hours";
import { useReviewStore } from "@/stores/reviewStore";
import { useLanguageStore } from "@/stores/languageStore";
import { t } from "@/lib/i18n/translations";
import { format, addDays } from "date-fns";
import {
  Phone,
  EnvelopeSimple,
  Globe,
  FacebookLogo,
  InstagramLogo,
  XLogo,
  TiktokLogo,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const priceLabel: Record<number, string> = {
  1: "฿ Budget",
  2: "฿฿ Mid-range",
  3: "฿฿฿ Upscale",
  4: "฿฿฿฿ Fine Dining",
};

type TabKey = "about" | "menu" | "reviews";

export function RestaurantDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [preselectedDeal, setPreselectedDeal] = useState<Deal | undefined>();
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [previewDate, setPreviewDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [previewPartySize, setPreviewPartySize] = useState(2);
  const { getAverageRating, loadAllReviews } = useReviewStore();
  const lang = useLanguageStore((s) => s.lang);

  const previewSlots = useMemo(
    () => (restaurant ? getSlotsForDate(restaurant.id, previewDate) : []),
    [restaurant, previewDate],
  );

  useEffect(() => {
    fetchRestaurantById(id).then((r) => {
      setRestaurant(r);
      setLoading(false);
    });
    loadAllReviews();
  }, [id, loadAllReviews]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-card rounded-[var(--radius-xl)]" />
          <div className="h-8 bg-card rounded w-1/3" />
          <div className="h-4 bg-card rounded w-full" />
          <div className="h-4 bg-card rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-20 text-center">
        <h2 className="font-sans text-2xl font-bold text-text-primary mb-4">
          {t(lang, "restaurantNotFound")}
        </h2>
        <Link href="/">
          <Button variant="ghost">{t(lang, "backToDiscovery")}</Button>
        </Link>
      </div>
    );
  }

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d") };
  });
  const r = restaurant;
  const openStatus = isOpenNow(r.openingHours);
  const ratingInfo = getAverageRating(r.id, r.rating);
  const tabs = [
    { id: "about", label: "Overview" },
    { id: "menu", label: "Menu" },
    {
      id: "reviews",
      label: `Reviews${ratingInfo.count > 0 ? ` (${ratingInfo.count})` : ""}`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
      <nav className="breadcrumb">
        <Link href="/" className="breadcrumb-link">
          {t(lang, "home")}
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{r.name}</span>
      </nav>

      {/* Hero image */}
      <div className="restaurant-hero">
        <Image
          src={r.imageUrl}
          alt={r.name}
          fill
          className="hero-img"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <h1>{r.name}</h1>
          <div className="hero-meta">
            <span className="rating-star font-semibold">★ {ratingInfo.avg}</span>
            <span>
              (
              {ratingInfo.count > 0
                ? `${ratingInfo.count} ${t(lang, "reviews")}`
                : `${r.reviewCount} ${t(lang, "reviews")}`}
              )
            </span>
            <span className="sep" aria-hidden="true">•</span>
            <span>{r.area}</span>
            <span className="sep" aria-hidden="true">•</span>
            <span className="price-tag">{priceLabel[r.priceTier]}</span>
            <span className="sep" aria-hidden="true">•</span>
            <span className={openStatus.open ? "status-open" : "status-closed"}>
              {openStatus.open ? t(lang, "open") : t(lang, "closed")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-0">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(k) => setActiveTab(k as TabKey)}
            className="mb-8 -mt-2"
          />
          <div className="space-y-10">
            {activeTab === "about" && (
              <>
                <section>
                  <h2 className="text-[18px] font-semibold text-text-primary mb-3">
                    {t(lang, "about")}
                  </h2>
                  <p className="text-[13px] text-text-secondary leading-[1.6]">
                    {r.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.restaurantType && (
                      <Badge variant="default">{r.restaurantType}</Badge>
                    )}
                    {r.cuisineTags.map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {r.googleRating != null && (
                    <div className="mt-2 flex items-center gap-2 text-[13px] text-text-muted">
                      <span className="text-gold font-semibold">
                        ★ {r.googleRating}
                      </span>
                      {t(lang, "onGoogle")}
                      {r.googleReviewCount != null && (
                        <> ({r.googleReviewCount} {t(lang, "reviews")})</>
                      )}
                    </div>
                  )}
                  {r.attributes && Object.keys(r.attributes).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-text-secondary">
                      {Object.entries(r.attributes).map(
                        ([category, features]) => {
                          const enabled = Object.entries(features)
                            .filter(([, v]) => v)
                            .map(([k]) => k);
                          if (enabled.length === 0) return null;
                          return (
                            <span key={category}>
                              <span className="font-medium text-text-muted uppercase tracking-wider">
                                {category.replace(/_/g, " ")}:
                              </span>{" "}
                              {enabled.join(", ")}
                            </span>
                          );
                        },
                      )}
                    </div>
                  )}
                </section>
                <OpeningHoursSection openingHours={r.openingHours} />
                {r.deals.length > 0 && (
                  <section>
                    <h2 className="text-[18px] font-semibold text-text-primary mb-3">
                      {t(lang, "dealsOffers")}
                    </h2>
                    <div className="space-y-2">
                      {r.deals.map((deal) => (
                        <div
                          key={deal.id}
                          className="border border-border rounded-[var(--radius-md)] p-3 hover:border-brand-border transition-colors duration-[var(--dur-fast)] bg-surface"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-[13px] font-semibold text-text-primary">
                                {deal.title}
                              </h3>
                              <p className="text-[12px] text-text-muted mt-0.5">
                                {deal.description}
                              </p>
                              {deal.conditions && (
                                <p className="text-[11px] text-text-muted mt-0.5 italic">
                                  {deal.conditions}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {deal.price && (
                                <span className="text-[15px] font-bold text-brand-light">
                                  ฿{deal.price}
                                </span>
                              )}
                              {deal.discount && (
                                <span className="text-[15px] font-bold text-brand-light">
                                  {deal.discount}% off
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setPreselectedDeal(deal);
                                  setShowBooking(true);
                                }}
                                className="block mt-1.5 text-[12px] font-medium text-brand-light hover:underline cursor-pointer bg-transparent border-none"
                              >
                                {t(lang, "bookWithDeal")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <TransitSection
                  transitNearby={r.transitNearby}
                  restaurantGeo={r.geo}
                  lang={lang}
                />
                <MapSection geo={r.geo} address={r.address} name={r.name} lang={lang} />
              </>
            )}
            {activeTab === "menu" && <MenuSection menu={r.menu} />}
            {activeTab === "reviews" && <ReviewsSection restaurant={r} />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardContent className="space-y-4">
              <h3 className="text-[18px] font-semibold text-text-primary">
                {t(lang, "checkAvailability")}
              </h3>
              <Select
                label={t(lang, "date")}
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="w-full"
              >
                {availableDates.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
              <div>
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block flex items-center gap-2">
                  {t(lang, "partySize")}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setPreviewPartySize(Math.max(1, previewPartySize - 1))
                    }
                    className="w-8 h-8 rounded-full border border-border-strong flex items-center justify-center hover:bg-card text-text-primary text-sm cursor-pointer transition-all duration-[var(--dur-fast)]"
                  >
                    −
                  </button>
                  <span className="font-bold text-text-primary">
                    {previewPartySize}
                  </span>
                  <button
                    onClick={() =>
                      setPreviewPartySize(Math.min(20, previewPartySize + 1))
                    }
                    className="w-8 h-8 rounded-full border border-border-strong flex items-center justify-center hover:bg-card text-text-primary text-sm cursor-pointer transition-all duration-[var(--dur-fast)]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[12px] text-text-muted mb-2">
                  {t(lang, "availableSlots")}
                </p>
                {previewSlots.length === 0 ? (
                  <p className="text-[12px] text-text-muted italic">
                    {t(lang, "noSlotsToday")}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                    {previewSlots.slice(0, 12).map((slot) => {
                      const full = slot.remaining < previewPartySize;
                      return (
                        <div
                          key={slot.time}
                          className={cn(
                            "text-center py-1.5 rounded-[var(--radius-md)] text-[12px] font-medium border",
                            full
                              ? "bg-surface text-text-muted border-border"
                              : slot.remaining <= 4
                                ? "bg-warning-dim text-warning border-warning-border"
                                : "bg-success-dim text-success border-success-border",
                          )}
                        >
                          {slot.time}
                          {full && (
                            <span className="block text-[10px] text-danger">
                              {t(lang, "slotFull")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {previewSlots.length > 12 && (
                  <p className="text-[11px] text-text-muted mt-1">
                    +{previewSlots.length - 12} more
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setPreselectedDeal(undefined);
                  setShowBooking(true);
                }}
              >
                {t(lang, "bookATable")}
              </Button>

              {/* Contact beside book */}
              {(r.phone ||
                r.email ||
                r.website ||
                r.facebookUrl ||
                r.instagramUrl ||
                r.twitterUrl ||
                r.tiktokUrl) && (
                <div className="pt-3 border-t border-border space-y-1.5">
                  <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">
                    {t(lang, "contact")}
                  </p>
                  <div className="space-y-1.5 text-[13px]">
                    {r.phone && (
                      <a
                        href={`tel:${r.phone}`}
                        className="flex items-center gap-2 py-1 text-text-secondary hover:text-brand-light transition-colors"
                      >
                        <Phone size={16} weight="regular" />
                        {t(lang, "call")}
                      </a>
                    )}
                    {r.email && (
                      <a
                        href={`mailto:${r.email}`}
                        className="flex items-center gap-2 py-1 text-text-secondary hover:text-brand-light transition-colors"
                      >
                        <EnvelopeSimple size={16} weight="regular" />
                        {t(lang, "email")}
                      </a>
                    )}
                    {r.website && (
                      <a
                        href={r.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1 text-text-secondary hover:text-brand-light transition-colors"
                      >
                        <Globe size={16} weight="regular" />
                        {t(lang, "website")}
                      </a>
                    )}
                    {r.facebookUrl && (
                      <a
                        href={r.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1 text-text-secondary hover:text-brand-light transition-colors"
                      >
                        <FacebookLogo size={16} weight="regular" />
                        Facebook
                      </a>
                    )}
                    {r.instagramUrl && (
                      <a
                        href={r.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1 text-text-secondary hover:text-brand-light transition-colors"
                      >
                        <InstagramLogo size={16} weight="regular" />
                        Instagram
                      </a>
                    )}
                    {r.twitterUrl && (
                      <a
                        href={r.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1 text-text-secondary hover:text-brand-light transition-colors"
                      >
                        <XLogo size={16} weight="regular" />X
                      </a>
                    )}
                    {r.tiktokUrl && (
                      <a
                        href={r.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1 text-text-secondary hover:text-brand-light transition-colors"
                      >
                        <TiktokLogo size={16} weight="regular" />
                        TikTok
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile floating call button */}
      {r.phone && (
        <a
          href={`tel:${r.phone}`}
          className={cn(
            "fixed bottom-6 right-6 z-[var(--z-nav)] flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white shadow-[var(--shadow-xl)] hover:bg-brand-hover transition-colors",
            "lg:hidden",
          )}
          aria-label="Call restaurant"
        >
          <Phone size={24} weight="bold" />
        </a>
      )}

      {bookingSuccess && (
        <div className="fixed inset-x-0 top-20 z-[var(--z-toast)] flex justify-center animate-slide-down">
          <div className="bg-success text-white px-6 py-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] flex items-center gap-4">
            <div>
              <p className="font-bold">{t(lang, "bookingConfirmed")}</p>
              <p className="text-[13px] text-white/80">
                {t(lang, "reference")} {bookingSuccess}
              </p>
            </div>
            <Link
              href="/bookings"
              className="text-[13px] font-semibold underline underline-offset-2"
            >
              {t(lang, "viewBookings")}
            </Link>
            <button
              onClick={() => setBookingSuccess(null)}
              className="text-white/70 hover:text-white cursor-pointer bg-transparent border-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showBooking && (
        <BookingModal
          restaurant={restaurant}
          preselectedDeal={preselectedDeal}
          onClose={() => setShowBooking(false)}
          onSuccess={(ref) => {
            setShowBooking(false);
            setBookingSuccess(ref);
          }}
        />
      )}
    </div>
  );
}
