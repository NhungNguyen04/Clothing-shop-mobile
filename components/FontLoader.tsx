import { View, Text, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import React from 'react';

export default function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    'Outfit': require('../assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Bold': require('../assets/fonts/Outfit-Bold.ttf'),
    'Outfit-Medium': require('../assets/fonts/Outfit-Medium.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={{ marginTop: 16 }}>Loading fonts...</Text>
      </View>
    );
  }

  return <>{children}</>;
}