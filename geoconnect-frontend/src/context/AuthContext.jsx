import { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { isTokenExpired, getTimeUntilExpiry } from "../utils/tokenUtils";
import { updateOnlineStatus } from "../services/pushNotificationService";
import { updateLocation } from "../services/locationService";
import api, { refreshAccessToken } from "../api/axios";

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null);

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USER_KEY = "geoconnect_user";

const HEARTBEAT_INTERVAL = 30000;
const LOCATION_UPDATE_INTERVAL = 30000;
const HEARTBEAT_DEBOUNCE_MS = 30000;
let heartbeatIntervalRef = null;
let locationIntervalRef = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);

  const proactiveRefreshTimerRef = useRef(null);
  const lastHeartbeatRef = useRef(0);
  const lastLocationRef = useRef(null);
  const restoreAuthRef = useRef(false);

  const clearAuth = useCallback(() => {
    if (proactiveRefreshTimerRef.current) {
      clearTimeout(proactiveRefreshTimerRef.current);
      proactiveRefreshTimerRef.current = null;
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const scheduleProactiveRefresh = useCallback((accessToken) => {
    if (proactiveRefreshTimerRef.current) {
      clearTimeout(proactiveRefreshTimerRef.current);
      proactiveRefreshTimerRef.current = null;
    }

    const timeUntilExpiry = getTimeUntilExpiry(accessToken, 30);
    if (timeUntilExpiry > 0) {
      proactiveRefreshTimerRef.current = setTimeout(() => {
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (!refresh || isTokenExpired(refresh)) {
          clearAuth();
          return;
        }
        const event = new CustomEvent("auth:token-refresh-needed");
        window.dispatchEvent(event);
      }, timeUntilExpiry);
    }
  }, [clearAuth]);

  const login = useCallback((userData, tokens) => {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    setUser(userData);
    setIsAuthenticated(true);

    scheduleProactiveRefresh(tokens.access);
  }, [scheduleProactiveRefresh]);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (refresh) {
      try {
        await api.post("logout/", { refresh }).catch(() => {});
      } catch {
        // Ignore logout API errors
      }
    }
    clearAuth();
  }, [clearAuth]);

  const restoreAuth = useCallback(async () => {
    if (restoreAuthRef.current) {
      setIsLoading(false);
      return;
    }
    restoreAuthRef.current = true;

    const access = localStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    const userData = localStorage.getItem(USER_KEY);

    if (!access || !refresh) {
      setIsLoading(false);
      restoreAuthRef.current = false;
      return;
    }

    if (!isTokenExpired(access)) {
      setUser(userData ? JSON.parse(userData) : null);
      setIsAuthenticated(true);
      scheduleProactiveRefresh(access);
      setIsLoading(false);
      restoreAuthRef.current = false;
      return;
    }

    try {
      const newAccess = await refreshAccessToken();
      setUser(userData ? JSON.parse(userData) : null);
      setIsAuthenticated(true);
      scheduleProactiveRefresh(newAccess);
      setIsLoading(false);
    } catch {
      clearAuth();
      setIsLoading(false);
    }
    restoreAuthRef.current = false;
  }, [clearAuth, scheduleProactiveRefresh]);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restoreAuth();
  }, [restoreAuth]);

  useEffect(() => {
    const handleRefreshNeeded = async () => {
      const refresh = localStorage.getItem(REFRESH_KEY);
      const access = localStorage.getItem(ACCESS_KEY);
      if (!refresh || !access || !isTokenExpired(access)) return;

      try {
        const newAccess = await refreshAccessToken();
        scheduleProactiveRefresh(newAccess);
        window.dispatchEvent(new CustomEvent("auth:token-refreshed"));
      } catch {
        clearAuth();
        window.location.href = "/login";
      }
    };

    window.addEventListener("auth:token-refresh-needed", handleRefreshNeeded);

    return () => {
      window.removeEventListener("auth:token-refresh-needed", handleRefreshNeeded);
      if (proactiveRefreshTimerRef.current) {
        clearTimeout(proactiveRefreshTimerRef.current);
      }
    };
  }, [clearAuth, scheduleProactiveRefresh]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const access = localStorage.getItem(ACCESS_KEY);
        if (access && isTokenExpired(access)) {
          const refresh = localStorage.getItem(REFRESH_KEY);
          if (refresh && !isTokenExpired(refresh)) {
            const event = new CustomEvent("auth:token-refresh-needed");
            window.dispatchEvent(event);
          } else {
            clearAuth();
            window.location.href = "/login";
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearAuth]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === ACCESS_KEY && !e.newValue) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const startLocationSharing = useCallback(() => {
    if (!isAuthenticated) return;
    if (locationIntervalRef) return;
    const update = async () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const newLat = position.coords.latitude;
            const newLng = position.coords.longitude;
            if (
              lastLocationRef.current &&
              Math.abs(lastLocationRef.current.lat - newLat) < 0.00005 &&
              Math.abs(lastLocationRef.current.lng - newLng) < 0.00005
            ) {
              return;
            }
            await updateLocation(newLat, newLng);
            lastLocationRef.current = { lat: newLat, lng: newLng };
            window.dispatchEvent(
              new CustomEvent("location:updated", { detail: { latitude: newLat, longitude: newLng } })
            );
          } catch (error) {
            console.error("Failed to update location:", error);
          }
        },
        (error) => {
          console.error("Unable to get your location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
    update();
    locationIntervalRef = setInterval(update, LOCATION_UPDATE_INTERVAL);
    setSharingLocation(true);
  }, [isAuthenticated]);

  const stopLocationSharing = useCallback(() => {
    if (locationIntervalRef) {
      clearInterval(locationIntervalRef);
      locationIntervalRef = null;
    }
    setSharingLocation(false);
    updateOnlineStatus(false).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const sendHeartbeat = () => {
      const now = Date.now();
      if (now - lastHeartbeatRef.current < HEARTBEAT_DEBOUNCE_MS) return;
      lastHeartbeatRef.current = now;
      updateOnlineStatus(true).catch(() => {});
    };

    sendHeartbeat();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startLocationSharing();

    heartbeatIntervalRef = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleBeforeUnload = () => {
      updateOnlineStatus(false).catch(() => {});
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    if (!navigator.getBattery) return;
    let battery;
    navigator.getBattery().then((b) => {
      battery = b;
      setBatteryLevel(Math.round(battery.level * 100));
      const onLevelChange = () => setBatteryLevel(Math.round(battery.level * 100));
      battery.addEventListener("levelchange", onLevelChange);
      return () => battery.removeEventListener("levelchange", onLevelChange);
    }).catch(() => {});

    return () => {
      if (heartbeatIntervalRef) {
        clearInterval(heartbeatIntervalRef);
        heartbeatIntervalRef = null;
      }
      if (locationIntervalRef) {
        clearInterval(locationIntervalRef);
        locationIntervalRef = null;
      }
      setSharingLocation(false);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updateOnlineStatus(false).catch(() => {});
    };
  }, [isAuthenticated, isLoading, startLocationSharing, setSharingLocation]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    sharingLocation,
    startLocationSharing,
    stopLocationSharing,
    batteryLevel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useGlobalIntervals() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useGlobalIntervals must be used within an AuthProvider");
  }
  return {
    sharingLocation: context.sharingLocation,
    startLocationSharing: context.startLocationSharing,
    stopLocationSharing: context.stopLocationSharing,
    batteryLevel: context.batteryLevel,
  };
}

