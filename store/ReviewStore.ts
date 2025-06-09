import { create } from "zustand";
import {
  Review,
  getReviewsByProduct,
  getReviewsBySeller,
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
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
  updateReview: (
    reviewId: string,
    payload: {
      rating?: number;
      comment?: string;
      images?: string[];
    }
  ) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  sortReviewsByUser: (userId: string | undefined) => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
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

  updateReview: async (reviewId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedReview = await updateReviewApi(reviewId, payload);

      // Update the review in the local state
      set((state) => {
        const updatedReviews = state.reviews.map((review) =>
          review.id === reviewId ? updatedReview : review
        );

        return {
          reviews: updatedReviews,
          isLoading: false,
        };
      });

      return updatedReview;
    } catch (err) {
      set({ error: "Failed to update review", isLoading: false });
      throw err;
    }
  },

  deleteReview: async (reviewId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteReviewApi(reviewId);

      // Remove the deleted review from local state
      set((state) => ({
        reviews: state.reviews.filter((review) => review.id !== reviewId),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: "Failed to delete review", isLoading: false });
    }
  },

  // Sort reviews to put current user's reviews at the top
  sortReviewsByUser: (userId) => {
    if (!userId) return; // Skip if no userId provided

    set((state) => {
      const sortedReviews = [...state.reviews].sort((a, b) => {
        // Put current user's reviews at the top
        if (a.userId === userId && b.userId !== userId) return -1;
        if (a.userId !== userId && b.userId === userId) return 1;

        // Otherwise sort by most recent first
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return { reviews: sortedReviews };
    });
  },
}));
