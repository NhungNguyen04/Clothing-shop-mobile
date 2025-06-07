import React, { useEffect, useState } from 'react';
import { 
  View, 
  FlatList,
  StyleSheet, 
  SafeAreaView,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Product } from '@/services/product';
import { fetchSellerProducts } from '@/services/seller/product';
import { useAuthStore } from '@/store/AuthStore';
import ProductItem from '@/components/seller/ProductItem';
import EmptyProductList from '@/components/seller/EmptyProductList';
import { Feather } from '@expo/vector-icons';

const SellerDashboard = () => {
  const { seller } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    if (!seller?.id) return;

    try {
      setError(null);
      const data = await fetchSellerProducts(seller.id);
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [seller?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>My Products</Text>
        <Text style={styles.headerSubtitle}>{products.length} products listed</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => router.push('/seller/create-product')}
      >
        <Feather name="plus" size={16} color="white" />
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {products.length === 0 ? (
        <EmptyProductList />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductItem product={item} onRefresh={loadProducts} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default SellerDashboard;