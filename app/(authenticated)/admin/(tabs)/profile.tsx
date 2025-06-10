import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, Image, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/AuthStore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { logout} = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600 mb-4">You are not logged in</Text>
        <TouchableOpacity 
          className="bg-pink-500 px-6 py-3 rounded-lg"
          onPress={() => router.push('/sign-in')}
        >
          <Text className="text-white font-medium">Go to Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        <View className="bg-white p-6 items-center shadow-sm mb-4">
          <View className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
            <Image 
              source={
                require('@/assets/admin.png') 
              }
              className="w-full h-full"
            />
          </View>
          <Text className="text-2xl font-bold text-gray-800">{user.name}</Text>
          <Text className="text-gray-500">{user.email}</Text>
        </View>

       
        <View className="p-6">
          <TouchableOpacity 
            className="bg-pink-500 py-4 rounded-lg w-full items-center"
            onPress={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Log Out</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="py-4 px-6 items-center">
          <Text className="text-gray-400 text-sm">App version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
