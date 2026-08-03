import api from "../api/axios";

export const getGuardianDashboard = async () => {
  const response = await api.get("guardian/dashboard/");
  return response.data;
};

export const updateGuardianProfile = async (data) => {
  const response = await api.put("guardian/profile/", data);
  return response.data;
};

export const addFamilyMember = async (data) => {
  const response = await api.post("guardian/family-members/", data);
  return response.data;
};

export const addSafePlace = async (data) => {
  const response = await api.post("guardian/safe-places/", data);
  return response.data;
};

export const addEmergencyContact = async (data) => {
  const response = await api.post("guardian/emergency-contacts/", data);
  return response.data;
};
