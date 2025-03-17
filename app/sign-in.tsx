import React, { useState } from 'react'
import { Image, ScrollView, Text, View, TextInput, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

const SignInPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter();
  const { login } = useAuth();

  const handleSignIn = async () => {
    try {
      const response = await fetch('https://clothing-shop-be-production.up.railway.app/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
        })
      });
      
      const data = await response.json();
      console.log(data);
      
      if (!data.access_token) {
        alert(data.message || 'Login failed');
        return;
      }
      
      // Use the context to store authentication data
      await login(data);
      
      // Navigate to home screen
      router.push('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during sign in. Please try again.');
    }
  }

  const handleRegister = () => {
    router.push('/register')
  }

  const handleForgotPassword = () => {
    router.push('/password-reset')
  }

  return (
    <SafeAreaView className= 'h-full'>
      <ScrollView contentContainerClassName="h-full justify-center items-center px-6">
        <Image 
          source={require('../assets/logo.png')} 
          resizeMode="contain" 
          className='w-3/5 h-32'
        />
        
        <View className='w-full mb-6'>
          <Text className='text-2xl font-bold text-center uppercase text-pink-500'>Welcome to Nh-Clothing</Text>
          <Text className='text-gray-500 text-center mt-2 text-base'>Style Made Simple – Shop, Try, Love!</Text>
        </View>
        
        <View className='w-full rounded-xl bg-white p-6 shadow-md'>
          
          <View className='mb-4'>
            <Text className='text-gray-700 mb-2 font-medium ml-1'>Email</Text>
            <TextInput 
              className='border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base' 
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View className='mb-2'>
            <Text className='text-gray-700 mb-2 font-medium ml-1'>Password</Text>
            <TextInput 
              className='border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base' 
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          
          <TouchableOpacity className='mb-6' onPress={handleForgotPassword}>
            <Text className='text-pink-500 text-right font-medium'>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className='bg-pink-500 py-3 rounded-lg mb-4'
            onPress={handleSignIn}
          >
            <Text className='text-white text-center font-bold text-lg'>Sign In</Text>
          </TouchableOpacity>
          
          <View className='flex-row justify-center mb-4'>
            <Text className='text-gray-600'>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text className='text-pink-500 font-bold'>Register</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity className='border border-gray-300 flex-row justify-center items-center py-3 rounded-lg'>
            <Image 
              source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} 
              style={{width: 20, height: 20}} 
              className="mr-2"
            />
            <Text className='text-gray-700 font-medium'>Sign In with Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignInPage
