import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useOrderStore } from '@/store/OrderStore';
import { Order, OrderStatus } from '@/services/order';
import { router } from 'expo-router';
import OrderCard from '@/components/OrderCard';
import { ChevronLeft } from 'react-native-feather';

const STATUS_TABS: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];


const OrdersScreen:React.FC = () => {
  const { orders, fetchUserOrders, isLoading, error, cancelOrder } = useOrderStore();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  
  useEffect(() => {
    fetchUserOrders();
  }, []);
  
  const handleOrderPress = (orderId: string) => {
    router.push({
      pathname: "/(authenticated)/(customer)/orders/[id]/page",
      params: { id: orderId }
    });
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            const success = await cancelOrder(orderId);
            if (success) {
              Alert.alert("Success", "Order cancelled successfully");
            }
          }
        }
      ]
    );
  };
  
  const filteredOrders = selectedStatus === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2e64e5" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-red-600 text-center">{error}</Text>
        <TouchableOpacity className="bg-pink-500 px-5 py-2 rounded" onPress={fetchUserOrders}>
          <Text className="text-white text-center">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!orders || orders.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-center mb-4">You haven't placed any orders yet</Text>
        <TouchableOpacity 
          className="bg-blue-600 px-5 py-2 rounded" 
          onPress={() => router.push('/(authenticated)/(customer)/(tabs)')}
        >
          <Text className="text-white text-center">Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-white shadow-md">
        <TouchableOpacity className="flex-row items-center p-2" onPress={() => router.back()}>
          <ChevronLeft width={24} height={24} color="#ec4899" />
          <Text className="text-lg font-outfit-medium">Orders history</Text>
        </TouchableOpacity>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="flex-row"
          contentContainerStyle={{ alignItems: 'center' }}
        >
          <TouchableOpacity 
            className={`py-3 px-5 border-b-2 ${selectedStatus === 'ALL' ? 'border-pink-500' : 'border-transparent'}`}
            onPress={() => setSelectedStatus('ALL')}
          >
            <Text className={`font-outfit-medium text-center ${selectedStatus === 'ALL' ? 'text-pink-500 font-outfit-bold' : 'text-gray-500'}`}>
              ALL
            </Text>
          </TouchableOpacity>
        
          {STATUS_TABS.map((status) => (
            <TouchableOpacity 
              key={status}
              className={`px-4 py-3 border-b-2 ${selectedStatus === status ? 'border-pink-500' : 'border-transparent'}`}
              onPress={() => setSelectedStatus(status)}
            >
              <Text className={`font-outfit-medium ${selectedStatus === status ? 'text-pink-500 font-outfit-bold' : 'text-gray-500'}`}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      </View>
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => handleOrderPress(item.id)}
            onCancel={item.status === 'PENDING' ? () => handleCancelOrder(item.id) : undefined}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

export default OrdersScreen;
