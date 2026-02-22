import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/apiGuard";

export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = await req.json();

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const slug =
      body.slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const restaurant = {
      name,
      slug: slug || null,
      description: (body.description ?? "").trim() || "Description to be added.",
      area: (body.area ?? "").trim() || "Bangkok",
      address: (body.address ?? "").trim() || "Address to be added.",
      lat: Number(body.lat) || 13.7563,
      lng: Number(body.lng) || 100.5018,
      cuisine_tags: Array.isArray(body.cuisine_tags)
        ? body.cuisine_tags
        : typeof body.cuisine_tags === "string"
          ? body.cuisine_tags.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      price_tier: Math.min(4, Math.max(1, Number(body.price_tier) || 2)),
      image_url: body.image_url?.trim() || null,
      open_time: body.open_time?.trim() || null,
      close_time: body.close_time?.trim() || null,
      opening_hours: body.opening_hours ?? [],
      transit_nearby: body.transit_nearby ?? [],
      status: ["draft", "active", "paused", "archived"].includes(body.status) ? body.status : "draft",
    };

    const { data, error } = await supabase
      .from("restaurants")
      .insert(restaurant)
      .select("id, name, slug, area, status")
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
