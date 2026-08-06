import api from "../api/axios";

const TRANSIENT_STATUS_CODES = new Set([408, 419, 425, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function withRetry(fn, label) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      if (status && TRANSIENT_STATUS_CODES.has(status) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        if (import.meta.env.DEV) console.debug(`[${label}] Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getGuardianDashboard = async () => {
  return withRetry(() => api.get("guardian/dashboard/").then((r) => r.data), "getGuardianDashboard");
};

export const updateGuardianProfile = async (data) => {
  return withRetry(() => api.put("guardian/profile/", data).then((r) => r.data), "updateGuardianProfile");
};

export const searchUsers = async (query) => {
  return withRetry(() => api.get(`users/search/?q=${encodeURIComponent(query)}`).then((r) => r.data), "searchUsers");
};

export const sendFamilyInvitation = async (data) => {
  return withRetry(() => api.post("guardian/invitations/", data).then((r) => r.data), "sendFamilyInvitation");
};

export const getFamilyInvitations = async () => {
  return withRetry(() => api.get("guardian/invitations/").then((r) => r.data), "getFamilyInvitations");
};

export const respondToFamilyInvitation = async (invitationId, action, permissionType = "always") => {
  return withRetry(
    () => api.post(`guardian/invitations/${invitationId}/respond/`, { action, permission_type: permissionType }).then((r) => r.data),
    "respondToFamilyInvitation"
  );
};

export const getFamilyMembers = async () => {
  return withRetry(() => api.get("guardian/family/").then((r) => r.data), "getFamilyMembers");
};

export const removeFamilyMember = async (userId) => {
  return withRetry(() => api.delete(`guardian/family/${userId}/remove/`).then((r) => r.data), "removeFamilyMember");
};

export const getLocationPermissions = async () => {
  return withRetry(() => api.get("guardian/permissions/").then((r) => r.data), "getLocationPermissions");
};

export const updateLocationPermission = async (guardianId, permissionType, pausedUntil) => {
  return withRetry(
    () => api.patch("guardian/permissions/", { guardian_id: guardianId, permission_type: permissionType, paused_until: pausedUntil }).then((r) => r.data),
    "updateLocationPermission"
  );
};

export const getSOSAlerts = async () => {
  return withRetry(() => api.get("guardian/sos/").then((r) => r.data), "getSOSAlerts");
};

export const triggerSOS = async (latitude, longitude) => {
  return withRetry(() => api.post("guardian/sos/", { latitude, longitude }).then((r) => r.data), "triggerSOS");
};

export const resolveSOSAlert = async (alertId) => {
  return withRetry(() => api.post(`guardian/sos/${alertId}/resolve/`).then((r) => r.data), "resolveSOSAlert");
};

export const getRouteHistory = async (userId, date) => {
  const params = {};
  if (userId) params.user_id = userId;
  if (date) params.date = date;
  return withRetry(() => api.get("guardian/route/", { params }).then((r) => r.data), "getRouteHistory");
};

export const getActivityLog = async () => {
  return withRetry(() => api.get("guardian/activity/").then((r) => r.data), "getActivityLog");
};

export const getFamilyMapData = async () => {
  return withRetry(() => api.get("guardian/map-data/").then((r) => r.data), "getFamilyMapData");
};

export const addSafePlace = async (data) => {
  return withRetry(() => api.post("guardian/safe-places/", data).then((r) => r.data), "addSafePlace");
};

export const addEmergencyContact = async (data) => {
  return withRetry(() => api.post("guardian/emergency-contacts/", data).then((r) => r.data), "addEmergencyContact");
};

export const getPermissionRequests = async () => {
  return withRetry(() => api.get("guardian/permission-requests/").then((r) => r.data), "getPermissionRequests");
};

export const sendPermissionRequest = async (data) => {
  return withRetry(() => api.post("guardian/permission-requests/", data).then((r) => r.data), "sendPermissionRequest");
};

export const respondToPermissionRequest = async (requestId, action) => {
  return withRetry(
    () => api.post("guardian/permission-requests/", { request_id: requestId, action }).then((r) => r.data),
    "respondToPermissionRequest"
  );
};
