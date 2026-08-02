import api from "../api/axios";

const CACHE_KEY = "geoconnect_user";

export const getUserCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUserCache = (user) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
};

export const clearUserCache = () => {
  localStorage.removeItem(CACHE_KEY);
};

export const getProfile = async () => {
  const response = await api.get("profile/");
  return response.data;
};
