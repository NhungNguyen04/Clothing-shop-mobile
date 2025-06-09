import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Star, ChevronLeft, Edit, Trash2, Eye, MessageSquare } from 'react-native-feather';
import { useProductStore } from '@/store/ProductStore';
import { useAuthStore } from '@/store/AuthStore';
import OrderService from '@/services/order';
import { Order } from '@/services/order';
import { ReviewSection } from "@/components/ReviewSection";

type ProductDetailParams = {
  ProductDetail: {
    id: string;
  };
};

const { width } = Dimensions.get("window");
const THUMBNAIL_SIZE = 80;
const MAIN_IMAGE_HEIGHT = width;

export default function SellerProductDetailScreen() {
  const route = useRoute<RouteProp<ProductDetailParams, "ProductDetail">>();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [productOrders, setProductOrders] = useState<Order[]>([]);
  const [productOrdersCount, setProductOrdersCount] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  
  const {
    product,
    isLoading,
    error: productError,
    setIsLoading,
    fetchProductById,
    formatPrice,
  } = useProductStore();
  
  const { seller } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        await fetchProductById(id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Fetch orders for this product
  useEffect(() => {
    const fetchProductOrders = async () => {
      if (!seller?.id || !id) return;
      
      try {
        setIsLoadingOrders(true);
        const response = await OrderService.getSellerOrders(seller.id);
        
        if (response.success && response.data) {
          // Filter orders containing this product
          const filteredOrders = response.data.filter(order => 
            order.orderItems.some(item => 
              item.sizeStock?.product?.id === id
            )
          );
          
          // Calculate the total number of this product ordered across all orders
          const totalUnitsOrdered = filteredOrders.reduce((total, order) => {
            const productItems = order.orderItems.filter(
              item => item.sizeStock?.product?.id === id
            );
            
            const itemsTotal = productItems.reduce(
              (itemTotal, item) => itemTotal + item.quantity, 
              0
            );
            
            return total + itemsTotal;
          }, 0);
          
          setProductOrders(filteredOrders);
          setProductOrdersCount(totalUnitsOrdered);
        }
      } catch (error) {
        console.error("Error fetching product orders:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    
    fetchProductOrders();
  }, [id, seller]);

  const handleThumbnailPress = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchProductById(id);
    } catch (error) {
      console.error("Error refreshing product:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [id, fetchProductById]);

  const handleEditProduct = useCallback(() => {
    router.push(`/seller/edit-product/${id}` as any);
  }, [id, router]);

  const handleDeleteProduct = useCallback(() => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Add your delete logic here
            Alert.alert("Product deleted", "The product has been successfully deleted.");
            router.back();
          }
        }
      ]
    );
  }, [id, router]);

  const handleViewOrders = useCallback(() => {
    router.push(`/(authenticated)/seller/(tabs)/orders?productId=${id}` as any);
  }, [id, router]);

  const handleToggleReviews = useCallback(() => {
    setShowReviews(prev => !prev);
  }, []);

  const renderStars = useCallback((rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} fill="#ec4899" color="#ec4899" width={16} height={16} />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            fill="#ec4899"
            color="#ec4899"
            width={16}
            height={16}
            strokeWidth={0.5}
          />
        );
      } else {
        stars.push(<Star key={i} color="#ec4899" width={16} height={16} />);
      }
    }

    return stars;
  }, []);

  const renderThumbnail = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <TouchableOpacity
        style={[
          {
            borderWidth: 1,
            borderColor: selectedImageIndex === index ? "#ec4899" : "#d1d5db",
            borderRadius: 4,
            overflow: "hidden",
            marginRight: 8
          },
        ]}
        onPress={() => handleThumbnailPress(index)}
      >
        <Image
          source={{ uri: item }}
          style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ),
    [selectedImageIndex, handleThumbnailPress]
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ec4899" />
        <Text className="mt-3 font-outfit">Loading product details...</Text>
      </SafeAreaView>
    );
  }

  if (productError || !product) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-5 bg-white">
        <Text className="font-outfit text-lg text-pink-500 text-center mb-5">
          {productError || "Product not found"}
        </Text>
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
      <View className="flex-row items-center justify-between border-b border-gray-200 px-2">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <ChevronLeft width={24} height={24} color="#000" />
        </TouchableOpacity>
        
        <Text className="text-lg font-outfit-medium">Product Details</Text>
        
        <View className="flex-row">
          <TouchableOpacity className="p-2 mr-2" onPress={handleEditProduct}>
            <Edit width={24} height={24} color="#0066cc" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={handleDeleteProduct}>
            <Trash2 width={24} height={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Product Images Section */}
        <View className="bg-gray-100">
          {/* Main Image */}
          <View style={{ width: width, height: MAIN_IMAGE_HEIGHT }}>
            <Image
              source={{
                uri: product.image[selectedImageIndex] || product.image[0],
              }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>

          {/* Thumbnails */}
          {product.image.length > 1 && (
            <FlatList
              data={product.image}
              renderItem={renderThumbnail}
              keyExtractor={(_, index) => `thumbnail-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 16 }}
            />
          )}
        </View>

        {/* Product Info Section */}
        <View className="p-4">
          {/* Product Status Badge */}
          <View className="mb-3">
            <View className="bg-green-100 self-start px-3 py-1 rounded-full">
              <Text className="font-outfit text-green-800 text-sm">Active</Text>
            </View>
          </View>
          
          {/* Title and Seller */}
          <View className="mb-4">
            <Text className="text-2xl font-outfit-bold text-gray-800 mb-2">
              {product.name}
            </Text>

            <View className="flex-row items-center mb-3">
              <View className="flex-row mr-1">
                {renderStars(product.averageRating || 0)}
              </View>
              <Text className="font-outfit text-sm text-gray-600">
                ({product.reviews || 0} reviews)
              </Text>
            </View>
          </View>

          {/* Price and IDs */}
          <View className="mb-4">
            <Text className="text-2xl font-outfit-bold text-gray-800 mb-2">
              {formatPrice(product.price)}
            </Text>
            
            <Text className="font-outfit text-xs text-gray-500">
              Product ID: {product.id}
            </Text>
          </View>

          {/* Sales Statistics */}
          <View className="mb-6 p-4 bg-gray-50 rounded-md">
            <Text className="text-lg font-outfit-bold text-gray-800 mb-3">
              Sales Statistics
            </Text>
            
            <View className="flex-row justify-between">
              <View className="bg-white p-3 rounded-md flex-1 mr-2 shadow-sm">
                <Text className="text-sm font-outfit text-gray-500">Orders</Text>
                <Text className="text-xl font-outfit-medium">
                  {isLoadingOrders ? (
                    <ActivityIndicator size="small" color="#ec4899" />
                  ) : (
                    productOrders.length
                  )}
                </Text>
              </View>
              
              <View className="bg-white p-3 rounded-md flex-1 ml-2 shadow-sm">
                <Text className="text-sm font-outfit text-gray-500">Units Sold</Text>
                <Text className="text-xl font-outfit-medium">
                  {isLoadingOrders ? (
                    <ActivityIndicator size="small" color="#ec4899" />
                  ) : (
                    productOrdersCount
                  )}
                </Text>
              </View>
            </View>
          </View>

          {/* Stock Overview */}
          <View className="mb-6 p-3 bg-gray-50 rounded-md">
            <Text className="text-lg font-outfit-medium text-gray-800 mb-2">
              Inventory Status
            </Text>
            
            {product.stockSize.map((sizeStock) => (
              <View key={sizeStock.id} className="flex-row justify-between py-1">
                <Text className="font-outfit">Size {sizeStock.size}</Text>
                <View className="flex-row items-center">
                  <Text className="font-outfit-medium">{sizeStock.quantity} units</Text>
                  {sizeStock.quantity <= 5 && (
                    <Text className="ml-2 text-xs text-orange-500 font-outfit-medium">
                      {sizeStock.quantity === 0 ? 'Out of stock' : 'Low stock'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            
            <View className="mt-3 pt-3 border-t border-gray-200">
              <Text className="font-outfit-medium">
                Total inventory: {product.stockQuantity} units
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-outfit-bold text-gray-800 mb-2">
              Description
            </Text>
            <Text className="font-outfit text-base leading-6 text-gray-600">
              {product.description}
            </Text>
          </View>

          {/* Category info */}
          <View className="mb-6">
            <Text className="text-lg font-outfit-bold text-gray-800 mb-2">
              Categories
            </Text>
            <View className="flex-row flex-wrap">
              <View className="bg-gray-200 rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="font-outfit">{product.category}</Text>
              </View>
              <View className="bg-gray-200 rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="font-outfit">{product.subCategory}</Text>
              </View>
            </View>
          </View>

          {/* Product Orders */}
          <View className="mb-6 p-3 bg-gray-50 rounded-md">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-outfit-bold text-gray-800">
                Recent Orders ({productOrders.length})
              </Text>
              <TouchableOpacity onPress={handleViewOrders}>
                <Text className="text-blue-500 font-outfit-medium">View All</Text>
              </TouchableOpacity>
            </View>
            
            {isLoadingOrders ? (
              <ActivityIndicator size="small" color="#ec4899" />
            ) : productOrders.length > 0 ? (
              productOrders.slice(0, 3).map(order => (
                <View key={order.id} className="py-2 border-b border-gray-200">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-outfit">{order.id.slice(-6)}</Text>
                    <View style={{
                      backgroundColor: 
                        order.status === 'DELIVERED' ? '#4CAF50' : 
                        order.status === 'SHIPPED' ? '#9C27B0' : 
                        order.status === 'PROCESSING' ? '#2196F3' :
                        order.status === 'CANCELLED' ? '#F44336' : '#FFC107',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12
                    }}>
                      <Text className="text-white text-xs">{order.status}</Text>
                    </View>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="font-outfit text-gray-500 italic py-2">
                No orders for this product yet
              </Text>
            )}
            
            <TouchableOpacity 
              className="mt-4 flex-row items-center justify-center bg-pink-500 py-3 rounded-md"
              onPress={handleViewOrders}
            >
              <Eye width={18} height={18} color="#ffffff" />
              <Text className="font-outfit text-white ml-2">
                View All Orders ({productOrders.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Reviews Toggle Button */}
          <View className="mb-4 mt-2">
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-gray-100 py-3 rounded-md"
              onPress={handleToggleReviews}
            >
              <MessageSquare width={18} height={18} color="#333333" />
              <Text className="font-outfit text-gray-800 ml-2">
                {showReviews ? "Hide Customer Reviews" : `View Customer Reviews (${product.reviews || 0})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Show Reviews Section if toggled on */}
          {showReviews && (
            <View className="mt-2">
              <ReviewSection productId={id} readOnly={true} />
            </View>
          )}
          
          {/* Creation and update info */}
          <View className="pt-4 border-t border-gray-200">
            <Text className="font-outfit text-sm text-gray-600 mb-2">
              Created: {new Date(product.createdAt).toLocaleDateString()}
            </Text>
            <Text className="font-outfit text-sm text-gray-600 mb-2">
              Last updated: {new Date(product.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
