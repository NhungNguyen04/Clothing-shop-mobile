"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from "react-native"
import CheckBox from "@/components/CheckBox"
import QuantityControl from "@/components/QuantityControl"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useNavigation } from "expo-router"
import { ChevronLeft } from "react-native-feather"
import { useCartStore } from "@/store/CartStore"

export default function CartScreen() {
  const { 
    cart, 
    itemsBySeller,
    isLoading, 
    error, 
    updateQuantity, 
    removeItem, 
    removeSellerItems, 
    clearCartError 
  } = useCartStore();

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [selectedSellers, setSelectedSellers] = useState<Record<string, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
  }, [cart])

  // Initialize selected items when cart changes
  useEffect(() => {
    if (cart && cart.cartItems) {
      const initialSelectedItems: Record<string, boolean> = {}
      const initialSelectedSellers: Record<string, boolean> = {}

      cart.cartItems.forEach((item) => {
        initialSelectedItems[item.id] = true
      })

      if (itemsBySeller) {
        itemsBySeller.forEach((sellerGroup) => {
          initialSelectedSellers[sellerGroup.sellerId] = true
        })
      }

      setSelectedItems(initialSelectedItems)
      setSelectedSellers(initialSelectedSellers)
    }
  }, [cart?.cartItems, itemsBySeller])

  // Handle cart errors
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearCartError }])
    }
  }, [error, clearCartError])

  const toggleItemSelection = useCallback((itemId: string, sellerId: string) => {
    setSelectedItems(prev => {
      const newSelectedItems = { ...prev }
      newSelectedItems[itemId] = !prev[itemId]
      
      // Update seller selection based on all items
      const sellerItems = itemsBySeller?.find((s) => s.sellerId === sellerId)?.items || []
      const allSellerItemsSelected = sellerItems.every((item) => newSelectedItems[item.id])
      
      setSelectedSellers(prevSellers => ({
        ...prevSellers,
        [sellerId]: allSellerItemsSelected
      }))
      
      return newSelectedItems
    })
  }, [itemsBySeller])

  const toggleSellerSelection = useCallback((sellerId: string) => {
    setSelectedSellers(prev => {
      const newSellerState = !prev[sellerId]
      
      // Update all items for this seller
      const sellerItems = itemsBySeller?.find((s) => s.sellerId === sellerId)?.items || []
      
      setSelectedItems(prevItems => {
        const newSelectedItems = { ...prevItems }
        
        sellerItems.forEach((item) => {
          newSelectedItems[item.id] = newSellerState
        })
        
        return newSelectedItems
      })
      
      return { ...prev, [sellerId]: newSellerState }
    })
  }, [itemsBySeller])

  const handleUpdateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      await updateQuantity(itemId, newQuantity)
    } catch (err) {
      console.error("Failed to update quantity:", err)
    }
  }, [updateQuantity])

  const handleRemoveItem = useCallback((itemId: string) => {
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
  }, [removeItem])

  const handleRemoveSellerItems = useCallback((sellerId: string, sellerName: string) => {
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
  }, [removeSellerItems])

  const calculateSelectedTotal = useCallback(() => {
    if (!cart || !cart.cartItems) return 0

    return cart.cartItems
      .filter((item) => selectedItems[item.id])
      .reduce((total, item) => total + item.totalPrice, 0)
  }, [cart, selectedItems])

  const countSelectedItems = useCallback(() => {
    return Object.values(selectedItems).filter((selected) => selected).length
  }, [selectedItems])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await useCartStore.getState().refreshCart()
    } catch (error) {
      console.error('Error refreshing cart:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Show loading during initial load or when isLoading is true
  const showLoading = isLoading

  if (showLoading && !cart) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#ec4899" />
        <Text className="mt-3 text-lg text-gray-600">Loading your cart...</Text>
      </View>
    )
  }

  if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
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
      {/* Header */}
      <View className="flex-row items-center p-2 bg-white border-b border-gray-300 mt-[-40]">
        <TouchableOpacity 
          className="p-1"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft width={24} height={24} color="#000" />
        </TouchableOpacity>
        <Text className="ml-2 font-outfit text-gray-600">{cart?.cartItems?.length || 0} items</Text>
      </View>

      {/* Main Content */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {itemsBySeller && itemsBySeller.length > 0 ? (
          itemsBySeller.map((sellerGroup) => (
            <View key={sellerGroup.sellerId} className="bg-white rounded-lg mb-4 overflow-hidden border border-gray-300">
              {/* Seller Header */}
              <View className="flex-row justify-between items-center p-3 border-b border-gray-300 bg-gray-100">
                <View className="flex-row items-center">
                  <CheckBox
                    checked={selectedSellers[sellerGroup.sellerId] || false}
                    onPress={() => toggleSellerSelection(sellerGroup.sellerId)}
                  />
                  <Text className="ml-2 text-base font-outfit-bold">
                    {sellerGroup.sellerName || 'Unknown Seller'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveSellerItems(sellerGroup.sellerId, sellerGroup.sellerName || 'Unknown Seller')}
                  className="p-2"
                >
                  <Text className="text-red-500 font-outfit-medium">Remove All</Text>
                </TouchableOpacity>
              </View>

              {/* Items in this seller group */}
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
                      
                      {item.sizeStock.quantity < 5 && (
                        <Text className="text-xs text-orange-500 mb-1">
                          Only {item.sizeStock.quantity} left in stock
                        </Text>
                      )}

                      <View className="flex-row justify-between items-center">
                        <QuantityControl
                          quantity={item.quantity}
                          onIncrease={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          onDecrease={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          maxQuantity={item.sizeStock.quantity}
                          disabled={isLoading}
                        />

                        <TouchableOpacity 
                          onPress={() => handleRemoveItem(item.id)} 
                          className="p-2"
                          disabled={isLoading}
                        >
                          <Ionicons name="trash" color={isLoading ? "#ccc" : "#F44336"} size={20}></Ionicons>
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
          ))
        ) : !isLoading ? (
          <View className="items-center justify-center py-8">
            <Text className="text-gray-500 text-lg">No items in your cart</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Show loading overlay when loading but cart already exists */}
      {isLoading && (
        <View className="absolute inset-0 bg-black/10 justify-center items-center z-50">
          <View className="bg-white p-5 rounded-lg shadow-lg">
            <ActivityIndicator size="large" color="#ec4899" />
            <Text className="mt-3 text-center font-outfit">Updating cart...</Text>
          </View>
        </View>
      )}

      {/* Bottom checkout bar */}
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
            countSelectedItems() === 0 ? 'bg-gray-400' : 'bg-black'
          } px-6 py-4 items-center w-4/5 mx-auto`}
          disabled={countSelectedItems() === 0}
          onPress={() => {
            router.push('/(authenticated)/(customer)/checkout/page')
          }}
        >
          <Text className="text-white font-outfit-medium">
            Proceed to Checkout ({countSelectedItems()})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}