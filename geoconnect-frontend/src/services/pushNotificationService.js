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

function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return { granted: false, permission: "unsupported" };
  }

  if (Notification.permission === "granted") {
    return { granted: true, permission: "granted" };
  }

  const permission = await withTimeout(
    Notification.requestPermission(),
    10000,
    "Notification permission request timed out"
  );
  return { granted: permission === "granted", permission };
}

export async function subscribeUser() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications not supported");
  }

  let registration;
  try {
    registration = await withTimeout(
      navigator.serviceWorker.ready,
      10000,
      "Service worker not ready"
    );
  } catch (err) {
    console.error("Service worker not ready in subscribeUser:", err);
    throw new Error("Service worker is not ready. Please reload the page.", { cause: err });
  }

  const { granted, permission } = await requestNotificationPermission();
  if (!granted) {
    throw new Error(`Notification permission denied: ${permission}`);
  }

  try {
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    subscription = await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }),
      10000,
      "Push subscription timed out"
    );

    const data = {
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")))),
      auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")))),
    };

    const response = await api.post("notifications/subscribe/", data);
    return response.data;
  } catch (err) {
    console.error("Failed to subscribe to push notifications:", err);
    throw err;
  }
}

export async function unsubscribeUser() {
  let registration;
  try {
    registration = await withTimeout(
      navigator.serviceWorker.ready,
      10000,
      "Service worker not ready"
    );
  } catch (err) {
    console.error("Service worker not ready in unsubscribeUser:", err);
    throw new Error("Service worker is not ready. Please reload the page.", { cause: err });
  }

  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return { detail: "no subscription" };
  }

  const data = { endpoint: subscription.endpoint };
  const response = await api.delete("notifications/unsubscribe/", { data });
  return response.data;
}

export async function getSubscriptionStatus() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  let registration;

  try {
    await navigator.serviceWorker.getRegistration();

    registration = await withTimeout(
      navigator.serviceWorker.ready,
      10000,
      "Service worker not ready"
    );
  } catch (err) {
    console.error("[pushNotificationService] Service worker not ready:", err);

    if (!registration) {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
            });
          }
        });

        await new Promise((resolve) => {
          if (registration.active) {
            resolve();
          } else if (registration.installing) {
            registration.installing.addEventListener('statechange', function handler() {
              if (registration.installing?.state === 'activated') {
                registration.installing.removeEventListener('statechange', handler);
                resolve();
              }
            });
          } else if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            registration.waiting.addEventListener('statechange', function handler() {
              if (registration.waiting?.state === 'activated') {
                registration.waiting.removeEventListener('statechange', handler);
                resolve();
              }
            });
          }
        });

        registration = await navigator.serviceWorker.ready;
      } catch (manualErr) {
        console.error("[pushNotificationService] Manual registration failed:", manualErr);
        return false;
      }
    }
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (err) {
    console.error("[pushNotificationService] Failed to get subscription:", err);
    return false;
  }
}

export async function checkBackendSubscription() {
  try {
    const response = await api.get("notifications/subscribe/");
    return response.data.subscribed === true;
  } catch (err) {
    console.error("[pushNotificationService] Failed to check backend subscription:", err);
    return false;
  }
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

export async function getNotifications() {
  const response = await api.get("notifications/notifications/");
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await api.post(`notifications/notifications/${notificationId}/read/`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.post("notifications/notifications/read-all/");
  return response.data;
}

