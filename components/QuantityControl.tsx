import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  maxQuantity: number;
  disabled?: boolean;
}

const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  maxQuantity,
  disabled = false
}) => {
  const isMaxReached = quantity >= maxQuantity;
  const isMinReached = quantity <= 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          styles.leftButton,
          (isMinReached || disabled) && styles.disabledButton
        ]}
        onPress={onDecrease}
        disabled={isMinReached || disabled}
      >
        <Text style={[styles.buttonText, (isMinReached || disabled) && styles.disabledText]}>-</Text>
      </TouchableOpacity>
      
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityText}>{quantity}</Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.button,
          styles.rightButton,
          (isMaxReached || disabled) && styles.disabledButton
        ]}
        onPress={onIncrease}
        disabled={isMaxReached || disabled}
      >
        <Text style={[styles.buttonText, (isMaxReached || disabled) && styles.disabledText]}>+</Text>
      </TouchableOpacity>
      
      {isMaxReached && (
        <Text style={styles.maxReachedText}>Max</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  button: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  leftButton: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  rightButton: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  quantityContainer: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledText: {
    color: '#9ca3af',
  },
  maxReachedText: {
    position: 'absolute',
    top: -15,
    right: 0,
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '500',
  }
});

export default QuantityControl;
