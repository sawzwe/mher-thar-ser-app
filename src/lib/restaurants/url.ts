/**
 * Returns the path segment for a restaurant URL.
 * Prefers slug when available for SEO-friendly URLs; falls back to id.
 */
export function getRestaurantPath(restaurant: {
  id: string;
  slug?: string | null;
}): string {
  return restaurant.slug?.trim() || restaurant.id;
}
