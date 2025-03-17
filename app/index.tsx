import React, { useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect authenticated users to the main app
  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#ec4899" />
        <Text className="mt-4 text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-3xl font-bold text-pink-500 mb-4">Welcome to Nh-Clothing</Text>
        <Text className="text-lg text-gray-600 mb-8 text-center">
          Your one-stop destination for trendy fashion.
        </Text>
        
        <TouchableOpacity 
          className="bg-pink-500 py-3 px-6 rounded-lg mb-4 w-full"
          onPress={() => router.push('/register')}
        >
          <Text className="text-white text-center font-bold text-lg">Create an Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="border border-pink-500 py-3 px-6 rounded-lg w-full"
          onPress={() => router.push('/sign-in')}
        >
          <Text className="text-pink-500 text-center font-bold text-lg">Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}