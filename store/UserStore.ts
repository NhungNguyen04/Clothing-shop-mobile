import { create } from 'zustand';
import { UserService, UpdateUserData, Address, formatFullAddress, normalizeAddress } from '../services/user';
import { useAuthStore } from './AuthStore';
import { parseAddress } from '../utils/stringUtils';

interface UserState {
  isLoading: boolean;
  error: string | null;
  
  // Address management
  addresses: Address[];
  currentAddress: Address | null;
  
  // User data actions
  getUserAddresses: () => Promise<Address[]>;
  getUserAddress: () => Promise<Address | null>;
  addUserAddress: (
    street: string,
    ward: string,
    district: string,
    province: string,
    phoneNumber: string,
    postalCode?: string
  ) => Promise<boolean>;
  updateUserAddress: (
    index: number,
    street: string,
    ward: string,
    district: string,
    province: string,
    phoneNumber: string,
    postalCode?: string
  ) => Promise<boolean>;
  deleteUserAddress: (index: number) => Promise<boolean>;
  setCurrentAddress: (address: Address | null) => void;
  clearAddresses: () => void;
  
  // Profile related actions
  updateUserProfile: (data: UpdateUserData) => Promise<boolean>;
  refreshUserData: () => Promise<boolean>;
}

export const useUserStore = create<UserState>((set, get) => ({
  isLoading: false,
  error: null,
  addresses: [],
  currentAddress: null,
  
  // Get all user addresses
  getUserAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        set({ error: 'User not authenticated', isLoading: false });
        return [];
      }
      
      // If the user has addresses stored, use them
      if (user.address && user.address.length > 0) {
        set({ 
          addresses: user.address,
          isLoading: false 
        });
        return user.address;
      }
      
      // Otherwise, fetch the latest user data to check for addresses
      const userData = await UserService.getCurrentUser();
      
      if (userData.address && userData.address.length > 0) {
        set({ 
          addresses: userData.address,
          isLoading: false 
        });
        return userData.address;
      }
      
      set({ isLoading: false });
      return [];
    } catch (error) {
      console.error('Error getting user addresses:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get addresses',
        isLoading: false 
      });
      return [];
    }
  },
  
  // Get the current user's primary address (first in the list or currently selected)
  getUserAddress: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentAddress } = get();
      if (currentAddress) {
        set({ isLoading: false });
        return currentAddress;
      }
      
      const addresses = await get().getUserAddresses();
      
      if (addresses.length > 0) {
        set({ 
          currentAddress: addresses[0],
          isLoading: false 
        });
        return addresses[0];
      }
      
      set({ isLoading: false });
      return null;
    } catch (error) {
      console.error('Error getting user address:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get address',
        isLoading: false 
      });
      return null;
    }
  },
  
  // Add a new address with standardized format
  addUserAddress: async (
    street: string,
    ward: string,
    district: string,
    province: string,
    phoneNumber: string,
    postalCode?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      
      if (!user?.id) {
        set({ error: 'User not authenticated', isLoading: false });
        return false;
      }
      
      // Format the full address string from components
      const fullAddressStr = formatFullAddress(street, ward, district, province);
      
      // Normalize the address (remove diacritics)
      const normalizedAddress = normalizeAddress(fullAddressStr);
      
      // Get existing addresses or empty array
      const currentAddresses = user.address || [];
      
      // Create the new address object with both normalized address and components
      const newAddress: Address = {
        address: normalizedAddress,
        phoneNumber,
        postalCode,
        street,
        ward,
        district,
        province
      };
      
      // Add to existing addresses
      const updatedAddresses = [...currentAddresses, newAddress];
      
      const updatedUser = await UserService.updateUser(user.id, {
        address: updatedAddresses
      });
      
      if (updatedUser) {
        set({ 
          addresses: updatedAddresses,
          currentAddress: newAddress,
          isLoading: false 
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Error adding user address:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add address',
        isLoading: false 
      });
      return false;
    }
  },
  
  // Update an existing address
  updateUserAddress: async (
    index: number,
    street: string,
    ward: string,
    district: string,
    province: string,
    phoneNumber: string,
    postalCode?: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const { addresses } = get();
      
      if (!user?.id) {
        set({ error: 'User not authenticated', isLoading: false });
        return false;
      }
      
      if (!addresses || index >= addresses.length) {
        set({ error: 'Invalid address index', isLoading: false });
        return false;
      }
      
      // Format the full address string from components
      const fullAddressStr = formatFullAddress(street, ward, district, province);
      
      // Normalize the address (remove diacritics)
      const normalizedAddress = normalizeAddress(fullAddressStr);
      
      // Create updated addresses array
      const updatedAddresses = [...addresses];
      updatedAddresses[index] = {
        address: normalizedAddress,
        phoneNumber,
        postalCode,
        street,
        ward,
        district,
        province
      };
      
      const updatedUser = await UserService.updateUser(user.id, {
        address: updatedAddresses
      });
      
      if (updatedUser) {
        set({ 
          addresses: updatedAddresses,
          // Update current address if it was the one being edited
          currentAddress: get().currentAddress === addresses[index] ? updatedAddresses[index] : get().currentAddress,
          isLoading: false 
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Error updating user address:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update address',
        isLoading: false 
      });
      return false;
    }
  },
  
  // Delete an address
  deleteUserAddress: async (index: number) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const { addresses, currentAddress } = get();
      
      if (!user?.id) {
        set({ error: 'User not authenticated', isLoading: false });
        return false;
      }
      
      if (!addresses || index >= addresses.length) {
        set({ error: 'Invalid address index', isLoading: false });
        return false;
      }
      
      // Create updated addresses array without the deleted address
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      
      const updatedUser = await UserService.updateUser(user.id, {
        address: updatedAddresses
      });
      
      if (updatedUser) {
        // Reset current address if it was deleted
        const deletedAddress = addresses[index];
        const isCurrentAddressDeleted = 
          currentAddress && 
          currentAddress.address === deletedAddress.address && 
          currentAddress.phoneNumber === deletedAddress.phoneNumber;
        
        set({ 
          addresses: updatedAddresses,
          currentAddress: isCurrentAddressDeleted 
            ? (updatedAddresses.length > 0 ? updatedAddresses[0] : null) 
            : currentAddress,
          isLoading: false 
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Error deleting user address:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete address',
        isLoading: false 
      });
      return false;
    }
  },
  
  // Set the current address
  setCurrentAddress: (address) => {
    set({ currentAddress: address });
  },
  
  // Clear all addresses
  clearAddresses: () => {
    set({ addresses: [], currentAddress: null });
  },
  
  // Update user profile information (name, email, etc.)
  updateUserProfile: async (data: UpdateUserData) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      
      if (!user?.id) {
        set({ error: 'User not authenticated', isLoading: false });
        return false;
      }
      
      const updatedUser = await UserService.updateUser(user.id, data);
      
      set({ isLoading: false });
      return !!updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        isLoading: false 
      });
      return false;
    }
  },
  
  // Refresh user data from the server
  refreshUserData: async () => {
    set({ isLoading: true, error: null });
    try {
      const userData = await UserService.getCurrentUser();
      
      // Update address information if available
      if (userData.address && userData.address.length > 0) {
        set({ addresses: userData.address });
        if (!get().currentAddress) {
          set({ currentAddress: userData.address[0] });
        }
      }
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh user data',
        isLoading: false 
      });
      return false;
    }
  }
}));
