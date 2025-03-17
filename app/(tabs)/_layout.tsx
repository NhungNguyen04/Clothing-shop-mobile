import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Pressable, Image, Dimensions } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Extract TopNavigation as a separate component
const TopNavigation = ({ colorScheme = 'light' as 'light' | 'dark' }) => (
  <View style={[
    styles.topNavContainer,
    {backgroundColor: Colors[colorScheme].background}
    ]}>
    <View style={styles.logoContainer}>
      <Image 
        source={require('@/assets/logo.png')} 
        style={styles.logo} 
        resizeMode="contain" // Ensures the logo scales properly without cropping
      />
    </View>
    <View style={styles.actionsContainer}>
      <Pressable onPress={() => {}} style={styles.iconButton}>
        <IconSymbol size={24} name="cart" color={Colors[colorScheme].tabIconSelected} />
      </Pressable>
    </View>
  </View>
);

export default function TabLayout() {
  const colorScheme = useColorScheme() || 'light';
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
        header: () => <TopNavigation colorScheme={colorScheme} />,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          ...Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
        backgroundColor: Colors[colorScheme].background
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='magnifyingglass' color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='person' color={color} />,
        }}
      />
    </Tabs>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
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
    width: width * 0.25, // Responsive width based on screen size
    height: 40, // Fixed height
    resizeMode: 'contain', // Ensures the logo maintains its aspect ratio
  },
  iconButton: {
    padding: 5, // Add some padding for a larger touch target
  },
  bottomNavigation: {
    padding: 8
  }
});