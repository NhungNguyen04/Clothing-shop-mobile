"use client"

import { useState, useEffect } from "react"
import { Image, ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useAuth } from "@/context/AuthContext"
import { AuthenticationService } from "@/services/authentication"
import * as WebBrowser from "expo-web-browser"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession()

const SignInPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    // Setup deep link handler for authentication callbacks
    const cleanup = AuthenticationService.setupDeepLinkHandler(async (authData) => {
      await login(authData)
      router.push("/(tabs)")
    })
    
    return cleanup
  }, [login, router])

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    setIsLoading(true)
    try {
      const result = await AuthenticationService.login(email, password)

      if (result.success && result.data) {
        await login(result.data)
        router.push("/(tabs)")
      } else {
        Alert.alert("Error", result.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      Alert.alert("Error", "An error occurred during sign in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await AuthenticationService.loginWithGoogle()

      if (result.success && result.data) {
        await login(result.data)
        router.push("/(tabs)")
      } else {
        Alert.alert("Authentication Error", result.error || "Failed to sign in with Google")
      }
    } catch (error) {
      console.error("Google sign in error:", error)
      Alert.alert("Error", "Failed to sign in with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = () => {
    router.push("/register")
  }

  const handleForgotPassword = () => {
    router.push("/password-reset")
  }
  
  return (
    <LinearGradient 
      colors={['#f9f9f9', '#ffe1f0']} 
      className="h-full"
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView className="h-full">
        <ScrollView 
          contentContainerClassName="h-full justify-center items-center px-6 py-8"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center">
            <Image 
              source={require("../assets/logo.png")} 
              resizeMode="contain" 
              className="w-4/5 h-36" 
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="w-full mb-8">
            <Text className="text-3xl font-outfit-bold text-center text-pink-600">
              Welcome Back!
            </Text>
            <Text className="font-outfit text-gray-600 text-center mt-2 text-base">
              Style Made Simple – Shop, Try, Love!
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(400).duration(800).springify()}
            className="w-full rounded-2xl bg-white p-7 shadow-xl" 
            style={{ 
              shadowColor: "#ff8dc7",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            <View className="mb-5">
              <Text className="font-outfit-medium text-gray-700 mb-2 ml-1 text-base">Email</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <Image 
                  source={{ uri: "https://cdn-icons-png.flaticon.com/512/561/561127.png" }} 
                  style={{ width: 20, height: 20 }}
                  className="mr-3 opacity-60"
                />
                <TextInput
                  className="flex-1 text-base text-gray-800 font-outfit"
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View className="mb-3">
              <Text className="font-outfit-medium text-gray-700 mb-2 ml-1 text-base">Password</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <Image 
                  source={{ uri: "https://cdn-icons-png.flaticon.com/512/3064/3064155.png" }} 
                  style={{ width: 20, height: 20 }}
                  className="mr-3 opacity-60"
                />
                <TextInput
                  className="flex-1 text-base text-gray-800 font-outfit"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
              </View>
            </View>

            <TouchableOpacity className="mb-7" onPress={handleForgotPassword} disabled={isLoading}>
              <Text className="text-pink-500 text-right font-outfit-medium">Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSignIn}
              disabled={isLoading}
              className="rounded-xl overflow-hidden"
            >
              <LinearGradient
                colors={['#f472b6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3.5 rounded-xl mb-5"
                style={{borderRadius: 12}}
              >
                {isLoading ? (
                  <View className="flex-row justify-center items-center">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="font-outfit-bold text-white text-center text-lg ml-2">Signing In...</Text>
                  </View>
                ) : (
                  <Text className="font-outfit-bold text-white text-center text-lg">Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row justify-center mb-5">
              <Text className="font-outfit text-gray-600">Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
                <Text className="font-outfit-bold text-pink-600">Register</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`border border-gray-200 flex-row justify-center items-center py-3.5 rounded-xl bg-white ${isLoading ? "opacity-70" : ""}`}
              style={{ 
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 2,
              }}
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Image
                source={{ uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" }}
                style={{ width: 22, height: 22 }}
                className="mr-3"
              />
              <Text className="font-outfit-medium text-gray-700">{isLoading ? "Signing In..." : "Continue with Google"}</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeInUp.delay(600).duration(800)} className="mt-6">
            <Text className="font-outfit text-gray-500 text-center text-xs">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

export default SignInPage
