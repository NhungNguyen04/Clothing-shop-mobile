import axiosInstance from '../axiosInstance';

// Sales Report Interfaces
export interface SalesReport {
  totalRevenue: number;
  salesByCategory: Record<string, number>;
  salesBySeller: Record<string, number>;
  salesByDate: Record<string, number>;
  orderCount: number;
  averageOrderValue: number;
}

// Inventory Report Interfaces
export interface InventoryProduct {
  id: string;
  name: string;
  seller: string;
  stock?: number;
}

export interface InventoryReport {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  outOfStock: InventoryProduct[];
  lowStock: InventoryProduct[];
  inventoryByCategory: Record<string, number>;
  inventoryBySeller: Record<string, number>;
}

// User Report Interfaces
export interface UserReport {
  totalUsers: number;
  totalSellers: number;
  usersByRole: {
    ADMIN: number;
    SELLER: number;
    CUSTOMER: number;
  };
  sellersByStatus: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
  };
  userTrendsByMonth: Record<string, number>;
}

// Order Report Interfaces
export interface OrderReport {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: {
    PENDING: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
  };
  revenueByStatus: {
    PENDING: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
  };
  orderTrendsByDay: Record<string, number>;
  averageOrderValue: number;
}

// System Overview Interface
export interface RecentOrder {
  id: string;
  totalPrice: number;
  status: string;
  orderDate: string;
  user: { name: string };
  seller: { user: { name: string } };
}

export interface SystemOverview {
  userCount: number;
  productCount: number;
  orderCount: number;
  sellerCount: number;
  totalRevenue: number;
  pendingSellerCount: number;
  pendingOrderCount: number;
  recentOrders: RecentOrder[];
}

// Filter Parameters Interfaces
export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
  sellerId?: string;
  category?: string;
}

export interface InventoryReportParams {
  sellerId?: string;
  category?: string;
}

export interface OrderReportParams {
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Report API Functions
export const getAdminSalesReport = async (params: SalesReportParams): Promise<SalesReport> => {
  const { startDate, endDate, sellerId, category } = params;
  const response = await axiosInstance.get('/report/sales', {
    params: { startDate, endDate, sellerId, category }
  });
  return response.data;
};

export const getAdminInventoryReport = async (params: InventoryReportParams): Promise<InventoryReport> => {
  const { sellerId, category } = params;
  const response = await axiosInstance.get('/report/inventory', {
    params: { sellerId, category }
  });
  return response.data;
};

export const getAdminUserReport = async (): Promise<UserReport> => {
  const response = await axiosInstance.get('/report/users');
  return response.data;
};

export const getAdminOrderReport = async (params: OrderReportParams): Promise<OrderReport> => {
  const { startDate, endDate, status } = params;
  const response = await axiosInstance.get('/report/orders', {
    params: { startDate, endDate, status }
  });
  return response.data;
};

export const getAdminSystemOverview = async (): Promise<SystemOverview> => {
  const response = await axiosInstance.get('/report/overview');
  return response.data;
};

// Export all report functions
const ReportService = {
  getAdminSalesReport,
  getAdminInventoryReport,
  getAdminUserReport, 
  getAdminOrderReport,
  getAdminSystemOverview
};

export default ReportService;
