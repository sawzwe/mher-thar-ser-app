import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = ["customer", "vendor", "admin"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAdmin(true); // superadmin only
    if (!user.isSuperAdmin()) {
      return NextResponse.json({ error: "Superadmin only" }, { status: 403 });
    }

    const { id: userId } = await params;
    const body = await req.json();
    const { role: roleRaw, action } = body as { role?: string; action?: "add" | "remove" };
    const role = typeof roleRaw === "string" ? roleRaw.trim() : "";
    if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json(
        { error: "role must be one of: customer, vendor, admin" },
        { status: 400 }
      );
    }
    const actionVal = action === "add" || action === "remove" ? action : null;
    if (!actionVal) {
      return NextResponse.json(
        { error: "action must be add or remove" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: roleRow } = await admin
      .from("roles")
      .select("id")
      .eq("slug", role)
      .single();
    const roleId = roleRow?.id;
    if (!roleId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (actionVal === "add") {
      const { error: insertErr } = await admin.from("user_roles").upsert(
        { user_id: userId, role_id: roleId },
        { onConflict: "user_id,role_id" }
      );
      if (insertErr) throw insertErr;
    } else {
      const { error: delErr } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", roleId);
      if (delErr) throw delErr;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
