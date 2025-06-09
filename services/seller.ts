import axiosInstance from './axiosInstance';
import { Product } from './product';
import { User, Address } from './user';

// Define schema types locally since they're from backend
interface AddressInfo extends Address {
  // Inherits from the Address type in user.ts
}

// Input interfaces based on backend schema
interface CreateSellerInput {
  userId: string;
  email: string;
  addressInfo: AddressInfo;
  managerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface UpdateSellerInput {
  email?: string;
  managerName?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  addressInfo?: Partial<AddressInfo>;
}

// Response interfaces
interface SellerResponse {
  success: boolean;
  message?: string;
  error?: any;
  data: {
    seller?: Seller;
    updatedSeller?: Seller;
    deletedSeller?: Seller;
    sellers?: Seller[];
  } | null;
}

export interface Seller {
  id: string;
  userId: string;
  email: string;
  managerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  addressId?: string;
  createdAt: string;
  updatedAt: string;
  address?: Address;
  user?: User;
  products?: Product[];
  image?: string; // Optional image field
}

// Create a new seller
// Create a new seller
export const createSeller = async (sellerData: CreateSellerInput): Promise<any> => {
  try {
    const response = await axiosInstance.post('/sellers', sellerData);
    
    // Return the direct response data which should contain the seller object
    return response.data;
  } catch (error) {
    console.error('Error creating seller:', error);
    throw error;
  }
};

// Get all sellers
export const getAllSellers = async (): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.get('/sellers');
    return response.data;
  } catch (error) {
    console.error('Error fetching all sellers:', error);
    throw error;
  }
};

// Get seller by ID
export const getSellerById = async (sellerId: string): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.get(`/sellers/${sellerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching seller with ID ${sellerId}:`, error);
    throw error;
  }
};

// Get seller by user ID
export const getSellerByUserId = async (userId: string): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.get(`/sellers/user/${userId}`);
    
    // If the response directly contains a seller property (without data wrapper)
    if (response.data) {
      // Transform the response to match the expected SellerResponse structure
      return {
        success: true,
        data: {
          seller: response.data.seller
        }
      };
    } 
    // If the response has data.seller structure
    else if (response && response.data && 'seller' in response.data) {
      return response.data;
    } 
    // If the response itself is the seller object (no wrapper)
    else if (response && 'id' in response && 'status' in response) {
      return {
        success: true,
        data: {
          seller: response.data as Seller
        }
      };
    }
    else {
      console.log('No seller data found in response');
      return {
        success: false,
        message: 'No seller data found',
        data: null
      };
    }
  } catch (error) {
    console.error(`Error fetching seller with user ID ${userId}:`, error);
    throw error;
  }
};

// Update seller
export const updateSeller = async (sellerId: string, updateData: UpdateSellerInput): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.patch(`/sellers/${sellerId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating seller with ID ${sellerId}:`, error);
    throw error;
  }
};

// Delete seller
export const deleteSeller = async (sellerId: string): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.delete(`/sellers/${sellerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting seller with ID ${sellerId}:`, error);
    throw error;
  }
};
