import React, { useEffect, useState } from 'react';
import { 
  View, 
  FlatList,
  StyleSheet, 
  SafeAreaView,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { router } from 'expo-router';
import ReportService, { SystemOverview, RecentOrder } from '../../../../services/admin/report';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<SystemOverview | null>(null);

  const fetchSystemOverview = async () => {
    try {
      setError(null);
      const data = await ReportService.getAdminSystemOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemOverview();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSystemOverview();
  };

  const navigateToReports = (reportType: string) => {
    router.push(`/(authenticated)/admin/reports/${reportType}` as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchSystemOverview}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Overview of your store</Text>
          </View>
          <TouchableOpacity 
            style={styles.reportsButton}
            onPress={() => navigateToReports('overview')}
          >
            <Text style={styles.reportsButtonText}>View Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Ionicons name="cash-outline" size={24} color="#4F46E5" />
            <Text style={styles.metricValue}>
              ${overview?.totalRevenue.toFixed(2)}
            </Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="cart-outline" size={24} color="#4F46E5" />
            <Text style={styles.metricValue}>{overview?.orderCount}</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="people-outline" size={24} color="#4F46E5" />
            <Text style={styles.metricValue}>{overview?.userCount}</Text>
            <Text style={styles.metricLabel}>Total Users</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="pricetags-outline" size={24} color="#4F46E5" />
            <Text style={styles.metricValue}>{overview?.productCount}</Text>
            <Text style={styles.metricLabel}>Products</Text>
          </View>
        </View>

        {/* Attention Needed Section */}
        <View style={styles.attentionSection}>
          <Text style={styles.sectionTitle}>Attention Needed</Text>
          <View style={styles.attentionItems}>
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => router.push('/(authenticated)/admin/sellers')}
            >
              <View style={styles.attentionIconBadge}>
                <Ionicons name="storefront-outline" size={22} color="#FFFFFF" />
                {overview?.pendingSellerCount! > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{overview?.pendingSellerCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.attentionValue}>{overview?.pendingSellerCount}</Text>
              <Text style={styles.attentionLabel}>Pending Sellers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => router.push('/admin/orders')}
            >
              <View style={styles.attentionIconBadge}>
                <Ionicons name="clipboard-outline" size={22} color="#FFFFFF" />
                {overview?.pendingOrderCount! > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{overview?.pendingOrderCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.attentionValue}>{overview?.pendingOrderCount}</Text>
              <Text style={styles.attentionLabel}>Pending Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/admin/orders')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {overview?.recentOrders && overview.recentOrders.length > 0 ? (
            overview.recentOrders.map((order: RecentOrder) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => router.push(`/admin/orders/${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderID}>Order #{order.id.substring(0, 8)}</Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderInfoText}>
                    <Text style={styles.infoLabel}>Customer: </Text>
                    {order.user.name}
                  </Text>
                  <Text style={styles.orderInfoText}>
                    <Text style={styles.infoLabel}>Seller: </Text>
                    {order.seller.user?.name || "Unknown"}
                  </Text>
                  <Text style={styles.orderInfoText}>
                    <Text style={styles.infoLabel}>Date: </Text>
                    {format(new Date(order.orderDate), 'MMM d, yyyy')}
                  </Text>
                  <Text style={styles.orderPrice}>
                    ${order.totalPrice.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="receipt-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No recent orders</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToReports('sales')}
            >
              <Ionicons name="bar-chart-outline" size={22} color="#4F46E5" />
              <Text style={styles.actionText}>Sales Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToReports('inventory')}
            >
              <Ionicons name="cube-outline" size={22} color="#4F46E5" />
              <Text style={styles.actionText}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToReports('users')}
            >
              <Ionicons name="people-outline" size={22} color="#4F46E5" />
              <Text style={styles.actionText}>User Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToReports('orders')}
            >
              <Ionicons name="receipt-outline" size={22} color="#4F46E5" />
              <Text style={styles.actionText}>Order Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to determine status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return '#F59E0B';
    case 'SHIPPED': return '#3B82F6';
    case 'DELIVERED': return '#10B981';
    case 'CANCELLED': return '#EF4444';
    default: return '#9CA3AF';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  reportsButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Metrics section
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Attention needed section
  attentionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  attentionItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attentionCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  attentionIconBadge: {
    backgroundColor: '#4F46E5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  attentionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  attentionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Recent Orders section
  recentOrdersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderID: {
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    marginTop: 4,
  },
  orderInfoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  orderPrice: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
    marginTop: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 15,
    color: '#6B7280',
  },
  // Quick Actions
  quickActionsSection: {
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  // Error section
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
});

export default AdminDashboard;