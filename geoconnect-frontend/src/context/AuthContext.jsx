import { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { isTokenExpired, getTimeUntilExpiry } from "../utils/tokenUtils";

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null);

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USER_KEY = "geoconnect_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const proactiveRefreshTimerRef = useRef(null);

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
        const module = await import("../api/axios");
        await module.default.post("logout/", { refresh }).catch(() => {});
      } catch {
        // Ignore logout API errors
      }
    }
    clearAuth();
  }, [clearAuth]);

  const restoreAuth = useCallback(() => {
    const access = localStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    const userData = localStorage.getItem(USER_KEY);

    if (!access || !refresh) {
      setIsLoading(false);
      return;
    }

    if (isTokenExpired(access)) {
      if (isTokenExpired(refresh)) {
        clearAuth();
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      return;
    }

    setUser(userData ? JSON.parse(userData) : null);
    setIsAuthenticated(true);
    scheduleProactiveRefresh(access);
    setIsLoading(false);
  }, [clearAuth, scheduleProactiveRefresh]);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restoreAuth();
  }, [restoreAuth]);

  useEffect(() => {
    const handleRefreshNeeded = async () => {
      const refresh = localStorage.getItem(REFRESH_KEY);
      const access = localStorage.getItem(ACCESS_KEY);
      if (!refresh || !access) return;

      try {
        const module = await import("../api/axios");
        const response = await module.default.post("token/refresh/", { refresh });
        const newAccess = response.data.access;
        localStorage.setItem(ACCESS_KEY, newAccess);
        if (response.data.refresh) {
          localStorage.setItem(REFRESH_KEY, response.data.refresh);
        }
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

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
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

