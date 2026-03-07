import type { Metadata } from "next";
import { RestaurantsPageClient } from "@/components/RestaurantsPageClient";

export const metadata: Metadata = {
  title: "All Restaurants — Mher Thar Ser",
  description: "Browse all Myanmar restaurants in Bangkok. Search, filter, and find your next meal.",
};

export default function RestaurantsPage() {
  return <RestaurantsPageClient />;
}
