import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ pageKey: string }> },
) {
  try {
    const { supabase } = await requireAdmin();
    const { pageKey } = await params;
    const key = decodeURIComponent(pageKey);
    const body = await req.json();

    const { title, description, og_title, og_description, og_image, keywords } = body as {
      title?: string;
      description?: string;
      og_title?: string;
      og_description?: string;
      og_image?: string;
      keywords?: string;
    };

    const { data, error } = await supabase
      .from("seo_pages")
      .upsert(
        { page_key: key, title, description, og_title, og_description, og_image, keywords, updated_at: new Date().toISOString() },
        { onConflict: "page_key" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ seoEntry: data });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
