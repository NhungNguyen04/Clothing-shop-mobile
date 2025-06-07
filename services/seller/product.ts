import axiosInstance from "../axiosInstance";
import { ApiResponse, Product, SizeStock } from "../product";

// Define specific types for seller product operations
export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  image: string[];
  category: 'men' | 'women' | 'kids';
  subCategory: 'topwear' | 'bottomwear' | 'winterwear';
  sellerId: string;
  stockSize: {
    size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
    quantity: number;
  }[];
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  image?: string[];
  category?: 'men' | 'women' | 'kids';
  subCategory?: 'topwear' | 'bottomwear' | 'winterwear';
  stockSize?: {
    size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
    quantity: number;
  }[];
}

// Get all products for a specific seller
export const fetchSellerProducts = async (sellerId: string): Promise<Product[]> => {
  try {
    const response = await axiosInstance.get(`products/seller/${sellerId}`);
    const result: ApiResponse = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch seller products');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
};

// Create new product
export const createProduct = async (productData: CreateProductData): Promise<Product> => {
  try {
    const response = await axiosInstance.post('products', productData);
    const result = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create product');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update existing product
export const updateProduct = async (productId: string, updateData: UpdateProductData): Promise<Product> => {
  try {
    const response = await axiosInstance.patch(`products/${productId}`, updateData);
    const result = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update product');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId: string): Promise<any> => {
  try {
    const response = await axiosInstance.delete(`products/${productId}`);
    const result = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete product');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Get single product details
export const getProductDetails = async (productId: string): Promise<Product> => {
  try {
    const response = await axiosInstance.get(`products/${productId}`);
    const result = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch product details');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
};

// Upload product images - modified to handle React Native file objects
export const uploadProductImage = async (file: any): Promise<string> => {
  try {
    const formData = new FormData();
    
    // Create a file object that FormData can properly process for React Native
    const fileToUpload = {
      uri: file.uri,
      type: file.mimeType || 'image/jpeg',
      name: file.fileName || 'image.jpg',
    };
    
    formData.append('file', fileToUpload as any);
    
    console.log('Uploading single file:', fileToUpload);
    
    const response = await axiosInstance.post('upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      timeout: 30000, // Increase timeout for large uploads
    });
    
    const result = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to upload image');
    }
    
    return result.data.url || result.data;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up the request:', error.message);
    }
    
    throw error;
  }
};

// Upload multiple product images - modified for React Native
export const uploadMultipleProductImages = async (files: any[]): Promise<string[]> => {
  try {
    const formData = new FormData();
    
    // Process each file for React Native compatibility
    files.forEach((file, index) => {
      const fileToUpload = {
        uri: file.uri,
        type: file.mimeType || 'image/jpeg',
        name: file.fileName || `image${index}.jpg`,
      };
      
      // Use 'files' key name as expected by the backend
      formData.append('files', fileToUpload as any);
    });
    
    console.log(`Preparing to upload ${files.length} files`);
    
    // Check network connection before attempting upload
    // (React Native doesn't have navigator.onLine, so this is skipped)
    
    const response = await axiosInstance.post('upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      timeout: 60000, // Increased timeout for multiple images
    });
    
    const result = response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to upload images');
    }
    
    // Return array of image URLs
    return result.data.map((item: any) => item.url || item);
  } catch (error: any) {
    console.error('Error uploading multiple images:', error);
    
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up the request:', error.message);
    }
    
    throw error;
  }
};
