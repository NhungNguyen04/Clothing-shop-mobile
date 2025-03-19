"use client"

import { useState, useEffect } from "react"
import { Image, ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useAuth } from "@/context/AuthContext"
import { AuthService } from "@/src/auth-service"
import * as WebBrowser from "expo-web-browser"

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession()

const SignInPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  // Handle deep links when app is already open
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url
      if (url.includes("token=")) {
        try {
          // Extract token from URL
          const token = url.split("token=")[1].split("&")[0]

          // Check if there's user data in the URL
          let userData = null
          if (url.includes("user=")) {
            try {
              const userDataStr = url.split("user=")[1].split("&")[0]
              userData = JSON.parse(decodeURIComponent(userDataStr))
            } catch (e) {
              console.error("Error parsing user data from URL:", e)
            }
          }

          // If we don't have user data, we'll need to decode the JWT token
          if (!userData) {
            try {
              const base64Url = token.split(".")[1]
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join(""),
              )

              const payload = JSON.parse(jsonPayload)
              userData = {
                id: payload.sub,
                email: payload.email,
                name: payload.name || "User",
              }
            } catch (e) {
              console.error("Error decoding JWT:", e)
              // Fallback user data
              userData = {
                id: "unknown",
                email: "user@example.com",
                name: "User",
              }
            }
          }

          await login({ access_token: token, user: userData })
          router.push("/(tabs)")
        } catch (error) {
          console.error("Error processing deep link:", error)
          Alert.alert("Authentication Error", "Failed to complete authentication")
        }
      }
    }

    // Add listener for deep links
    const subscription = Linking.addEventListener("url", handleDeepLink as any)

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [login, router])

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("https://clothing-shop-be-production.up.railway.app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!data.access_token) {
        Alert.alert("Error", data.message || "Login failed")
        return
      }

      // Use the context to store authentication data
      await login(data)

      // Navigate to home screen
      router.push("/(tabs)")
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
      const result = await AuthService.loginWithGoogle()

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

  // Add this function to your SignInPage component
  const testDeepLink = async () => {
    const result = await AuthService.testDeepLink()
    if (result) {
      Alert.alert("Success", "Deep linking is working!")
    } else {
      Alert.alert("Error", "Deep linking is not working. Please check your app configuration.")
    }
  }

  return (
    <SafeAreaView className="h-full">
      <ScrollView contentContainerClassName="h-full justify-center items-center px-6">
        <Image source={require("../assets/logo.png")} resizeMode="contain" className="w-3/5 h-32" />

        <View className="w-full mb-6">
          <Text className="text-2xl font-bold text-center uppercase text-pink-500">Welcome to Nh-Clothing</Text>
          <Text className="text-gray-500 text-center mt-2 text-base">Style Made Simple – Shop, Try, Love!</Text>
        </View>

        <View className="w-full rounded-xl bg-white p-6 shadow-md">
          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium ml-1">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base"
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View className="mb-2">
            <Text className="text-gray-700 mb-2 font-medium ml-1">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base"
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity className="mb-6" onPress={handleForgotPassword} disabled={isLoading}>
            <Text className="text-pink-500 text-right font-medium">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`bg-pink-500 py-3 rounded-lg mb-4 ${isLoading ? "opacity-70" : ""}`}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-bold text-lg">{isLoading ? "Signing In..." : "Sign In"}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mb-4">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
              <Text className="text-pink-500 font-bold">Register</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`border border-gray-300 flex-row justify-center items-center py-3 rounded-lg ${isLoading ? "opacity-70" : ""}`}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" }}
              style={{ width: 20, height: 20 }}
              className="mr-2"
            />
            <Text className="text-gray-700 font-medium">{isLoading ? "Signing In..." : "Sign In with Google"}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mt-2 py-2 border border-gray-300 rounded-lg" onPress={testDeepLink}>
            <Text className="text-center text-gray-700">Test Deep Link</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignInPage

