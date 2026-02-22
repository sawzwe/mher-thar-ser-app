import { Review } from "@/types";
import { storageGet, storageSet } from "../storage";

const REVIEWS_KEY = "reviews";

function delay(ms: number = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateId(): string {
  return `rv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getReviews(): Review[] {
  return storageGet<Review[]>(REVIEWS_KEY, []);
}

function saveReviews(reviews: Review[]): void {
  storageSet(REVIEWS_KEY, reviews);
}

export async function listReviews(restaurantId: string): Promise<Review[]> {
  await delay();
  return getReviews()
    .filter((r) => r.restaurantId === restaurantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function fetchAllReviews(): Promise<Review[]> {
  await delay();
  return getReviews();
}

export async function createReview(
  params: Omit<Review, "id" | "createdAt">
): Promise<Review> {
  await delay();
  const review: Review = {
    ...params,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const reviews = getReviews();
  reviews.push(review);
  saveReviews(reviews);
  return review;
}

export function computeAverageRating(
  reviews: Review[],
  fallback: number
): { avg: number; count: number } {
  if (reviews.length === 0) return { avg: fallback, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    avg: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}
