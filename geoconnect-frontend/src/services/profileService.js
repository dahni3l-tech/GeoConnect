import api from "../api/axios";

// Get logged-in user's profile
export const getProfile = async () => {
  const response = await api.get("profile/");
  return response.data;
};

