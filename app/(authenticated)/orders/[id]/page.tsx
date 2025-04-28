import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { useOrderStore } from '@/store/OrderStore';
import { ChevronLeft } from 'react-native-feather';

const OrderDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOrderById, cancelOrder, isLoading, error, currentOrder } = useOrderStore();

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    await getOrderById(id);
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            const success = await cancelOrder(id);
            if (success) {
              Alert.alert("Success", "Order cancelled successfully");
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'PROCESSING': return 'bg-blue-500';
      case 'SHIPPED': return 'bg-purple-500';
      case 'DELIVERED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#2e64e5" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="font-outfit text-lg text-red-600  mb-4 text-center">{error}</Text>
        <TouchableOpacity className="bg-blue-600 px-5 py-2 rounded-lg" onPress={loadOrder}>
          <Text className="text-white font-outfit-medium text-lg">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentOrder) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="font-outfit text-lg text-red-600 mb-4 text-center">Order not found</Text>
        <TouchableOpacity
          className="bg-pink-500 px-5 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-outfit-medium text-lg">Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 pt-2">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft stroke="#ec4899" width={30} height={30} />
        </TouchableOpacity>
        <Text className='font-outfit font-medium text-lg'>Order {currentOrder.id.slice(-6)}</Text>
      </View>

      {/* Status Badge */}
      <View className="items-center">
        <View className={`px-4 py-2 rounded-full mb-2 ${getStatusColor(currentOrder.status)}`}>
          <Text className="text-white font-outfit font-medium">{currentOrder.status}</Text>
        </View>
        <Text className="text-gray-500 text-sm font-outfit">
          {new Date(currentOrder.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Order Information */}
      <View className="bg-white rounded-lg p-4 mb-4 shadow">
        <Text className="text-lg font-outfit-bold mb-3 text-gray-800">Order Information</Text>
        <View className="flex-row justify-between py-2 border-b border-gray-200">
          <Text className="text-gray-500 font-outfit flex-1">Order ID:</Text>
          <Text className="text-gray-800 font-outfit font-medium flex-2 text-right">{currentOrder.id}</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b border-gray-200">
          <Text className="text-gray-500 font-outfit flex-1">Date:</Text>
          <Text className="text-gray-800 font-outfit-medium flex-2 text-right">
            {new Date(currentOrder.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-gray-500 font-outfit flex-1">Total:</Text>
          <Text className="text-gray-800 font-outfit-medium flex-2 text-right">
            ${currentOrder.totalPrice.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Product Information */}
      <View className="bg-white rounded-lg p-4 mb-4 shadow">
        <Text className="text-lg font-outfit-bold mb-3 text-gray-800">Product Information</Text>
        <View className="py-2">
          <Text className="text-gray-800 font-outfit-medium mb-1">Product ID: {currentOrder.productId}</Text>
          <Text className="text-gray-500 font-outfit mb-1">Size: {currentOrder.size}</Text>
          <Text className="text-gray-500 font-outfit mb-1">Quantity: {currentOrder.quantity}</Text>
          <Text className="text-gray-500 font-outfit">Price: ${currentOrder.price.toFixed(2)}</Text>
        </View>
      </View>

      {/* Shipping Information */}
      <View className="bg-white rounded-lg p-4 mb-4 shadow">
        <Text className="text-lg font-outfit-bold mb-3 text-gray-800">Shipping Information</Text>
        
        <View className="flex-row justify-between py-2 border-b border-gray-200">
          <Text className="text-gray-500 font-outfit w-1/4">Name:</Text>
          <Text className="text-gray-800 font-outfit-medium w-3/4 text-right">{currentOrder.customerName}</Text>
        </View>
        
        <View className="flex-row justify-between py-2 border-b border-gray-200">
          <Text className="text-gray-500 font-outfit w-1/4">Phone:</Text>
          <Text className="text-gray-800 font-outfit-medium w-3/4 text-right">{currentOrder.phoneNumber}</Text>
        </View>
        
        {/* Modified address section to handle long text */}
        <View className="py-2">
          <Text className="text-gray-500 font-outfit mb-1">Address:</Text>
          <Text className="text-gray-800 font-outfit-medium mt-1">
            {currentOrder.address}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {currentOrder.status === 'PENDING' && (
        <TouchableOpacity
          className="bg-red-500 py-4 items-center mb-3"
          onPress={handleCancelOrder}
        >
          <Text className="text-white font-outfit-medium">Cancel Order</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        className="bg-black py-4 items-center mb-3"
        onPress={() => Alert.alert('Contact', 'Contact seller functionality coming soon')}
      >
        <Text className="text-white font-outfit-medium">Contact Seller</Text>
      </TouchableOpacity>

      <View className="h-10" />
    </ScrollView>
  );
};

export default OrderDetailsScreen;
