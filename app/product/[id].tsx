import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Star, ChevronLeft, ShoppingBag } from 'react-native-feather'; // Assuming you have this package or similar icons

import { Product, fetchProductById } from '@/services/product'

type ProductDetailParams = {
  ProductDetail: {
    id: string;
  };
};

const { width } = Dimensions.get('window');
const THUMBNAIL_SIZE = 80;
const MAIN_IMAGE_HEIGHT = width;

export default function ProductDetailScreen () {
  const route = useRoute<RouteProp<ProductDetailParams, 'ProductDetail'>>();
  const navigation = useNavigation();
  const { id } = route.params;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await fetchProductById(id);
        setProduct(productData);
        
        // Set default selected size if available
        if (productData.stockSize && productData.stockSize.length > 0) {
          setSelectedSize(productData.stockSize[0].size);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load product details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleThumbnailPress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const renderStars = (rating: number) => {
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
  };

  const renderThumbnail = ({ item, index }: { item: string; index: number }) => (
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
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ec4899" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-5 bg-white">
        <Text className="font-outfit text-lg text-pink-500 text-center mb-5">{error || 'Product not found'}</Text>
        <TouchableOpacity 
          className="p-2"
          onPress={() => navigation.goBack()}
        >
          <Text className=" text-pink-500 text-lg font-outfit-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity 
          className="p-1"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft width={24} height={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
                {renderStars(4)} {/* Assuming rating of 4 */}
              </View>
              <Text className="font-outfit text-sm text-gray-600">(122)</Text>
            </View>
            
            <View className="flex-row items-center">
              <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/thumb/women/44.jpg' }} 
                className="w-6 h-6 rounded-full mr-2"
              />
              <Text className="font-outfit text-sm font-medium text-gray-800">{product.seller.managerName}</Text>
            </View>
          </View>
          
          {/* Price */}
          <Text className="text-2xl font-outfit-bold text-gray-800 mb-4">${product.price.toFixed(2)}</Text>
          
          {/* Description */}
          <Text className="font-outfit text-base leading-6 text-gray-600 mb-6">{product.description}</Text>
          
          {/* Size Selection */}
          <View className="mb-6">
            <Text className="text-lg font-outfit-bold text-gray-800 mb-3">Select Size</Text>
            <View className="flex-row flex-wrap">
              {product.stockSize.map((sizeOption) => (
                <TouchableOpacity
                  key={sizeOption.id}
                  className={`w-15 h-15 p-4 justify-center items-center border ${
                    selectedSize === sizeOption.size ? 'border-pink-500 bg-white' : 'border-gray-300'
                  } mr-2 mb-2`}
                  onPress={() => handleSizeSelect(sizeOption.size)}
                >
                  <Text 
                    className={`font-outfit text-base ${
                      selectedSize === sizeOption.size ? 'text-pink-500 font-outfit-medium' : 'text-gray-800'
                    }`}
                  >
                    {sizeOption.size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row mb-6">
            <TouchableOpacity className="flex-1 h-12 justify-center items-center bg-gray-200 mr-2">
              <Text className=" text-sm font-outfit-medium text-gray-800">TRY ON WITH AI</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 h-12 justify-center items-center bg-black">
              <Text className=" text-sm font-outfit-medium text-white">ADD TO CART</Text>
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
