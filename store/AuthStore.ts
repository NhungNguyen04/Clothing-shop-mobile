import { create } from 'zustand';
import { User, UserService, UpdateUserData } from '../services/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  clearAuth: () => void;
  updateUser: (updateData: UpdateUserData) => Promise<User | null>;
  refreshUserData: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  setAuth: (user, token) => set({ 
    user, 
    token,
    isAuthenticated: !!user && !!token 
  }),
  
  clearAuth: () => set({ 
    user: null, 
    token: null,
    isAuthenticated: false 
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