import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

const EmptyProductList = () => {
  return (
    <View style={styles.container}>
      <Feather name="package" size={60} color="#D1D5DB" />
      <Text style={styles.title}>No Products Yet</Text>
      <Text style={styles.subtitle}>Start adding products to your store</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/seller/create-product')}
      >
        <Feather name="plus" size={16} color="white" />
        <Text style={styles.buttonText}>Add First Product</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    color: '#374151',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EmptyProductList;
