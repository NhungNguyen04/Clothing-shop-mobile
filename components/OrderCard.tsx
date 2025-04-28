import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  
  return (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 mb-3 shadow-sm" 
      onPress={onPress}
    >
      <View className="flex-row justify-between mb-3">
        <Text className="text-lg font-outfit-bold">Order #{order.id.slice(-6)}</Text>
        <Text className="text-gray-500 font-outfit">{date}</Text>
      </View>
      
      <View className="mb-3">
        <Text className="text-base mb-1 truncate font-outfit">
          {order.productId} - Size {order.size}
        </Text>
        <Text className="text-gray-500 font-outfit">Quantity: {order.quantity}</Text>
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
