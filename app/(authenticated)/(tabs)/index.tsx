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
import { Product, fetchRecentProducts } from '@/services/product';
import { router } from 'expo-router';

const HomeScreen = () => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  const loadProducts = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const products = await fetchRecentProducts(10);
      setRecentProducts(products);
      setError(null);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
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
          products={recentProducts}
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