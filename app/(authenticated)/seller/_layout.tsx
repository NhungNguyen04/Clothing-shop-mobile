import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, StyleSheet, Image, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


// Main Layout component that will render both the TopNavigation and child screens
export default function AuthenticatedLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <View style={{ flex: 1 }} >
      <View style={{ height: 32 }} />
      <Stack
        screenOptions={{
          headerShown: false, // Hide the default header
          contentStyle: { backgroundColor: Colors[colorScheme].background }
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
