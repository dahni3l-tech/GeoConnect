import axios from "axios";

const api = axios.create({
  baseURL: "https://geoconnect-afte.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  const publicRoutes = ["login/", "register/"];

  const isPublicRoute = publicRoutes.some((route) =>
    config.url?.includes(route)
  );

  if (token && !isPublicRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export default api;