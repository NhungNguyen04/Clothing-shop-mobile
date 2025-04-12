import React, { useEffect, useState } from 'react';
import { 
  View, 
  ScrollView,
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  RefreshControl,
  Text
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FashionHero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import { router } from 'expo-router';
import { useProductStore } from '@/store/ProductStore';
import { Product } from '@/services/product';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { recentProducts, fetchProducts, isLoading, setIsLoading } = useProductStore();

  const handleRefresh = () => {
    setRefreshing(true);
    setIsLoading(true);
    fetchProducts()
      .then(() => {
        setRefreshing(false);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setRefreshing(false);
        setLoading(false);
      });
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <FashionHero />
        <View className='mt-10 flex-row ml-2'>
          <Text className='font-outfit-medium text-xl'>OUR BESTSELLERS</Text>
          <View style={styles.line} />
        </View>
        <ProductGrid
          products={recentProducts || []}
          loading={loading}
          error={error}
          onProductPress={handleProductPress}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  line: {
    width: 100,
    height: 1,
    backgroundColor: '#9ca3af',
    marginTop: 10,
    marginLeft: 8,
  },
});

export default HomeScreen;