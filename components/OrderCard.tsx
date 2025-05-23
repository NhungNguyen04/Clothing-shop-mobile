import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Order, OrderStatus } from '@/services/order';

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500'; // orange
    case 'PROCESSING':
      return 'bg-blue-500'; // blue
    case 'SHIPPED':
      return 'bg-purple-500'; // purple
    case 'DELIVERED':
      return 'bg-green-500'; // green
    case 'CANCELLED':
      return 'bg-red-500'; // red
    default:
      return 'bg-gray-500'; // grey
  }
};

export default function OrderCard({ 
  order, 
  onPress, 
  onCancel 
}: { 
  order: Order, 
  onPress: () => void,
  onCancel?: () => void 
}) {
  const date = new Date(order.createdAt).toLocaleDateString();
  
  // Get the first item safely, or provide a fallback for display
  const firstItem = order.orderItems && order.orderItems.length > 0 
    ? order.orderItems[0] 
    : null;
  
  return (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 mb-3 shadow-sm" 
      onPress={onPress}
    >
      <View className="flex-row justify-between mb-3">
        <Text className="text-lg font-outfit-bold">Order #{order.id.slice(-6)}</Text>
        <Text className="text-gray-500 font-outfit">{date}</Text>
      </View>
      
      <View className="mb-3 flex-row items-center">
        {firstItem?.sizeStock?.product?.image && firstItem.sizeStock.product.image.length > 0 ? (
          <View className="mr-3">
            <Image
              source={{ uri: firstItem.sizeStock.product.image[0] }}
              className="w-14 h-14 rounded-md"
              style={{ width: 56, height: 56 }}
            />
          </View>
        ) : (
          <View className="mr-3 w-14 h-14 rounded-md bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-xs">No Image</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base mb-1 truncate font-outfit">
            {order.seller?.managerName || 'Seller Name Unavailable'}
          </Text>
          {firstItem?.sizeStock?.product ? (
            <Text className="text-gray-500 font-outfit">{firstItem.sizeStock.product.name}</Text>
          ) : (
            <Text className="text-gray-500 font-outfit italic">Order details unavailable</Text>
          )}
          {order.orderItems && order.orderItems.length > 1 && (
            <Text className="text-gray-500 font-outfit mt-1">
              +{order.orderItems.length - 1} more {order.orderItems.length - 1 === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>
      </View>
      
      <View className="flex-row justify-between items-center mb-3">
        <View className={`px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
          <Text className="text-white text-xs font-outfit-bold">{order.status}</Text>
        </View>
        <Text className="text-lg font-outfit-bold">${order.totalPrice.toFixed(2)}</Text>
      </View>
      
      {order.status === 'PENDING' && onCancel && (
        <TouchableOpacity 
          className="bg-red-500 py-2 px-3 items-center self-end w-fit" 
          onPress={onCancel}
        >
          <Text className="text-white font-outfit-medium">Cancel Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
