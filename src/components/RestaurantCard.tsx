"use client";

import Link from "next/link";
import Image from "next/image";
import { Restaurant } from "@/types";
import { getRestaurantPath } from "@/lib/restaurants/url";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { isOpenNow } from "@/lib/hours";
import { cn } from "@/lib/utils";

const priceLabel: Record<number, string> = { 1: "฿", 2: "฿฿", 3: "฿฿฿", 4: "฿฿฿฿" };

function getDealPreview(r: Restaurant): string | null {
  if (r.deals.length === 0) return null;
  const deal = r.deals[0];
  if (deal.price) return `From ฿${deal.price}`;
  if (deal.discount) return `${deal.discount}% off`;
  return deal.title;
}

function getDealSub(r: Restaurant): string | null {
  if (r.deals.length === 0) return null;
  const deal = r.deals[0];
  if (deal.type === "set_menu") return "set menu";
  if (deal.type === "buffet") return "buffet";
  if (deal.type === "combo") return "combo";
  return deal.description;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  featured?: boolean;
}

export function RestaurantCard({ restaurant, featured = false }: RestaurantCardProps) {
  const r = restaurant;
  const openStatus = isOpenNow(r.openingHours);
  const dealPreview = getDealPreview(r);
  const dealSub = getDealSub(r);

  return (
    <Link
      href={`/restaurant/${getRestaurantPath(r)}`}
      className={cn("group block focus-ring rounded-[var(--radius-lg)]", featured && "col-span-2")}
    >
      <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden transition-all duration-[var(--dur-base)] ease-[var(--ease-out)] hover:bg-card-hover hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] active:translate-y-0 active:shadow-[var(--shadow-sm)]">
        {/* Image */}
        <div className={cn("relative overflow-hidden", featured ? "aspect-[2/1]" : "aspect-[16/9]")}>
          <Image
            src={r.imageUrl}
            alt={r.name}
            fill
            className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-[1.04]"
            sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,8,0.85)] via-[rgba(10,10,8,0.2)] via-40% to-transparent" />

          {r.deals.length > 0 && (
            <Badge variant="brand" className="absolute top-3 right-3 shadow-[var(--shadow-sm)]">
              {r.deals.length} {r.deals.length === 1 ? "Deal" : "Deals"}
            </Badge>
          )}

          <button className="absolute top-3 left-3 w-8 h-8 rounded-[var(--radius-sm)] bg-[rgba(10,10,8,0.6)] backdrop-blur-[8px] border-none flex items-center justify-center text-sm cursor-pointer opacity-0 group-hover:opacity-80 transition-opacity duration-[var(--dur-fast)] text-text-secondary hover:text-text-primary">
            ♡
          </button>
        </div>

        {/* Body */}
        <div className={cn("p-4 pb-0", featured && "p-5 pb-0")}>
          <div className="flex items-start justify-between mb-1.5">
            <h3 className={cn(
              "font-semibold text-text-primary leading-tight tracking-[-0.2px]",
              featured ? "text-xl" : "text-[15px]"
            )}>
              {r.name}
            </h3>
            <div className="flex items-center gap-1 font-bold text-gold shrink-0 ml-2" style={{ fontSize: featured ? 14 : 13 }}>
              ★ {r.rating}
              <span className="text-text-muted font-normal text-[12px]">({r.reviewCount})</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[12px] text-text-muted mb-3">
            <span>{r.area}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-text-muted" />
            <span>{r.cuisineTags.slice(0, 2).join(" · ")}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-text-muted" />
            <span className="text-gold font-semibold">{priceLabel[r.priceTier]}</span>
            <span className="flex-1" />
            <Badge
              variant={openStatus.open ? "success" : "danger"}
              className="text-[10px] py-[2px] px-2"
            >
              <BadgeDot />
              {openStatus.open ? "Open" : "Closed"}
            </Badge>
          </div>

          <p className={cn(
            "text-text-secondary leading-[1.55] line-clamp-2 mb-3.5",
            featured ? "text-[13px]" : "text-[12px]"
          )}>
            {r.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[rgba(0,0,0,0.2)]">
          {dealPreview ? (
            <div className="text-[12px] text-brand-light font-semibold">
              {dealPreview} <span className="text-text-muted font-normal">{dealSub ? `/ ${dealSub}` : ""}</span>
            </div>
          ) : (
            <div className="text-[12px] text-text-muted">No active deals</div>
          )}
          <span className="px-4 py-[7px] rounded-[var(--radius-md)] bg-brand-dim border border-brand-border text-brand-light text-[12px] font-semibold group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all duration-[var(--dur-base)]">
            {featured ? "View & Book →" : "Book →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
