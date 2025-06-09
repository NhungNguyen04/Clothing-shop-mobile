import axiosInstance from "./axiosInstance";

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  images: string[];
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    image?: string;
  };
  product?: {
    name: string;
  };
}

// Lấy đánh giá theo productId
export const getReviewsByProduct = async (
  productId: string
): Promise<Review[]> => {
  const res = await axiosInstance.get(`/reviews/${productId}`);
  return res.data.data;
};

export const createReviewApi = async (review: {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  images?: string[]; // thêm dòng này
}): Promise<Review> => {
  const res = await axiosInstance.post(`/reviews`, review);
  return res.data.data;
};

export const updateReviewApi = async (
  reviewId: string,
  updateData: {
    rating?: number;
    comment?: string;
    images?: string[];
  }
): Promise<Review> => {
  const res = await axiosInstance.patch(`/reviews/${reviewId}`, updateData);
  return res.data.data;
};

export const getReviewsBySeller = async (
  sellerId: string,
  page = 1,
  limit = 10
): Promise<Review[]> => {
  const res = await axiosInstance.get(
    `/reviews/seller/${sellerId}?page=${page}&limit=${limit}`
  );
  return res.data.data;
};

export const deleteReviewApi = async (reviewId: string): Promise<void> => {
  await axiosInstance.delete(`/reviews/${reviewId}`);
};