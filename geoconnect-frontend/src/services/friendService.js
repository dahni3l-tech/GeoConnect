import api from "../api/axios";

export const getFriends = async () => {
  const response = await api.get("friends/");
  return response.data;
};

export const getFriendRequests = async () => {
  const response = await api.get("friend-requests/");
  return response.data;
};

export const acceptFriendRequest = async (id) => {
  const response = await api.post(
    `friend-requests/${id}/accept/`
  );

  return response.data;
};

export const rejectFriendRequest = async (id) => {
  const response = await api.post(
    `friend-requests/${id}/reject/`
  );

  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`users/search/?q=${query}`);
  return response.data;
};

export const sendFriendRequest = async (receiverId) => {
  const response = await api.post("friend-requests/", {
    receiver: receiverId,
  });

  return response.data;
};
