import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mhertharser.com"
  ).replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/restaurants`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("id, updated_at")
      .eq("status", "active");
    if (data) {
      for (const row of data) {
        entries.push({
          url: `${base}/restaurant/${row.id}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch {
    // keep static entries if DB is unavailable
  }

  return entries;
}
