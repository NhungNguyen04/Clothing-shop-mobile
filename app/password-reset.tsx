import React, { useState } from 'react'
import { Image, ScrollView, Text, View, TextInput, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

const PasswordResetPage = () => {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleResetPassword = () => {
    // Add password reset logic here
    // For now, just navigate back to sign-in
    router.push('/sign-in')
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <ScrollView contentContainerClassName="h-full justify-center items-center px-6">
        <View className='w-full mb-6'>
          <Text className='text-2xl font-outfit-bold text-center uppercase text-pink-500'>Reset Password</Text>
          <Text className='font-outfit text-gray-500 text-center mt-2 text-base'>We'll send you instructions to reset your password</Text>
        </View>
        
        <View className='w-full rounded-xl bg-white p-6 shadow-md'>
          <View className='mb-6'>
            <Text className='font-outfit text-gray-700 mb-2 font-medium ml-1'>Email</Text>
            <TextInput 
              className='border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base font-outfit' 
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity 
            className='bg-pink-500 py-3 rounded-lg mb-4'
            onPress={handleResetPassword}
          >
            <Text className='text-white text-center font-outfit-bold text-lg'>Send Reset Instructions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className='py-3 rounded-lg'
            onPress={() => router.push('/sign-in')}
          >
            <Text className='text-pink-500 text-center font-outfit-medium'>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default PasswordResetPage
