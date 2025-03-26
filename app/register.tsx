import React, { useState } from 'react'
import { Image, ScrollView, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { AuthenticationService } from '@/services/authentication'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome, Ionicons, Feather } from '@expo/vector-icons'

const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }
    
    setIsLoading(true)
    try {
      const result = await AuthenticationService.register(name, email, password)
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully! Please sign in to continue.')
        router.push('/sign-in')
      } else {
        Alert.alert('Error', result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = async () => {
    setIsLoading(true)
    try {
      const result = await AuthenticationService.loginWithGoogle()
      
      if (result.success && result.data) {
        // Handle successful OAuth login
        router.push('/(tabs)')
      } else {
        Alert.alert('Error', result.error || 'Google sign in failed')
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      Alert.alert('Error', 'Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#fdf2f8', '#ffffff']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className='h-full'>
        <ScrollView contentContainerClassName="h-full justify-center items-center px-6 py-8">
          <View className='w-full mb-6'>
            <Text className='text-3xl font-outfit-bold text-center text-pink-500'>Create Account</Text>
            <Text className='font-outfit text-gray-500 text-center mt-2 text-base'>Join our fashion community today</Text>
          </View>
          
          <View className='w-full rounded-xl bg-white p-6 shadow-lg' style={{ elevation: 4 }}>
            <View className='mb-4'>
              <Text className='text-gray-700 mb-2 font-outfit-medium ml-1'>Full Name</Text>
              <View className='flex-row border border-gray-200 rounded-xl bg-gray-50 items-center'>
                <View className='pl-3 pr-2'>
                  <FontAwesome name="user" size={20} color="#9ca3af" />
                </View>
                <TextInput 
                  className='flex-1 px-2 py-3 text-base font-outfit' 
                  placeholder="Enter your name"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
            
            <View className='mb-4'>
              <Text className='text-gray-700 mb-2 font-outfit-medium ml-1'>Email</Text>
              <View className='flex-row border border-gray-200 rounded-xl bg-gray-50 items-center'>
                <View className='pl-3 pr-2'>
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                </View>
                <TextInput 
                  className='flex-1 px-2 py-3 text-base font-outfit' 
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View className='mb-4'>
              <Text className='text-gray-700 mb-2 font-outfit-medium ml-1'>Password</Text>
              <View className='flex-row border border-gray-200 rounded-xl bg-gray-50 items-center'>
                <View className='pl-3 pr-2'>
                  <Feather name="lock" size={20} color="#9ca3af" />
                </View>
                <TextInput 
                  className='flex-1 px-2 py-3 text-base font-outfit' 
                  placeholder="Create a password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>
            
            <View className='mb-6'>
              <Text className='text-gray-700 mb-2 font-outfit-medium ml-1'>Confirm Password</Text>
              <View className='flex-row border border-gray-200 rounded-xl bg-gray-50 items-center'>
                <View className='pl-3 pr-2'>
                  <Feather name="lock" size={20} color="#9ca3af" />
                </View>
                <TextInput 
                  className='flex-1 px-2 py-3 text-base font-outfit' 
                  placeholder="Confirm your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              className={`bg-pink-500 py-3.5 rounded-xl mb-4 shadow-md ${isLoading ? 'opacity-70' : ''}`}
              onPress={handleRegister}
              disabled={isLoading}
              style={{ elevation: 2 }}
            >
              {isLoading ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className='text-white text-center font-outfit-bold text-lg ml-2'>Creating...</Text>
                </View>
              ) : (
                <Text className='text-white text-center font-outfit-bold text-lg'>Register</Text>
              )}
            </TouchableOpacity>
            
            <View className='flex-row justify-center mb-4'>
              <Text className='text-gray-600 font-outfit'>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/sign-in')}>
                <Text className='text-pink-500 font-outfit-bold'>Sign In</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row items-center my-2">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="font-outfit mx-4 text-gray-500">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>
            
            <TouchableOpacity 
              className={`border border-gray-300 flex-row justify-center items-center py-3.5 rounded-xl mt-4 bg-white shadow-sm ${isLoading ? 'opacity-70' : ''}`} 
              onPress={handleOAuth}
              disabled={isLoading}
              style={{ elevation: 1 }}
            >
              <Image 
                source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} 
                style={{width: 20, height: 20}} 
                className="mr-2"
              />
              {isLoading ? (
                <Text className='text-gray-700 font-outfit-medium'>Processing...</Text>
              ) : (
                <Text className='text-gray-700 font-outfit-medium'>Continue with Google</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

export default RegisterPage
