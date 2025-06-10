import axiosInstance from '../axiosInstance';
import { AxiosError } from 'axios';

// User Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  isOAuth: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User | null;
  error?: any;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: User[] | null;
  error?: any;
}

// Seller Interfaces
export interface Seller {
  id: string;
  userId: string;
  user: User;
  email?: string | null;
  image?: string | null;
  addressId?: string | null;
  managerName?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface SellerResponse {
  success?: boolean;
  message?: string;
  data?: Seller | null;
  updatedSeller?: Seller;
  deletedSeller?: Seller;
  error?: any;
}

export interface SellersResponse {
  success?: boolean;
  message?: string;
  data?: Seller[] | null;
  sellers?: Seller[];
  error?: any;
}

export interface UpdateRoleResponse {
  success?: boolean;
  message?: string;
  data?: User | null;
  updatedUser?: User;
  error?: any;
}

// User Management Functions
export const getAllUsers = async (): Promise<UsersResponse> => {
  try {
    const response = await axiosInstance.get('/users');
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error('Error fetching users:', axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to fetch users',
      data: null,
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

export const getUserById = async (userId: string): Promise<UserResponse> => {
  try {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Error fetching user ${userId}:`, axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to fetch user',
      data: null,
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

export const updateUserRole = async (
  userId: string, 
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER'
): Promise<UpdateRoleResponse> => {
  try {
    const response = await axiosInstance.patch(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Error updating role for user ${userId}:`, axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to update user role',
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

export const deleteUser = async (userId: string): Promise<UserResponse> => {
  try {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Error deleting user ${userId}:`, axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to delete user',
      data: null,
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

// Seller Management Functions
export const getAllSellers = async (): Promise<SellersResponse> => {
  try {
    const response = await axiosInstance.get('/sellers');
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error('Error fetching sellers:', axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to fetch sellers',
      data: null,
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

export const getSellerById = async (sellerId: string): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.get(`/sellers/${sellerId}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Error fetching seller ${sellerId}:`, axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to fetch seller',
      data: null,
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

export const getSellerByUserId = async (userId: string): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.get(`/sellers/user/${userId}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Error fetching seller by user ID ${userId}:`, axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to fetch seller',
      data: null,
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

export const updateSellerStatus = async (
  sellerId: string, 
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.patch(`/sellers/${sellerId}/status`, { status });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Error updating status for seller ${sellerId}:`, axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to update seller status',
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

export const deleteSeller = async (sellerId: string): Promise<SellerResponse> => {
  try {
    const response = await axiosInstance.delete(`/sellers/${sellerId}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    console.error(`Error deleting seller ${sellerId}:`, axiosError);
    return {
      success: false,
      message: (axiosError.response?.data as any)?.message || 'Failed to delete seller',
      data: null,
      error: (axiosError.response?.data as any) || axiosError.message
    };
  }
};

// Export all functions as a service object
const AdminAccountService = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllSellers,
  getSellerById,
  getSellerByUserId,
  updateSellerStatus,
  deleteSeller
};

export default AdminAccountService;
