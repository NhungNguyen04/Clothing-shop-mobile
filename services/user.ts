import axiosInstance from './axiosInstance';
import { useAuthStore } from '../store/AuthStore';

// Address type to match backend schema with standardized fields
export type Address = {
  address: string;         // Full standardized address string
  phoneNumber: string;
  postalCode?: string;
  
  // Additional fields for structured display and editing
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
};

// Types for user data
export type User = {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  image?: string;
  address?: Address[];
  postalCode?: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
};

// Types for update user request
export type UpdateUserData = {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  image?: string;
  address?: Address[];
  postalCode?: string;
};

// Format a full address from structured components
export const formatFullAddress = (
  street: string,
  ward?: string,
  district?: string,
  province?: string
): string => {
  return [street, ward, district, province]
    .filter(Boolean)
    .join(', ');
};

// Normalize a Vietnamese address by removing diacritics
export const normalizeAddress = (address: string): string => {
  return address
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D');
};

// User service class
export class UserService {
  // Get current authenticated user's information
  static async getCurrentUser(): Promise<User> {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await axiosInstance.get(`/users/${user.id}`);
      
      if (response.data.success) {
        // Update store with latest user data
        const token = useAuthStore.getState().token;
        if (token) { // Add null check for token
          useAuthStore.getState().setAuth({...response.data.data}, token);
        }
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get user data');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
  
  // Update user information
  static async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    try {
      const response = await axiosInstance.patch(`/users/${userId}`, data);
      
      if (response.data.success) {
        // Update user in store with the updated data
        const updatedUser = response.data.data;
        const token = useAuthStore.getState().token;
        if (token) { // Add null check for token
          useAuthStore.getState().setAuth(updatedUser, token);
        }
        return updatedUser;
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  // Delete user account
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const response = await axiosInstance.delete(`/users/${userId}`);
      
      if (response.data.success) {
        // Clear auth store after successful deletion
        useAuthStore.getState().clearAuth();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
