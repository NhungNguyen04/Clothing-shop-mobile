import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  Animated,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ProductGrid from '@/components/ProductGrid';
import FashionHero from '@/components/Hero';
import { Product, fetchAllProducts, fetchRecentProducts } from '@/services/product';

// Define interfaces for our filter options
interface CategoryOption {
  name: string;
  checked: boolean;
}

// Sort options
const SORT_OPTIONS: string[] = [
  'Price: Low To High',
  'Price: High To Low',
  'Newest First',
];

// Category options
const CATEGORIES: CategoryOption[] = [
  { name: 'Men', checked: false },
  { name: 'Women', checked: false },
  { name: 'Kids', checked: false },
];

// Type options
const TYPES: CategoryOption[] = [
  { name: 'Topwear', checked: false },
  { name: 'Bottomwear', checked: false },
  { name: 'Winterwear', checked: false },
];

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.7;

const ProductListingScreen: React.FC = () => {
  // Product state from your existing code
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>(SORT_OPTIONS[0]);
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryOption[]>(CATEGORIES);
  const [types, setTypes] = useState<CategoryOption[]>(TYPES);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Animation for the drawer
  const drawerAnimation = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Load products using your existing function
  const loadProducts = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const fetchedProducts = await fetchAllProducts(); // Fetch more products for the listing
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts); // Initialize filtered products with all products
      setError(null);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Apply filters and search whenever dependencies change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, selectedSort, categories, types, products]);

  const applyFiltersAndSearch = () => {
    console.log('categories', categories);
    let result = [...products];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        item => item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filters
    const selectedCategories = categories
      .filter(cat => cat.checked)
      .map(cat => cat.name.toLowerCase());
      
    if (selectedCategories.length > 0) {
      result = result.filter(item => 
        selectedCategories.includes(item.category.toLowerCase() || '')
      );
    }
    
    // Apply type filters
    const selectedTypes = types
      .filter(type => type.checked)
      .map(type => type.name.toLowerCase());
      
    if (selectedTypes.length > 0) {
      result = result.filter(item => 
        selectedTypes.includes(item.subCategory.toLowerCase() || '')
      );
    }
    
    // Apply sorting
    result = sortProducts(result, selectedSort);
    
    setFilteredProducts(result);
  };
  
  const sortProducts = (productsToSort: Product[], sortOption: string): Product[] => {
    const sorted = [...productsToSort];
    
    switch (sortOption) {
      case 'Price: Low To High':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'Price: High To Low':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'Newest First':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  };

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

  const toggleDrawer = (): void => {
    if (drawerOpen) {
      // Close drawer
      Animated.timing(drawerAnimation, {
        toValue: DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Open drawer
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    setDrawerOpen(!drawerOpen);
  };

  const handleSearch = (text: string): void => {
    setSearchQuery(text);
  };

  const toggleCategory = (index: number): void => {
    const updatedCategories = [...categories];
    updatedCategories[index].checked = !updatedCategories[index].checked;
    setCategories(updatedCategories);
  };

  const toggleType = (index: number): void => {
    const updatedTypes = [...types];
    updatedTypes[index].checked = !updatedTypes[index].checked;
    setTypes(updatedTypes);
  };

  const clearAllFilters = (): void => {
    setCategories(CATEGORIES.map(cat => ({ ...cat, checked: false })));
    setTypes(TYPES.map(type => ({ ...type, checked: false })));
    setSearchQuery('');
    setSelectedSort(SORT_OPTIONS[0]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      {/* Search Box */}
      <View className='flex-row items-center bg-white shadow-md px-4 py-3'>
        <View className="flex-1 flex-row items-center px-3 h-10 rounded-lg bg-gray-100">
          <Ionicons name="search-outline" size={20} color="#999" className="mr-2" />
          <TextInput
        className="flex-1 h-full text-base"
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity className="ml-3" onPress={toggleDrawer}>
          <Ionicons name="filter-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      {/* Sort Dropdown */}
      <View className="mx-4 mb-3 relative z-10">
        <TouchableOpacity 
          className="flex-row justify-between items-center px-3 py-2 border border-gray-300 rounded"
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Text className="text-sm">Sort by: {selectedSort}</Text>
          <Ionicons 
            name={showSortOptions ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#000" 
          />
        </TouchableOpacity>
        
        {showSortOptions && (
          <View className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 z-20 shadow-md">
            {SORT_OPTIONS.map((option, index) => (
              <TouchableOpacity 
                key={index} 
                className="px-3 py-2.5 border-b border-gray-100"
                onPress={() => {
                  setSelectedSort(option);
                  setShowSortOptions(false);
                }}
              >
                <Text className={`text-sm ${selectedSort === option ? 'font-bold' : ''}`}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Product Grid using your existing component */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      > 
        <View className="flex-row items-center mt-10 ml-2">
          <Text className="font-outfit-medium text-xl">ALL PRODUCTS</Text>
          <View className="w-[100px] h-[1px] bg-gray-400 mt-2.5 ml-2" />
        </View>
        
        <ProductGrid
          products={filteredProducts}
          loading={loading}
          error={error}
          onProductPress={handleProductPress}
        />
      </ScrollView>

      {/* Filter Drawer */}
      <Animated.View 
        className="absolute top-0 right-0 w-[70%] h-full bg-white z-50 shadow-lg"
        style={{
          transform: [{ translateX: drawerAnimation }],
        }}
      >
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold">FILTERS</Text>
          <TouchableOpacity onPress={toggleDrawer}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-base font-semibold mb-3">CATEGORIES</Text>
            {categories.map((category, index) => (
              <TouchableOpacity 
                key={index} 
                className="flex-row items-center mb-3"
                onPress={() => toggleCategory(index)}
              >
                <View className={`w-5 h-5 border rounded mr-2 justify-center items-center ${category.checked ? 'bg-black border-black' : 'border-gray-300'}`}>
                  {category.checked && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text className="text-sm">{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="p-4 border-b border-gray-200">
            <Text className="text-base font-semibold mb-3">TYPE</Text>
            {types.map((type, index) => (
              <TouchableOpacity 
                key={index} 
                className="flex-row items-center mb-3"
                onPress={() => toggleType(index)}
              >
                <View className={`w-5 h-5 border rounded mr-2 justify-center items-center ${type.checked ? 'bg-black border-black' : 'border-gray-300'}`}>
                  {type.checked && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text className="text-sm">{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View className="flex-row p-4 border-t border-gray-200">
          <TouchableOpacity 
            className="flex-1 justify-center items-center py-3 mr-2 border border-black rounded"
            onPress={clearAllFilters}
          >
            <Text className="text-sm font-semibold">CLEAR ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 justify-center items-center py-3 ml-2 bg-black rounded"
            onPress={toggleDrawer}
          >
            <Text className="text-sm font-semibold text-white">APPLY</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Overlay when drawer is open */}
      {drawerOpen && (
        <TouchableOpacity 
          className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 z-40"
          style={{ right: DRAWER_WIDTH }}
          activeOpacity={1}
          onPress={toggleDrawer}
        />
      )}
    </SafeAreaView>
  );
};

export default ProductListingScreen;