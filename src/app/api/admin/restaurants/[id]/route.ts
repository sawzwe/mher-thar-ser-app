import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";
import { CUISINES } from "@/data/constants";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await params;

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug =
      body.slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const rawCuisine =
      Array.isArray(body.cuisine_tags)
        ? body.cuisine_tags
        : typeof body.cuisine_tags === "string"
          ? body.cuisine_tags.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
    const cuisineSet = new Set(CUISINES);
    const cuisine_tags = rawCuisine.filter((c: string) =>
      cuisineSet.has(c as (typeof CUISINES)[number])
    );

    const update = {
      name,
      slug: slug || null,
      description: (body.description ?? "").trim() || "Description to be added.",
      area: (body.area ?? "").trim() || "Bangkok",
      address: (body.address ?? "").trim() || "Address to be added.",
      province: (body.province ?? "").trim() || null,
      district: (body.district ?? "").trim() || null,
      subdistrict: (body.subdistrict ?? "").trim() || null,
      lat: Number(body.lat) || 13.7563,
      lng: Number(body.lng) || 100.5018,
      cuisine_tags,
      price_tier: Math.min(4, Math.max(1, Number(body.price_tier) || 2)),
      image_url: body.image_url?.trim() || null,
      open_time: body.open_time?.trim() || null,
      close_time: body.close_time?.trim() || null,
      status: ["draft", "active", "paused", "archived"].includes(body.status)
        ? body.status
        : "active",
      updated_at: new Date().toISOString(),
      phone: body.phone?.trim() || null,
      website: body.website?.trim() || null,
      email: body.email?.trim() || null,
      facebook_url: body.facebook_url?.trim() || null,
      instagram_url: body.instagram_url?.trim() || null,
      twitter_url: body.twitter_url?.trim() || null,
      tiktok_url: body.tiktok_url?.trim() || null,
      postal_code: body.postal_code?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      street_view_url: body.street_view_url?.trim() || null,
      restaurant_type: body.restaurant_type?.trim() || null,
    };

    const { data, error } = await supabase
      .from("restaurants")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message },
      { status: e.status ?? 500 }
    );
  }
}
