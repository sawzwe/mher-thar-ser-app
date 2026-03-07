import { NextRequest, NextResponse } from "next/server";
import { requireVendorOwner } from "@/lib/auth/apiGuard";
import { fetchMenu, replaceMenu } from "@/lib/menu/menuApi";
import type { MenuCategoryInput } from "@/lib/menu/menuApi";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await requireVendorOwner(id);
    const menu = await fetchMenu(supabase, id);
    return NextResponse.json({ menu });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase } = await requireVendorOwner(id);
    const { categories } = (await req.json()) as { categories: MenuCategoryInput[] };
    await replaceMenu(supabase, id, categories ?? []);
    const menu = await fetchMenu(supabase, id);
    return NextResponse.json({ menu });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
