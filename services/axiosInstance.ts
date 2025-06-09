import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // For Android emulators, localhost points to the emulator's own loopback interface
  // 10.0.2.2 is the special IP that allows Android emulator to access the host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3300';
  }
  else if (Platform.OS === 'ios') {
    return 'http://localhost:3300';
  }
  return 'http://localhost:3300';
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Safe string conversion for logging
      const safeData = config.data ? JSON.stringify(config.data) : "no data";
      const safeUrl = config.url || "unknown endpoint";
      console.log(
        `${config.method?.toUpperCase() || "REQUEST"} ${safeUrl}`,
        safeData
      );

      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error in request interceptor:", error);
      // Don't throw - continue with the request
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    try {
      // Safe logging
      const statusText = response.status
        ? `${response.status}`
        : "unknown status";
      console.log(
        `Response from ${response.config.url || "unknown endpoint"}`,
        statusText,
        response.data ? JSON.stringify(response.data) : "no data"
      );
    } catch (error) {
      console.error("Error logging response:", error);
    }
    return response;
  },
  (error) => {
    try {
      // Safe error logging
      console.error(
        "Response error:",
        error.response?.status || "unknown status",
        error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message || "Unknown error"
      );
    } catch (loggingError) {
      console.error("Error while logging error:", loggingError);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;