import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, MapPin, Phone, Mail, MessageCircle } from 'react-native-feather';
import { getSellerById, Seller } from '@/services/seller';
import { Product } from '@/services/product';
import ProductGrid from '@/components/ProductGrid';
import SearchAndFilter from '@/components/SearchAndFilter';
import { createConversation } from '@/services/chat';
import { useAuthStore } from '@/store/AuthStore'; // Import the auth hook for getting current user ID

export default function SellerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterResetKey, setFilterResetKey] = useState<number>(0);
  const { user } = useAuthStore(); // Get the current authenticated user
  
  // Reset filters when leaving the screen
  useEffect(() => {
    return () => {
      // Force component to reset on unmount
      setFilterResetKey(prev => prev + 1);
    };
  }, []);

  const loadSellerData = useCallback(async () => {
    if (!id) {
      setError('No seller ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Add console logs to debug the response
      console.log('Fetching seller data for ID:', id);
      
      // Fetch seller information which includes products
      const sellerResponse = await getSellerById(id);
      console.log('Seller API response:', JSON.stringify(sellerResponse, null, 2));
      
      // Check for seller in response
      if (sellerResponse?.data?.seller) {
        console.log('Found seller in response data');
        const sellerData = sellerResponse.data.seller;
        setSeller(sellerData);
        
        // Use the products that come with the seller data
        if (sellerData.products && sellerData.products.length > 0) {
          console.log(`Found ${sellerData.products.length} products in seller data`);
          setProducts(sellerData.products);
          setFilteredProducts(sellerData.products); // Initialize filtered products
        } else {
          console.log('No products found in seller data');
          setProducts([]);
          setFilteredProducts([]);
        }
        
        setError(null);
      } 
      // If there's no data.seller wrapper, but the seller object is directly in the response
      else if (sellerResponse?.seller) {
        console.log('Found seller directly in response');
        const sellerData = sellerResponse.seller;
        setSeller(sellerData);
        
        if (sellerData.products && sellerData.products.length > 0) {
          console.log(`Found ${sellerData.products.length} products directly in seller`);
          setProducts(sellerData.products);
          setFilteredProducts(sellerData.products); // Initialize filtered products
        } else {
          setProducts([]);
          setFilteredProducts([]);
        }
        
        setError(null);
      }
      // Handle case where the API returns an object with no seller property
      else {
        console.error('Seller information not available in response', sellerResponse);
        setError('Seller information not available in API response');
      }
    } catch (err: any) {
      console.error('Error loading seller data:', err);
      setError(err.message || 'Failed to load seller information');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSellerData();
  }, [loadSellerData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadSellerData();
    } catch (err) {
      console.error('Error refreshing seller data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSellerData]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  const handleProductPress = useCallback((product: Product) => {
    router.push(`/product/${product.id}`);
  }, [router]);

  const handleProductsFiltered = useCallback((filtered: Product[]) => {
    setFilteredProducts(filtered);
  }, []);

  // Function to navigate to chat screen
  const handleChatWithSeller = async () => {
    if (!user || !seller) return;
    
    try {
      // Create or get a conversation between the current user and the seller
      const conversation = await createConversation(user.id, seller.id);
      
      // Navigate to the chat screen with the conversation ID
      router.push(`/(authenticated)/(customer)/chat/${conversation.id}` as any);
    } catch (error) {
      console.error('Error starting chat with seller:', error);
      // You might want to show an error message to the user
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ec4899" />
        <Text className="mt-3 font-outfit">Loading seller information...</Text>
      </SafeAreaView>
    );
  }

  if (error || !seller) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-5 bg-white">
        <Text className="font-outfit text-lg text-pink-500 text-center mb-5">
          {error || 'Seller not found'}
        </Text>
        {products.length > 0 && (
          <Text className="font-outfit text-sm text-gray-500 text-center mb-5">
            Found {products.length} products, but seller information is unavailable
          </Text>
        )}
        <TouchableOpacity 
          className="p-2"
          onPress={() => router.back()}
        >
          <Text className="text-pink-500 text-lg font-outfit-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Stack.Screen 
        options={{ 
          headerTitle: () => (
            <Text className="font-outfit-medium text-lg">{seller.managerName}</Text>
          ),
          headerLeft: () => (
            <TouchableOpacity 
              className="p-2" 
              onPress={() => router.back()}
            >
              <ChevronLeft width={24} height={24} color="#000" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false
        }} 
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Seller Profile */}
        <View className="px-2 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className='mr-4'
            >
              <ChevronLeft width={24} height={24} color="#000" />
            </TouchableOpacity>
            <Image 
              source={{ uri: seller.image || 'https://randomuser.me/api/portraits/thumb/women/44.jpg' }}
              className="w-16 h-16 rounded-full mr-4"
            />
            <View>
              <Text className="font-outfit-bold text-xl text-gray-800">{seller.managerName}</Text>
              <Text className="font-outfit text-gray-600">Seller since {new Date(seller.createdAt).getFullYear()}</Text>
            </View>
          </View>
          
          {/* Contact Information */}
          <View className="space-y-2 m-2">
            {seller.address?.phoneNumber && (
              <View className="flex-row items-center">
                <Phone width={16} height={16} color="#6b7280" className="mr-2" />
                <Text className="font-outfit text-gray-600 ml-2">{seller.address?.phoneNumber}</Text>
              </View>
            )}
            
            {seller.email && (
              <View className="flex-row items-center">
                <Mail width={16} height={16} color="#6b7280" className="mr-2" />
                <Text className="font-outfit text-gray-600 ml-2">{seller.email}</Text>
              </View>
            )}
            
            {seller.address && (
              <View className="flex-row items-center">
                <MapPin width={16} height={16} color="#6b7280" className="mr-2" />
                <Text className="font-outfit text-gray-600 ml-2">
                  {seller.address.address}{seller.address.postalCode ? `, ${seller.address.postalCode}` : ''}
                </Text>
              </View>
            )}

            {/* Chat Button */}
            <TouchableOpacity 
              className="flex-row items-center bg-pink-500 py-2 px-4 rounded-md my-2 self-start"
              onPress={handleChatWithSeller}
            >
              <MessageCircle width={18} height={18} color="#ffffff" />
              <Text className="font-outfit-medium text-white ml-2">Chat with Seller</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search and Filter Component with reset key and enhanced functionality */}
        <SearchAndFilter 
          products={products}
          onProductsFiltered={handleProductsFiltered}
          title={`Products by ${seller.managerName}`}
          resetKey={filterResetKey}
        />
        
        {/* Debug info - remove in production */}
        {products.length > 0 && (
          <View className="px-4 py-1">
            <Text className="text-xs text-gray-500">Found {products.length} products</Text>
          </View>
        )}
        
        {/* Seller Products Grid */}
        <View>
          <ProductGrid 
            products={filteredProducts}
            loading={isLoading && !isRefreshing}
            error={error}
            onProductPress={handleProductPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
