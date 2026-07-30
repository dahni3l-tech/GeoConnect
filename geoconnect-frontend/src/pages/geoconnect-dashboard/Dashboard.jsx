import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { RiMapPinLine, RiNotification3Line } from 'react-icons/ri';
import { useSearchParams } from "react-router-dom";
import './Dashboard.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProfileCard from './components/ProfileCard';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import LocationCard from './components/LocationCard';
import MapPlaceholder from './components/MapPlaceholder';
import { getProfile } from "../../services/profileService";
import {
  getFriends,
  getFriendRequests,
} from "../../services/friendService";
import { updateLocation } from "../../services/locationService";
import {
  respondToLocationRequest,
  subscribeUser,
  getSubscriptionStatus,
  checkBackendSubscription,
  updateOnlineStatus,
  getPendingLocationRequests,
  getNotifications,
} from "../../services/pushNotificationService";

const ONLINE_HEARTBEAT_INTERVAL = 30000;
const LOCATION_UPDATE_INTERVAL = 30000;
const PENDING_REQUESTS_POLL_INTERVAL = 15000;

function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [sharingLocation, setSharingLocation] = useState(false);
  const lastLocation = useRef(null);
  const locationIntervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const pendingRequestsRef = useRef(null);

  const startLocationSharing = useCallback(() => {
    if (locationIntervalRef.current) return;

    const update = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const newLat = position.coords.latitude;
            const newLng = position.coords.longitude;

            if (
              lastLocation.current &&
              Math.abs(lastLocation.current.lat - newLat) < 0.00005 &&
              Math.abs(lastLocation.current.lng - newLng) < 0.00005
            ) {
              return;
            }

            await updateLocation(newLat, newLng);
            lastLocation.current = { lat: newLat, lng: newLng };

            const profile = await getProfile();
            setUser(profile);
          } catch (error) {
            console.error("Failed to update location:", error);
          }
        },
        (error) => {
          console.error("Unable to get your location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    update();
    locationIntervalRef.current = setInterval(update, LOCATION_UPDATE_INTERVAL);
    setSharingLocation(true);
  }, []);

  const stopLocationSharing = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    setSharingLocation(false);
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
          console.log("Location permission denied.", error);
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
    const fetchDashboardData = async () => {
      try {
        const [profile, friendsData, requestsData] = await Promise.all([
          getProfile(),
          getFriends(),
          getFriendRequests(),
        ]);

        setUser(profile);
        setFriends(friendsData);
        setPendingRequests(requestsData);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                await updateLocation(
                  position.coords.latitude,
                  position.coords.longitude
                );

                const updatedProfile = await getProfile();
                setUser(updatedProfile);
              } catch (err) {
                console.error("Failed to update location:", err);
              }
            },
            (error) => {
              console.log("Location permission denied.", error);
            }
          );
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const sendHeartbeat = () => {
      updateOnlineStatus(true).catch(() => {});
      console.log("[Dashboard] Heartbeat sent to server to indicate online status.");
    };

    heartbeatRef.current = setInterval(sendHeartbeat, ONLINE_HEARTBEAT_INTERVAL);
    sendHeartbeat();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    pendingRequestsRef.current = setInterval(async () => {
      try {
        const [pending, notifData] = await Promise.all([
          getPendingLocationRequests(),
          getNotifications().catch(() => ({ results: [], unread_count: 0 })),
        ]);
        setPendingRequests(pending);
      } catch (err) {
        console.error("Failed to fetch pending requests:", err);
      }
    }, PENDING_REQUESTS_POLL_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pendingRequestsRef.current) clearInterval(pendingRequestsRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopLocationSharing();
      updateOnlineStatus(false).catch(() => {});
    };
  }, [stopLocationSharing]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  useEffect(() => {
    let mounted = true;
    let intervalId;

    async function checkSubscription() {
      try {
        const backendSubscribed = await checkBackendSubscription();
        console.log("[Dashboard] Backend subscription:", backendSubscribed);
        
        if (mounted) {
          setNotificationsEnabled(backendSubscribed);
          setCheckingSubscription(false);
        }
      } catch (err) {
        console.error("[Dashboard] Failed to check backend subscription:", err);
        if (mounted) {
          setNotificationsEnabled(false);
          setCheckingSubscription(false);
        }
      }
    }

    checkSubscription();
    intervalId = setInterval(checkSubscription, 5000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!checkingSubscription && !notificationsEnabled) {
      console.log("[Dashboard] Notifications button visible - backend says not subscribed");
    } else if (!checkingSubscription && notificationsEnabled) {
      console.log("[Dashboard] Notifications button hidden - backend says subscribed");
    }
  }, [checkingSubscription, notificationsEnabled]);

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

  return (
    <div className="dashboard-container">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        toggleMobile={toggleMobileMenu}
      />

      <div className={`dashboard-main ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <Navbar user={user} toggleMobileMenu={toggleMobileMenu} />

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
              />
              <QuickActions />
            </div>

            <div className="dashboard-right-column">
              <LocationCard
                  user={user}
                  setUser={setUser}
                  sharingLocation={sharingLocation}
                  onStartSharing={startLocationSharing}
                  onStopSharing={stopLocationSharing}
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
