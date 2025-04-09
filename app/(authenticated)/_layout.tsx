import { Stack } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Image, Dimensions, TouchableOpacity, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { CartProvider } from '@/context/CartContext';
import { useCartContext } from '@/context/CartContext';

// Separate TopNavigation component
function TopNavigation({ colorScheme = 'light' as 'light' | 'dark' }) {
  const { cart, refreshCart } = useCartContext();
  
  // Calculate total items in cart
  const totalItems = cart?.cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;
  
  // Refresh cart when component mounts
  React.useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <View style={[
      styles.topNavContainer,
      {backgroundColor: Colors[colorScheme].background}
    ]}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => {router.navigate("/cart")}} style={styles.iconButton}>
          <IconSymbol size={24} name="cart" color={Colors[colorScheme].tabIconSelected} />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Main Layout component that will render both the TopNavigation and child screens
export default function AuthenticatedLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <CartProvider>
      <View style={{ flex: 1 }}>
        <TopNavigation colorScheme={colorScheme} />
        <Stack
          screenOptions={{
            headerShown: false, // Hide the default header
            contentStyle: { backgroundColor: Colors[colorScheme].background }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        </Stack>
      </View>
    </CartProvider>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  // Your existing styles
  topNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 8,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  logo: {
    width: width * 0.25,
    height: 40,
    resizeMode: 'contain',
  },
  iconButton: {
    padding: 5,
  },
  bottomNavigation: {
    padding: 8
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});