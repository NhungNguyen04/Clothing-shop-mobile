import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Product } from '@/services/product';
import { deleteProduct } from '@/services/seller/product';
import { router } from 'expo-router';

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

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: product.image[0] || 'https://via.placeholder.com/150' }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <Text style={[styles.stock, { color: stockStatus.color }]}>
          {stockStatus.text}
        </Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.subCategory}>{product.subCategory}</Text>
        </View>
      </View>
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
  name: {
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
});

export default ProductItem;
