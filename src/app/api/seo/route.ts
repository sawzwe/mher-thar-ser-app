import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/seo?key=landing  or  GET /api/seo?key=restaurant:123
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("seo_pages")
      .select("*")
      .eq("page_key", key)
      .single();

    return NextResponse.json({ seo: data ?? null }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ seo: null });
  }
}
