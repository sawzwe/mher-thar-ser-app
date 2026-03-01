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
import { format, addDays } from "date-fns";
import { Badge, BadgeDot } from "@/components/ui/badge";
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

export default function RestaurantDetailPage({
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
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">
          Restaurant not found
        </h2>
        <Link href="/">
          <Button variant="ghost">Back to discovery</Button>
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
      <nav className="text-[13px] text-text-muted mb-4">
        <Link
          href="/"
          className="hover:text-brand-light transition-colors duration-[var(--dur-fast)]"
        >
          Home
        </Link>
        <span className="mx-2 text-border-strong">/</span>
        <span className="text-text-primary">{r.name}</span>
      </nav>

      {/* Hero image */}
      <div className="relative h-64 md:h-80 rounded-[var(--radius-xl)] overflow-hidden mb-8">
        <Image
          src={r.imageUrl}
          alt={r.name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,8,0.85)] via-[rgba(10,10,8,0.3)] to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary drop-shadow-lg tracking-[-1px]">
            {r.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[rgba(245,244,239,0.8)]">
            <span className="text-gold font-semibold">★ {ratingInfo.avg}</span>
            <span>
              (
              {ratingInfo.count > 0
                ? `${ratingInfo.count} reviews`
                : `${r.reviewCount} reviews`}
              )
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-text-muted" />
            <span>{r.area}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-text-muted" />
            <span className="text-gold">{priceLabel[r.priceTier]}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-text-muted" />
            <Badge variant={openStatus.open ? "success" : "danger"}>
              <BadgeDot />
              {openStatus.open ? "Open" : "Closed"}
            </Badge>
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
                  <h2 className="font-serif text-[24px] font-bold text-text-primary tracking-[-0.5px] mb-3">
                    About
                  </h2>
                  <p className="text-text-secondary leading-[1.65] text-[15px]">
                    {r.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
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
                    <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-gold font-semibold">
                        ★ {r.googleRating}
                      </span>
                      <span className="text-text-muted">on Google</span>
                      {r.googleReviewCount != null && (
                        <span className="text-text-muted">
                          ({r.googleReviewCount} reviews)
                        </span>
                      )}
                    </div>
                  )}
                  {r.attributes && Object.keys(r.attributes).length > 0 && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(r.attributes).map(
                        ([category, features]) => {
                          const enabled = Object.entries(features)
                            .filter(([, v]) => v)
                            .map(([k]) => k);
                          if (enabled.length === 0) return null;
                          return (
                            <div key={category}>
                              <p className="text-xs font-semibold text-text-muted uppercase mb-1">
                                {category.replace(/_/g, " ")}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {enabled.map((feat) => (
                                  <span
                                    key={feat}
                                    className="px-2 py-0.5 bg-surface border border-border rounded-full text-xs text-text-secondary"
                                  >
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </section>
                {/* Contact & social */}
                {(r.phone ||
                  r.website ||
                  r.email ||
                  r.facebookUrl ||
                  r.instagramUrl ||
                  r.twitterUrl ||
                  r.tiktokUrl) && (
                  <section>
                    <h2 className="font-serif text-[24px] font-bold text-text-primary tracking-[-0.5px] mb-3">
                      Contact
                    </h2>
                    <div className="space-y-2 text-sm">
                      {r.phone && (
                        <p className="text-text-secondary">
                          <span className="font-medium text-text-primary">
                            Phone:
                          </span>{" "}
                          <a
                            href={`tel:${r.phone}`}
                            className="text-brand-light hover:underline"
                          >
                            {r.phone}
                          </a>
                        </p>
                      )}
                      {r.email && (
                        <p className="text-text-secondary">
                          <span className="font-medium text-text-primary">
                            Email:
                          </span>{" "}
                          <a
                            href={`mailto:${r.email}`}
                            className="text-brand-light hover:underline"
                          >
                            {r.email}
                          </a>
                        </p>
                      )}
                      {r.website && (
                        <p className="text-text-secondary">
                          <span className="font-medium text-text-primary">
                            Website:
                          </span>{" "}
                          <a
                            href={r.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-light hover:underline"
                          >
                            {r.website}
                          </a>
                        </p>
                      )}
                      {(r.facebookUrl ||
                        r.instagramUrl ||
                        r.twitterUrl ||
                        r.tiktokUrl) && (
                        <div className="flex flex-wrap gap-4 mt-1">
                          {r.facebookUrl && (
                            <a
                              href={r.facebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-light hover:underline text-sm"
                            >
                              Facebook
                            </a>
                          )}
                          {r.instagramUrl && (
                            <a
                              href={r.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-light hover:underline text-sm"
                            >
                              Instagram
                            </a>
                          )}
                          {r.twitterUrl && (
                            <a
                              href={r.twitterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-light hover:underline text-sm"
                            >
                              X (Twitter)
                            </a>
                          )}
                          {r.tiktokUrl && (
                            <a
                              href={r.tiktokUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-light hover:underline text-sm"
                            >
                              TikTok
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                )}
                <OpeningHoursSection openingHours={r.openingHours} />
                {r.deals.length > 0 && (
                  <section>
                    <h2 className="font-serif text-[24px] font-bold text-text-primary tracking-[-0.5px] mb-3">
                      Deals & Offers
                    </h2>
                    <div className="space-y-3">
                      {r.deals.map((deal) => (
                        <div
                          key={deal.id}
                          className="border border-border rounded-[var(--radius-lg)] p-4 hover:border-brand-border transition-colors duration-[var(--dur-fast)] bg-surface"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-text-primary">
                                {deal.title}
                              </h3>
                              <p className="text-[13px] text-text-muted mt-1">
                                {deal.description}
                              </p>
                              {deal.conditions && (
                                <p className="text-[11px] text-text-muted mt-1 italic">
                                  {deal.conditions}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {deal.price && (
                                <span className="text-lg font-bold text-brand-light">
                                  ฿{deal.price}
                                </span>
                              )}
                              {deal.discount && (
                                <span className="text-lg font-bold text-brand-light">
                                  {deal.discount}% off
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setPreselectedDeal(deal);
                                  setShowBooking(true);
                                }}
                                className="block mt-2 text-[13px] font-medium text-brand-light hover:underline cursor-pointer bg-transparent border-none"
                              >
                                Book with deal →
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
                />
                <MapSection geo={r.geo} address={r.address} name={r.name} />
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
              <h3 className="font-serif text-[20px] font-bold text-text-primary tracking-[-0.4px]">
                Check Availability
              </h3>
              <Select
                label="Date"
                labelMy="/ ရက်"
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
                <label className="text-[13px] font-semibold text-text-secondary mb-1.5 block flex items-center gap-2">
                  Party Size{" "}
                  <span className="font-my text-[12px] text-text-muted">
                    / လူ
                  </span>
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
                <p className="text-[13px] text-text-muted mb-2">
                  Available slots:
                </p>
                {previewSlots.length === 0 ? (
                  <p className="text-[13px] text-text-muted italic">
                    No slots today
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
                              Full
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {previewSlots.length > 12 && (
                  <p className="text-[11px] text-text-muted mt-1">
                    +{previewSlots.length - 12} more slots
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
                Book a Table
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {bookingSuccess && (
        <div className="fixed inset-x-0 top-20 z-[var(--z-toast)] flex justify-center animate-slide-down">
          <div className="bg-success text-white px-6 py-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] flex items-center gap-4">
            <div>
              <p className="font-bold">Booking Confirmed!</p>
              <p className="text-[13px] text-white/80">
                Reference: {bookingSuccess}
              </p>
            </div>
            <Link
              href="/bookings"
              className="text-[13px] font-semibold underline underline-offset-2"
            >
              View Bookings
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
