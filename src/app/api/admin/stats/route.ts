import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const admin = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const [{ data: listData }, { data: roleRows }, pendingVendors, todayBookings] =
      await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        admin.from("user_roles").select("user_id, roles(slug)"),
        supabase
          .from("vendor_profiles")
          .select("user_id", { count: "exact", head: true })
          .is("verified_at", null),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("date", today),
      ]);

    const authUsers = listData?.users ?? [];
    const totalUsers = authUsers.length;

    const roleMap = new Map<string, Set<string>>();
    for (const row of roleRows ?? []) {
      const r = row as { user_id: string; roles: { slug: string } | { slug: string }[] };
      const slugs = Array.isArray(r.roles)
        ? r.roles.map((x) => x.slug)
        : r.roles
          ? [r.roles.slug]
          : [];
      const set = roleMap.get(r.user_id) ?? new Set();
      slugs.forEach((s) => set.add(s));
      roleMap.set(r.user_id, set);
    }

    let admins = 0;
    let vendors = 0;
    let customers = 0;
    for (const roles of roleMap.values()) {
      if (roles.has("admin")) admins++;
      if (roles.has("vendor")) vendors++;
      if (roles.has("customer")) customers++;
    }

    return NextResponse.json({
      totalUsers,
      customers,
      vendors,
      admins,
      pendingVendors: pendingVendors.count ?? 0,
      todayBookings: todayBookings.count ?? 0,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
