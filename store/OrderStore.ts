import { create } from 'zustand';
import { OrderService, CreateOrderInput, Order, ApiResponse, OrderStatus } from '../services/order';
import { useCartStore } from './CartStore';
import { useAuthStore } from './AuthStore';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Fetch all orders for current user
  fetchUserOrders: () => Promise<void>;
  
  // Get a specific order
  getOrderById: (orderId: string) => Promise<Order | null>;
  
  // Create orders from cart items (checkout)
  checkoutCart: (shippingAddress: string, phoneNumber: string) => Promise<boolean>;
  
  // Update order status
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  
  // Cancel an order
  cancelOrder: (orderId: string) => Promise<boolean>;
  
  clearOrderError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  clearOrderError: () => set({ error: null }),
  
  fetchUserOrders: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const authStore = useAuthStore.getState();
      
      if (!authStore.user) {
        set({ error: 'User not authenticated', isLoading: false });
        return;
      }

      const response = await OrderService.getUserOrders(authStore.user.id);
      if (response.success && response.data) {
        set({ orders: response.data, isLoading: false });
      } else {
        set({ 
          error: response.message || 'Failed to fetch orders', 
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false 
      });
    }
  },
  
  getOrderById: async (orderId: string): Promise<Order | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await OrderService.getOrderById(orderId);
      if (response.success && response.data) {
        const order = response.data;
        set({ currentOrder: order, isLoading: false });
        return order;
      } else {
        set({ 
          error: response.message || `Failed to fetch order ${orderId}`, 
          isLoading: false,
          currentOrder: null
        });
        return null;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch order ${orderId}`,
        isLoading: false,
        currentOrder: null
      });
      return null;
    }
  },
  
  checkoutCart: async (shippingAddress: string, phoneNumber: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      const authStore = useAuthStore.getState();
      const cartStore = useCartStore.getState();
      
      if (!authStore.user) {
        set({ error: 'User not authenticated', isLoading: false });
        return false;
      }
      
      if (!cartStore.cart || !cartStore.itemsBySeller || cartStore.itemsBySeller.length === 0) {
        set({ error: 'Cart is empty', isLoading: false });
        return false;
      }
      
      // We need to create separate orders for each seller
      const orderPromises = cartStore.itemsBySeller.map(async (sellerItems) => {
        // Create an order for each seller's items
        for (const item of sellerItems.items) {
          const product = item.sizeStock.product;
          const orderData: CreateOrderInput = {
            totalPrice: item.totalPrice,
            status: 'PENDING',
            customerName: authStore.user!.name || 'Unknown Customer',
            phoneNumber: phoneNumber,
            userId: authStore.user!.id,
            address: shippingAddress,
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
            sellerId: product.sellerId,
            size: item.sizeStock.size
          };
          
          await OrderService.createOrder(orderData);
        }
      });
      
      // Wait for all orders to be created
      await Promise.all(orderPromises);
      
      // Clear the cart after successful checkout
      // We need to remove all items from the cart for each seller
      for (const sellerItems of cartStore.itemsBySeller) {
        await cartStore.removeSellerItems(sellerItems.sellerId);
      }
      
      // Refresh the orders list
      await get().fetchUserOrders();
      
      set({ isLoading: false });
      return true;
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Checkout failed',
        isLoading: false 
      });
      return false;
    }
  },
  
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await OrderService.updateOrderStatus(orderId, status);
      if (response.success && response.data) {
        // Update the order in the local state
        const updatedOrders = get().orders.map(order => 
          order.id === orderId ? response.data! : order
        );
        
        set({ 
          orders: updatedOrders,
          currentOrder: get().currentOrder?.id === orderId ? response.data : get().currentOrder,
          isLoading: false 
        });
        
        return true;
      } else {
        set({ 
          error: response.message || `Failed to update order ${orderId}`, 
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to update order ${orderId}`,
        isLoading: false
      });
      return false;
    }
  },
  
  cancelOrder: async (orderId: string): Promise<boolean> => {
    return get().updateOrderStatus(orderId, 'CANCELLED');
  }
}));