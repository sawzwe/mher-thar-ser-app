import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const admin = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const [
      { data: listData },
      { data: roleRows },
      { data: pendingProfiles },
      { count: pendingCount },
      { count: todayBookingsCount },
      { data: restaurants },
      { data: bookings },
    ] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("user_roles").select("user_id, roles(slug)"),
      supabase
        .from("vendor_profiles")
        .select("user_id, company_name, created_at")
        .is("verified_at", null)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("vendor_profiles")
        .select("user_id", { count: "exact", head: true })
        .is("verified_at", null),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("date", today),
      supabase
        .from("restaurants")
        .select("id, name, slug, area, image_url, status")
        .order("name"),
      supabase
        .from("bookings")
        .select("restaurant_id")
        .limit(500),
    ]);

    const authUsers = listData?.users ?? [];
    const roleMap = new Map<string, Set<string>>();
    for (const row of roleRows ?? []) {
      const r = row as { user_id: string; roles: { slug: string } | { slug: string }[] };
      const slugs = Array.isArray(r.roles)
        ? r.roles.map((x) => x.slug)
        : r.roles ? [r.roles.slug] : [];
      const set = roleMap.get(r.user_id) ?? new Set();
      slugs.forEach((s) => set.add(s));
      roleMap.set(r.user_id, set);
    }

    let admins = 0, vendors = 0, customers = 0;
    for (const roles of roleMap.values()) {
      if (roles.has("admin")) admins++;
      if (roles.has("vendor")) vendors++;
      if (roles.has("customer")) customers++;
    }

    const bookingCountByRestaurant = new Map<string, number>();
    for (const b of bookings ?? []) {
      const rid = (b as { restaurant_id: string }).restaurant_id;
      if (rid) bookingCountByRestaurant.set(rid, (bookingCountByRestaurant.get(rid) ?? 0) + 1);
    }

    const restaurantList = (restaurants ?? []).map((r) => ({
      ...r,
      bookingCount: bookingCountByRestaurant.get(r.id) ?? 0,
    }));
    const topRestaurants = [...restaurantList]
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    const userMap = new Map(authUsers.map((u) => [u.id, u.email ?? ""]));
    const activity = (pendingProfiles ?? []).map((p) => ({
      type: "vendor_claim" as const,
      user_id: p.user_id,
      company_name: (p as { company_name?: string }).company_name ?? "",
      email: userMap.get(p.user_id) ?? "",
      created_at: (p as { created_at?: string }).created_at ?? "",
    }));

    return NextResponse.json({
      stats: {
        totalUsers: authUsers.length,
        customers,
        vendors,
        admins,
        pendingVendors: pendingCount ?? 0,
        todayBookings: todayBookingsCount ?? 0,
      },
      restaurantCount: restaurantList.length,
      topRestaurants,
      activity,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
