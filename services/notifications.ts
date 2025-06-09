import axiosInstance from "./axiosInstance";
import { useAuthStore } from "../store/AuthStore"; // Import for getting the user ID

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get the current user ID
const getCurrentUserId = (): string => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("User is not authenticated");
  }
  return user.id;
};

// Lấy tất cả notification của user hiện tại
export const getNotifications = async (): Promise<AppNotification[]> => {
  const userId = getCurrentUserId();
  const response = await axiosInstance.get<AppNotification[]>(
    `/notifications/user/${userId}`
  );
  return response.data;
};

// Lấy các notification chưa đọc
export const getUnreadNotifications = async (): Promise<AppNotification[]> => {
  const userId = getCurrentUserId();
  const response = await axiosInstance.get<AppNotification[]>(
    `/notifications/user/${userId}/unread`
  );
  return response.data;
};

// Lấy count notification chưa đọc
export const getNotificationCount = async (): Promise<number> => {
  const userId = getCurrentUserId();
  const response = await axiosInstance.get<{ count: number }>(
    `/notifications/user/${userId}/count`
  );
  return response.data.count;
};

// Đánh dấu 1 notification là đã đọc
export const markNotificationAsRead = async (id: string): Promise<void> => {
  await axiosInstance.put(`/notifications/${id}/read`);
};

// Đánh dấu tất cả notification là đã đọc
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const userId = getCurrentUserId();
  await axiosInstance.put(`/notifications/user/${userId}/read-all`);
};

// Xoá 1 notification
export const deleteNotificationApi = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/notifications/${id}`);
};

// Xoá tất cả notification (nếu cần dùng)
export const deleteAllNotificationApi = async (): Promise<void> => {
  const userId = getCurrentUserId();
  await axiosInstance.delete(`/notifications/user/${userId}`);
};
