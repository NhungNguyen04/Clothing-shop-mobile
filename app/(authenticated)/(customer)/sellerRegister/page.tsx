import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  ScrollView, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { createSeller, getSellerByUserId } from '@/services/seller';
import { useAuthStore } from '@/store/AuthStore';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// Location data interfaces (as used in DeliveryInformation)
interface Province {
  code: number;
  name: string;
  districts: District[];
}

interface District {
  code: number;
  name: string;
  wards: Ward[];
}

interface Ward {
  code: number;
  name: string;
}

export default function SellerRegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { setSeller, user: storeUser, seller } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    managerName: user?.name || '',
    email: user?.email || '',
    address: '',
    phoneNumber: '',
    postalCode: '',
    street: '',
    ward: '',
    district: '',
    province: ''
  });
  
  // Error state
  const [errors, setErrors] = useState({
    managerName: '',
    email: '',
    address: '',
    phoneNumber: ''
  });
  
  // Location state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  
  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Load province data
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("https://provinces.open-api.vn/api/?depth=3");
        setProvinces(response.data);
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchProvinces();
  }, []);

  // Update address whenever location components change
  useEffect(() => {
    updateFullAddress();
  }, [formData.street, formData.ward, formData.district, formData.province]);

  // Handle province selection
  const handleProvinceChange = (provinceCode: string) => {
    setSelectedProvince(provinceCode);
    setSelectedDistrict("");
    setWards([]);
    
    const province = provinces.find((p) => p.code === Number(provinceCode));
    setDistricts(province ? province.districts : []);

    handleChange("province", province?.name || "");
    handleChange("district", "");
    handleChange("ward", "");
  };

  // Handle district selection
  const handleDistrictChange = (districtCode: string) => {
    setSelectedDistrict(districtCode);

    const district = districts.find((d) => d.code === Number(districtCode));
    setWards(district ? district.wards : []);

    handleChange("district", district?.name || "");
    handleChange("ward", "");
  };

  // Handle ward selection
  const handleWardChange = (wardCode: string) => {
    const ward = wards.find((w) => w.code === Number(wardCode))?.name || "";
    handleChange("ward", ward);
  };

  // Update full address string from components
  const updateFullAddress = () => {
    const { street, ward, district, province } = formData;
    if (street && ward && district && province) {
      const fullAddress = [street, ward, district, province].filter(Boolean).join(", ");
      handleChange("address", fullAddress);
    }
  };
  
  // Basic validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    if (formData.managerName.length < 3) {
      newErrors.managerName = 'Manager name must be at least 3 characters';
      isValid = false;
    }
    
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    if (!formData.address || formData.address.length < 5) {
      newErrors.address = 'Complete address information is required';
      isValid = false;
    }
    
    if (formData.phoneNumber.length < 8) {
      newErrors.phoneNumber = 'Phone number must be at least 8 characters';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async () => {
  if (!validateForm()) return;
  
  if (!user?.id) {
    Alert.alert('Error', 'You must be logged in to register as a seller');
    return;
  }

  try {
    setIsSubmitting(true);
    
    const sellerData = {
      userId: user.id,
      email: formData.email,
      managerName: formData.managerName,
      status: 'PENDING' as const,
      addressInfo: {
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        postalCode: formData.postalCode,
        street: formData.street,
        ward: formData.ward,
        district: formData.district,
        province: formData.province,
      }
    };

    const response = await createSeller(sellerData);
    
    // Handle the different response structures
    let sellerData2;
    if (response.seller) {
      // Direct seller property in response
      sellerData2 = response.seller;
    } else if (response.data && response.data.seller) {
      // Seller in data property
      sellerData2 = response.data.seller;
    }
    
    if (sellerData2) {
      // Update global state with seller info
      setSeller(sellerData2);
      
      // Show success message
      Alert.alert(
        'Application Submitted',
        'Your seller application has been submitted and is pending review.',
        [{ text: 'OK', onPress: () => router.push('/(authenticated)/(customer)/(tabs)/profile') }]
      );
    } else {
      throw new Error('Failed to register as seller');
    }
  } catch (error) {
    console.error('Error submitting seller application:', error);
    Alert.alert('Registration Error', 
      error instanceof Error ? error.message : 'An unexpected error occurred');
  } finally {
    setIsSubmitting(false);
  }
};

  // Check user role and seller status
  useEffect(() => {
    const checkSellerStatus = async () => {
      setIsLoading(true);
      
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to access this page');
        router.push('/(authenticated)/(customer)/(tabs)/profile');
        return;
      }
      
      // If user is already a SELLER, check their status
      if (user?.role === 'SELLER' || storeUser?.role === 'SELLER') {
        try {
          // If we don't have seller info in store, fetch it
          if (!seller) {
            const response = await getSellerByUserId(user.id);
            
            // Fix: Handle different response structures
            if (response.seller) {
              const sellerData = response.seller;
              setSeller(sellerData);
              
              if (sellerData.status === 'APPROVED') {
                router.push('/(authenticated)/seller/(tabs)');
                return;
              }
            } else {
              console.log('No seller data found in processed response');
            }
          } else {
            // Use seller info from store
            if (seller.status === 'APPROVED') {
              console.log('Using cached seller info, status is approved');
              router.push('/(authenticated)/seller/(tabs)');
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching seller status:', error);
        }
      } else {
        console.log('User is not a seller');
      }
      
      setIsLoading(false);
    };
    
    checkSellerStatus();
  }, [user, storeUser, seller]);

  // Render based on user role and seller status
  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2e64e5" />
          <Text className="mt-4 text-lg">Loading...</Text>
        </View>
      );
    }
    
    // Check both user objects for seller role
    const isUserSeller = user?.role === 'SELLER' || storeUser?.role === 'SELLER';
    
    // Debug what's being rendered and fix seller status check
    console.log('Rendering with:', { 
      isUserSeller,
      userRole: user?.role,
      storeUserRole: storeUser?.role,
      sellerStatus: seller?.status,
      seller: seller // Log the entire seller object
    });
    
    // If user is a seller with PENDING status
    if (isUserSeller && seller && seller.status === 'PENDING') {
      console.log('Rendering PENDING seller view');
      return (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="time-outline" size={60} color="#f59e0b" />
          <Text className="text-xl font-bold text-center mt-4 mb-2">Application Under Review</Text>
          <Text className="text-base text-center text-gray-600 mb-6">
            Your seller application is pending review by our team. This typically takes 2-3 business days.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(authenticated)/(customer)/(tabs)/profile')}
            className="bg-pink-500 rounded-lg py-3 px-6"
          >
            <Text className="text-white font-semibold">Return to Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // If user is a seller with REJECTED status
    if (isUserSeller && seller && seller.status === 'REJECTED') {
      console.log('Rendering REJECTED seller view');
      return (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="close-circle-outline" size={60} color="#ef4444" />
          <Text className="text-xl font-bold text-center mt-4 mb-2">Application Rejected</Text>
          <Text className="text-base text-center text-gray-600 mb-6">
            Unfortunately, your seller application has been rejected. Please contact customer support for more information.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(authenticated)/(customer)/(tabs)/profile')}
            className="bg-pink-500 rounded-lg py-3 px-6"
          >
            <Text className="text-white font-semibold">Return to Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    console.log('Rendering registration form');
    // For customers or new applicants, show the registration form
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow"
        >
          <Ionicons name="arrow-back" size={24} color="#2e64e5" />
        </TouchableOpacity>
        <ScrollView className="flex-1 px-4 pb-10">
          <Text className="text-2xl font-bold text-center mt-6 mb-2">
            Seller Registration
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Complete this form to start selling on our platform
          </Text>

          <View className="w-full">
            <Text className="text-lg font-bold mt-5 mb-2 ml-1">
              Personal Information
            </Text>
            
            {/* Manager Name Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                Manager Name *
              </Text>
              <TextInput
                placeholder="Enter your full name"
                value={formData.managerName}
                onChangeText={(value) => handleChange('managerName', value)}
                className={`border rounded-lg p-3 bg-gray-50 ${errors.managerName ? 'border-red-500' : 'border-gray-300'}`}
                editable={!isSubmitting}
              />
              {errors.managerName ? (
                <Text className="text-red-500 text-xs ml-1 mt-1">{errors.managerName}</Text>
              ) : null}
            </View>

            {/* Business Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                Business Email *
              </Text>
              <TextInput
                placeholder="Enter your business email"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                className={`border rounded-lg p-3 bg-gray-50 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                editable={!isSubmitting}
              />
              {errors.email ? (
                <Text className="text-red-500 text-xs ml-1 mt-1">{errors.email}</Text>
              ) : null}
            </View>

            <Text className="text-lg font-bold mt-5 mb-2 ml-1">
              Business Address
            </Text>
            
            {/* Phone Number Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                Business Phone Number *
              </Text>
              <TextInput
                placeholder="Enter business phone number"
                value={formData.phoneNumber}
                onChangeText={(value) => handleChange('phoneNumber', value)}
                keyboardType="phone-pad"
                className={`border rounded-lg p-3 bg-gray-50 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                editable={!isSubmitting}
              />
              {errors.phoneNumber ? (
                <Text className="text-red-500 text-xs ml-1 mt-1">{errors.phoneNumber}</Text>
              ) : null}
            </View>

            {loadingLocations ? (
              <View className="p-5 items-center">
                <ActivityIndicator size="large" color="#2e64e5" />
                <Text className="mt-2 text-base">Loading address data...</Text>
              </View>
            ) : (
              <>
                {/* Province Select */}
                <View className="mb-4">
                  <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                    Province *
                  </Text>
                  <View className={`border rounded-lg overflow-hidden ${!formData.province && errors.address ? 'border-red-500' : 'border-gray-300'}`}>
                    <Picker
                      selectedValue={selectedProvince}
                      onValueChange={handleProvinceChange}
                      className="h-12"
                    >
                      <Picker.Item label="Select Province" value="" />
                      {provinces.map((province) => (
                        <Picker.Item 
                          key={province.code.toString()} 
                          label={province.name} 
                          value={province.code.toString()} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* District Select */}
                <View className="mb-4">
                  <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                    District *
                  </Text>
                  <View className={`border rounded-lg overflow-hidden ${!formData.district && errors.address ? 'border-red-500' : 'border-gray-300'}`}>
                    <Picker
                      selectedValue={selectedDistrict}
                      onValueChange={handleDistrictChange}
                      className="h-12"
                      enabled={selectedProvince !== ""}
                    >
                      <Picker.Item label="Select District" value="" />
                      {districts.map((district) => (
                        <Picker.Item 
                          key={district.code.toString()} 
                          label={district.name} 
                          value={district.code.toString()} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Ward Select */}
                <View className="mb-4">
                  <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                    Ward *
                  </Text>
                  <View className={`border rounded-lg overflow-hidden ${!formData.ward && errors.address ? 'border-red-500' : 'border-gray-300'}`}>
                    <Picker
                      selectedValue={wards.find(w => w.name === formData.ward)?.code.toString() || ""}
                      onValueChange={handleWardChange}
                      className="h-12"
                      enabled={selectedDistrict !== ""}
                    >
                      <Picker.Item label="Select Ward" value="" />
                      {wards.map((ward) => (
                        <Picker.Item 
                          key={ward.code.toString()} 
                          label={ward.name} 
                          value={ward.code.toString()} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Street Address */}
                <View className="mb-4">
                  <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                    Street *
                  </Text>
                  <TextInput
                    placeholder="Enter street address"
                    value={formData.street}
                    onChangeText={(value) => handleChange('street', value)}
                    className={`border rounded-lg p-3 bg-gray-50 ${!formData.street && errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    editable={!isSubmitting}
                  />
                </View>
              </>
            )}

            {/* Postal Code Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium ml-1 mb-1 text-gray-700">
                Postal Code
              </Text>
              <TextInput
                placeholder="Enter postal code"
                value={formData.postalCode}
                onChangeText={(value) => handleChange('postalCode', value)}
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                editable={!isSubmitting}
              />
            </View>

            {errors.address ? (
              <Text className="text-red-500 text-xs ml-1 mb-4">{errors.address}</Text>
            ) : null}

            <Text className="text-xs text-gray-500 text-center my-5 px-4">
              * By submitting this form, you agree to our seller terms and conditions.
              Your application will be reviewed within 2-3 business days.
            </Text>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`rounded-lg py-3 px-4 ${isSubmitting ? 'bg-pink-300' : 'bg-pink-500'} flex-row justify-center items-center mt-2`}
            >
              {isSubmitting && (
                <ActivityIndicator size="small" color="white" style={{ marginRight: 10 }} />
              )}
              <Text className="text-white font-semibold">
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {renderContent()}
    </SafeAreaView>
  );
}
