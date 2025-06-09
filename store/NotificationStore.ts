import { create } from "zustand";
import {
  AppNotification,
  getNotifications,
  getUnreadNotifications,
  getNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationApi,
  deleteAllNotificationApi,
} from "@/services/notifications";

import { useAuthStore } from "./AuthStore";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  fetchUnreadNotifications: () => Promise<void>;
  fetchNotificationCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ error: "User not authenticated", isLoading: false });
        return;
      }

      const response = await getNotifications();
      set({ notifications: response, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch notifications",
        isLoading: false,
      });
    }
  },

  fetchUnreadNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ error: "User not authenticated", isLoading: false });
        return;
      }

      const response = await getUnreadNotifications();
      set({ notifications: response, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch unread notifications",
        isLoading: false,
      });
    }
  },

  fetchNotificationCount: async () => {
    try {
      const count = await getNotificationCount();
      set({ unreadCount: count });
    } catch (error) {
      set({ error: "Failed to fetch notification count" });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      set({ error: "Failed to mark notification as read" });
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({ error: "Failed to mark all notifications as read" });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await deleteNotificationApi(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    } catch (error) {
      set({ error: "Failed to delete notification" });
    }
  },

  deleteAllNotifications: async (id: string) => {
    try {
      await deleteAllNotificationApi(id);
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      set({ error: "Failed to delete all notifications" });
    }
  },
}));
