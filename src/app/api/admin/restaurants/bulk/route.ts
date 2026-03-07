import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

const VALID_STATUSES = ["draft", "active", "paused", "archived"] as const;

export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = await req.json();

    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids array is required and must not be empty" }, { status: 400 });
    }

    const action = body.action as string;
    if (action === "status") {
      const status = body.status;
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: "status must be draft, active, paused, or archived" },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from("restaurants")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids)
        .select("id, status");

      if (error) throw error;
      return NextResponse.json({ updated: data?.length ?? 0, ids: data?.map((r) => r.id) ?? [] });
    }

    if (action === "delete") {
      const { error } = await supabase.from("restaurants").delete().in("id", ids);
      if (error) throw error;
      return NextResponse.json({ deleted: ids.length, ids });
    }

    return NextResponse.json({ error: "action must be status or delete" }, { status: 400 });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
