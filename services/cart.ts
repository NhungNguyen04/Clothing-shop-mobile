import axiosInstance from "./axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useCallback } from "react";

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

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  image: string[];
  category: string;
  subCategory: string;
  sellerId: string;
  ratings: null | number;
  createdAt: string;
  updatedAt: string;
  seller: Seller;
}

export interface SizeStock {
  id: string;
  size: string;
  quantity: number;
  productId: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
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
  sizeStock: SizeStock;
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

/**
 * Hook that provides cart operations with automatic user ID from auth context
 */
export const useCart = () => {
  const { user } = useAuth();
  
  const getUserCart = useCallback(async (): Promise<Cart> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await axiosInstance.get(`/cart/${user.id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cart data:', error);
      throw new Error('Failed to fetch cart data');
    }
  }, [user?.id]);

  const addItemToCart = useCallback(async (
    productId: string,
    size: string,
    quantity: number
  ): Promise<CartItem> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await axiosInstance.post(`/cart/${user.id}`, {
        productId,
        size,
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw new Error('Failed to add item to cart');
    }
  }, [user?.id]);

  const updateItemQuantity = useCallback(async (
    cartItemId: string,
    quantity: number
  ): Promise<CartItem> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await axiosInstance.patch(
        `/cart/item/${cartItemId}?userId=${user.id}`,
        { quantity }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw new Error('Failed to update cart item quantity');
    }
  }, [user?.id]);

  const removeItem = useCallback(async (
    cartItemId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await axiosInstance.delete(
        `/cart/item/${cartItemId}?userId=${user.id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw new Error('Failed to remove cart item');
    }
  }, [user?.id]);

  const removeSellerItems = useCallback(async (
    sellerId: string
  ): Promise<{
    success: boolean;
    deletedCount: number;
    totalPriceReduction: number;
    message: string;
  }> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await axiosInstance.delete(
        `/cart/seller/${sellerId}?userId=${user.id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing seller items from cart:', error);
      throw new Error('Failed to remove seller items from cart');
    }
  }, [user?.id]);

  return {
    getUserCart,
    addItemToCart,
    updateItemQuantity,
    removeItem,
    removeSellerItems
  };
};

// Keep the original functions for backward compatibility or direct usage

/**
 * Fetches the cart data for a specific user
 * @param userId - The ID of the user whose cart data is being requested
 * @returns The cart data including items and seller information
 */
export const getCartByUserId = async (userId: string): Promise<Cart> => {
  try {
    const response = await axiosInstance.get(`/cart/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cart data:', error);
    throw new Error('Failed to fetch cart data');
  }
};

/**
 * Adds an item to the user's cart
 * @param userId - The ID of the user
 * @param productId - The ID of the product to add
 * @param size - The size of the product
 * @param quantity - The quantity to add
 * @returns The updated cart data with the new item
 */
export const addToCart = async (
  userId: string,
  productId: string,
  size: string,
  quantity: number
): Promise<CartItem> => {
  try {
    const response = await axiosInstance.post(`/cart/${userId}`, {
      productId,
      size,
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw new Error('Failed to add item to cart');
  }
};

/**
 * Updates the quantity of an item in the cart
 * @param cartItemId - The ID of the cart item to update
 * @param userId - The ID of the user who owns the cart
 * @param quantity - The new quantity to set
 * @returns The updated cart data
 */
export const updateCartItemQuantity = async (
  cartItemId: string,
  userId: string,
  quantity: number
): Promise<CartItem> => {
  try {
    const response = await axiosInstance.patch(
      `/cart/item/${cartItemId}?userId=${userId}`,
      { quantity }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw new Error('Failed to update cart item quantity');
  }
};

/**
 * Removes an item from the cart
 * @param cartItemId - The ID of the cart item to remove
 * @param userId - The ID of the user who owns the cart
 * @returns The updated cart data
 */
export const removeCartItem = async (
  cartItemId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axiosInstance.delete(
      `/cart/item/${cartItemId}?userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw new Error('Failed to remove cart item');
  }
};

/**
 * Removes all items from a specific seller from the cart
 * @param userId - The ID of the user who owns the cart
 * @param sellerId - The ID of the seller whose items should be removed
 * @returns Result of the operation
 */
export const removeItemsBySeller = async (
  userId: string,
  sellerId: string
): Promise<{
  success: boolean;
  deletedCount: number;
  totalPriceReduction: number;
  message: string;
}> => {
  try {
    const response = await axiosInstance.delete(
      `/cart/seller/${sellerId}?userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing seller items from cart:', error);
    throw new Error('Failed to remove seller items from cart');
  }
};
