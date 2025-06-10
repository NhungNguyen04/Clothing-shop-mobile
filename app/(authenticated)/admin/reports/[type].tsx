import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ReportService, {
  SalesReport,
  InventoryReport,
  UserReport,
  OrderReport,
  SystemOverview
} from '../../../../services/admin/report';

type ReportData = SalesReport | InventoryReport | UserReport | OrderReport | SystemOverview;

const ReportDetailScreen = () => {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      switch(type) {
        case 'sales':
          data = await ReportService.getAdminSalesReport({});
          break;
        case 'inventory':
          data = await ReportService.getAdminInventoryReport({});
          break;
        case 'users':
          data = await ReportService.getAdminUserReport();
          break;
        case 'orders':
          data = await ReportService.getAdminOrderReport({});
          break;
        case 'overview':
          data = await ReportService.getAdminSystemOverview();
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setReportData(data);
    } catch (err) {
      console.error(`Error fetching ${type} report:`, err);
      setError(`Failed to load ${type} report. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [type]);

  const getReportTitle = () => {
    switch(type) {
      case 'sales': return 'Sales Report';
      case 'inventory': return 'Inventory Report';
      case 'users': return 'User Report';
      case 'orders': return 'Order Report';
      case 'overview': return 'System Overview';
      default: return 'Report';
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;
    
    switch(type) {
      case 'sales':
        return renderSalesReport(reportData as SalesReport);
      case 'inventory':
        return renderInventoryReport(reportData as InventoryReport);
      case 'users':
        return renderUserReport(reportData as UserReport);
      case 'orders':
        return renderOrderReport(reportData as OrderReport);
      case 'overview':
        return renderSystemOverview(reportData as SystemOverview);
      default:
        return <Text style={styles.emptyText}>No report data available</Text>;
    }
  };

  const renderSalesReport = (data: SalesReport) => (
    <View>
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>${data.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>Total Revenue</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.orderCount}</Text>
          <Text style={styles.metricLabel}>Total Orders</Text>
        </View>
      </View>
      
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>${data.averageOrderValue.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>Avg Order Value</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales by Category</Text>
        {Object.entries(data.salesByCategory).map(([category, value]) => (
          <View key={category} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{category}</Text>
            <Text style={styles.listItemValue}>${value.toFixed(2)}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales by Seller</Text>
        {Object.entries(data.salesBySeller).map(([seller, value]) => (
          <View key={seller} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{seller}</Text>
            <Text style={styles.listItemValue}>${value.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderInventoryReport = (data: InventoryReport) => (
    <View>
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.totalProducts}</Text>
          <Text style={styles.metricLabel}>Total Products</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.outOfStockCount}</Text>
          <Text style={styles.metricLabel}>Out of Stock</Text>
        </View>
      </View>
      
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.lowStockCount}</Text>
          <Text style={styles.metricLabel}>Low Stock</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Out of Stock Products</Text>
        {data.outOfStock.map(product => (
          <View key={product.id} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{product.name}</Text>
            <Text style={styles.listItemSubLabel}>Seller: {product.seller}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory by Category</Text>
        {Object.entries(data.inventoryByCategory).map(([category, value]) => (
          <View key={category} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{category}</Text>
            <Text style={styles.listItemValue}>{value} items</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUserReport = (data: UserReport) => (
    <View>
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.totalUsers}</Text>
          <Text style={styles.metricLabel}>Total Users</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.totalSellers}</Text>
          <Text style={styles.metricLabel}>Total Sellers</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users by Role</Text>
        {Object.entries(data.usersByRole).map(([role, count]) => (
          <View key={role} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{role}</Text>
            <Text style={styles.listItemValue}>{count}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sellers by Status</Text>
        {Object.entries(data.sellersByStatus).map(([status, count]) => (
          <View key={status} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{status}</Text>
            <Text style={styles.listItemValue}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderOrderReport = (data: OrderReport) => (
    <View>
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.totalOrders}</Text>
          <Text style={styles.metricLabel}>Total Orders</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>${data.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>Total Revenue</Text>
        </View>
      </View>
      
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>${data.averageOrderValue.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>Avg Order Value</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders by Status</Text>
        {Object.entries(data.ordersByStatus).map(([status, count]) => (
          <View key={status} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{status}</Text>
            <Text style={styles.listItemValue}>{count}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue by Status</Text>
        {Object.entries(data.revenueByStatus).map(([status, amount]) => (
          <View key={status} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{status}</Text>
            <Text style={styles.listItemValue}>${amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSystemOverview = (data: SystemOverview) => (
    <View>
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.userCount}</Text>
          <Text style={styles.metricLabel}>Users</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.productCount}</Text>
          <Text style={styles.metricLabel}>Products</Text>
        </View>
      </View>
      
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.orderCount}</Text>
          <Text style={styles.metricLabel}>Orders</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>${data.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>Revenue</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action Items</Text>
        <View style={styles.listItem}>
          <Text style={styles.listItemLabel}>Pending Sellers</Text>
          <Text style={styles.listItemValue}>{data.pendingSellerCount}</Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.listItemLabel}>Pending Orders</Text>
          <Text style={styles.listItemValue}>{data.pendingOrderCount}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {data.recentOrders.map(order => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderItem}
            onPress={() => router.push(`/admin/orders/${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderItemTitle}>
                Order #{order.id.substring(0, 8)}
              </Text>
              <Text style={[
                styles.orderStatus,
                { color: getStatusColor(order.status) }
              ]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.orderItemSubtitle}>
              ${order.totalPrice.toFixed(2)} • {new Date(order.orderDate).toLocaleDateString()}
            </Text>
            <Text style={styles.orderItemSubtitle}>
              Customer: {order.user.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'SHIPPED': return '#3B82F6';
      case 'DELIVERED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: getReportTitle() }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading report data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: getReportTitle() }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchReportData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: getReportTitle() }} />
      <ScrollView style={styles.scrollContainer}>
        {renderReportContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    padding: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  listItemSubLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  orderItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orderItemSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  orderStatus: {
    fontWeight: '600',
    fontSize: 14,
  }
});

export default ReportDetailScreen;
