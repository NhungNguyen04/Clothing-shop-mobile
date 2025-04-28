import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCartStore } from '@/store/CartStore';
import { useOrderStore } from '@/store/OrderStore';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import DeliveryInformation from '@/components/DeliveryInformation';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const { itemsBySeller, cart } = useCartStore();
  const { checkoutCart, isLoading, error, clearOrderError } = useOrderStore();

  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    street: '',
    ward: '',
    district: '',
    province: '',
  });

  if (!cart || !itemsBySeller || itemsBySeller.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-lg mb-5 font-outfit">Your cart is empty</Text>
        <TouchableOpacity
          className="bg-blue-600 px-5 py-3 rounded"
          onPress={() => router.push('/(authenticated)/(tabs)')}
        >
          <Text className="text-white text-base font-outfit">Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDeliveryInfoChange = (name: string, value: string) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckout = async () => {
    if (!deliveryInfo.address) {
      Alert.alert('Error', 'Please enter a complete shipping address');
      return;
    }

    if (!deliveryInfo.phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    const success = await checkoutCart(deliveryInfo.address, deliveryInfo.phoneNumber);
    if (success) {
      Alert.alert('Success', 'Your order has been placed successfully!', [
        { text: 'View Orders', onPress: () => router.push('/(authenticated)/orders/page') },
        { text: 'Continue Shopping', onPress: () => router.push('/(authenticated)/(tabs)') },
      ]);
    }
  };

  const totalItems = cart.cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-lg p-4 mb-4 shadow">
          <Text className="text-lg font-outfit-bold mb-3">Order Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className='font-outfit'>Total Items:</Text>
            <Text className='font-outfit'>{totalItems}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className='font-outfit'>Total Amount:</Text>
            <Text className='font-outfit'>${cart.totalCartValue.toFixed(2)}</Text>
          </View>
        </View>

        <DeliveryInformation
          deliveryInfo={deliveryInfo}
          onDeliveryChange={handleDeliveryInfoChange}
        />

        <View className="bg-white rounded-lg p-4 mb-4 shadow">
          <Text className="text-lg font-outfit-bold mb-3">Items by Seller</Text>
          {itemsBySeller.map((sellerItems, index) => (
            <View key={index} className="mb-4">
              <Text className="text-base font-outfit-bold mb-2">{sellerItems.sellerName}</Text>
              {sellerItems.items.map((item, idx) => (
                <View key={idx} className="mb-2">
                  <Text className="text-sm font-outfit">{item.sizeStock.product.name}</Text>
                  <View className="flex-row justify-between mt-1">
                    <Text className='font-outfit'>Size: {item.sizeStock.size}</Text>
                    <Text className='font-outfit'>Qty: {item.quantity}</Text>
                    <Text className='font-outfit'>${item.totalPrice.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
              <View className="border-t border-gray-200 pt-2 items-end">
                <Text className='font-outfit'>Seller Total: ${sellerItems.totalValue.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {error && (
          <View className="bg-red-100 p-3 rounded mb-4 flex-row justify-between">
            <Text className="text-red-600 flex-1 font-outfit">{error}</Text>
            <TouchableOpacity onPress={clearOrderError}>
              <Text className="text-blue-600 ml-2 font-outfit">Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View className="bg-white p-4 border-t border-gray-200 flex-row justify-between items-center">
        <Text className="text-lg font-outfit-bold">Total: ${cart.totalCartValue.toFixed(2)}</Text>
        <TouchableOpacity
          className={`bg-black px-5 py-3 rounded ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white text-base font-outfit-medium">Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutScreen;
