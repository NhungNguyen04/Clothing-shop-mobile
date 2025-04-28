import axiosInstance from './axiosInstance';
/**
 * Order status options
 */
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
/**
 * Order creation input type
 */
export interface CreateOrderInput {
  totalPrice: number;
  status: string;
  customerName: string;
  phoneNumber: string;
  userId: string;
  address: string;
  productId: string;
  quantity: number;
  price: number;
  sellerId: string;
  size: string;
}

/**
 * Order update input type - all fields are optional
 */
export interface UpdateOrderInput {
  totalPrice?: number;
  status?: string;
  customerName?: string;
  phoneNumber?: string;
  userId?: string;
  address?: string;
  productId?: string;
  quantity?: number;
  price?: number;
  sellerId?: string;
  size?: string;
}

/**
 * Order response data structure
 */
export interface Order {
  id: string;
  totalPrice: number;
  status: OrderStatus;
  customerName: string;
  phoneNumber: string;
  userId: string;
  address: string;
  productId: string;
  quantity: number;
  price: number;
  sellerId: string;
  size: string;
  createdAt: string;
  updatedAt: string;
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
   * Get all orders for the current user
   * @param userId The ID of the user
   * @returns API response with user's orders
   */
  getUserOrders: async (userId: string): Promise<ApiResponse<Order[]>> => {
    try {
      const response = await axiosInstance.get(`/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user orders:', error);
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
  }
};

export default OrderService;