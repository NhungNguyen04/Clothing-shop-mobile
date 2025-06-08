import { useEffect, useState } from "react";
import { Text, View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Alert, Modal } from "react-native";
import { useAuthStore } from "../../../../store/AuthStore";
import OrderService, { Order, OrderStatus } from "../../../../services/order";
import { Ionicons } from '@expo/vector-icons';

export default function Orders() {
  const { seller } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!seller?.id) {
      setError("Seller information not available");
      setLoading(false);
      return;
    }

    try {
      const response = await OrderService.getSellerOrders(seller.id);
      if (response.success && response.data) {
        setOrders(response.data);
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

  useEffect(() => {
    fetchOrders();
  }, [seller]);

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FFC107';
      case 'PROCESSING': return '#2196F3';
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

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  // Get next status label based on current status
  const getNextStatusLabel = (currentStatus: OrderStatus): string => {
    switch (currentStatus) {
      case 'PENDING':
        return 'Process Order';
      case 'PROCESSING':
        return 'Mark as Shipped';
      case 'SHIPPED':
        return 'Mark as Delivered';
      default:
        return '';
    }
  };

  // Handle updating order status
  const handleUpdateStatus = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      const response = await OrderService.progressOrderStatus(orderId);
      
      if (response.success && response.data) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? response.data! : order
          )
        );
        Alert.alert('Success', 'Order status updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'An error occurred while updating the order status');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Show cancel order confirmation dialog
  const showCancelConfirmation = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelModalVisible(true);
  };

  // Handle cancelling an order
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      setProcessingOrderId(orderToCancel);
      const response = await OrderService.cancelOrder(orderToCancel);
      
      if (response.success && response.data) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderToCancel ? response.data! : order
          )
        );
        Alert.alert('Success', 'Order cancelled successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to cancel the order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert('Error', 'An error occurred while cancelling the order');
    } finally {
      setProcessingOrderId(null);
      setOrderToCancel(null);
      setCancelModalVisible(false);
    }
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
      <Text style={styles.header}>My Orders</Text>
      
      {orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.noOrdersText}>No orders yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              
              <View style={styles.orderInfo}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.orderInfo}>
                <Text style={styles.infoLabel}>Customer:</Text>
                <Text style={styles.infoValue}>{item.user?.name || 'Unknown'}</Text>
              </View>
              
              <View style={styles.orderInfo}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{item.phoneNumber}</Text>
              </View>
              
              <View style={styles.orderInfo}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>
                  {item.address}{item.postalCode ? `, ${item.postalCode}` : ''}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.orderInfo}>
                <Text style={styles.infoLabel}>Items:</Text>
                <Text style={styles.infoValue}>{item.orderItems.length} items</Text>
              </View>
              
              <View style={styles.orderInfo}>
                <Text style={styles.infoLabel}>Total:</Text>
                <Text style={styles.totalPrice}>${item.totalPrice.toFixed(2)}</Text>
              </View>
              
              <View style={styles.orderInfo}>
                <Text style={styles.infoLabel}>Payment:</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoValue}>
                    {item.paymentMethod}
                  </Text>
                </View>
              </View>
              
              {/* Action buttons for status update and cancellation */}
              <View style={styles.actionsContainer}>
                {/* Only show progress button if order is not delivered or cancelled */}
                {['PENDING', 'PROCESSING', 'SHIPPED'].includes(item.status) && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.progressButton]}
                    onPress={() => handleUpdateStatus(item.id)}
                    disabled={processingOrderId === item.id}
                  >
                    {processingOrderId === item.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="arrow-forward-circle" size={16} color="#ffffff" style={{marginRight: 5}} />
                        <Text style={styles.actionButtonText}>{getNextStatusLabel(item.status)}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {/* Only show cancel button if order is pending or processing */}
                {['PENDING', 'PROCESSING'].includes(item.status) && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => showCancelConfirmation(item.id)}
                    disabled={processingOrderId === item.id}
                  >
                    <Ionicons name="close-circle" size={16} color="#ffffff" style={{marginRight: 5}} />
                    <Text style={styles.actionButtonText}>Cancel Order</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.detailsButton} 
                onPress={() => toggleOrderDetails(item.id)}
              >
                <Text style={styles.detailsButtonText}>
                  {expandedOrder === item.id ? 'Hide Details' : 'View Details'}
                </Text>
                <Ionicons 
                  name={expandedOrder === item.id ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#0066cc" 
                  style={{marginLeft: 5}}
                />
              </TouchableOpacity>
              
              {expandedOrder === item.id && (
                <View style={styles.expandedDetails}>
                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {item.orderItems.map((orderItem) => (
                    <View key={orderItem.id} style={styles.orderItemCard}>
                      {orderItem.sizeStock?.product?.image && orderItem.sizeStock.product.image.length > 0 && (
                        <Image 
                          source={{uri: orderItem.sizeStock.product.image[0]}} 
                          style={styles.productImage} 
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.orderItemDetails}>
                        <Text style={styles.productName}>{orderItem.sizeStock?.product?.name || 'Unknown Product'}</Text>
                        <Text style={styles.productSize}>Size: {orderItem.sizeStock?.size || 'N/A'}</Text>
                        <View style={styles.orderItemFooter}>
                          <Text style={styles.quantity}>Qty: {orderItem.quantity}</Text>
                          <Text style={styles.price}>${orderItem.totalPrice.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
      
      {/* Cancel Order Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalText}>Are you sure you want to cancel this order? This action cannot be undone.</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]} 
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>No, Keep Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmModalButton]} 
                onPress={handleCancelOrder}
                disabled={processingOrderId !== null}
              >
                {processingOrderId ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>Yes, Cancel Order</Text>
                )}
              </TouchableOpacity>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginVertical: 10,
  },
  detailsButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  noOrdersText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
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
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderItemCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  orderItemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSize: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  orderItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 13,
    color: '#666',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  progressButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmModalButton: {
    backgroundColor: '#F44336',
  },
  cancelModalButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmModalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});