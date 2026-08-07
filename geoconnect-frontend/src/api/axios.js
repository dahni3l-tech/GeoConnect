import axios from "axios";
import { isTokenExpired } from "../utils/tokenUtils";

const BASE_URL = import.meta.env.VITE_API_URL || "https://geoconnect-afte.onrender.com/api/";

const api = axios.create({
  baseURL: BASE_URL,
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, newAccessToken = null) {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else if (config) {
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      resolve(api(config));
    } else {
      resolve(newAccessToken);
    }
  });
  failedQueue = [];
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh || isTokenExpired(refresh)) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("geoconnect_user");
    throw new Error("No valid refresh token");
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject, config: null });
    });
  }

  isRefreshing = true;
  try {
    const response = await api.post("token/refresh/", { refresh });
    const newAccess = response.data.access;
    localStorage.setItem("access", newAccess);
    if (response.data.refresh) {
      localStorage.setItem("refresh", response.data.refresh);
    }
    processQueue(null, newAccess);
    return newAccess;
  } catch (refreshError) {
    processQueue(refreshError, null);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("geoconnect_user");
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (!token) {
    const publicPaths = [
      "login/",
      "register/",
      "forgot-password/",
      "reset-password/",
      "token/refresh/",
    ];
    const isPublic = publicPaths.some(
      (path) => config.url === path || config.url.startsWith(path)
    );
    if (!isPublic) {
      return Promise.reject(new Error("No access token"));
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "token/refresh/"
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = localStorage.getItem("refresh");

      if (!refresh) {
        processQueue(error, null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("geoconnect_user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isTokenExpired(refresh)) {
        processQueue(error, null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("geoconnect_user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const newAccess = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;