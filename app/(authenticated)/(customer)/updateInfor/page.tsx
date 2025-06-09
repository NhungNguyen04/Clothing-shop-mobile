import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Platform,
  ToastAndroid,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useUserStore } from "@/store/UserStore";
import { useAuth } from "@/context/AuthContext";

export default function UpdateProfile() {
  const { setUser, user } = useAuth();
  const currentUser = useUserStore((s) => s.currentUser);
  const isLoading = useUserStore((s) => s.isLoading);
  const error = useUserStore((s) => s.error);
  const loadUser = useUserStore((s) => s.loadCurrentUser);
  const updateUser = useUserStore((s) => s.updateUserProfile);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [avatar, setAvatar] = useState<string | null>(null);

  // Prefill ONCE
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setEmail(currentUser.email);

    setAvatar(
      currentUser.image ||
        "https://ui-avatars.com/api/?name=" +
          encodeURI(currentUser.name) +
          "&background=random"
    );
  }, [currentUser]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Cần cấp quyền truy cập ảnh.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets.length > 0) {
      setAvatar(res.assets[0].uri);
    }
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Lỗi", "Tên không được để trống");
    if (!validateEmail(email)) return Alert.alert("Lỗi", "Email không hợp lệ");

    const success = await updateUser(
      {
        name,
        email,

        image: avatar || undefined,
      },
      setUser,
      user
    );
    if (success) {
      const msg = "Update Success";
      if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert("Update Success", msg);
      // nếu cần làm gì thêm...
    } else {
      Alert.alert("Error", error || "fail to update");
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar picker */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Form fields */}
      <Field label="Tên" value={name} onChange={setName} />
      <Field
        label="Email"
        value={email}
        onChange={setEmail}
        keyboard="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Lưu thay đổi</Text>
      </TouchableOpacity>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const Field = ({
  label,
  value,
  onChange,
  keyboard = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: any;
}) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboard}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", paddingBottom: 40 },
  avatarContainer: { alignSelf: "center", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 36, color: "#999" },
  label: { fontSize: 14, marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#ec4899",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  error: { color: "red", marginTop: 12, textAlign: "center" },
});
