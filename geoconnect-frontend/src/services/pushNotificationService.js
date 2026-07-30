import api from "../api/axios";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error("VAPID public key is not configured");
  }
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return { granted: false, permission: "unsupported" };
  }

  if (Notification.permission === "granted") {
    return { granted: true, permission: "granted" };
  }

  const permission = await Notification.requestPermission();
  return { granted: permission === "granted", permission };
}

export async function subscribeUser() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications not supported");
  }

  const { granted, permission } = await requestNotificationPermission();
  if (!granted) {
    throw new Error(`Notification permission denied: ${permission}`);
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const data = {
    endpoint: subscription.endpoint,
    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")))),
    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")))),
  };

  const response = await api.post("notifications/subscribe/", data);
  return response.data;
}

export async function unsubscribeUser() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return { detail: "no subscription" };
  }

  const data = { endpoint: subscription.endpoint };
  const response = await api.post("notifications/unsubscribe/", data);
  return response.data;
}

export async function getSubscriptionStatus() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

export async function respondToLocationRequest(requestId, status) {
  const response = await api.post(`location-requests/${requestId}/respond/`, {
    status,
  });

  return response.data;
}

export async function updateOnlineStatus(isOnline) {
  const response = await api.post("online-status/", {
    is_online: isOnline,
  });

  return response.data;
}

export async function getPendingLocationRequests() {
  const response = await api.get("location-requests/pending/");
  return response.data;
}

