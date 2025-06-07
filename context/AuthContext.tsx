import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/AuthStore';
import { useRouter } from 'expo-router'; // Import router for navigation
import { getSellerByUserId } from '@/services/seller'; // Import seller service
import { User as AppUser } from '@/services/user'; // Import user type from services

// Update User type to match the one from services/user.ts
type User = AppUser;

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSeller: boolean; // Add isSeller property
  login: (data: { user: User, access_token: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setAuth = useAuthStore(state => state.setAuth);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const setSeller = useAuthStore(state => state.setSeller);
  const isSeller = useAuthStore(state => state.isSeller);
  const router = useRouter();

  useEffect(() => {
    // Load stored values
    const loadStoredAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userData');
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.log('Failed to load auth data', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (user && token) {
        setAuth(user, token);
      } else {
        clearAuth();
      }
    }
  }, [user, token, isLoading, setAuth, clearAuth]);

  // Function to check seller status and load seller data
  const checkSellerStatus = async (userId: string) => {
    try {
      console.log('Checking seller status for user ID:', userId);
      const response = await getSellerByUserId(userId);
      console.log('Seller status check response:', response);
      
      if (response.success && response.data && response.data.seller) {
        console.log('Setting seller data in store:', response.data.seller);
        setSeller(response.data.seller);
        
        // Only redirect to seller dashboard if status is APPROVED
        if (response.data.seller.status === 'APPROVED') {
          router.push('/seller');
        }
      } else {
        console.log('No valid seller data found, setting seller to null');
        setSeller(null);
      }
    } catch (error) {
      console.log('Error checking seller status:', error);
      setSeller(null);
    }
  };

  useEffect(() => {
    // When user logs in and has role SELLER, check seller status
    if (user?.id && user?.role === 'SELLER') {
      console.log('User is a SELLER, checking seller status');
      checkSellerStatus(user.id);
    }
  }, [user]);

  const login = async (data: { user: User, access_token: string }) => {
    try {
      await SecureStore.setItemAsync('userToken', data.access_token);
      await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);
      setAuth(data.user, data.access_token);
      
      // Check if user is a seller and redirect if necessary
      if (data.user.role === 'SELLER' && data.user.id) {
        checkSellerStatus(data.user.id);
      }
    } catch (error) {
      console.log('Failed to store auth data', error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      
      setToken(null);
      setUser(null);
      clearAuth();
    } catch (error) {
      console.log('Failed to remove auth data', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      isSeller, // Expose isSeller to the context
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};