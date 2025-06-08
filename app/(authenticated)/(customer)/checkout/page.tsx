import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useCartStore } from '@/store/CartStore';
import { useOrderStore } from '@/store/OrderStore';
import { useAuthStore } from '@/store/AuthStore';
import { useUserStore } from '@/store/UserStore';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import DeliveryInformation from '@/components/DeliveryInformation';
import AddressService, { Address } from '@/services/address';
import { normalizeVietnameseText } from '@/utils/stringUtils';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const { itemsBySeller, cart } = useCartStore();
  const { checkoutCart, isLoading, error, clearOrderError } = useOrderStore();
  const { user } = useAuthStore();
  
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VIETQR'>('COD');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);

  // Delivery information state
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: '',
    street: '',
    ward: '',
    district: '',
    province: '',
  });

  useEffect(() => {
    // Check if user has any saved addresses
    const loadUserAddress = async () => {
      if (user?.id) {
        try {
          const addresses = await AddressService.getUserAddresses(user.id);
          setUserAddresses(addresses);
          
          if (addresses.length > 0) {
            setUseSavedAddress(true);
            setSelectedAddress(addresses[0]);
          }
        } catch (error) {
          console.error('Failed to load addresses:', error);
        }
      }
    };
    
    loadUserAddress();
  }, [user?.id]);

  // Update delivery info when selected address changes
  useEffect(() => {
    if (selectedAddress && useSavedAddress) {
      setDeliveryInfo(prev => ({
        ...prev,
        phoneNumber: selectedAddress.phoneNumber,
        address: selectedAddress.address,
        street: selectedAddress.street || '',
        ward: selectedAddress.ward || '',
        district: selectedAddress.district || '',
        province: selectedAddress.province || ''
      }));
    }
  }, [selectedAddress, useSavedAddress]);

  if (!cart || !itemsBySeller || itemsBySeller.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-lg mb-5 font-outfit">Your cart is empty</Text>
        <TouchableOpacity
          className="bg-blue-600 px-5 py-3 rounded"
          onPress={() => router.push('/(authenticated)/(customer)/(tabs)')}
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
    
    // If user is manually editing address fields, disable "use saved address"
    if (['address', 'street', 'ward', 'district', 'province'].includes(name)) {
      setUseSavedAddress(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    setDeliveryInfo(prev => ({
      ...prev,
      phoneNumber: address.phoneNumber,
      address: address.address,
      street: address.street || '',
      ward: address.ward || '',
      district: address.district || '',
      province: address.province || ''
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
    
    // If user wants to save this address and it's not from saved addresses
    if (saveAddressToAccount && !useSavedAddress && user?.id) {
      // Save address to user's account using AddressService
      try {
        await AddressService.createAddress({
          userId: user.id,
          phoneNumber: deliveryInfo.phoneNumber,
          address: deliveryInfo.address,
          street: deliveryInfo.street,
          ward: deliveryInfo.ward,
          district: deliveryInfo.district,
          province: deliveryInfo.province,
        });
      } catch (error) {
        console.error('Failed to save address:', error);
        // Continue with checkout even if saving address fails
      }
    }

    setProcessingOrder(true);

    try {
      // Format complete address string using AddressService utility
      const formattedAddress = useSavedAddress && selectedAddress 
        ? AddressService.formatAddressForDisplay(selectedAddress)
        : formatFullAddress(
            deliveryInfo.street,
            deliveryInfo.ward,
            deliveryInfo.district,
            deliveryInfo.province
          );

      // Extract postal code if available from the selected address
      const postalCode = selectedAddress?.postalCode || undefined;
      
      // Call the updated checkoutCart function with all required parameters
      const success = await checkoutCart(
        formattedAddress,
        deliveryInfo.phoneNumber,
        postalCode,
        paymentMethod
      );
      
      if (success) {
        Alert.alert('Success', 'Your order has been placed successfully!', [
          { text: 'View Orders', onPress: () => router.push('/(authenticated)/(customer)/(tabs)/orders') },
          { text: 'Continue Shopping', onPress: () => router.push('/(authenticated)/(customer)/(tabs)') },
        ]);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to place your order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Helper function to format the complete address
  const formatFullAddress = (street: string, ward: string, district: string, province: string): string => {
    const addressParts = [street, ward, district, province].filter(part => part && part.trim().length > 0);
    
    if (addressParts.length === 0) {
      // If no specific parts provided, return the general address field
      return deliveryInfo.address;
    }
    
    return addressParts.join(', ');
  };

  const totalItems = cart.cartItems.reduce((total, item) => total + item.quantity, 0);

  // Render the saved address selector
  const renderAddressSelector = () => {
    return (
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-outfit text-base font-medium">Use a saved address</Text>
          <Switch 
            value={useSavedAddress}
            onValueChange={setUseSavedAddress}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>
        
        {useSavedAddress && (
          <View className="bg-gray-50 p-3 rounded-lg">
            {selectedAddress ? (
              <TouchableOpacity 
                className="p-3"
                onPress={() => router.push('/(authenticated)/(customer)/address/page')}
              >
                <Text className="font-outfit-medium text-base mb-1">
                  {AddressService.formatAddressForDisplay(selectedAddress)}
                </Text>
                <Text className="font-outfit text-gray-600">📞 {selectedAddress.phoneNumber}</Text>
                <Text className="text-blue-500 mt-2 font-outfit">Change or select another address →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                className="p-3 items-center"
                onPress={() => router.push('/(authenticated)/(customer)/address/page')}
              >
                <Text className="font-outfit text-blue-500">Add a new address</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render the save address option
  const renderSaveAddressOption = () => {
    if (useSavedAddress) return null;
    
    return (
      <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg mb-4">
        <Text className="font-outfit">Save this address to my account</Text>
        <Switch 
          value={saveAddressToAccount}
          onValueChange={setSaveAddressToAccount}
          trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
        />
      </View>
    );
  };

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

        {renderAddressSelector()}

        {!useSavedAddress && (
          <DeliveryInformation
            deliveryInfo={deliveryInfo}
            onDeliveryChange={handleDeliveryInfoChange}
          />
        )}

        {renderSaveAddressOption()}

        {/* Payment Method Selection */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow">
          <Text className="text-lg font-outfit-bold mb-3">Payment Method</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              className={`border rounded-lg p-3 flex-1 ${paymentMethod === 'COD' ? 'border-black bg-gray-100' : 'border-gray-300'}`}
              onPress={() => setPaymentMethod('COD')}
            >
              <Text className={`text-center font-outfit ${paymentMethod === 'COD' ? 'font-outfit-bold' : ''}`}>Cash On Delivery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`border rounded-lg p-3 flex-1 ${paymentMethod === 'VIETQR' ? 'border-black bg-gray-100' : 'border-gray-300'}`}
              onPress={() => setPaymentMethod('VIETQR')}
            >
              <Text className={`text-center font-outfit ${paymentMethod === 'VIETQR' ? 'font-outfit-bold' : ''}`}>VietQR</Text>
            </TouchableOpacity>
          </View>
        </View>

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
          className={`bg-black px-5 py-3 rounded ${processingOrder || isLoading ? 'opacity-50' : ''}`}
          onPress={handleCheckout}
          disabled={processingOrder || isLoading}
        >
          {processingOrder || isLoading ? (
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
