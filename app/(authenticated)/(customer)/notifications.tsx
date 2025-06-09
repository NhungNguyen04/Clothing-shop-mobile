import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNotificationStore } from "../../../store/NotificationStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ChevronLeft } from "react-native-feather";
import { router } from "expo-router";

export default function NotificationScreen() {
  const {
    isLoading,
    notifications,
    unreadCount,
    fetchNotifications,
    fetchNotificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    // These functions will now use the updated API endpoints with user ID
    fetchNotifications();
    fetchNotificationCount();
  }, []);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center mb-6">
      <TouchableOpacity onPress={()=> router.back()} className="mr-4">
          <ChevronLeft width={22} height={22} color="#555" />
        </TouchableOpacity>
      <Text style={styles.header}>Notifications</Text>
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {unreadCount ? (
          <Text>{unreadCount} unread notify</Text>
        ) : (
          <Text>Nothing new</Text>
        )}

        <TouchableOpacity onPress={() => markAllAsRead()}>
          <Text>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={{ marginTop: 20 }}
        data={notifications}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.notificationItem,
              !item.isRead && { backgroundColor: "#eef6ff" },
            ]}
          >
            <TouchableOpacity
              onPress={() => markAsRead(item.id)}
              style={{ flex: 1 }}
            >
              <Text style={styles.message}>{item.message}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                setDeletingId(item.id);
                await deleteNotification(item.id);
                setDeletingId(null);
              }}
            >
              {deletingId === item.id ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="close-circle" size={20} color="#ff4d4f" />
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 18, fontWeight: "bold"},
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  title: { fontWeight: "600" },
  message: { fontSize: 13, color: "#555" },
});
