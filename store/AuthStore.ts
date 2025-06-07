import { create } from 'zustand';
import { User, UserService, UpdateUserData } from '../services/user';
import { Seller } from '../services/seller'

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // New seller-related properties
  isSeller: boolean;
  seller: Seller | null;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  setSeller: (seller: Seller | null) => void;
  clearAuth: () => void;
  updateUser: (updateData: UpdateUserData) => Promise<User | null>;
  refreshUserData: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isSeller: false,
  seller: null,

  setAuth: (user, token) => set({ 
    user, 
    token,
    isAuthenticated: !!user && !!token ,
    isSeller: user?.role === 'SELLER'
  }),
  
  setSeller: (seller) => set({ 
    seller,
    isSeller: seller !== null 
  }),

  clearAuth: () => set({ 
    user: null, 
    token: null,
    isAuthenticated: false,
    isSeller: false,
    seller: null
  }),
  
  updateUser: async (updateData) => {
    try {
      const { user } = get();
      if (!user?.id) return null;
      
      const updatedUser = await UserService.updateUser(user.id, updateData);
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user in store:', error);
      return null;
    }
  },
  
  refreshUserData: async () => {
    try {
      const userData = await UserService.getCurrentUser();
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  }
}));