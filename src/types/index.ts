export type PriceTier = 1 | 2 | 3 | 4;

export type TransitType = "BTS" | "MRT" | "ARL";

export interface TransitStop {
  name: string;
  type: TransitType;
  walkingMinutes: number;
}

export interface Geo {
  lat: number;
  lng: number;
}

export interface MenuItem {
  name: string;
  description?: string;
  price: number;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface DayHours {
  day: string;
  intervals: { open: string; close: string }[];
  closed?: boolean;
}

export interface Deal {
  id: string;
  title: string;
  type: "discount" | "set_menu" | "buffet" | "free_item" | "combo";
  description: string;
  price?: number;
  discount?: number;
  conditions?: string;
}

export interface Restaurant {
  id: string;
  /** URL-friendly identifier; prefer over id for public links */
  slug?: string | null;
  name: string;
  description: string;
  /** Area = neighbourhood (Silom, Sukhumvit, etc.) */
  area: string;
  /** Full formatted address for display (street, subdistrict, district, province) */
  address: string;
  geo: Geo;
  transitNearby: TransitStop[];
  cuisineTags: string[];
  priceTier: PriceTier;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  deals: Deal[];
  menu: MenuCategory[];
  openingHours: DayHours[];
  openTime: string;
  closeTime: string;
  phone?: string;
  website?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  postalCode?: string;
  logoUrl?: string;
  streetViewUrl?: string;
  restaurantType?: string;
  attributes?: Record<string, Record<string, boolean>>;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  googleRating?: number;
  googleReviewCount?: number;
}

export interface Slot {
  restaurantId: string;
  date: string;
  time: string;
  capacity: number;
  remaining: number;
}

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "rescheduled";

export interface Booking {
  id: string;
  bookingRef: string;
  restaurantId: string;
  dealId?: string;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  contact: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  name: string;
  contact: string;
  createdAt: string;
  notified?: boolean;
}

export interface Review {
  id: string;
  restaurantId: string;
  bookingId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SlotKey {
  restaurantId: string;
  date: string;
  time: string;
}
