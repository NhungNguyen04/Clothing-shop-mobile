// Product.ts - Types and API functions for products

import axiosInstance from "./axiosInstance";

// Define the types based on the API response

export interface SizeStock {
  id: string;
  productId: string;
  size: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}
export interface Seller {
  id: string;
  userId: string;
  email: string | null;
  address: string;
  phone: string;
  managerName: string | null;
  postalCode: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  image: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  image: string[];
  category: string;
  subCategory: string;
  sellerId: string;
  reviews: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
  seller: Seller;
  stockSize: SizeStock[];
}

export interface ApiResponse {
  success: boolean;
  message: string;
  error: string | null;
  data: Product[];
}

// Function to fetch all products
export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await axiosInstance.get('products');
    
    // Axios doesn't have an 'ok' property - we check if the request was successful
    // by checking if the status code is in the 2xx range
    const result: ApiResponse = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch products');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

