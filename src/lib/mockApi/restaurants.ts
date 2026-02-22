import { Restaurant } from "@/types";
import { restaurants as seedRestaurants } from "@/data/seed";

function delay(ms: number = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  await delay();
  return [...seedRestaurants];
}

export async function fetchRestaurantById(
  id: string
): Promise<Restaurant | null> {
  await delay();
  return seedRestaurants.find((r) => r.id === id) ?? null;
}

export async function searchRestaurants(query: string): Promise<Restaurant[]> {
  await delay();
  const q = query.toLowerCase().trim();
  if (!q) return [...seedRestaurants];

  return seedRestaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.area.toLowerCase().includes(q) ||
      r.cuisineTags.some((t) => t.toLowerCase().includes(q)) ||
      r.description.toLowerCase().includes(q)
  );
}
