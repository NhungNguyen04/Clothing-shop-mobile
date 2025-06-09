import { User } from './user';
import axiosInstance from './axiosInstance';
import { Seller, SizeStock } from './product';

/**
 * Order status options
 */
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

/**
 * Shipment status options
 */
export type ShipmentStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED';

/**
 * Payment status options
 */
export type PaymentStatus = 'PENDING' | 'SUCCESS';

/**
 * Order item structure
 */
export interface OrderItem {
  sizeStockId: string;
  quantity: number;
  price: number;
}

/**
 * Order creation input type
 */
export interface CreateOrderInput {
  userId: string;
  sellerId: string;
  phoneNumber: string;
  address: string;
  postalCode?: string;
  paymentMethod: 'COD' | 'VIETQR';
  orderItems: OrderItem[];
}

/**
 * Cart to order input type
 */
export interface CartToOrderInput {
  cartId: string;
  userId: string;
  phoneNumber: string;
  address: string;
  postalCode?: string;
  paymentMethod: 'COD' | 'VIETQR';
  selectedCartItemIds: string[];
}

/**
 * Order update input type - all fields are optional
 */
export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shipmentStatus?: ShipmentStatus;
  deliveryDate?: string;
  cancelReason?: string;
}

/**
 * OrderItem response structure
 */
export interface OrderItemResponse {
  id: string;
  orderId: string;
  sizeStockId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  sizeStock: SizeStock;
}

/**
 * Shipment structure
 */
export interface Shipment {
  id: string;
  status: ShipmentStatus;
  orderId: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order response structure
 */
export interface Order {
  id: string;
  userId: string;
  sellerId: string;
  phoneNumber: string;
  address: string;
  postalCode?: string;
  paymentMethod: 'COD' | 'VIETQR';
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemResponse[];
  shipment: Shipment;
  user?: User;
  seller?: Seller;
}

/**
 * API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error: any | null;
  data: T | null;
}

/**
 * Service for managing orders through API calls
 */
export const OrderService = {
  /**
   * Create a new order
   * @param orderData Order details to create
   * @returns API response with created order data
   */
  createOrder: async (orderData: CreateOrderInput): Promise<ApiResponse<Order>> => {
    try {
      const response = await axiosInstance.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Create order from cart items
   * @param orderData Cart and order details
   * @returns API response with created orders data
   */
  createFromCart: async (orderData: CartToOrderInput): Promise<ApiResponse<Order[]>> => {
    try {
      console.log(`POST /orders/from-cart ${JSON.stringify(orderData)}`);
      const response = await axiosInstance.post('/orders/from-cart', orderData);
      console.log(`Response from /orders/from-cart ${response.status}`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating order from cart:', error);
      
      // Check if the response contains data with an error message
      if (error.response?.data) {
        return error.response.data;
      }
      
      // If no structured response available, create a standard error response
      throw error;
    }
  },

  /**
   * Get order by ID
   * @param orderId The ID of the order to fetch
   * @returns API response with order data
   */
  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting order with ID ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Get all orders for a seller
   * @param sellerId The ID of the seller
   * @returns API response with seller's orders
   */
  getSellerOrders: async (sellerId: string): Promise<ApiResponse<Order[]>> => {
    try {
      const response = await axiosInstance.get(`/orders/seller/${sellerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting orders for seller ${sellerId}:`, error);
      throw error;
    }
  },

  /**
   * Get all orders for a user
   * @param userId The ID of the user
   * @returns API response with user's orders
   */
  getUserOrders: async (userId: string): Promise<ApiResponse<Order[]>> => {
    try {
      const response = await axiosInstance.get(`/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting orders for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing order
   * @param orderId The ID of the order to update
   * @param updateData Order details to update
   * @returns API response with updated order data
   */
  updateOrder: async (orderId: string, updateData: UpdateOrderInput): Promise<ApiResponse<Order>> => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Update order status
   * @param orderId The ID of the order to update
   * @param status New status for the order
   * @returns API response with updated order data
   */
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Update order status to the next status in the workflow
   * @param orderId The ID of the order to update
   * @returns API response with updated order data
   */
  progressOrderStatus: async (orderId: string): Promise<ApiResponse<Order>> => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/status`, {});
      return response.data;
    } catch (error) {
      console.error(`Error progressing status for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel an order
   * @param orderId The ID of the order to cancel
   * @param cancelReason Optional reason for cancellation
   * @returns API response with cancelled order data
   */
  cancelOrder: async (orderId: string, cancelReason?: string): Promise<ApiResponse<Order>> => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/cancel`, { cancelReason });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an order
   * @param orderId The ID of the order to delete
   * @returns API response with deleted order data
   */
  deleteOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    try {
      const response = await axiosInstance.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      throw error;
    }
  }
};

export default OrderService;