import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

// GET /api/admin/seo — return all SEO entries + restaurant list for building rows
export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const [seoRes, restaurantsRes] = await Promise.all([
      supabase.from("seo_pages").select("*").order("page_key"),
      supabase.from("restaurants").select("id, name, slug, area").order("name"),
    ]);

    return NextResponse.json({
      seoEntries: seoRes.data ?? [],
      restaurants: restaurantsRes.data ?? [],
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
