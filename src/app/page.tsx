import type { Metadata } from "next";
import { HomePageClient } from "@/components/HomePageClient";

type SeoRow = {
  title?: string | null;
  description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  keywords?: string | null;
};

async function getLandingSeo(): Promise<SeoRow> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/seo?key=landing`, {
      next: { revalidate: 60 },
    });
    const json = await res.json();
    return (json.seo as SeoRow) ?? {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getLandingSeo();

  const title = seo.title ?? "Mher Thar Ser — Find Myanmar Restaurants in Bangkok";
  const description = seo.description ?? "Discover authentic Myanmar restaurants in Bangkok, Thailand. Menus, prices, promotions, and table booking in one place.";

  return {
    title,
    description,
    keywords: seo.keywords ?? "myanmar restaurant, burmese food, bangkok, thailand",
    openGraph: {
      title: seo.og_title ?? title,
      description: seo.og_description ?? description,
      images: seo.og_image ? [{ url: seo.og_image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.og_title ?? title,
      description: seo.og_description ?? description,
      images: seo.og_image ? [seo.og_image] : [],
    },
  };
}

export default function Page() {
  return <HomePageClient />;
}
