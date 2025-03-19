"use client"

import { useState, useEffect } from "react"
import { Image, ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useAuth } from "@/context/AuthContext"
import { AuthService } from "@/src/auth-service"

const RegisterPage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  // Handle deep links when app is already open
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url
      if (url.includes("token=")) {
        const token = url.split("token=")[1].split("&")[0]
        try {
          // Fetch user data
          const response = await fetch(`${process.env.API_ENDPOINT}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error("Failed to fetch user data")
          }

          const userData = await response.json()
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

    return () => {
      subscription.remove()
    }
  }, [login, router])

  const handleRegister = async () => {
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.API_ENDPOINT}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        Alert.alert("Error", data.message || "Registration failed")
        return
      }

      Alert.alert("Success", "Account created successfully! Please sign in to continue.", [
        { text: "OK", onPress: () => router.push("/sign-in") },
      ])
    } catch (error) {
      console.error("Registration error:", error)
      Alert.alert("Error", "An error occurred during registration. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const result = await AuthService.loginWithGoogle()

      if (result.success && result.data) {
        await login(result.data)
        router.push("/(tabs)")
      } else {
        Alert.alert("Authentication Error", result.error || "Failed to sign up with Google")
      }
    } catch (error) {
      console.error("Google sign up error:", error)
      Alert.alert("Error", "Failed to sign up with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="h-full">
      <ScrollView contentContainerClassName="h-full justify-center items-center px-6">
        <Image source={require("../assets/logo.png")} resizeMode="contain" className="w-3/5 h-32 mb-6" />

        <View className="w-full mb-6">
          <Text className="text-2xl font-bold text-center uppercase text-pink-500">Create an Account</Text>
          <Text className="text-gray-500 text-center mt-2 text-base">Join our fashion community today</Text>
        </View>

        <View className="w-full rounded-xl bg-white p-6 shadow-md">
          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium ml-1">Full Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base"
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          </View>

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

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium ml-1">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base"
              placeholder="Create a password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-2 font-medium ml-1">Confirm Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-base"
              placeholder="Confirm your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            className={`bg-pink-500 py-3 rounded-lg mb-4 ${isLoading ? "opacity-70" : ""}`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isLoading ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/sign-in")} disabled={isLoading}>
              <Text className="text-pink-500 font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`border border-gray-300 flex-row justify-center items-center py-3 rounded-lg mt-4 ${isLoading ? "opacity-70" : ""}`}
            onPress={handleGoogleSignUp}
            disabled={isLoading}
          >
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" }}
              style={{ width: 20, height: 20 }}
              className="mr-2"
            />
            <Text className="text-gray-700 font-medium">{isLoading ? "Signing Up..." : "Sign Up with Google"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default RegisterPage

