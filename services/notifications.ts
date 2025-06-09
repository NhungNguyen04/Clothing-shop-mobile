import axiosInstance from "./axiosInstance";

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// Lấy tất cả notification của user hiện tại
export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await axiosInstance.get<AppNotification[]>("/notifications");
  return response.data;
};

// Lấy các notification chưa đọc
export const getUnreadNotifications = async (): Promise<AppNotification[]> => {
  const response = await axiosInstance.get<AppNotification[]>(
    "/notifications/unread"
  );
  return response.data;
};

// Lấy count notification chưa đọc
export const getNotificationCount = async (): Promise<number> => {
  const response = await axiosInstance.get<{ count: number }>(
    "/notifications/count"
  );
  return response.data.count;
};

// Đánh dấu 1 notification là đã đọc
export const markNotificationAsRead = async (id: string): Promise<void> => {
  await axiosInstance.put(`/notifications/${id}/read`);
};

// Đánh dấu tất cả notification là đã đọc
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await axiosInstance.put("/notifications/read-all");
};

// Xoá 1 notification
export const deleteNotificationApi = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/notifications/${id}`);
};

// Xoá tất cả notification (nếu cần dùng)
export const deleteAllNotificationApi = async (id: string): Promise<void> => {
  await axiosInstance.delete("/notifications/user/:userId");
};
