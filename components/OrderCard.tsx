import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Order } from '@/services/order';
import { Ionicons } from '@expo/vector-icons';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onCancel?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, onCancel }) => {
  // Helper function to get status color
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get first product image to display
  const getFirstProductImage = () => {
    if (order.orderItems && order.orderItems.length > 0) {
      const firstItem = order.orderItems[0];
      if (firstItem.sizeStock?.product?.image && firstItem.sizeStock.product.image.length > 0) {
        return firstItem.sizeStock.product.image[0];
      }
    }
    return null;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {getFirstProductImage() ? (
          <Image 
            source={{ uri: getFirstProductImage()! }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={24} color="#ccc" />
          </View>
        )}
        
        <View style={styles.details}>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
          <Text style={styles.items}>{order.orderItems.length} item(s)</Text>
          <Text style={styles.price}>${order.totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      {(order.status === 'PENDING' || order.status === 'PROCESSING') && onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close-circle-outline" size={16} color="#fff" />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#2e64e5" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
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
  content: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  items: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#2e64e5',
    marginRight: 8,
    fontWeight: '600',
  },
});

export default OrderCard;
