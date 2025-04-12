import { create } from 'zustand'
import { Cart, CartItem, SellerItems, getCartByUserId, addToCart, updateCartItemQuantity, removeCartItem, removeItemsBySeller } from '@/services/cart'
import { useProductStore } from './ProductStore'
import { useAuthStore } from './AuthStore'

interface CartState {
  cart: Cart | null
  itemsBySeller: SellerItems[] | null
  isLoading: boolean
  error: string | null
  getUserCart: () => Promise<Cart | null>
  refreshCart: () => Promise<void>
  addToCart: (productId: string, size: string, quantity: number) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  removeSellerItems: (sellerId: string) => Promise<void>
  clearCartError: () => void
  organizeItemsBySeller: (cart: Cart) => SellerItems[]
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  itemsBySeller: null,
  isLoading: false,
  error: null,
  
  clearCartError: () => set({ error: null }),
  
  organizeItemsBySeller: (cart: Cart): SellerItems[] => {
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return [];
    }
    
    const sellerMap = new Map<string, CartItem[]>();
    
    cart.cartItems.forEach(item => {
      const sellerId = item.sizeStock.product.sellerId;
      
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, []);
      }
      
      sellerMap.get(sellerId)?.push(item);
    });
    
    const itemsBySeller: SellerItems[] = [];
    
    sellerMap.forEach((items, sellerId) => {
      const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Fix the seller name access - use fallbacks to ensure we always have a name
      const product = items[0].sizeStock.product;
      let sellerName = 'Unknown Seller';
      
      // Try different ways to get the seller name
      if (product.sellerName) {
        sellerName = product.sellerName;
      } else if (product.seller && product.seller.managerName) {
        sellerName = product.seller.managerName;
      }
      
      itemsBySeller.push({
        sellerId,
        sellerName,
        items,
        totalValue
      });
    });
    
    return itemsBySeller;
  },
  
  getUserCart: async (): Promise<Cart | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const authStore = useAuthStore.getState();
      
      if (!authStore.user) {
        set({ error: 'User not authenticated', isLoading: false });
        return null;
      }
      
      const cart = await getCartByUserId();
      const itemsBySeller = get().organizeItemsBySeller(cart);
      
      set({ cart, itemsBySeller, isLoading: false });
      return cart;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoading: false 
      });
      return null;
    }
  },
  
  refreshCart: async () => {
    await get().getUserCart();
  },
  
  addToCart: async (productId: string, size: string, quantity: number) => {
    const originalCart = get().cart;
    const originalItemsBySeller = get().itemsBySeller;

    const authStore = useAuthStore.getState();
    if (!authStore.user) {
      set({ error: 'User not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const productStore = useProductStore.getState();
      const product = productStore.product;
      
      if (!product) {
        set({ error: 'Product information not available', isLoading: false });
        return;
      }
      
      const sizeStock = productStore.getSizeStockByProductIdAndSize(productId, size);
      
      if (!sizeStock) {
        set({ error: 'Size not available for this product', isLoading: false });
        return;
      }
      
      if (sizeStock.quantity < quantity) {
        set({ error: 'Quantity exceeds available stock', isLoading: false });
        return;
      }

      const existingItem = get().cart?.cartItems.find(
        (item) => item.sizeStock.productId === productId && item.sizeStock.size === size
      );
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        await get().updateQuantity(existingItem.id, newQuantity);
        return;
      }
      
      const tempCartId = `temp-cart-${Date.now()}`;
      const currentCart = get().cart ? {...get().cart} : {
        id: tempCartId,
        userId: authStore.user.id,
        totalCartValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cartItems: [],
        itemsBySeller: []
      } as Cart;
      
      const tempId = `temp-${Date.now()}`;
      const itemPrice = product.price * quantity;
      
      const cartId = currentCart.id || tempCartId;
      
      const newItem: CartItem = {
        id: tempId,
        userId: authStore.user.id,
        cartId: cartId,
        sizeStockId: sizeStock.id,
        quantity: quantity,
        totalPrice: itemPrice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sizeStock: {
          ...sizeStock,
          productId: productId,
          size: size,
          product: {
            ...product,
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            sellerId: product.sellerId,
            // Make sure to set the sellerName correctly here
            sellerName: product.seller?.managerName || 'Unknown Seller'
          }
        }
      };
      
      const newTotalCartValue = (currentCart.totalCartValue || 0) + itemPrice;
      
      const updatedCartItems = [...(currentCart.cartItems || []), newItem];
      
      const updatedCart: Cart = {
        id: currentCart.id || tempCartId,
        userId: currentCart.userId || authStore.user.id,
        totalCartValue: newTotalCartValue,
        createdAt: currentCart.createdAt || new Date().toISOString(),
        updatedAt: currentCart.updatedAt || new Date().toISOString(),
        cartItems: updatedCartItems,
        itemsBySeller: currentCart.itemsBySeller || []
      };
      
      const updatedItemsBySeller = get().organizeItemsBySeller(updatedCart);
      
      set({ 
        cart: updatedCart,
        itemsBySeller: updatedItemsBySeller,
        isLoading: true
      });
      
      await addToCart(productId, size, quantity);
      
      await get().refreshCart();
      
    } catch (error) {
      set({ 
        cart: originalCart,
        itemsBySeller: originalItemsBySeller,
        error: error instanceof Error ? error.message : 'Failed to add item to cart',
        isLoading: false
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateQuantity: async (cartItemId: string, quantity: number) => {
    const originalCart = get().cart;
    const originalItemsBySeller = get().itemsBySeller;
    
    try {
      set({ isLoading: true, error: null });

      if (quantity <= 0) {
        set({ error: 'Quantity must be greater than zero', isLoading: false });
        return;
      }
      
      const item = get().cart?.cartItems.find(item => item.id === cartItemId);
      
      if (!item) {
        set({ error: 'Cart item not found', isLoading: false });
        return;
      }
      
      if (item.sizeStock.quantity < quantity) {
        set({ error: 'Quantity exceeds available stock', isLoading: false });
        return;
      }
      
      const oldTotalPrice = item.totalPrice;
      const newTotalPrice = item.sizeStock.product.price * quantity;
      const priceDifference = newTotalPrice - oldTotalPrice;
      
      const currentCart = {...get().cart} as Cart;
      if (!currentCart) {
        set({ error: 'Cart not found', isLoading: false });
        return;
      }
      
      const updatedItems = currentCart.cartItems.map(cartItem => 
        cartItem.id === cartItemId 
          ? { 
              ...cartItem, 
              quantity, 
              totalPrice: newTotalPrice
            } 
          : cartItem
      );
      
      const updatedCart: Cart = {
        ...currentCart,
        cartItems: updatedItems,
        totalCartValue: (currentCart.totalCartValue || 0) + priceDifference
      };
      
      const updatedItemsBySeller = get().organizeItemsBySeller(updatedCart);
      
      set({ 
        cart: updatedCart,
        itemsBySeller: updatedItemsBySeller,
        isLoading: true
      });
      
      await updateCartItemQuantity(cartItemId, quantity);
      
      await get().refreshCart();
      
    } catch (error) {
      set({ 
        cart: originalCart,
        itemsBySeller: originalItemsBySeller,
        error: error instanceof Error ? error.message : 'Failed to update quantity',
        isLoading: false
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  removeItem: async (cartItemId: string) => {
    const originalCart = get().cart;
    const originalItemsBySeller = get().itemsBySeller;
    
    try {
      set({ isLoading: true, error: null });
      
      const itemToRemove = get().cart?.cartItems.find(item => item.id === cartItemId);
      if (!itemToRemove) {
        set({ error: 'Cart item not found', isLoading: false });
        return;
      }
      
      const currentCart = {...get().cart} as Cart;
      if (!currentCart) {
        set({ error: 'Cart not found', isLoading: false });
        return;
      }
      
      const updatedItems = currentCart.cartItems.filter(item => item.id !== cartItemId);
      
      const updatedCart: Cart = {
        ...currentCart,
        cartItems: updatedItems,
        totalCartValue: (currentCart.totalCartValue || 0) - itemToRemove.totalPrice
      };
      
      const updatedItemsBySeller = get().organizeItemsBySeller(updatedCart);
      
      set({ 
        cart: updatedCart,
        itemsBySeller: updatedItemsBySeller,
        isLoading: true
      });
      
      await removeCartItem(cartItemId);
      
      await get().refreshCart();
      
    } catch (error) {
      set({ 
        cart: originalCart,
        itemsBySeller: originalItemsBySeller,
        error: error instanceof Error ? error.message : 'Failed to remove item',
        isLoading: false
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  removeSellerItems: async (sellerId: string) => {
    const originalCart = get().cart;
    const originalItemsBySeller = get().itemsBySeller;
    
    try {
      set({ isLoading: true, error: null });
      
      const currentCart = {...get().cart} as Cart;
      if (!currentCart) {
        set({ error: 'Cart not found', isLoading: false });
        return;
      }
      
      const sellerItems = currentCart.cartItems.filter(
        item => item.sizeStock.product.sellerId === sellerId
      );
      
      const sellerItemsTotalPrice = sellerItems.reduce(
        (total, item) => total + item.totalPrice, 0
      );
      
      const updatedItems = currentCart.cartItems.filter(
        item => item.sizeStock.product.sellerId !== sellerId
      );
      
      const updatedCart: Cart = {
        ...currentCart,
        cartItems: updatedItems,
        totalCartValue: (currentCart.totalCartValue || 0) - sellerItemsTotalPrice
      };
      
      const updatedItemsBySeller = get().organizeItemsBySeller(updatedCart);
      
      set({ 
        cart: updatedCart,
        itemsBySeller: updatedItemsBySeller,
        isLoading: true
      });
      
      await removeItemsBySeller(sellerId);
      
      await get().refreshCart();
      
    } catch (error) {
      set({ 
        cart: originalCart,
        itemsBySeller: originalItemsBySeller,
        error: error instanceof Error ? error.message : 'Failed to remove seller items',
        isLoading: false
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));