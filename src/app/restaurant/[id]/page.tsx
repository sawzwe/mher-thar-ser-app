import type { Metadata } from "next";
import { RestaurantDetailClient } from "@/components/RestaurantDetailClient";
import { fetchRestaurantById } from "@/lib/mockApi/restaurants";

type SeoRow = {
  title?: string | null;
  description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  keywords?: string | null;
};

async function getRestaurantSeo(id: string): Promise<SeoRow> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/seo?key=restaurant:${id}`, {
      next: { revalidate: 60 },
    });
    const json = await res.json();
    return (json.seo as SeoRow) ?? {};
  } catch {
    return {};
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [seo, restaurant] = await Promise.all([
    getRestaurantSeo(id),
    fetchRestaurantById(id).catch(() => null),
  ]);

  const defaultTitle = restaurant
    ? `${restaurant.name} — Mher Thar Ser`
    : "Restaurant — Mher Thar Ser";
  const defaultDescription = restaurant
    ? `Book a table at ${restaurant.name} in ${restaurant.area}, Bangkok. ${restaurant.description ?? ""}`
    : "Discover and book Myanmar restaurants in Bangkok.";

  const title = seo.title ?? defaultTitle;
  const description = seo.description ?? defaultDescription;

  return {
    title,
    description,
    keywords: seo.keywords ?? `${restaurant?.name ?? ""}, myanmar restaurant, ${restaurant?.area ?? "bangkok"}`,
    openGraph: {
      title: seo.og_title ?? title,
      description: seo.og_description ?? description,
      images: seo.og_image
        ? [{ url: seo.og_image }]
        : restaurant?.imageUrl
          ? [{ url: restaurant.imageUrl }]
          : [],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.og_title ?? title,
      description: seo.og_description ?? description,
      images: seo.og_image
        ? [seo.og_image]
        : restaurant?.imageUrl
          ? [restaurant.imageUrl]
          : [],
    },
  };
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <RestaurantDetailClient params={params} />;
}
