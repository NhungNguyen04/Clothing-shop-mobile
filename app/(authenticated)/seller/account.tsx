import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getSellerById, getSellerByUserId, updateSeller } from '@/services/seller';
import axiosInstance from '@/services/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/AuthStore';
import DeliveryInformation from '@/components/DeliveryInformation';
import addressService, { Address } from '@/services/address';
import { ChevronLeft } from 'react-native-feather';
import { router } from 'expo-router';

const SellerAccountScreen = () => {
  // Get user and seller directly from AuthStore
  const { user, seller, setSeller } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    managerName: '',
    image: ''
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [address, setAddress] = useState<Address>({
    phoneNumber: '',
    address: '',
    street: '',
    ward: '',
    district: '',
    province: ''
  });
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (seller) {
      // Initialize form with seller data from store
      console.log('Seller data from store:', seller);
      initializeFormWithSeller(seller);
      
      // Fetch address data if seller has addressId
      if (seller.addressId) {
        loadAddressData(seller.addressId);
      }
      
      setLoading(false);
    } else if (user?.id) {
      // Fetch seller data if not in store
      loadSellerData();
    }
  }, [seller, user]);

  const initializeFormWithSeller = (sellerData: any) => {
    setFormData({
      email: sellerData.email || '',
      managerName: sellerData.managerName || '',
      image: sellerData.image || ''
    });
    setAvatar(sellerData.image || null);
  };

  const loadSellerData = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const response = await getSellerByUserId(user.id);
      console.log('Seller data response:', response);
      if (response?.success && response?.data?.seller) {
        const sellerData = response.data.seller;
        // Update both local state and global store
        initializeFormWithSeller(sellerData);
        setSeller(sellerData);
        
        // Fetch address if seller has addressId
        if (sellerData.addressId) {
          loadAddressData(sellerData.addressId);
        }
      }
    } catch (error) {
      console.error('Failed to load seller data:', error);
      Alert.alert('Error', 'Failed to load your account information');
    } finally {
      setLoading(false);
    }
  };

  const loadAddressData = async (addressId: string) => {
    try {
      setAddressLoading(true);
      const addressData = await addressService.getAddressById(addressId);
      setAddress(addressData);
      console.log('Address data loaded:', addressData);
    } catch (error) {
      console.error('Failed to load address data:', error);
      Alert.alert('Error', 'Failed to load address information');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressChange = (name: string, value: string) => {
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUpdating(true);
      
      const formData = new FormData();
      const fileExtension = uri.split('.').pop() || 'jpg';
      
      // @ts-ignore - TypeScript doesn't recognize append with this format
      formData.append('file', {
        uri,
        name: `avatar-${Date.now()}.${fileExtension}`,
        type: `image/${fileExtension}`
      });

      const uploadResponse = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', JSON.stringify(uploadResponse.data));
      
      // Check for successful response
      if (uploadResponse.data?.success === true) {
        // The API returns the URL directly in the data field
        const imageUrl = uploadResponse.data.data;
        
        if (typeof imageUrl === 'string') {
          // Update avatar and form data
          setAvatar(imageUrl);
          setFormData(prev => ({ ...prev, image: imageUrl }));
        } else {
          throw new Error('Invalid image URL format in response');
        }
      } else {
        throw new Error('Upload failed: ' + (uploadResponse.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile image');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = async () => {
    if (!seller?.id) {
      Alert.alert('Error', 'Seller information not found');
      return;
    }

    try {
      setUpdating(true);
      
      // Update seller profile
      const updateData = {
        email: formData.email,
        managerName: formData.managerName,
        image: formData.image
      };

      const response = await updateSeller(seller.id, updateData);
      console.log('Update seller response:', response);
      
      // Update address if we have an addressId
      let addressUpdateSuccess = true;
      if (seller.addressId) {
        try {
          const addressUpdateData = {
            phoneNumber: address.phoneNumber,
            address: address.address,
            street: address.street,
            ward: address.ward,
            district: address.district,
            province: address.province
          };
          
          const addressResponse = await addressService.updateAddress(seller.addressId, addressUpdateData);
          console.log('Update address response:', addressResponse);
        } catch (addressError) {
          console.error('Error updating address:', addressError);
          addressUpdateSuccess = false;
        }
      }
      
      // Check if seller update was successful
      if (response?.updatedSeller) {
        // Update the seller in the global store
        setSeller(response.updatedSeller);
        
        if (addressUpdateSuccess) {
          Alert.alert('Success', 'Account and address information updated successfully');
        } else {
          Alert.alert('Partial Success', 'Profile updated but there was an issue updating your address');
        }
      } 
      else if (response?.success && response?.data?.updatedSeller) {
        // Update the seller in the global store
        setSeller(response.data.updatedSeller);
        
        if (addressUpdateSuccess) {
          Alert.alert('Success', 'Account and address information updated successfully');
        } else {
          Alert.alert('Partial Success', 'Profile updated but there was an issue updating your address');
        }
      } 
      else {
        Alert.alert('Update Status', 'Update may have been successful but we couldn\'t confirm the changes. Please refresh your profile.');
      }
    } catch (error) {
      console.error('Error updating seller:', error);
      Alert.alert('Error', 'Failed to update account information');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-2 text-gray-600">Loading account information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-6">
        <View className="items-center mb-6">
        <View className="flex-row items-center w-full mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft width={22} height={22} color="#555" />
          </TouchableOpacity>
          <Text className="text-xl font-outfit-bold">Seller Profile</Text>
          </View>
          
          <TouchableOpacity 
            onPress={pickImage} 
            className="mb-4"
            disabled={updating}
          >
            <View className="relative">
              {avatar ? (
                <Image 
                  source={{ uri: avatar }} 
                  className="w-28 h-28 rounded-full bg-gray-200"
                />
              ) : (
                <View className="w-28 h-28 rounded-full bg-gray-200 justify-center items-center">
                  <Ionicons name="person" size={50} color="#666" />
                </View>
              )}
              
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          
          {updating && (
            <Text className="text-blue-500 mb-2">Processing...</Text>
          )}
        </View>

        <View className="space-y-4">
          <Text className="text-lg font-bold">Account Information</Text>
          
          <View>
            <Text className="text-gray-600 mb-1 font-medium">Email</Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Email address"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg px-4 py-3"
            />
          </View>

          <View>
            <Text className="text-gray-600 mb-1 font-outfit-medium">Manager Name</Text>
            <TextInput
              value={formData.managerName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, managerName: text }))}
              placeholder="Manager name"
              className="border border-gray-300 rounded-lg px-4 py-3"
            />
          </View>
          
          <View className="mt-4">
            <Text className="text-gray-600 mb-1 font-medium">Status</Text>
            <View className={`py-3 px-4 rounded-lg ${getStatusColor(seller?.status)}`}>
              <Text className="font-semibold text-white">{seller?.status}</Text>
            </View>
          </View>
          
          {/* Address Information Section */}
          <View className="mt-6">
            <Text className="text-lg font-bold mt-4 mb-2">Address Information</Text>
            
            {addressLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#0000ff" />
                <Text className="mt-2 text-gray-600">Loading address information...</Text>
              </View>
            ) : (
              <DeliveryInformation 
                deliveryInfo={address} 
                onDeliveryChange={handleAddressChange} 
                showNameEmail={false}
              />
            )}
          </View>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={updating}
            className={`mt-4 rounded-lg py-3 ${updating ? 'bg-gray-400' : 'bg-blue-500'}`}
          >
            <Text className="text-white font-bold text-center text-lg">
              {updating ? 'Updating...' : 'Update Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function for status colors
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-500';
    case 'PENDING':
      return 'bg-yellow-500';
    case 'REJECTED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export default SellerAccountScreen;
