import React, { useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const windowHeight = Dimensions.get('window').height;

  // Redirect authenticated users to the main app
  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#fdf2f8', '#ffffff']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ec4899" />
          <Text className="font-outfit mt-4 text-gray-500">Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#fdf2f8', '#ffffff']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View style={{ height: windowHeight * 0.4 }} className="justify-center items-center">
          <Image 
            source={require('../assets/logo.png')} 
            resizeMode="contain" 
            className="w-4/5 h-32 mb-4"
          />
          <Text className="font-outfit-bold text-4xl text-pink-500 mb-2">Nh-Clothing</Text>
          <Text className="font-outfit text-lg text-gray-600 mb-8 text-center px-10">
            Your one-stop destination for trendy fashion that defines your style.
          </Text>
        </View>
        
        <View className="px-8 flex-1 justify-center">
          <TouchableOpacity 
            className="bg-pink-500 py-4 rounded-2xl mb-4 shadow-md"
            onPress={() => router.push('/register')}
            style={{ elevation: 3 }}
          >
            <Text className="font-outfit-bold text-white text-center text-lg">Create an Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-white border border-pink-300 py-4 rounded-2xl shadow-sm"
            onPress={() => router.push('/sign-in')}
            style={{ elevation: 1 }}
          >
            <Text className="font-outfit-bold text-pink-500 text-center text-lg">Sign In</Text>
          </TouchableOpacity>
          
          <Text className="font-outfit text-gray-500 text-center mt-10">
            Discover fashion that speaks your language
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}