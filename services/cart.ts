import axiosInstance from "./axiosInstance";
import { SizeStock } from "./product";
import { useAuthStore } from "@/store/AuthStore";

// Define all the types that represent our cart data structure
export interface Seller {
  id: string;
  userId: string;
  email: string;
  address: string;
  phone: string;
  managerName: string;
  postalCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  cartId: string;
  sizeStockId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  sizeStock: SizeStock & {
    product: {
      id: string;
      name: string;
      price: number; 
      image: string[];
      sellerId: string;
      sellerName: string;
    }
  };
}

export interface SellerItems {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  totalValue: number;
}

export interface Cart {
  id: string;
  userId: string;
  totalCartValue: number;
  createdAt: string;
  updatedAt: string;
  cartItems: CartItem[];
  itemsBySeller: SellerItems[];
}

// Direct service functions that use AuthStore instead of hooks
export const getCartByUserId = async (): Promise<Cart> => {
  const authStore = useAuthStore.getState();
  if (!authStore.user?.id) {
    throw new Error('User not authenticated');
  }
  
  try {
    const response = await axiosInstance.get(`/cart/${authStore.user.id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cart data:', error);
    throw new Error('Failed to fetch cart data');
  }
};

export const addToCart = async (
  productId: string,
  size: string,
  quantity: number
): Promise<Cart> => {
  const authStore = useAuthStore.getState();
  if (!authStore.user?.id) {
    throw new Error('User not authenticated');
  }
  
  try {
    const response = await axiosInstance.post(`/cart/${authStore.user.id}`, {
      productId,
      size,
      quantity,
    });
    console.log('Add to cart response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw new Error('Failed to add item to cart');
  }
};

export const updateCartItemQuantity = async (
  cartItemId: string,
  quantity: number
): Promise<Cart> => {
  const authStore = useAuthStore.getState();
  if (!authStore.user?.id) {
    throw new Error('User not authenticated');
  }
  
  try {
    const response = await axiosInstance.patch(
      `/cart/item/${cartItemId}?userId=${authStore.user.id}`,
      { quantity }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw new Error('Failed to update cart item quantity');
  }
};

export const removeCartItem = async (
  cartItemId: string
): Promise<Cart> => {
  const authStore = useAuthStore.getState();
  if (!authStore.user?.id) {
    throw new Error('User not authenticated');
  }
  
  try {
    const response = await axiosInstance.delete(
      `/cart/item/${cartItemId}?userId=${authStore.user.id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw new Error('Failed to remove cart item');
  }
};

export const removeItemsBySeller = async (
  sellerId: string
): Promise<Cart> => {
  const authStore = useAuthStore.getState();
  if (!authStore.user?.id) {
    throw new Error('User not authenticated');
  }
  
  try {
    const response = await axiosInstance.delete(
      `/cart/seller/${sellerId}?userId=${authStore.user.id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing seller items from cart:', error);
    throw new Error('Failed to remove seller items from cart');
  }
};