import api from "./api";

// Login user
export const login = async (login, password) => {
  const response = await api.post("login/", {
    login,
    password,
  });

  return response.data;
};

// Register user
export const register = async (username, email, password) => {
  const response = await api.post("register/", {
    username,
    email,
    password,
  });

  return response.data;
};