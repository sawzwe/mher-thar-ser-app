import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const admin = createAdminClient();
    const { id: restaurantId } = await params;
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const role = (body.role ?? "owner") as string;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json({ error: "User not found with this email" }, { status: 404 });
    }

    const { error: vrError } = await supabase
      .from("vendor_restaurants")
      .upsert(
        { vendor_id: user.id, restaurant_id: restaurantId, role },
        { onConflict: "vendor_id,restaurant_id" }
      );

    if (vrError) throw vrError;

    const { data: vp } = await supabase
      .from("vendor_profiles")
      .select("restaurant_ids")
      .eq("user_id", user.id)
      .single();

    const ids = new Set((vp?.restaurant_ids as string[] | undefined) ?? []);
    ids.add(restaurantId);
    await supabase.from("vendor_profiles").upsert(
      { user_id: user.id, restaurant_ids: Array.from(ids) },
      { onConflict: "user_id" }
    );

    const { data: roleRow } = await supabase
      .from("roles")
      .select("id")
      .eq("slug", "vendor")
      .single();

    if (roleRow) {
      await supabase
        .from("user_roles")
        .upsert(
          { user_id: user.id, role_id: roleRow.id },
          { onConflict: "user_id,role_id" }
        );
    }

    return NextResponse.json({ success: true, vendor_id: user.id });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const admin = createAdminClient();
    const { id: restaurantId } = await params;

    const { data: vrRows } = await supabase
      .from("vendor_restaurants")
      .select("vendor_id, role")
      .eq("restaurant_id", restaurantId);

    if (!vrRows?.length) {
      return NextResponse.json({ vendors: [] });
    }

    const userIds = [...new Set(vrRows.map((r) => r.vendor_id))];
    const { data: users } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });
    const userMap = new Map(
      (users?.users ?? []).map((u) => [u.id, u.email ?? null])
    );

    const vendors = vrRows.map((r) => ({
      vendor_id: r.vendor_id,
      role: r.role,
      email: userMap.get(r.vendor_id) ?? undefined,
    }));

    return NextResponse.json({ vendors });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
