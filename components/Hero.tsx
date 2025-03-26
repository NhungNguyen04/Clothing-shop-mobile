import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const FashionHero = () => {
  return (
    <View style={styles.container}>
      {/* Top section with white background */}
      <View style={styles.topSection}>
        <View style={styles.headerContainer}>
          <View style={styles.line} />
          <Text style={styles.headerText}>OUR BESTSELLERS</Text>
        </View>
        
        <Text style={styles.mainHeading}>Latest Arrivals</Text>
        
        <TouchableOpacity style={styles.shopNowContainer}>
          <Text style={styles.shopNowText}>SHOP NOW</Text>
          <View style={styles.line} />
        </TouchableOpacity>
      </View>
      
      {/* Bottom section with pink background and image */}
      <View style={styles.bottomSection}>
        <Image
          source={ require('../assets/hero_img.png') }
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width > 500 ? 500 : width, // Max width similar to max-w-4xl
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  topSection: {
    backgroundColor: 'white',
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  line: {
    width: 24,
    height: 1,
    backgroundColor: '#9ca3af',
    marginHorizontal: 8,
  },
  headerText: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#4b5563',
  },
  mainHeading: {
    fontSize: width > 500 ? 36 : 30,
    fontFamily: 'serif', // Note: You may need to load a custom font
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 24,
  },
  shopNowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopNowText: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#4b5563',
  },
  bottomSection: {
    height: width > 500 ? 320 : 256,
    backgroundColor: '#fad3ce',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
});

export default FashionHero;