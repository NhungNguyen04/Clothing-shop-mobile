import axiosInstance from './axiosInstance';

// Types based on backend schemas
export interface Address {
  id?: string;
  userId?: string;
  sellerId?: string;
  phoneNumber: string;
  address: string;
  postalCode?: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
}

export type CreateAddressInput = Omit<Address, 'id'>;
export type UpdateAddressInput = Partial<CreateAddressInput>;
export type CoordinatesInput = { latitude: number; longitude: number };

export class AddressService {
  private baseUrl = '/addresses';

  // Create a new address
  async createAddress(addressData: CreateAddressInput): Promise<Address> {
    try {
      const response = await axiosInstance.post<Address>(this.baseUrl, addressData);
      return response.data;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  // Get all addresses for a user
  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      const response = await axiosInstance.get<Address[]>(`${this.baseUrl}?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      throw error;
    }
  }

  // Get all addresses for a seller
  async getSellerAddresses(sellerId: string): Promise<Address[]> {
    try {
      const response = await axiosInstance.get<Address[]>(`${this.baseUrl}?sellerId=${sellerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching seller addresses:', error);
      throw error;
    }
  }

  // Get a specific address by ID
  async getAddressById(addressId: string): Promise<Address> {
    try {
      const response = await axiosInstance.get<Address>(`${this.baseUrl}/${addressId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching address with ID ${addressId}:`, error);
      throw error;
    }
  }

  // Update an address
  async updateAddress(addressId: string, updatedData: UpdateAddressInput): Promise<Address> {
    try {
      const response = await axiosInstance.patch<Address>(`${this.baseUrl}/${addressId}`, updatedData);
      return response.data;
    } catch (error) {
      console.error(`Error updating address with ID ${addressId}:`, error);
      throw error;
    }
  }

  // Update address coordinates
  async updateCoordinates(addressId: string, latitude: number, longitude: number): Promise<Address> {
    try {
      const response = await axiosInstance.patch<Address>(
        `${this.baseUrl}/${addressId}/coordinates`, 
        { latitude, longitude }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating coordinates for address ID ${addressId}:`, error);
      throw error;
    }
  }

  // Delete an address
  async deleteAddress(addressId: string): Promise<void> {
    try {
      await axiosInstance.delete(`${this.baseUrl}/${addressId}`);
    } catch (error) {
      console.error(`Error deleting address with ID ${addressId}:`, error);
      throw error;
    }
  }

  // Utility functions
  
  // Format address for display
  formatAddressForDisplay(address: Address): string {
    const parts = [
      address.address,
      address.street,
      address.ward,
      address.district,
      address.province,
      address.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // Format address for maps
  formatAddressForMaps(address: Address): string {
    return [
      address.address,
      address.district,
      address.province
    ].filter(Boolean).join(', ');
  }

  // Validate address has required fields
  validateAddress(address: Partial<Address>): boolean {
    return Boolean(
      address.phoneNumber &&
      address.phoneNumber.length >= 8 &&
      address.address &&
      address.address.length >= 5
    );
  }

  // Check if address has coordinates
  hasCoordinates(address: Address): boolean {
    return typeof address.latitude === 'number' && 
           typeof address.longitude === 'number';
  }
}

export default new AddressService();
