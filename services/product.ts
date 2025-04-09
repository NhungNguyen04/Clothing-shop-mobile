// Product.ts - Types and API functions for products

import axiosInstance from "./axiosInstance";

// Define the types based on the API response
export interface SizeStock {
  id: string;
  size: string;
  quantity: number;
  productId: string;
  createdAt: string;
  updatedAt: string;
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
  ratings: any | null;
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

// Function to fetch the 10 most recent products
export const fetchRecentProducts = async (limit: number = 10): Promise<Product[]> => {
  try {
    const allProducts = await fetchAllProducts();
    
    // Sort products by createdAt date (newest first)
    const sortedProducts = [...allProducts].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Return only the specified number of products
    return sortedProducts.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent products:', error);
    throw error;
  }
};

// Helper function to get the first image from a product
export const getProductMainImage = (product: Product): string => {
  return product.image && product.image.length > 0 
    ? product.image[0] 
    : 'https://via.placeholder.com/300x400';
};

// Format price with currency symbol
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export const fetchProductById = async (id: string): Promise<Product> => {
  try {
    const response = await axiosInstance.get(`products/${id}`);
    
    const result = response.data;
    console.log("result", result)
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error(result.error || 'Product not found');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}