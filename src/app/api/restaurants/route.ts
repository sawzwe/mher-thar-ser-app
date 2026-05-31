import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformDbRestaurant } from "@/lib/restaurants/transform";
import type { Restaurant } from "@/types";

function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusParam = searchParams.get("radius");
  try {
    const supabase = await createClient();

    // Try with deals first; fall back to restaurants only if join fails (e.g. RLS on deals)
    let rows: Record<string, unknown>[] | null = null;

    const { data: withDeals, error: err1 } = await supabase
      .from("restaurants")
      .select(
        "*, deals(id, title, type, description, price, discount, discount_pct, conditions)",
      )
      .eq("status", "active")
      .order("name");

    if (!err1 && withDeals) {
      rows = withDeals;
    } else {
      const { data: noDeals, error: err2 } = await supabase
        .from("restaurants")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (err2) throw err2;
      rows = noDeals;
    }

    if (!rows) throw new Error("No data returned from Supabase");

    // Determine which restaurants have menu items (count per restaurant).
    // We only need a presence indicator for the list view, not the full menu.
    const menuItemCountByRestaurant = new Map<string, number>();
    {
      const { data: categoryRows } = await supabase
        .from("menu_categories")
        .select("restaurant_id, menu_items(count)");
      for (const row of (categoryRows ?? []) as {
        restaurant_id: string;
        menu_items: { count: number }[] | null;
      }[]) {
        const raw = row.menu_items;
        const n =
          Array.isArray(raw) && raw[0] && typeof raw[0].count === "number"
            ? raw[0].count
            : 0;
        menuItemCountByRestaurant.set(
          row.restaurant_id,
          (menuItemCountByRestaurant.get(row.restaurant_id) ?? 0) + n,
        );
      }
    }

    let restaurants: Restaurant[] = rows.map((row) => {
      const deals = (row.deals ?? []) as {
        id: string;
        title: string;
        type: string;
        description: string;
        price?: number;
        discount?: number;
        discount_pct?: number;
        conditions?: string;
      }[];
      const restaurant = transformDbRestaurant(
        row as Parameters<typeof transformDbRestaurant>[0],
        {
          deals: Array.isArray(deals) ? deals.filter((d) => d && d.id) : [],
        },
      );
      // Lightweight menu presence indicator for filtering/list display.
      // Full menu details are loaded on the restaurant detail page.
      const menuItemCount =
        menuItemCountByRestaurant.get(restaurant.id) ?? 0;
      if (menuItemCount > 0) {
        restaurant.menu = [
          {
            name: "Menu",
            items: Array.from({ length: menuItemCount }, () => ({
              name: "",
              price: 0,
            })),
          },
        ];
      }
      return restaurant;
    });

    // Filter by lat/lng/radius when provided
    const centerLat = lat ? parseFloat(lat) : null;
    const centerLng = lng ? parseFloat(lng) : null;
    const radiusKm = radiusParam ? parseFloat(radiusParam) : null;

    if (
      centerLat != null &&
      !Number.isNaN(centerLat) &&
      centerLng != null &&
      !Number.isNaN(centerLng) &&
      radiusKm != null &&
      !Number.isNaN(radiusKm) &&
      radiusKm > 0
    ) {
      restaurants = restaurants.filter((r) => {
        const d = getDistanceKm(
          centerLat,
          centerLng,
          r.geo.lat,
          r.geo.lng
        );
        return d <= radiusKm;
      });
    }

    return NextResponse.json(restaurants);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
