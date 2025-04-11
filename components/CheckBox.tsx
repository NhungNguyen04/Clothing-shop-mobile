import type React from "react"
import { TouchableOpacity, View, StyleSheet } from "react-native"

interface CheckBoxProps {
  checked: boolean
  onPress: () => void
  disabled?: boolean
}

const CheckBox: React.FC<CheckBoxProps> = ({ checked, onPress, disabled = false }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} disabled={disabled} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checked, disabled && styles.disabled]}>
        {checked && <View style={styles.checkmark} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ec4899",
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#ec4899",
  },
  disabled: {
    borderColor: "#a0a0a0",
    backgroundColor: "transparent",
  },
  checkmark: {
    width: 10,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "white",
    transform: [{ rotate: "-45deg" }],
    marginTop: -2,
  },
})

export default CheckBox
