import { router, Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Pressable, Image, Dimensions, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() || 'light';
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        tabBarActiveTintColor: Colors[colorScheme].tabIconSelected,
      }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.arrow.trianglehead.counterclockwise" color={color} />,
        }}
      ></Tabs.Screen>
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

const styles = StyleSheet.create({
  iconButton: {
    padding: 5, // Add some padding for a larger touch target
  },
  bottomNavigation: {
    padding: 8
  }
});