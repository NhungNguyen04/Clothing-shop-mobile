import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Product } from '@/services/product';
import { 
  CreateProductData, 
  UpdateProductData,
  createProduct,
  updateProduct,
  uploadMultipleProductImages
} from '@/services/seller/product';
import { router } from 'expo-router';

type SizeQuantity = {
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
};

type ProductFormProps = {
  initialData?: Product;
  sellerId: string;
};

const ProductForm = ({ initialData, sellerId }: ProductFormProps) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [category, setCategory] = useState<'men' | 'women' | 'kids'>(
    initialData?.category as any || 'men'
  );
  const [subCategory, setSubCategory] = useState<'topwear' | 'bottomwear' | 'winterwear'>(
    initialData?.subCategory as any || 'topwear'
  );
  const [images, setImages] = useState<string[]>(initialData?.image || []);
  const [newImageFiles, setNewImageFiles] = useState<any[]>([]);
  
  // Initialize with default sizes if creating new product
  const [sizes, setSizes] = useState<SizeQuantity[]>(
    initialData?.stockSize.map(item => ({
      size: item.size as any,
      quantity: item.quantity
    })) || [
      { size: 'S', quantity: 0 },
      { size: 'M', quantity: 0 },
      { size: 'L', quantity: 0 },
      { size: 'XL', quantity: 0 },
      { size: 'XXL', quantity: 0 },
    ]
  );

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, // Lower quality to reduce file size
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        // Log the file details to debug
        console.log(`Selected ${result.assets.length} images:`, result.assets[0]);
        
        // For preview purposes
        setImages([...images, ...result.assets.map(asset => asset.uri)]);
        
        // Store the actual file objects for upload
        setNewImageFiles([...newImageFiles, ...result.assets]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to select images. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    // Also remove from files if it's a new image
    if (index >= (initialData?.image?.length || 0)) {
      const newFiles = [...newImageFiles];
      newFiles.splice(index - (initialData?.image?.length || 0), 1);
      setNewImageFiles(newFiles);
    }
  };

  const updateSizeQuantity = (sizeToUpdate: SizeQuantity['size'], quantity: number) => {
    setSizes(prevSizes => 
      prevSizes.map(s => 
        s.size === sizeToUpdate ? { ...s, quantity } : s
      )
    );
  };

  const validateForm = () => {
    if (!name || name.trim().length < 2) {
      Alert.alert("Validation Error", "Please enter a valid product name (min 2 characters)");
      return false;
    }
    
    if (!description || description.trim().length < 10) {
      Alert.alert("Validation Error", "Please enter a valid description (min 10 characters)");
      return false;
    }
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price");
      return false;
    }
    
    if (images.length === 0) {
      Alert.alert("Validation Error", "Please add at least one product image");
      return false;
    }
    
    const totalStock = sizes.reduce((sum, item) => sum + item.quantity, 0);
    if (totalStock <= 0) {
      Alert.alert("Validation Error", "Please add stock for at least one size");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Upload any new images first
      let finalImages = [...images];
      if (newImageFiles.length > 0) {
        try {
          console.log(`Attempting to upload ${newImageFiles.length} new images`);
          
          // Check if we have real files to upload
          if (!newImageFiles[0].uri) {
            throw new Error("Invalid file objects - missing URI property");
          }
          
          const uploadedUrls = await uploadMultipleProductImages(newImageFiles);
          console.log("Upload successful, received URLs:", uploadedUrls);
          
          // Replace local URIs with uploaded URLs
          finalImages = [
            ...(initialData?.image || []),
            ...uploadedUrls
          ];
        } catch (uploadError) {
          console.error("Failed to upload images:", uploadError);
          Alert.alert(
            "Upload Failed", 
            "Failed to upload images. Please check your internet connection and try again."
          );
          return;
        }
      }
      
      // Filter out sizes with zero quantity
      const stockSizes = sizes.filter(s => s.quantity > 0);
      
      if (isEditing) {
        // Update existing product
        const updateData: UpdateProductData = {
          name,
          description,
          price: Number(price),
          category,
          subCategory,
          image: finalImages,
          stockSize: stockSizes
        };
        
        await updateProduct(initialData.id, updateData);
        Alert.alert("Success", "Product updated successfully");
      } else {
        // Create new product
        const productData: CreateProductData = {
          name,
          description,
          price: Number(price),
          image: finalImages,
          category,
          subCategory,
          sellerId,
          stockSize: stockSizes
        };
        
        await createProduct(productData);
        Alert.alert("Success", "Product created successfully");
      }
      
      // Navigate back to the products list
      router.push('/seller');
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Error", `Failed to ${isEditing ? 'update' : 'create'} product. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
          />
          
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter product description"
            multiline
            numberOfLines={4}
          />
          
          <Text style={styles.label}>Price ($)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(value) => setCategory(value as any)}
              style={styles.picker}
            >
              <Picker.Item label="Men" value="men" />
              <Picker.Item label="Women" value="women" />
              <Picker.Item label="Kids" value="kids" />
            </Picker>
          </View>
          
          <Text style={styles.label}>Sub-Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={subCategory}
              onValueChange={(value) => setSubCategory(value as any)}
              style={styles.picker}
            >
              <Picker.Item label="Top Wear" value="topwear" />
              <Picker.Item label="Bottom Wear" value="bottomwear" />
              <Picker.Item label="Winter Wear" value="winterwear" />
            </Picker>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Images</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Feather name="image" size={20} color="#4F46E5" />
            <Text style={styles.uploadButtonText}>Add Product Images</Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => removeImage(index)}
                  >
                    <Feather name="x" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          
          {sizes.map((sizeItem) => (
            <View key={sizeItem.size} style={styles.sizeRow}>
              <Text style={styles.sizeLabel}>{sizeItem.size}</Text>
              <TextInput
                style={styles.quantityInput}
                value={sizeItem.quantity.toString()}
                onChangeText={(text) => {
                  const qty = text === '' ? 0 : parseInt(text, 10);
                  if (!isNaN(qty) && qty >= 0) {
                    updateSizeQuantity(sizeItem.size, qty);
                  }
                }}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Feather name={isEditing ? "save" : "plus"} size={16} color="white" />
              <Text style={styles.submitButtonText}>
                {isEditing ? "Update Product" : "Create Product"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#4F46E5',
    fontWeight: '500',
  },
  imagePreviewScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sizeLabel: {
    fontWeight: '500',
    fontSize: 16,
    width: 50,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    width: '70%',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProductForm;
