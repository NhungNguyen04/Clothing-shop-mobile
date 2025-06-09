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
import axiosInstance from "@/services/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ChevronLeft } from "react-native-feather";

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
  const [uploading, setUploading] = useState(false);

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

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      const formData = new FormData();
      const fileExtension = uri.split(".").pop() || "jpg";

      // @ts-ignore - TypeScript doesn't recognize append with this format
      formData.append("file", {
        uri,
        name: `avatar-${Date.now()}.${fileExtension}`,
        type: `image/${fileExtension}`,
      });

      const uploadResponse = await axiosInstance.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", JSON.stringify(uploadResponse.data));

      // Check for successful response
      if (uploadResponse.data?.success === true) {
        // The API returns the URL directly in the data field
        const imageUrl = uploadResponse.data.data;

        if (typeof imageUrl === "string") {
          // Update avatar
          setAvatar(imageUrl);
          return imageUrl;
        } else {
          throw new Error("Invalid image URL format in response");
        }
      } else {
        throw new Error(
          "Upload failed: " + (uploadResponse.data?.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload profile image");
      return null;
    } finally {
      setUploading(false);
    }
  };

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
      const uploadedImageUrl = await uploadImage(res.assets[0].uri);
      if (uploadedImageUrl) {
        setAvatar(uploadedImageUrl);
      }
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
       <View className="flex-row items-center w-full mb-4">
                <TouchableOpacity onPress={() => router.back()}>
                  <ChevronLeft width={22} height={22} color="#555" />
                </TouchableOpacity>
                <Text className="text-xl font-outfit-bold">Customer Profile</Text>
                </View>
      {/* Avatar picker */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={pickAvatar}
        disabled={uploading}
      >
        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>+</Text>
            </View>
          )}

          {/* Camera icon overlay */}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        </View>

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {uploading && <Text style={styles.uploadingText}>Uploading image...</Text>}

      {/* Form fields */}
      <Field label="Tên" value={name} onChange={setName} />
      <Field
        label="Email"
        value={email}
        onChange={setEmail}
        keyboard="email-address"
      />

      <TouchableOpacity
        style={[styles.button, uploading ? styles.disabledButton : null]}
        onPress={handleSave}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? "Đang tải lên..." : "Lưu thay đổi"}
        </Text>
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
  avatarWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
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
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ec4899",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});
