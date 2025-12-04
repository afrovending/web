import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";
import { setupCache } from "axios-cache-interceptor";
import { toast } from "react-hot-toast";

let api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.afrovending.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api = setupCache(api, {
  ttl: 1000 * 60 * 60,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.cache = false;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      toast.error("Session expired. Please log in to continue.");

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


export default api;
