import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { RiMapPinLine, RiNotification3Line, RiAlarmWarningLine } from 'react-icons/ri';
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth, useGlobalIntervals } from "../../context/AuthContext";
import './Dashboard.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProfileCard from './components/ProfileCard';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import LocationCard from './components/LocationCard';
import MapPlaceholder from './components/MapPlaceholder';
import ActivityFeed from './components/ActivityFeed';
import { getProfile, getUserCache, setUserCache } from "../../services/profileService";
import {
  getFriends,
} from "../../services/friendService";
import { updateLocation } from "../../services/locationService";
import api from "../../api/axios";
import {
  respondToLocationRequest,
  subscribeUser,
  checkBackendSubscription,
  getSubscriptionStatus,
  getPendingLocationRequests,
} from "../../services/pushNotificationService";

const PENDING_REQUESTS_POLL_INTERVAL = 15000;

function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { sharingLocation, startLocationSharing, stopLocationSharing, batteryLevel } = useGlobalIntervals();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(() => getUserCache());
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const pendingRequestsRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const handler = (e) => {
      const { latitude, longitude } = e.detail;
      setUser((prev) => ({ ...prev, latitude, longitude }));
    };
    window.addEventListener("location:updated", handler);
    return () => window.removeEventListener("location:updated", handler);
  }, []);

  useEffect(() => {
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return;
    }

    const handleLocationRequest = async () => {
      if (!navigator.geolocation) {
        await respondToLocationRequest(requestId, "rejected");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await updateLocation(
              position.coords.latitude,
              position.coords.longitude
            );

            await respondToLocationRequest(requestId, "accepted");
            startLocationSharing();
          } catch (err) {
            console.error("Failed to update location:", err);
            await respondToLocationRequest(requestId, "rejected");
          }
        },
        async (error) => {
          console.error("Location permission denied:", error);
          await respondToLocationRequest(requestId, "rejected");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    handleLocationRequest();
  }, [searchParams, startLocationSharing]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const fetchDashboardData = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
        setUserCache(profile);

        const friendsData = await getFriends().catch(() => []);
        setFriends(friendsData);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                await updateLocation(lat, lng);

                setUser((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                }));
              } catch (err) {
                console.error("Failed to update location:", err);
              }
            },
            (error) => {
              console.error("Location permission denied:", error);
            }
          );
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    const fetchPendingRequests = async () => {
      try {
        const pending = await getPendingLocationRequests();
        setPendingRequests(pending);
      } catch (err) {
        console.error("Failed to fetch pending requests:", err);
      }
    };

    fetchDashboardData();
    fetchPendingRequests();

    pendingRequestsRef.current = setInterval(fetchPendingRequests, PENDING_REQUESTS_POLL_INTERVAL);

    return () => {
      if (pendingRequestsRef.current) clearInterval(pendingRequestsRef.current);
    };
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const checkSubscription = useCallback(async () => {
    try {
      const [backendSubscribed, frontendSubscribed] = await Promise.all([
        checkBackendSubscription(),
        getSubscriptionStatus(),
      ]);

      setNotificationsEnabled(backendSubscribed && frontendSubscribed);
      setCheckingSubscription(false);
    } catch (err) {
      console.error("[Dashboard] Failed to check subscription:", err);
      setNotificationsEnabled(false);
      setCheckingSubscription(false);
    }
  }, []);

  const [showSOSConfirm, setShowSOSConfirm] = useState(false);

  const handleSOS = async () => {
    try {
      await api.post("guardian/sos/", {
        latitude: user?.latitude,
        longitude: user?.longitude,
      });
      setShowSOSConfirm(false);
      alert("SOS alert sent to your Friends and guardians!");
    } catch {
      alert("Failed to send SOS alert. Please try again.");
    }
  };

  useEffect(() => {
    (async () => {
      await checkSubscription();
    })();
    const intervalId = setInterval(checkSubscription, 30000);
    return () => clearInterval(intervalId);
  }, [checkSubscription]);

  const handleEnableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    setNotificationLoading(true);
    try {
      await subscribeUser();
      setNotificationsEnabled(true);
    } catch (err) {
      console.error("Failed to enable notifications:", err);
      alert(err.message || "Failed to enable notifications. Please try again.");
    } finally {
      setNotificationLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="dashboard-loading">
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        toggleMobile={toggleMobileMenu}
        user={user}
      />

      <div className={`dashboard-main ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <Navbar user={user} setUser={setUser} toggleMobileMenu={toggleMobileMenu} />

        <motion.main
          className="dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="dashboard-grid">
            <MapPlaceholder user={user} friends={friends} className="map-full-width" />

            <div className="dashboard-left-column">
              <ProfileCard user={user} />
              <StatsCards
                user={user}
                friends={friends}
                pendingRequests={pendingRequests}
                batteryLevel={batteryLevel}
              />
              <QuickActions />
              <ActivityFeed />
            </div>

            <div className="dashboard-right-column">
              <LocationCard
                  user={user}
                  setUser={setUser}
                  sharingLocation={sharingLocation}
                  onStartSharing={startLocationSharing}
                  onStopSharing={stopLocationSharing}
                  batteryLevel={batteryLevel}
              />
            </div>
          </div>
        </motion.main>

        <FloatingActionButton
          onRefresh={() => {
            if (!sharingLocation) {
              startLocationSharing();
            }
          }}
          sharingLocation={sharingLocation}
          onStopSharing={stopLocationSharing}
        />

        {!checkingSubscription && !notificationsEnabled && (
          <motion.button
            className="notification-enable-btn"
            onClick={handleEnableNotifications}
            disabled={notificationLoading}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
            aria-label="Enable Notifications"
          >
            <RiNotification3Line size={24} />
            {notificationLoading ? "Enabling..." : "Enable Notifications"}
          </motion.button>
        )}

        <motion.button
          className="sos-fab"
          onClick={() => setShowSOSConfirm(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
          title="Send SOS Alert"
        >
          <RiAlarmWarningLine size={24} />
        </motion.button>

        {showSOSConfirm && (
          <motion.div
            className="sos-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowSOSConfirm(false)}
          >
            <motion.div
              className="sos-confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Send SOS Alert?</h3>
              <p>This will immediately notify all your friends and guardians with your current location.</p>
              <div className="sos-confirm-actions">
                <button className="btn-cancel" onClick={() => setShowSOSConfirm(false)}>Cancel</button>
                <button className="btn-sos-confirm" onClick={handleSOS}>Send SOS</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingActionButton({ onRefresh, sharingLocation, onStopSharing }) {
  return (
    <motion.button
      className={`fab ${sharingLocation ? "sharing" : ""}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        delay: 0.8,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      aria-label={sharingLocation ? "Stop Sharing Location" : "Start Sharing Location"}
      onClick={sharingLocation ? onStopSharing : onRefresh}
      title={sharingLocation ? "Stop sharing location" : "Start sharing location"}
    >
      <RiMapPinLine size={24} />
    </motion.button>
  );

}

export default Dashboard;
