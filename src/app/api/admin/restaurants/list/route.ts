import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

type CategoryRow = {
  restaurant_id: string;
  menu_items: { count: number }[] | null;
};

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const [{ data: restaurants }, { data: categoryRows, error: menuErr }] =
      await Promise.all([
        supabase
          .from("restaurants")
          .select("id, name, slug, area, status")
          .order("name"),
        supabase.from("menu_categories").select("restaurant_id, menu_items(count)"),
      ]);

    if (menuErr) {
      return NextResponse.json(
        { error: `Menu summary failed: ${menuErr.message}` },
        { status: 500 },
      );
    }

    const itemCountByRestaurant = new Map<string, number>();
    for (const row of (categoryRows ?? []) as CategoryRow[]) {
      const rid = row.restaurant_id;
      const raw = row.menu_items;
      const n =
        Array.isArray(raw) && raw[0] && typeof raw[0].count === "number"
          ? raw[0].count
          : 0;
      itemCountByRestaurant.set(rid, (itemCountByRestaurant.get(rid) ?? 0) + n);
    }

    const list = (restaurants ?? []).map((r) => {
      const menu_item_count = itemCountByRestaurant.get(r.id) ?? 0;
      return {
        ...r,
        menu_item_count,
        has_menu: menu_item_count > 0,
      };
    });

    return NextResponse.json({ restaurants: list });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
