import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Cart, CartItem, useCart } from '../services/cart';
import { useAuth } from './AuthContext';

type CartContextType = {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, size: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  removeSellerItems: (sellerId: string) => Promise<void>;
  clearCartError: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { 
    getUserCart, 
    addItemToCart, 
    updateItemQuantity, 
    removeItem: removeCartItem,
    removeSellerItems: removeSellerCartItems
  } = useCart();

  const clearCartError = useCallback(() => {
    setError(null);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const cartData = await getUserCart();
      setCart(cartData);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load your cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, getUserCart]);

  const addToCart = useCallback(async (productId: string, size: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await addItemToCart(productId, size, quantity);
      await refreshCart(); // Refresh cart after adding item
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [addItemToCart, refreshCart]);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await updateItemQuantity(cartItemId, quantity);
      await refreshCart(); // Refresh cart after updating
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Failed to update cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [updateItemQuantity, refreshCart]);

  const removeItem = useCallback(async (cartItemId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await removeCartItem(cartItemId);
      await refreshCart(); // Refresh cart after removing
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item from cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [removeCartItem, refreshCart]);

  const removeSellerItems = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await removeSellerCartItems(sellerId);
      await refreshCart(); // Refresh cart after removing
    } catch (err) {
      console.error('Error removing seller items:', err);
      setError('Failed to remove items from cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [removeSellerCartItems, refreshCart]);

  // Load cart on initial render and when user changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        removeSellerItems,
        clearCartError
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
