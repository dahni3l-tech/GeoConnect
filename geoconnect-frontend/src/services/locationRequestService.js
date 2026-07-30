import api from "../api/axios";

export const requestLocation = async (receiverId) => {
  const response = await api.post("request-location/", {
    receiver_id: receiverId,
  });

  return response.data;
};
