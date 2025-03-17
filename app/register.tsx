import React, { useState } from 'react'
import { Image, ScrollView, Text, View, TextInput, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const handleRegister = async () => {
    const data = await fetch('https://clothing-shop-be-production.up.railway.app/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
      })
    })
    const respond = await data.json()
    if (!respond.success) {
      alert(respond.message)
    } else {
      alert('Account created successfully! Please sign in to continue.')
      router.push('/sign-in')
    }
  }

  const handleOAuth = async () => {
    const respond = await fetch('https://clothing-shop-be-production.up.railway.app/auth/google')
  }

  return (
    <SafeAreaView className='h-full'>
      <ScrollView contentContainerClassName="h-full justify-center items-center px-6">
        <Image 
          source={require('../assets/logo.png')} 
          resizeMode="contain" 
          className='w-3/5 h-32 mb-6'
        />
        
        <View className='w-full mb-6'>
          <Text className='text-2xl font-bold text-center uppercase text-pink-500'>Create an Account</Text>
          <Text className='text-gray-500 text-center mt-2 text-base'>Join our fashion community today</Text>
        </View>
        
        <View className='w-full rounded-xl bg-white p-6 shadow-md'>
          <View className='mb-4'>
            <Text className='text-gray-700 mb-2 font-medium ml-1'>Full Name</Text>
            <TextInput 
              className='border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base' 
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>
          
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
          
          <View className='mb-4'>
            <Text className='text-gray-700 mb-2 font-medium ml-1'>Password</Text>
            <TextInput 
              className='border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base' 
              placeholder="Create a password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          
          <View className='mb-6'>
            <Text className='text-gray-700 mb-2 font-medium ml-1'>Confirm Password</Text>
            <TextInput 
              className='border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base' 
              placeholder="Confirm your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
          
          <TouchableOpacity 
            className='bg-pink-500 py-3 rounded-lg mb-4'
            onPress={handleRegister}
          >
            <Text className='text-white text-center font-bold text-lg'>Register</Text>
          </TouchableOpacity>
          <View className='flex-row justify-center'>
            <Text className='text-gray-600'>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-in')}>
              <Text className='text-pink-500 font-bold'>Sign In</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className='border border-gray-300 flex-row justify-center items-center py-3 rounded-lg mt-4' onPress={handleOAuth}>
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

export default RegisterPage
