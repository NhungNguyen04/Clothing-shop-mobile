import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ToastAndroid,
  Platform
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Star, ChevronLeft } from 'react-native-feather';
import { useProductStore } from '@/store/ProductStore';
import { useCartStore } from '@/store/CartStore';

type ProductDetailParams = {
  ProductDetail: {
    id: string;
  };
};

const { width } = Dimensions.get('window');
const THUMBNAIL_SIZE = 80;
const MAIN_IMAGE_HEIGHT = width;

export default function ProductDetailScreen() {
  const route = useRoute<RouteProp<ProductDetailParams, 'ProductDetail'>>();
  const navigation = useNavigation();
  const { id } = route.params;
  const { 
    addToCart, 
    isLoading: cartIsLoading, 
    error: cartError,
    clearCartError,
  } = useCartStore();
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1); // Default quantity
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { 
    product, 
    isLoading, 
    error: productError,
    setIsLoading, 
    fetchProductById, 
    formatPrice,
  } = useProductStore();
  
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
    return () => {
      // Clear cart errors when component unmounts
      clearCartError();
    };
  }, [id]);

  // Set default selected size when product loads
  useEffect(() => {
    if (product && product.stockSize && product.stockSize.length > 0) {
      setSelectedSize(product.stockSize[0].size);
    }
  }, [product]);

  // Show cart error if exists
  useEffect(() => {
    if (cartError) {
      Alert.alert('Error', cartError, [
        { text: 'OK', onPress: clearCartError }
      ]);
    }
  }, [cartError, clearCartError]);

  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleThumbnailPress = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const showSuccessToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', message, [{ text: 'OK' }]);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchProductById(id);
    } catch (error) {
      console.error('Error refreshing product:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [id, fetchProductById]);

  const handleAddToCart = useCallback(async () => {
    if (!selectedSize) {
      Alert.alert('Size Required', 'Please select a size before adding to cart');
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(id, selectedSize, quantity);
      showSuccessToast('Item added to cart successfully!');
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
    }
  }, [id, selectedSize, quantity, addToCart]);

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
          <Star key={i} fill="#ec4899" color="#ec4899" width={16} height={16} strokeWidth={0.5} />
        );
      } else {
        stars.push(
          <Star key={i} color="#ec4899" width={16} height={16} />
        );
      }
    }
    
    return stars;
  }, []);

  const renderThumbnail = useCallback(({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity 
      style={[
        { borderWidth: 1, borderColor: selectedImageIndex === index ? '#ec4899' : '#d1d5db', borderRadius: 4, overflow: 'hidden' }
      ]}
      onPress={() => handleThumbnailPress(index)}
    >
      <Image 
        source={{ uri: item }} 
        style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }} 
        resizeMode="cover"
      />
    </TouchableOpacity>
  ), [selectedImageIndex, handleThumbnailPress]);

  const isInStock = useCallback((size: string) => {
    if (!product || !product.stockSize) return false;
    const sizeStock = product.stockSize.find(stock => stock.size === size);
    return sizeStock && sizeStock.quantity > 0;
  }, [product]);

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
          {productError || 'Product not found'}
        </Text>
        <TouchableOpacity 
          className="p-2"
          onPress={() => navigation.goBack()}
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
        <TouchableOpacity 
          className="p-2"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft width={24} height={24} color="#000" />
        </TouchableOpacity>
        
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
              source={{ uri: product.image[selectedImageIndex] || product.image[0] }} 
              style={{ width: '100%', height: '100%' }}
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
          {/* Title and Seller */}
          <View className="mb-4">
            <Text className="text-2xl font-outfit-bold text-gray-800 mb-2">{product.name}</Text>
            
            <View className="flex-row items-center mb-3">
              <View className="flex-row mr-1">
                {renderStars(product.ratings || 4)} {/* Use product rating if available */}
              </View>
              <Text className="font-outfit text-sm text-gray-600">({product.ratings || 0})</Text>
            </View>
            
            <View className="flex-row items-center">
              <Image 
                source={{uri: 'https://randomuser.me/api/portraits/thumb/women/44.jpg' }} 
                className="w-6 h-6 rounded-full mr-2"
              />
              <Text className="font-outfit text-sm font-medium text-gray-800">{product.seller.managerName}</Text>
            </View>
          </View>
          
          {/* Price */}
          <Text className="text-2xl font-outfit-bold text-gray-800 mb-4">{formatPrice(product.price)}</Text>
          
          {/* Description */}
          <Text className="font-outfit text-base leading-6 text-gray-600 mb-6">{product.description}</Text>
          
          {/* Size Selection */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-outfit-bold text-gray-800">Select Size</Text>
              
              {/* Size guide link */}
              <TouchableOpacity>
                <Text className="text-sm font-outfit text-pink-500">Size Guide</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row flex-wrap">
              {product.stockSize.map((sizeOption) => (
                <TouchableOpacity
                  key={sizeOption.id}
                  className={`w-15 h-15 p-4 justify-center items-center border ${
                    selectedSize === sizeOption.size ? 'border-pink-500 bg-white' : 'border-gray-300'
                  } mr-2 mb-2 ${sizeOption.quantity <= 0 ? 'opacity-40' : ''}`}
                  onPress={() => handleSizeSelect(sizeOption.size)}
                  disabled={sizeOption.quantity <= 0}
                >
                  <Text 
                    className={`font-outfit text-base ${
                      selectedSize === sizeOption.size ? 'text-pink-500 font-outfit-medium' : 'text-gray-800'
                    } ${sizeOption.quantity <= 0 ? 'line-through' : ''}`}
                  >
                    {sizeOption.size}
                  </Text>
                  {sizeOption.quantity <= 0 ? (
                    <Text className="text-xs text-red-500 mt-1">Out of stock</Text>
                  ) : sizeOption.quantity < 5 ? (
                    <Text className="text-xs text-orange-500 mt-1">Low stock</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Quantity control */}
          <View className="mb-6">
            <Text className="text-lg font-outfit-bold text-gray-800 mb-3">Quantity</Text>
            <View className="flex-row items-center">
              <TouchableOpacity 
                className="w-10 h-10 border border-gray-300 rounded-l justify-center items-center"
                onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Text className="text-xl">-</Text>
              </TouchableOpacity>
              
              <View className="w-12 h-10 border-t border-b border-gray-300 justify-center items-center">
                <Text className="text-base">{quantity}</Text>
              </View>
              
              <TouchableOpacity 
                className="w-10 h-10 border border-gray-300 rounded-r justify-center items-center"
                onPress={() => {
                  const sizeStock = product.stockSize.find(s => s.size === selectedSize);
                  if (sizeStock && quantity < sizeStock.quantity) {
                    setQuantity(quantity + 1);
                  } else {
                    Alert.alert('Maximum Quantity', 'You\'ve reached the maximum available quantity for this item.');
                  }
                }}
                disabled={!selectedSize || (product.stockSize.find(s => s.size === selectedSize)?.quantity ?? 0) <= quantity}
              >
                <Text className="text-xl">+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row mb-6">
            <TouchableOpacity className="flex-1 h-12 justify-center items-center bg-gray-200 mr-2">
              <Text className="text-sm font-outfit-medium text-gray-800">TRY ON WITH AI</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 h-12 justify-center items-center ${
                isAddingToCart || cartIsLoading || !selectedSize || !isInStock(selectedSize || '') 
                  ? 'bg-gray-400' 
                  : 'bg-black'
              }`}
              onPress={handleAddToCart}
              disabled={isAddingToCart || cartIsLoading || !selectedSize || !isInStock(selectedSize || '')}
            >
              {cartIsLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-sm font-outfit-medium text-white">ADD TO CART</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Product Info */}
          <View className="pt-4 border-t border-gray-200">
            <Text className="font-outfit text-sm text-gray-600 mb-2">100% Original product.</Text>
            <Text className="font-outfit text-sm text-gray-600 mb-2">Cash on delivery is available on this product.</Text>
            <Text className="font-outfit text-sm text-gray-600 mb-2">Easy return and exchange policy within 7 days.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};