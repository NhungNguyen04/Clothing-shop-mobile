import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Phone, Calendar, Package, Clock, CreditCard } from 'react-native-feather';
import { Ionicons } from '@expo/vector-icons';
import OrderService, { Order, OrderStatus } from '@/services/order';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    if (!id) return;
    
    try {
      setError(null);
      const response = await OrderService.getOrderById(id);
      
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Failed to load order');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('An error occurred while fetching order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const handleUpdateStatus = async () => {
    if (!order) return;
    
    try {
      setProcessingAction(true);
      const response = await OrderService.progressOrderStatus(order.id);
      
      if (response.success && response.data) {
        setOrder(response.data);
        Alert.alert('Success', 'Order status updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'An error occurred while updating the order status');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      setProcessingAction(true);
      const response = await OrderService.cancelOrder(order.id);
      
      if (response.success && response.data) {
        setOrder(response.data);
        Alert.alert('Success', 'Order cancelled successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to cancel the order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert('Error', 'An error occurred while cancelling the order');
    } finally {
      setProcessingAction(false);
      setCancelModalVisible(false);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Order not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <ChevronLeft width={24} height={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.slice(-6)}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Order Status */}
        <View style={styles.section}>
          <View style={[styles.statusContainer, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Calendar width={18} height={18} color="#666" />
            <Text style={styles.infoText}>Placed on {formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Package width={18} height={18} color="#666" />
            <Text style={styles.infoText}>
              {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'} • 
              Total: ${order.totalPrice.toFixed(2)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <CreditCard width={18} height={18} color="#666" />
            <Text style={styles.infoText}>
              Payment: {order.paymentMethod} • {order.paymentStatus}
            </Text>
          </View>
        </View>
        
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          
          <View style={styles.customerCard}>
            {order.user?.image ? (
              <Image source={{ uri: order.user.image }} style={styles.customerImage} />
            ) : (
              <View style={[styles.customerImage, styles.customerImagePlaceholder]}>
                <Text style={styles.customerInitial}>
                  {(order.user?.name?.charAt(0) || 'U').toUpperCase()}
                </Text>
              </View>
            )}
            
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.user?.name || 'Unknown'}</Text>
              
              <View style={styles.infoRow}>
                <Phone width={14} height={14} color="#666" />
                <Text style={styles.customerDetail}>{order.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MapPin width={14} height={14} color="#666" />
                <Text style={styles.customerDetail}>
                  {order.address}
                  {order.postalCode ? ` (${order.postalCode})` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          
          {order.orderItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              {item.sizeStock?.product?.image && item.sizeStock.product.image.length > 0 ? (
                <Image 
                  source={{uri: item.sizeStock.product.image[0]}} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={24} color="#ccc" />
                </View>
              )}
              
              <View style={styles.orderItemDetails}>
                <Text style={styles.productName}>
                  {item.sizeStock?.product?.name || 'Unknown Product'}
                </Text>
                <Text style={styles.productSize}>Size: {item.sizeStock?.size || 'N/A'}</Text>
                <View style={styles.orderItemFooter}>
                  <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
                  <Text style={styles.priceText}>${item.totalPrice.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${order.totalPrice.toFixed(2)}</Text>
            </View>
            {/* You can add shipping fee, tax, etc. here if available */}
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>${order.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        {/* Shipping Information */}
        {order.shipment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Information</Text>
            
            <View style={styles.infoRow}>
              <Clock width={18} height={18} color="#666" />
              <Text style={styles.infoText}>
                Status: {order.shipment.status}
              </Text>
            </View>
            
            {order.shipment.deliveryDate && (
              <View style={styles.infoRow}>
                <Calendar width={18} height={18} color="#666" />
                <Text style={styles.infoText}>
                  Delivered on: {formatDate(order.shipment.deliveryDate)}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Only show progress button if order is not delivered or cancelled */}
          {['PENDING', 'PROCESSING', 'SHIPPED'].includes(order.status) && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleUpdateStatus}
              disabled={processingAction}
            >
              {processingAction ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {getNextStatusLabel(order.status)}
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          {/* Only show cancel button if order is pending or processing */}
          {['PENDING', 'PROCESSING'].includes(order.status) && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setCancelModalVisible(true)}
              disabled={processingAction}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Cancel Order Confirmation Modal */}
      {cancelModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this order? This action cannot be undone.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>No, Keep Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleCancelOrder}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Yes, Cancel Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  backButtonText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#333',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  customerImagePlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: 22,
    color: '#666',
    fontWeight: 'bold',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerDetail: {
    marginLeft: 6,
    color: '#333',
    fontSize: 13,
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
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
  quantityText: {
    fontSize: 13,
    color: '#666',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    fontWeight: '500',
  },
  grandTotalLabel: {
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionSection: {
    padding: 16,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F44336',
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#333',
  },
  modalConfirmText: {
    color: 'white',
  },
});
