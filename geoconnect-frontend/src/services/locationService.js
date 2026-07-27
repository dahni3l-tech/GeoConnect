import api from "../api/axios";

export const updateLocation = async (latitude, longitude) => {
  const response = await api.post("update-location/", {
    latitude,
    longitude,
  });

  return response.data;
};