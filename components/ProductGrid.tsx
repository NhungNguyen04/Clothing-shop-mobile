import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { Product } from '@/services/product';
import ProductItem from './ProductItem';
import { useProductStore } from '@/store/ProductStore';

interface ProductGridProps {
  title?: string;
  products: Product[];
  loading?: boolean;
  error?: string | null;
  onProductPress: (product: Product) => void;
}

const { width } = Dimensions.get('window');
const ITEM_SPACING = 16;
const ITEM_WIDTH = (width - ITEM_SPACING * 3) / 2;

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  error = null,
  onProductPress
}) => {
  const { getProductMainImage } = useProductStore();
  console.log('Rendering ProductGrid with products:', products);
  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.itemContainer}>
      <ProductItem
        imageUrl={getProductMainImage(item)}
        title={item.name}
        price={item.price}
        onPress={() => onProductPress(item)}
        reviewsCount={item.reviews}
        rating={item.averageRating}
      />
    </View>
  );

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            products.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={renderEmptyComponent}
          scrollEnabled={false} 
          ItemSeparatorComponent={() => <View style={{ height: ITEM_SPACING }} />}

        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  listContent: {
    paddingHorizontal: ITEM_SPACING/2,
    paddingBottom: ITEM_SPACING
  },
  itemContainer: {
    width: ITEM_WIDTH,
  },
  emptyListContent: {
    height: 200,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingLeft: 0,
    width: '100%',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  }
});

export default ProductGrid;