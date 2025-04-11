"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native"
import { useCartContext } from "@/context/CartContext"
import CheckBox from "@/components/CheckBox"
import QuantityControl from "@/components/QuantityControl"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "expo-router"
import { ChevronLeft } from "react-native-feather"

export default function CartScreen() {
  const { cart, isLoading, error, refreshCart, updateQuantity, removeItem, removeSellerItems, clearCartError } =
    useCartContext()

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [selectedSellers, setSelectedSellers] = useState<Record<string, boolean>>({})
  const navigation = useNavigation()

  useEffect(() => {
    if (cart?.cartItems) {
      const initialSelectedItems: Record<string, boolean> = {}
      const initialSelectedSellers: Record<string, boolean> = {}

      cart.cartItems.forEach((item) => {
        initialSelectedItems[item.id] = true
      })

      cart.itemsBySeller.forEach((sellerGroup) => {
        initialSelectedSellers[sellerGroup.sellerId] = true
      })

      setSelectedItems(initialSelectedItems)
      setSelectedSellers(initialSelectedSellers)
    }
  }, [cart?.id])

  const handleRefresh = () => {
    refreshCart()
  }

  const toggleItemSelection = (itemId: string, sellerId: string) => {
    const newSelectedItems = { ...selectedItems }
    newSelectedItems[itemId] = !selectedItems[itemId]
    setSelectedItems(newSelectedItems)

    const sellerItems = cart?.itemsBySeller.find((s) => s.sellerId === sellerId)?.items || []
    const allSellerItemsSelected = sellerItems.every((item) => newSelectedItems[item.id])

    const newSelectedSellers = { ...selectedSellers }
    newSelectedSellers[sellerId] = allSellerItemsSelected
    setSelectedSellers(newSelectedSellers)
  }

  const toggleSellerSelection = (sellerId: string) => {
    const newSellerState = !selectedSellers[sellerId]
    const newSelectedSellers = { ...selectedSellers }
    newSelectedSellers[sellerId] = newSellerState
    setSelectedSellers(newSelectedSellers)

    const newSelectedItems = { ...selectedItems }
    const sellerItems = cart?.itemsBySeller.find((s) => s.sellerId === sellerId)?.items || []

    sellerItems.forEach((item) => {
      newSelectedItems[item.id] = newSellerState
    })

    setSelectedItems(newSelectedItems)
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      await updateQuantity(itemId, newQuantity)
    } catch (err) {
      console.error("Failed to update quantity:", err)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeItem(itemId)
          } catch (err) {
            console.error("Failed to remove item:", err)
          }
        },
      },
    ])
  }

  const handleRemoveSellerItems = (sellerId: string, sellerName: string) => {
    Alert.alert("Remove All Items", `Are you sure you want to remove all items from ${sellerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove All",
        style: "destructive",
        onPress: async () => {
          try {
            await removeSellerItems(sellerId)
          } catch (err) {
            console.error("Failed to remove seller items:", err)
          }
        },
      },
    ])
  }

  const calculateSelectedTotal = () => {
    if (!cart) return 0

    return cart.cartItems.filter((item) => selectedItems[item.id]).reduce((total, item) => total + item.totalPrice, 0)
  }

  const countSelectedItems = () => {
    return Object.values(selectedItems).filter((selected) => selected).length
  }

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearCartError }])
    }
  }, [error, clearCartError])

  if (isLoading && !cart) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#ec4899" />
        <Text className="mt-3 text-lg text-gray-600">Loading your cart...</Text>
      </View>
    )
  }

  if (!cart || cart.cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-5 bg-gray-100">
        <Text className="text-xl font-bold mb-2">Your cart is empty</Text>
        <Text className="text-lg text-gray-600 text-center mb-6">Add items to your cart to see them here</Text>
        <TouchableOpacity
          className="bg-pink-500 px-6 py-4 rounded-lg items-center w-4/5"
          onPress={() => {
            navigation.goBack()
          }}
        >
          <Text className="text-white font-bold text-lg">Continue Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center p-2 bg-white border-b border-gray-300 mt-[-30]">
       <TouchableOpacity 
          className="p-1"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft width={24} height={24} color="#000" />
        </TouchableOpacity>
        <Text className="ml-2 font-outfit text-gray-600">{cart.cartItems.length} items</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 12 }}>
        {cart.itemsBySeller.map((sellerGroup) => (
          <View key={sellerGroup.sellerId} className="bg-white rounded-lg mb-4 overflow-hidden border border-gray-300">
            <View className="flex-row justify-between items-center p-3 border-b border-gray-300 bg-gray-100">
              <View className="flex-row items-center">
                <CheckBox
                  checked={selectedSellers[sellerGroup.sellerId] || false}
                  onPress={() => toggleSellerSelection(sellerGroup.sellerId)}
                />
                <Text className="ml-2 text-base font-outfit-bold">{sellerGroup.sellerName}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveSellerItems(sellerGroup.sellerId, sellerGroup.sellerName)}
                className="p-2"
              >
                <Text className="text-red-500 font-outfit-medium">Remove All</Text>
              </TouchableOpacity>
            </View>

            {sellerGroup.items.map((item) => (
              <View key={item.id} className="border-b border-gray-300 p-3">
                <View className="flex-row">
                  <CheckBox
                    checked={selectedItems[item.id] || false}
                    onPress={() => toggleItemSelection(item.id, sellerGroup.sellerId)}
                  />

                  <Image
                    source={{
                      uri: item.sizeStock?.product?.image?.[0] || 'https://via.placeholder.com/80'
                    }}
                    className="w-20 h-20 rounded ml-2"
                  />

                  <View className="flex-1 ml-3">
                    <Text className="text-base font-outfit-medium mb-1" numberOfLines={2}>
                      {item.sizeStock?.product?.name || 'Product Name Unavailable'}
                    </Text>
                    <Text className="font-outfit text-sm text-gray-600 mb-1">Size: {item.sizeStock?.size || 'N/A'}</Text>
                    <Text className="text-base font-outfit-bold text-pink-500 mb-2">
                      ${(item.sizeStock?.product?.price || 0).toFixed(2)}
                    </Text>

                    <View className="flex-row justify-between items-center">
                      <QuantityControl
                        quantity={item.quantity}
                        onIncrease={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        onDecrease={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        maxQuantity={item.sizeStock.quantity}
                      />

                      <TouchableOpacity onPress={() => handleRemoveItem(item.id)} className="p-2">
                        <Ionicons name="trash" color="#F44336" size={20}></Ionicons>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View className="mt-2 items-end">
                  <Text className="text-sm font-outfit-medium">Item Total: ${item.totalPrice.toFixed(2)}</Text>
                </View>
              </View>
            ))}

            <View className="p-3 border-t border-gray-300 items-end bg-gray-100">
              <Text className="text-base font-outfit-medium">Total: ${sellerGroup.totalValue.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {isLoading && (
        <View className="absolute inset-0 bg-white/70 justify-center items-center z-50">
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      )}

      <View className="p-4 bg-white border-t border-gray-300">
        <View className="flex-row justify-between mb-2">
          <Text className="font-outfit text-base">Selected Items:</Text>
          <Text className="font-outfit text-base font-medium">{countSelectedItems()}</Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text className="font-outfit text-base">Total:</Text>
          <Text className="text-xl font-outfit-bold text-pink-500">${calculateSelectedTotal().toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          className={`${
            countSelectedItems() === 0 ? 'bg-gray-400' : 'bg-pink-500'
          } px-6 py-4 rounded-lg items-center w-4/5 mx-auto`}
          disabled={countSelectedItems() === 0}
          onPress={() => {
            /* Navigate to checkout */
          }}
        >
          <Text className="text-white font-outfit-bold text-lg">
            Proceed to Checkout ({countSelectedItems()})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
