import { create } from "zustand";
import { Review } from "@/types";
import {
  listReviews as apiListReviews,
  createReview as apiCreateReview,
  fetchAllReviews,
  computeAverageRating,
} from "@/lib/mockApi/reviews";

interface ReviewState {
  reviews: Review[];
  allReviews: Review[];
  loading: boolean;
  loadReviews: (restaurantId: string) => Promise<void>;
  loadAllReviews: () => Promise<void>;
  addReview: (params: Omit<Review, "id" | "createdAt">) => Promise<Review>;
  getAverageRating: (restaurantId: string, seedRating: number) => { avg: number; count: number };
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  allReviews: [],
  loading: false,

  loadReviews: async (restaurantId) => {
    set({ loading: true });
    const data = await apiListReviews(restaurantId);
    set({ reviews: data, loading: false });
  },

  loadAllReviews: async () => {
    const data = await fetchAllReviews();
    set({ allReviews: data });
  },

  addReview: async (params) => {
    const review = await apiCreateReview(params);
    await get().loadReviews(params.restaurantId);
    await get().loadAllReviews();
    return review;
  },

  getAverageRating: (restaurantId, seedRating) => {
    const restaurantReviews = get().allReviews.filter(
      (r) => r.restaurantId === restaurantId
    );
    return computeAverageRating(restaurantReviews, seedRating);
  },
}));
