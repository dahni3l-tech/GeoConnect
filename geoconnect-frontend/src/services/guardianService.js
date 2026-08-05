import api from "../api/axios";

export const getGuardianDashboard = async () => {
  const response = await api.get("guardian/dashboard/");
  return response.data;
};

export const updateGuardianProfile = async (data) => {
  const response = await api.put("guardian/profile/", data);
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`users/search/?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const sendFamilyInvitation = async (data) => {
  const response = await api.post("guardian/invitations/", data);
  return response.data;
};

export const getFamilyInvitations = async () => {
  const response = await api.get("guardian/invitations/");
  return response.data;
};

export const respondToFamilyInvitation = async (invitationId, action, permissionType = "always") => {
  const response = await api.post(`guardian/invitations/${invitationId}/respond/`, {
    action,
    permission_type: permissionType,
  });
  return response.data;
};

export const getFamilyMembers = async () => {
  const response = await api.get("guardian/family/");
  return response.data;
};

export const removeFamilyMember = async (userId) => {
  const response = await api.delete(`guardian/family/${userId}/remove/`);
  return response.data;
};

export const getLocationPermissions = async () => {
  const response = await api.get("guardian/permissions/");
  return response.data;
};

export const updateLocationPermission = async (guardianId, permissionType, pausedUntil) => {
  const response = await api.patch("guardian/permissions/", {
    guardian_id: guardianId,
    permission_type: permissionType,
    paused_until: pausedUntil,
  });
  return response.data;
};

export const getSOSAlerts = async () => {
  const response = await api.get("guardian/sos/");
  return response.data;
};

export const triggerSOS = async (latitude, longitude) => {
  const response = await api.post("guardian/sos/", { latitude, longitude });
  return response.data;
};

export const resolveSOSAlert = async (alertId) => {
  const response = await api.post(`guardian/sos/${alertId}/resolve/`);
  return response.data;
};

export const getRouteHistory = async (userId, date) => {
  const params = {};
  if (userId) params.user_id = userId;
  if (date) params.date = date;
  const response = await api.get("guardian/route/", { params });
  return response.data;
};

export const getActivityLog = async () => {
  const response = await api.get("guardian/activity/");
  return response.data;
};

export const getFamilyMapData = async () => {
  const response = await api.get("guardian/map-data/");
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

export const getPermissionRequests = async () => {
  const response = await api.get("guardian/permission-requests/");
  return response.data;
};

export const sendPermissionRequest = async (data) => {
  const response = await api.post("guardian/permission-requests/", data);
  return response.data;
};

export const respondToPermissionRequest = async (requestId, action) => {
  const response = await api.post(`guardian/permission-requests/`, {
    request_id: requestId,
    action,
  });
  return response.data;
};
