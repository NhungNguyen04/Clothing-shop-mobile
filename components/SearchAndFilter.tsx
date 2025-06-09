import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  StyleSheet
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
  title?: string;
  resetKey?: string | number; // Add a key prop to reset the component state
}

// Sort options including our new rating options
const sortOptions = [
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest First' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'reviews', label: 'Most Reviewed' },
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

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.7;

const defaultRatingFilters: CategoryOption[] = [
  { name: '4★ & above', checked: false },
  { name: '3★ & above', checked: false },
  { name: '2★ & above', checked: false },
];

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  products,
  onProductsFiltered,
  title = "PRODUCTS",
  resetKey = "0"
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>(sortOptions[0].label);
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [typeOptions, setTypeOptions] = useState<CategoryOption[]>(DEFAULT_TYPES);
  const [ratingFilters, setRatingFilters] = useState<CategoryOption[]>(defaultRatingFilters);
  
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
  }, [searchQuery, selectedSort, categoryOptions, typeOptions, products, ratingFilters]);
  
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
    
    // Apply rating filters
    const selectedRatings = ratingFilters.filter(r => r.checked);
    if (selectedRatings.length > 0) {
      // Get the lowest selected rating
      let lowestRating = 5;
      selectedRatings.forEach(rating => {
        const ratingValue = parseInt(rating.name.charAt(0));
        if (ratingValue < lowestRating) {
          lowestRating = ratingValue;
        }
      });
      
      result = result.filter(product => 
        (product.averageRating || 0) >= lowestRating
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
      case 'Top Rated':
        return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'Most Reviewed':
        return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
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
  
  const toggleRatingFilter = (index: number): void => {
    const updated = [...ratingFilters];
    updated[index].checked = !updated[index].checked;
    setRatingFilters(updated);
  };
  
  const clearAllFilters = (): void => {
    resetFilters();
  };
  
  // New method to reset all filters
  const resetFilters = useCallback(() => {
    setCategoryOptions(DEFAULT_CATEGORIES.map(cat => ({ ...cat, checked: false })));
    setTypeOptions(DEFAULT_TYPES.map(type => ({ ...type, checked: false })));
    setRatingFilters(defaultRatingFilters.map(filter => ({ ...filter, checked: false })));
    setSearchQuery('');
    setSelectedSort(sortOptions[0].label);
    setShowSortOptions(false);
    
    if (drawerOpen) {
      Animated.timing(drawerAnimation, {
        toValue: DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setDrawerOpen(false);
    }
  }, [drawerOpen]);
  
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
                  setSelectedSort(option.label);
                  setShowSortOptions(false);
                }}
              >
                <Text className={`text-sm ${selectedSort === option.label ? 'font-bold' : ''}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Optional Title */}
      {title && (
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

          {/* Rating Filters - New Section */}
          <View className="p-4 border-b border-gray-200">
            <Text className="text-base font-semibold mb-3">CUSTOMER RATINGS</Text>
            {ratingFilters.map((filter, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center mb-3"
                onPress={() => toggleRatingFilter(index)}
              >
                <View className={`w-5 h-5 border rounded mr-2 justify-center items-center ${filter.checked ? 'bg-black border-black' : 'border-gray-300'}`}>
                  {filter.checked && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text className="text-sm">{filter.name}</Text>
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

      {/* Sort Modal - New Implementation */}
      <Modal
        visible={showSortOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortOptions(false)}
        >
          <View style={styles.sortModalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortOptions(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.sortOption}
                  onPress={() => {
                    setSelectedSort(option.label);
                    setShowSortOptions(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    selectedSort === option.label && styles.selectedText
                  ]}>
                    {option.label}
                  </Text>
                  {selectedSort === option.label && (
                    <Ionicons name="checkmark" size={20} color="#ec4899" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Filter Modal - New Implementation */}
      <Modal
        visible={drawerOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleDrawer}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleDrawer}
        >
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Products</Text>
              <TouchableOpacity onPress={toggleDrawer}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Rating Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Customer Ratings</Text>
                {ratingFilters.map((filter, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.filterOption}
                    onPress={() => toggleRatingFilter(index)}
                  >
                    <View style={[
                      styles.checkbox,
                      filter.checked && styles.checkboxChecked
                    ]}>
                      {filter.checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <Text style={styles.filterOptionText}>{filter.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearButtonText}>CLEAR ALL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={toggleDrawer}
              >
                <Text style={styles.applyButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    width: '48%',
    justifyContent: 'center',
  },
  filterText: {
    marginRight: 4,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  sortModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  filterOptionText: {
    fontSize: 14,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortOptionText: {
    fontSize: 16,
  },
  selectedText: {
    color: '#ec4899',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
  },
  clearButtonText: {
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginLeft: 8,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default SearchAndFilter;
