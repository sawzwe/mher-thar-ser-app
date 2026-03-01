import type { Restaurant, Deal, DayHours } from "@/types";

type DbRestaurant = {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  area: string;
  address: string;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  lat?: number;
  lng?: number;
  cuisine_tags?: string[] | null;
  price_tier?: number;
  image_url?: string | null;
  open_time?: string | null;
  close_time?: string | null;
  opening_hours?: unknown;
  transit_nearby?: unknown;
  status?: string;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  postal_code?: string | null;
  logo_url?: string | null;
  street_view_url?: string | null;
  restaurant_type?: string | null;
  attributes?: Record<string, Record<string, boolean>> | null;
  google_place_id?: string | null;
  google_maps_url?: string | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  twitter_url?: string | null;
  tiktok_url?: string | null;
};

type DbDeal = {
  id: string;
  title: string;
  type: string;
  description: string;
  price?: number | null;
  discount?: number | null;
  discount_pct?: number | null;
  conditions?: string | null;
};

function parseTime(t: string | null | undefined): string {
  if (!t) return "11:00";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function parseOpeningHours(oh: unknown): DayHours[] {
  const defaultHours: DayHours[] = [
    { day: "Monday", intervals: [{ open: "11:00", close: "22:00" }] },
    { day: "Tuesday", intervals: [{ open: "11:00", close: "22:00" }] },
    { day: "Wednesday", intervals: [{ open: "11:00", close: "22:00" }] },
    { day: "Thursday", intervals: [{ open: "11:00", close: "22:00" }] },
    { day: "Friday", intervals: [{ open: "11:00", close: "22:00" }] },
    { day: "Saturday", intervals: [{ open: "11:00", close: "22:00" }] },
    { day: "Sunday", intervals: [{ open: "11:00", close: "22:00" }] },
  ];
  if (!oh || !Array.isArray(oh)) return defaultHours;
  return (oh as DayHours[]).length > 0 ? (oh as DayHours[]) : defaultHours;
}

function parseTransit(
  tn: unknown,
): { name: string; type: "BTS" | "MRT" | "ARL"; walkingMinutes: number }[] {
  if (!tn || !Array.isArray(tn)) return [];
  return (
    tn as { name?: string; type?: string; walkingMinutes?: number }[]
  ).map((x) => ({
    name: x.name ?? "",
    type: (x.type === "BTS" || x.type === "MRT" || x.type === "ARL"
      ? x.type
      : "BTS") as "BTS" | "MRT" | "ARL",
    walkingMinutes: typeof x.walkingMinutes === "number" ? x.walkingMinutes : 5,
  }));
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80";

type RestaurantRow = {
  id: string;
  slug?: string | null;
  name: string;
  description?: string;
  area?: string;
  address?: string;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  lat?: number;
  lng?: number;
  cuisine_tags?: string[] | null;
  price_tier?: number;
  image_url?: string | null;
  open_time?: string | null;
  close_time?: string | null;
  opening_hours?: unknown;
  transit_nearby?: unknown;
  status?: string;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  tiktok_url?: string | null;
  postal_code?: string | null;
  logo_url?: string | null;
  street_view_url?: string | null;
  restaurant_type?: string | null;
  attributes?: Record<string, Record<string, boolean>> | null;
  google_place_id?: string | null;
  google_maps_url?: string | null;
  google_rating?: number | null;
  google_review_count?: number | null;
};

function buildFullAddress(row: {
  address?: string;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
}): string {
  const parts = [
    row.address?.trim(),
    row.subdistrict?.trim(),
    row.district?.trim(),
    row.province?.trim(),
  ].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(", ") : "Address to be added.";
}

export function transformDbRestaurant(
  row: DbRestaurant | RestaurantRow,
  opts?: { deals?: DbDeal[]; reviewCount?: number; avgRating?: number },
): Restaurant {
  const deals: Deal[] = (opts?.deals ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    type: d.type as Deal["type"],
    description: d.description,
    price: d.price ?? undefined,
    discount: d.discount ?? d.discount_pct ?? undefined,
    conditions: d.conditions ?? undefined,
  }));

  const openingHours = parseOpeningHours(row.opening_hours);
  const openTime = parseTime(row.open_time);
  const closeTime = parseTime(row.close_time);

  return {
    id: row.id,
    slug: (row as { slug?: string | null }).slug ?? null,
    name: row.name,
    description: row.description ?? "",
    area: row.area ?? "",
    address: buildFullAddress(row),
    geo: {
      lat: Number(row.lat) || 13.7563,
      lng: Number(row.lng) || 100.5018,
    },
    transitNearby: parseTransit(row.transit_nearby),
    cuisineTags: Array.isArray(row.cuisine_tags) ? row.cuisine_tags : [],
    priceTier: (row.price_tier as 1 | 2 | 3 | 4) || 2,
    rating: opts?.avgRating ?? 0,
    reviewCount: opts?.reviewCount ?? 0,
    imageUrl: row.image_url || DEFAULT_IMAGE,
    deals,
    menu: [],
    openingHours,
    openTime,
    closeTime,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    email: row.email ?? undefined,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    tiktokUrl: row.tiktok_url ?? undefined,
    postalCode: row.postal_code ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    streetViewUrl: row.street_view_url ?? undefined,
    restaurantType: row.restaurant_type ?? undefined,
    attributes: row.attributes ?? undefined,
    googlePlaceId: row.google_place_id ?? undefined,
    googleMapsUrl: row.google_maps_url ?? undefined,
    googleRating: row.google_rating != null ? Number(row.google_rating) : undefined,
    googleReviewCount: row.google_review_count != null ? Number(row.google_review_count) : undefined,
  };
}
