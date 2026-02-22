import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const admin = createAdminClient();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();

    const { data: listData, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });
    if (listError) throw listError;

    const authUsers = listData?.users ?? [];

    const { data: roleRows } = await admin
      .from("user_roles")
      .select("user_id, roles(slug)")
      .in("user_id", authUsers.map((u) => u.id));

    const rolesByUserId = new Map<string, string[]>();
    for (const row of roleRows ?? []) {
      const r = row as { user_id: string; roles: { slug: string } | { slug: string }[] };
      const slugs = Array.isArray(r.roles) ? r.roles.map((x) => x.slug) : r.roles ? [r.roles.slug] : [];
      const existing = rolesByUserId.get(r.user_id) ?? [];
      rolesByUserId.set(r.user_id, [...existing, ...slugs]);
    }

    type UserRow = {
      id: string;
      email: string | null;
      name: string;
      created_at: string;
      banned_until?: string | null;
      roles: string[];
    };

    let users: UserRow[] = authUsers.map((u) => {
      const name =
        (u.user_metadata?.name as string) ||
        u.email?.split("@")[0] ||
        "User";
      return {
        id: u.id,
        email: u.email ?? null,
        name,
        created_at: u.created_at ?? new Date().toISOString(),
        banned_until: u.banned_until ?? null,
        roles: rolesByUserId.get(u.id) ?? [],
      };
    });

    if (q) {
      users = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
