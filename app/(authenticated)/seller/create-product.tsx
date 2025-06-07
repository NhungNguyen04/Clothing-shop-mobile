import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import ProductForm from '@/components/seller/ProductForm';
import { useAuthStore} from '@/store/AuthStore';
import { Stack } from 'expo-router';

export default function CreateProductScreen() {
  const { user, seller } = useAuthStore();
  
  if (!user?.role || user.role !== 'SELLER' || !seller) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          You need to be registered as a seller to create products.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add New Product',
          headerBackTitle: 'Cancel',
        }}
      />
      <ProductForm sellerId={seller.id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#EF4444',
    paddingHorizontal: 20,
  },
});
