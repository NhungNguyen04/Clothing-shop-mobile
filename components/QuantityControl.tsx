import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

interface QuantityControlProps {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  maxQuantity?: number
}

const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  maxQuantity = Number.POSITIVE_INFINITY,
}) => {
  const isDecrementDisabled = quantity <= 1
  const isIncrementDisabled = maxQuantity !== undefined && quantity >= maxQuantity

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isDecrementDisabled && styles.disabledButton]}
        onPress={onDecrease}
        disabled={isDecrementDisabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, isDecrementDisabled && styles.disabledText]}>-</Text>
      </TouchableOpacity>

      <Text style={styles.quantity}className="font-outfit">{quantity}</Text>

      <TouchableOpacity
        style={[styles.button, isIncrementDisabled && styles.disabledButton]}
        onPress={onIncrease}
        disabled={isIncrementDisabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, isIncrementDisabled && styles.disabledText]}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    borderRadius: 4,
    overflow: "hidden",
    width: 96,
  },
  button: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledText: {
    color: "#a0a0a0",
  },
  quantity: {
    width: 32,
    textAlign: "center",
    fontSize: 14,
  },
})

export default QuantityControl
