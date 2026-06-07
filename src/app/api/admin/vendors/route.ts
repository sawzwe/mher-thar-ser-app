import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPendingVendorClaims } from "@/lib/admin/pendingVendors";

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: listData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const emailById = new Map(
      (listData?.users ?? []).map((u) => [u.id, u.email ?? null]),
    );

    const pending = await listPendingVendorClaims(admin, emailById);

    return NextResponse.json({
      pending: pending.map((p) => ({
        user_id: p.user_id,
        company_name: p.company_name,
        email: p.email,
        created_at: p.submitted_at,
        restaurant_count: p.restaurant_count,
      })),
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
