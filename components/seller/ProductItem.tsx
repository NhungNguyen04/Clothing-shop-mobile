import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Product } from '@/services/product';
import { deleteProduct } from '@/services/seller/product';
import { Ionicons } from '@expo/vector-icons';

type ProductItemProps = {
  product: Product;
  onRefresh: () => void;
};

const ProductItem = ({ product, onRefresh }: ProductItemProps) => {
  const handleEdit = () => {
    router.push({
      pathname: "/seller/edit-product/[id]",
      params: { id: product.id }
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              Alert.alert("Success", "Product deleted successfully");
              onRefresh();
            } catch (error) {
              Alert.alert("Error", "Failed to delete product");
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const getStockStatus = () => {
    const totalStock = product.stockSize.reduce((acc, item) => acc + item.quantity, 0);
    
    if (totalStock === 0) {
      return { text: "Out of stock", color: "#EF4444" };
    } else if (totalStock < 10) {
      return { text: "Low stock", color: "#F59E0B" };
    }
    return { text: "In stock", color: "#10B981" };
  };

  const stockStatus = getStockStatus();

  // Generate star rating display
  const renderStarRating = () => {
    const stars = [];
    const roundedRating = Math.round(product.averageRating * 2) / 2; // Round to nearest 0.5
    
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
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.contentContainer}
        onPress={() => router.push(`/seller/product/${product.id}`)}
      >
        <Image 
          source={{ uri: product.image[0] }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <Text style={styles.stock}>Stock: {product.stockQuantity}</Text>
          
          {/* Rating and reviews section */}
          <View style={styles.ratingContainer}>
            <View style={styles.starContainer}>
              {renderStarRating()}
            </View>
            <Text style={styles.reviewsText}>
              ({product.reviews})
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
          <Feather name="edit" size={18} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  contentContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginTop: 2,
  },
  stock: {
    fontSize: 13,
    marginTop: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  category: {
    fontSize: 12,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    color: '#4F46E5',
    overflow: 'hidden',
  },
  subCategory: {
    fontSize: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    color: '#6B7280',
    marginLeft: 5,
    overflow: 'hidden',
  },
  actions: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
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
    color: '#ec4899', // pink-500 color
    marginLeft: 4,
  },
});

export default ProductItem;
