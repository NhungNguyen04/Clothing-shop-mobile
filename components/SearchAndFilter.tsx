import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/services/product';

// Define interfaces for our filter options
interface CategoryOption {
  name: string;
  checked: boolean;
}

interface SearchAndFilterProps {
  products: Product[];
  onProductsFiltered: (filteredProducts: Product[]) => void;
  sortOptions?: string[];
  categories?: CategoryOption[];
  types?: CategoryOption[];
  title?: string;
  showTitle?: boolean;
  resetKey?: string | number; // Add a key prop to reset the component state
}

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.7;

const DEFAULT_SORT_OPTIONS: string[] = [
  'Price: Low To High',
  'Price: High To Low',
  'Newest First',
];

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { name: 'Men', checked: false },
  { name: 'Women', checked: false },
  { name: 'Kids', checked: false },
];

const DEFAULT_TYPES: CategoryOption[] = [
  { name: 'Topwear', checked: false },
  { name: 'Bottomwear', checked: false },
  { name: 'Winterwear', checked: false },
];

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  products,
  onProductsFiltered,
  sortOptions = DEFAULT_SORT_OPTIONS,
  categories = DEFAULT_CATEGORIES,
  types = DEFAULT_TYPES,
  title = "PRODUCTS",
  showTitle = true,
  resetKey = "0"
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>(sortOptions[0]);
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(categories);
  const [typeOptions, setTypeOptions] = useState<CategoryOption[]>(types);
  
  // Animation for the drawer
  const drawerAnimation = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  
  // Reset filters when resetKey changes
  useEffect(() => {
    resetFilters();
  }, [resetKey]);
  
  // Apply filters and search whenever dependencies change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, selectedSort, categoryOptions, typeOptions, products]);
  
  const applyFiltersAndSearch = () => {
    let result = [...products];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        item => item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filters
    const selectedCategories = categoryOptions
      .filter(cat => cat.checked)
      .map(cat => cat.name.toLowerCase());
      
    if (selectedCategories.length > 0) {
      result = result.filter(item => 
        selectedCategories.includes(item.category.toLowerCase() || '')
      );
    }
    
    // Apply type filters
    const selectedTypes = typeOptions
      .filter(type => type.checked)
      .map(type => type.name.toLowerCase());
      
    if (selectedTypes.length > 0) {
      result = result.filter(item => 
        selectedTypes.includes(item.subCategory.toLowerCase() || '')
      );
    }
    
    // Apply sorting
    result = sortProducts(result, selectedSort);
    
    // Return filtered products to parent component
    onProductsFiltered(result);
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
    const updated = [...categoryOptions];
    updated[index].checked = !updated[index].checked;
    setCategoryOptions(updated);
  };
  
  const toggleType = (index: number): void => {
    const updated = [...typeOptions];
    updated[index].checked = !updated[index].checked;
    setTypeOptions(updated);
  };
  
  const clearAllFilters = (): void => {
    resetFilters();
  };
  
  // New method to reset all filters
  const resetFilters = useCallback(() => {
    setCategoryOptions(categories.map(cat => ({ ...cat, checked: false })));
    setTypeOptions(types.map(type => ({ ...type, checked: false })));
    setSearchQuery('');
    setSelectedSort(sortOptions[0]);
    setShowSortOptions(false);
    
    if (drawerOpen) {
      Animated.timing(drawerAnimation, {
        toValue: DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setDrawerOpen(false);
    }
  }, [categories, types, sortOptions]);
  
  return (
    <>
      {/* Search Box */}
      <View className='flex-row items-center bg-white px-4 py-2'>
        <View className="flex-1 flex-row items-center px-3 h-10 rounded-lg bg-gray-100">
          <Ionicons name="search-outline" size={20} color="#999" className="mr-2" />
          <TextInput
            className="flex-1 h-full text-base"
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity className="ml-3" onPress={toggleDrawer}>
          <Ionicons name="filter-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Sort Dropdown */}
      <View className="mx-4 mb-2 relative z-10">
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
            {sortOptions.map((option, index) => (
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

      {/* Optional Title */}
      {showTitle && (
        <View className="flex-row items-center mt-3 mb-2 ml-4">
          <Text className="font-outfit-medium ml-2">{title}</Text>
          <View className="w-[100px] h-[1px] bg-gray-400 mt-2.5 ml-2" />
        </View>
      )}
            
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
            {categoryOptions.map((category, index) => (
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
            {typeOptions.map((type, index) => (
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
    </>
  );
};

export default SearchAndFilter;
