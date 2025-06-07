import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, ActivityIndicator, View } from 'react-native';
import ProductForm from '@/components/seller/ProductForm';
import { useAuthStore } from '@/store/AuthStore';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getProductDetails } from '@/services/seller/product';
import { Product } from '@/services/product';

export default function EditProductScreen() {
  const {  seller } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      
      try {
        const productData = await getProductDetails(id);
        
        // Check if the product belongs to the current seller
        if (productData.sellerId !== seller?.id) {
          setError('You do not have permission to edit this product');
          return;
        }
        
        setProduct(productData);
      } catch (err) {
        setError('Failed to load product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, seller]);

  if (!seller) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          You need to be registered as a seller to edit products.
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Product',
          headerBackTitle: 'Cancel',
        }}
      />
      <ProductForm initialData={product} sellerId={seller.id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#EF4444',
    paddingHorizontal: 20,
  },
});
