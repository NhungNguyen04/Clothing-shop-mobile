import { create } from "zustand";
import {
  Review,
  getReviewsByProduct,
  getReviewsBySeller,
  createReviewApi,
} from "@/services/review";

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;

  fetchByProduct: (productId: string) => Promise<void>;
  fetchBySeller: (
    sellerId: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  createReview: (payload: {
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
    images?: string[];
  }) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchByProduct: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getReviewsByProduct(productId);
      set({ reviews: data, isLoading: false });
    } catch (err) {
      set({ error: "Failed to fetch product reviews", isLoading: false });
    }
  },

  fetchBySeller: async (sellerId: string, page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getReviewsBySeller(sellerId, page, limit);
      set({ reviews: data, isLoading: false });
    } catch (err) {
      set({ error: "Failed to fetch seller reviews", isLoading: false });
    }
  },

  createReview: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const newReview = await createReviewApi(payload);
      set((state) => ({
        reviews: [newReview, ...state.reviews],
        isLoading: false,
      }));
    } catch (err) {
      set({ error: "Failed to create review", isLoading: false });
    }
  },
}));
