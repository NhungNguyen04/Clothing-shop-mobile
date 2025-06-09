import { useEffect, useState } from "react";
import { Text, View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Alert, Modal, ScrollView } from "react-native";
import { useAuthStore } from "../../../../store/AuthStore";
import OrderService, { Order, OrderStatus } from "../../../../services/order";
import { Ionicons } from '@expo/vector-icons';
import { Product, fetchAllProducts } from "../../../../services/product";
import { useRouter } from "expo-router";

export default function Orders() {
  const router = useRouter();
  const { seller } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilterModalVisible, setStatusFilterModalVisible] = useState(false);

  // Order status options
  const statusOptions: OrderStatus[] = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  const fetchProducts = async () => {
    if (!seller?.id) return;

    try {
      const productsData = await fetchAllProducts();
      // Filter to only show products from this seller
      const sellerProducts = productsData.filter(product => product.sellerId === seller.id);
      setProducts(sellerProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchOrders = async () => {
    if (!seller?.id) {
      setError("Seller information not available");
      setLoading(false);
      return;
    }

    try {
      const response = await OrderService.getSellerOrders(seller.id);

      if (response.success && response.data) {
        setAllOrders(response.data); // Store all orders
        
        // Apply filters if any
        let filteredOrders = response.data;
        
        if (selectedProductId) {
          // Filter by product
          filteredOrders = filterOrdersByProductId(filteredOrders, selectedProductId);
        }
        
        if (selectedStatus) {
          // Filter by status
          filteredOrders = filteredOrders.filter(order => order.status === selectedStatus);
        }
        
        setOrders(filteredOrders);
      } else {
        setError(response.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("An error occurred while fetching orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to filter orders by product ID
  const filterOrdersByProductId = (orderList: Order[], productId: string): Order[] => {
    return orderList.filter(order => 
      order.orderItems.some(item => 
        item.sizeStock?.product?.id === productId
      )
    );
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [seller]);

  // Apply filters when selected product or status changes
  useEffect(() => {
    if (allOrders.length > 0) {
      let filteredOrders = [...allOrders];
      
      if (selectedProductId) {
        filteredOrders = filterOrdersByProductId(filteredOrders, selectedProductId);
      }
      
      if (selectedStatus) {
        filteredOrders = filteredOrders.filter(order => order.status === selectedStatus);
      }
      
      setOrders(filteredOrders);
    }
  }, [selectedProductId, selectedStatus, allOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchOrders();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedProductId(null);
    setSelectedStatus(null);
    setFilterModalVisible(false);
    setStatusFilterModalVisible(false);
    setOrders(allOrders);
  };

  // Clear product filter
  const clearFilter = () => {
    setSelectedProductId(null);
    setFilterModalVisible(false);
    
    // Re-apply status filter if present
    if (selectedStatus && allOrders.length > 0) {
      const filteredByStatus = allOrders.filter(order => order.status === selectedStatus);
      setOrders(filteredByStatus);
    } else {
      setOrders(allOrders);
    }
  };

  // Clear status filter
  const clearStatusFilter = () => {
    setSelectedStatus(null);
    setStatusFilterModalVisible(false);
    
    // Re-apply product filter if present
    if (selectedProductId && allOrders.length > 0) {
      const filteredByProduct = filterOrdersByProductId(allOrders, selectedProductId);
      setOrders(filteredByProduct);
    } else {
      setOrders(allOrders);
    }
  };

  // Select a product to filter by
  const selectProductFilter = (productId: string) => {
    setSelectedProductId(productId);
    setFilterModalVisible(false);
    
    // Apply product filter and maintain status filter if present
    if (allOrders.length > 0) {
      let filtered = filterOrdersByProductId(allOrders, productId);
      
      if (selectedStatus) {
        filtered = filtered.filter(order => order.status === selectedStatus);
      }
      
      setOrders(filtered);
    }
  };

  // Select a status to filter by
  const selectStatusFilter = (status: OrderStatus) => {
    setSelectedStatus(status);
    setStatusFilterModalVisible(false);
    
    // Apply status filter and maintain product filter if present
    if (allOrders.length > 0) {
      let filtered = allOrders.filter(order => order.status === status);
      
      if (selectedProductId) {
        filtered = filterOrdersByProductId(filtered, selectedProductId);
      }
      
      setOrders(filtered);
    }
  };

  // Count orders by status
  const getOrderCountByStatus = (status: OrderStatus) => {
    return allOrders.filter(order => order.status === status).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FFC107';
      case 'SHIPPED': return '#9C27B0';
      case 'DELIVERED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Navigate to order details page
  const goToOrderDetails = (orderId: string) => {
    router.push(`/seller/order/${orderId}`);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Text style={styles.header}>Orders</Text>
        <Text style={styles.orderCount}>
          {orders.length}/{allOrders.length} orders {selectedProductId || selectedStatus ? '(filtered)' : ''}
        </Text>
      </View>

      {/* Filter buttons row */}
      <View style={styles.filterButtonsRow}>
        <TouchableOpacity 
          style={[styles.filterButtonContainer, selectedProductId && styles.activeFilterButton]} 
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="cube-outline" size={16} color={selectedProductId ? "#0066cc" : "#333"} />
          <Text style={[styles.filterButtonText, selectedProductId && styles.activeFilterText]}>
            {selectedProductId ? "Product" : "Product Filter"}
          </Text>
          {selectedProductId && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButtonContainer, selectedStatus && styles.activeFilterButton]}
          onPress={() => setStatusFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={16} color={selectedStatus ? "#0066cc" : "#333"} />
          <Text style={[styles.filterButtonText, selectedStatus && styles.activeFilterText]}>
            {selectedStatus ? selectedStatus : "Status Filter"}
          </Text>
          {selectedStatus && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
        
        {(selectedProductId || selectedStatus) && (
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={clearAllFilters}
          >
            <Ionicons name="close-circle" size={16} color="#F44336" />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Product filter indicator */}
      {selectedProductId && (
        <View style={styles.filterActiveContainer}>
          <Text style={styles.filterActiveText}>
            Product: {products.find(p => p.id === selectedProductId)?.name || 'Selected Product'}
          </Text>
          <TouchableOpacity onPress={clearFilter}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Status filter indicator */}
      {selectedStatus && (
        <View style={styles.filterActiveContainer}>
          <View style={styles.statusFilterIndicator}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedStatus) }]} />
            <Text style={styles.filterActiveText}>
              Status: {selectedStatus}
            </Text>
          </View>
          <TouchableOpacity onPress={clearStatusFilter}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.noOrdersText}>
            {(selectedProductId || selectedStatus) ? 'No orders found with current filters' : 'No orders yet'}
          </Text>
          {(selectedProductId || selectedStatus) && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={clearAllFilters}>
              <Text style={styles.clearFilterButtonText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.orderCard}
              onPress={() => goToOrderDetails(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                  <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(item.status) }
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.orderSummary}>
                <View style={styles.summaryItem}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.summaryText}>{item.user?.name || 'Unknown'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="cube-outline" size={16} color="#666" />
                  <Text style={styles.summaryText}>{item.orderItems.length} items</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.summaryText}>${item.totalPrice.toFixed(2)}</Text>
                </View>
              </View>
              
              <View style={styles.viewDetailsContainer}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#0066cc" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      
      {/* Product Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Orders by Product</Text>
            
            <TouchableOpacity 
              style={[
                styles.productFilterItem, 
                !selectedProductId && styles.selectedProductFilter
              ]} 
              onPress={clearFilter}
            >
              <Text style={styles.productFilterText}>All Products</Text>
              {!selectedProductId && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
            
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              style={styles.productFilterList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.productFilterItem, 
                    selectedProductId === item.id && styles.selectedProductFilter
                  ]} 
                  onPress={() => selectProductFilter(item.id)}
                >
                  <View style={styles.productFilterRow}>
                    {item.image && item.image.length > 0 && (
                      <Image source={{ uri: item.image[0] }} style={styles.productFilterImage} />
                    )}
                    <Text 
                      style={styles.productFilterText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                  </View>
                  
                  {selectedProductId === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Status Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusFilterModalVisible}
        onRequestClose={() => setStatusFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Orders by Status</Text>
            
            {statusOptions.map(status => (
              <TouchableOpacity 
                key={status}
                style={[
                  styles.statusFilterItem, 
                  selectedStatus === status && styles.selectedStatusFilter
                ]} 
                onPress={() => selectStatusFilter(status)}
              >
                <View style={styles.statusFilterRow}>
                  <View style={[
                    styles.statusIndicator, 
                    { backgroundColor: getStatusColor(status) }
                  ]} />
                  <Text style={styles.statusFilterText}>
                    {status} ({getOrderCountByStatus(status)})
                  </Text>
                </View>
                
                {selectedStatus === status && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.clearStatusFilterButton} 
              onPress={clearStatusFilter}
            >
              <Text style={styles.clearFilterButtonText}>Clear Status Filter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setStatusFilterModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  orderCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
  },
  activeFilterButton: {
    backgroundColor: '#e6f0ff',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  filterButtonText: {
    color: '#333',
    marginLeft: 4,
    fontSize: 14,
  },
  activeFilterText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff0f0',
    borderRadius: 20,
    marginBottom: 8,
  },
  clearAllText: {
    color: '#F44336',
    marginLeft: 4,
    fontSize: 14,
  },
  statusCountsContainer: {
    paddingBottom: 12,
    marginBottom: 4,
  },
  statusCountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusCountText: {
    fontSize: 13,
    color: '#333',
  },
  statusFilterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  closeModalButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  filterIndicator: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    top: 6,
    right: 6,
  },
  filterActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  filterActiveText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  productFilterList: {
    maxHeight: 300,
    width: '100%',
  },
  productFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedProductFilter: {
    backgroundColor: '#f2fff2',
  },
  productFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productFilterImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 12,
  },
  productFilterText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  clearFilterButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignSelf: 'center',
  },
  clearFilterButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  statusFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedStatusFilter: {
    backgroundColor: '#f2fff2',
  },
  statusFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusFilterText: {
    fontSize: 16,
    color: '#333',
  },
  clearStatusFilterButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignSelf: 'center',
  },
  // Order card styles
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6, // Increased padding
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90, // Ensure minimum width
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginVertical: 10,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#0066cc',
    marginRight: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noOrdersText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  }
});