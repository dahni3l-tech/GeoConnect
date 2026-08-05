import api from "../api/axios";

// Login user
export const login = async (login, password) => {
  const response = await api.post("login/", {
    login,
    password,
  });

  return response.data;
};

// Register user
export const register = async (username, email, password, isGuardian = false, guardianDetails = {}) => {
  const payload = {
    username,
    email,
    password,
    is_guardian: isGuardian,
    ...guardianDetails,
  };

  const response = await api.post("register/", payload);

  return response.data;
};

// Logout user
export const logout = async () => {
  try {
    await api.post("logout/");
  } catch {
    // Ignore logout API errors
  }
};