import type { DayHours } from "@/types";

export interface ImportRow {
  name?: string;
  latitude?: string | number;
  longitude?: string | number;
  photo?: string;
  state?: string;
  District?: string;
  "Sub District"?: string;
  street?: string;
  postal_code?: string;
  phone?: string;
  website?: string;
  email_1?: string;
  facebook?: string;
  instagram?: string;
  logo?: string;
  street_view?: string;
  type?: string;
  description?: string;
  about?: string;
  working_hours?: string;
  place_id?: string;
  location_link?: string;
  rating?: string | number;
  reviews?: string | number;
  reviews_per_score?: string;
  google_id?: string;
  cid?: string;
  kgmid?: string;
  reviews_id?: string;
  [key: string]: unknown;
}

export interface RowValidationError {
  row: number;
  field: string;
  message: string;
}

export interface RestaurantInsert {
  name: string;
  slug: string;
  description: string;
  area: string;
  address: string;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  lat: number;
  lng: number;
  cuisine_tags: string[];
  price_tier: number;
  image_url: string | null;
  open_time: string | null;
  close_time: string | null;
  opening_hours: DayHours[];
  status: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  postal_code: string | null;
  logo_url: string | null;
  street_view_url: string | null;
  restaurant_type: string | null;
  attributes: Record<string, unknown>;
  google_place_id: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_reviews_per_score: Record<string, number> | null;
  google_ids: Record<string, string> | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseJsonField<T>(raw: unknown): T | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object") return raw as T;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return null;
}

const BURMESE_KEYWORDS = [
  "burmese",
  "myanmar",
  "shan",
  "mohinga",
  "tea leaf",
  "laphet",
];

function deriveCuisineTags(type: string | undefined): string[] {
  if (!type) return [];
  const lower = type.toLowerCase();
  const tags: string[] = [];
  if (BURMESE_KEYWORDS.some((k) => lower.includes(k))) tags.push("Burmese");
  if (lower.includes("thai")) tags.push("Thai");
  if (lower.includes("indian")) tags.push("Indian");
  if (lower.includes("chinese")) tags.push("Chinese");
  if (lower.includes("korean")) tags.push("Korean");
  if (lower.includes("seafood")) tags.push("Seafood");
  if (lower.includes("vegetarian") || lower.includes("vegan"))
    tags.push("Vegetarian");
  if (lower.includes("asian") && !tags.length) tags.push("Asian");
  return tags;
}

/**
 * Converts scraped working hours from {"Monday": ["7:30AM-5PM"]} into
 * the app's DayHours[] format. Returns the parsed hours plus derived
 * open_time / close_time (earliest open, latest close across all days).
 */
export function parseWorkingHours(raw: unknown): {
  hours: DayHours[];
  openTime: string | null;
  closeTime: string | null;
} {
  const parsed = parseJsonField<Record<string, string[]>>(raw);
  if (!parsed || typeof parsed !== "object") {
    return { hours: [], openTime: null, closeTime: null };
  }

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  let earliestOpen = "23:59";
  let latestClose = "00:00";
  const hours: DayHours[] = [];

  for (const day of DAYS) {
    const ranges = parsed[day];
    if (!ranges || ranges.length === 0) {
      hours.push({ day, intervals: [], closed: true });
      continue;
    }

    const intervals: { open: string; close: string }[] = [];
    for (const range of ranges) {
      const parts = range.split("-");
      if (parts.length !== 2) continue;
      const open = to24h(parts[0].trim());
      const close = to24h(parts[1].trim());
      if (open && close) {
        intervals.push({ open, close });
        if (open < earliestOpen) earliestOpen = open;
        if (close > latestClose) latestClose = close;
      }
    }

    hours.push({ day, intervals, closed: intervals.length === 0 });
  }

  return {
    hours,
    openTime: earliestOpen !== "23:59" ? earliestOpen : null,
    closeTime: latestClose !== "00:00" ? latestClose : null,
  };
}

function to24h(timeStr: string): string | null {
  const match = timeStr.match(
    /^(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?$/,
  );
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2] || "0", 10);
  const period = (match[3] || "").toUpperCase();

  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function str(val: unknown): string | null {
  if (val == null || val === "") return null;
  return String(val).trim() || null;
}

export function mapRowToRestaurant(row: ImportRow): RestaurantInsert {
  const name = String(row.name ?? "").trim();
  const lat = Number(row.latitude) || 0;
  const lng = Number(row.longitude) || 0;

  const { hours, openTime, closeTime } = parseWorkingHours(
    row.working_hours,
  );

  const aboutData = parseJsonField<Record<string, Record<string, boolean>>>(
    row.about,
  );

  const reviewsPerScore = parseJsonField<Record<string, number>>(
    row.reviews_per_score,
  );

  const googleIds: Record<string, string> = {};
  if (row.google_id) googleIds.google_id = String(row.google_id);
  if (row.cid) googleIds.cid = String(row.cid);
  if (row.kgmid) googleIds.kgmid = String(row.kgmid);
  if (row.reviews_id) googleIds.reviews_id = String(row.reviews_id);

  const district = str(row.District);
  const subdistrict = str(row["Sub District"]);

  return {
    name,
    slug: slugify(name),
    description: str(row.description) ?? "Description to be added.",
    area: district ?? "Bangkok",
    address: str(row.street) ?? "Address to be added.",
    province: str(row.state),
    district,
    subdistrict,
    lat,
    lng,
    cuisine_tags: deriveCuisineTags(row.type),
    price_tier: 2,
    image_url: str(row.photo),
    open_time: openTime,
    close_time: closeTime,
    opening_hours: hours,
    status: "draft",
    phone: str(row.phone),
    website: str(row.website),
    email: str(row.email_1),
    facebook_url: str(row.facebook),
    instagram_url: str(row.instagram),
    postal_code: str(row.postal_code),
    logo_url: str(row.logo),
    street_view_url: str(row.street_view),
    restaurant_type: str(row.type),
    attributes: aboutData ?? {},
    google_place_id: str(row.place_id),
    google_maps_url: str(row.location_link),
    google_rating: row.rating != null ? Number(row.rating) || null : null,
    google_review_count:
      row.reviews != null ? Math.round(Number(row.reviews)) || null : null,
    google_reviews_per_score: reviewsPerScore,
    google_ids: Object.keys(googleIds).length > 0 ? googleIds : null,
  };
}

export function validateRow(
  row: ImportRow,
  index: number,
): RowValidationError[] {
  const errors: RowValidationError[] = [];
  const rowNum = index + 2; // +2 = 1-indexed + header row

  if (!row.name || !String(row.name).trim()) {
    errors.push({ row: rowNum, field: "name", message: "Name is required" });
  }
  if (row.latitude == null || isNaN(Number(row.latitude))) {
    errors.push({
      row: rowNum,
      field: "latitude",
      message: "Valid latitude is required",
    });
  }
  if (row.longitude == null || isNaN(Number(row.longitude))) {
    errors.push({
      row: rowNum,
      field: "longitude",
      message: "Valid longitude is required",
    });
  }

  return errors;
}
