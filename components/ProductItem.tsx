import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define the product data interface
interface ProductItemProps {
  imageUrl: string;
  title: string;
  price: number;
  currency?: string; // Optional, defaults to $
  onPress?: () => void; // Optional callback for when item is pressed
  reviewsCount?: number; // Optional reviews count
  rating?: number; // Optional average rating
}

const { width } = Dimensions.get('window');
const itemWidth = width > 500 ? width / 3 - 20 : width / 2 - 16; // Responsive width

const ProductItem: React.FC<ProductItemProps> = ({
  imageUrl,
  title,
  price,
  currency = '$',
  onPress,
  reviewsCount = 0,
  rating = 0
}) => {

  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Generate star rating display
  const renderStarRating = () => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        // Full star
        stars.push(<Ionicons key={i} name="star" size={12} color="#ec4899" />);
      } else if (i - 0.5 === roundedRating) {
        // Half star
        stars.push(<Ionicons key={i} name="star-half" size={12} color="#ec4899" />);
      } else {
        // Empty star
        stars.push(<Ionicons key={i} name="star-outline" size={12} color="#ec4899" />);
      }
    }
    
    return stars;
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text className="font-outfit-medium" numberOfLines={2}>{title}</Text>
          <Text className='font-outfit text-gray-500'>{currency}{price}</Text>
          
          {/* Rating and reviews section */}
          {(rating > 0 || reviewsCount > 0) && (
            <View style={styles.ratingContainer}>
              <View style={styles.starContainer}>
                {renderStarRating()}
              </View>
              {reviewsCount > 0 && (
                <Text style={styles.reviewsText}>({reviewsCount})</Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: itemWidth,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: itemWidth * 1.3, // Maintain aspect ratio
    backgroundColor: '#f5f5f5', // Placeholder color while loading
  },
  infoContainer: {
    paddingTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  }
});

export default ProductItem;