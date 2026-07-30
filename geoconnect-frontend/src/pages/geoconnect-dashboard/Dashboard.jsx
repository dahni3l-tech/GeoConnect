import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { RiMapPinLine, RiNotification3Line } from 'react-icons/ri';
import { useSearchParams } from "react-router-dom";
import './Dashboard.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProfileCard from './components/ProfileCard';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
// import ActivityFeed from './components/ActivityFeed';
import LocationCard from './components/LocationCard';
import MapPlaceholder from './components/MapPlaceholder';
import { getProfile } from "../../services/profileService";
import {
  getFriends,
  getFriendRequests,
} from "../../services/friendService";
import { updateLocation } from "../../services/locationService";
import { respondToLocationRequest, subscribeUser, getSubscriptionStatus } from "../../services/pushNotificationService";


function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const lastLocation = useRef(null);

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
  }, [searchParams]);

  // i wanted to put recent activities here but i don't think i need it right now so i'm commenting it out for now
  // const [activities] = useState([
  //   { id: 1, type: 'login', message: 'Logged In', timestamp: '2 mins ago' },
  //   { id: 2, type: 'location', message: 'Location Updated', timestamp: '15 mins ago' },
  //   { id: 3, type: 'friend_request', message: 'Friend Request Sent', timestamp: '1 hour ago' },
  //   { id: 4, type: 'friend_accept', message: 'Friend Request Accepted', timestamp: '3 hours ago' },
  //   { id: 5, type: 'refresh', message: 'Location Refreshed', timestamp: '5 hours ago' },
  // ]);

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
        // just so i don't forget this is what triggers that allow location stuff
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
  const interval = setInterval(() => {
  handleRefreshLocation();
}, 30000);

return () => clearInterval(interval);

}, [
  
]);


const handleRefreshLocation = async () => {
  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by your browser.");
    return;
  }

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
          console.log("📍 Location unchanged.");
          return;
        }

        await updateLocation(newLat, newLng);

        lastLocation.current = {
          lat: newLat,
          lng: newLng,
        };

        const profile = await getProfile();
        setUser(profile);

        console.log("📍 Location updated.");
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


   const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

   useEffect(() => {
     if (!("Notification" in window)) return;
     setNotificationsEnabled(Notification.permission === "granted");
   }, []);

   const handleEnableNotifications = async () => {
     setNotificationLoading(true);
     try {
       await subscribeUser();
       setNotificationsEnabled(true);
     } catch (err) {
       console.error("Failed to enable notifications:", err);
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

      <div className="dashboard-main">
        <Navbar user={user} toggleMobileMenu={toggleMobileMenu} />

        <motion.main
          className="dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="dashboard-grid">
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
              />
              {/* <ActivityFeed activities={activities} /> */}
              <MapPlaceholder user={user} friends={friends} />
            </div>
          </div>
        </motion.main>

        <FloatingActionButton
    onRefresh={handleRefreshLocation}
/>

        {!notificationsEnabled && (
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

// this is the rrfresh location stuff
function FloatingActionButton({ onRefresh }) {
  return (
    <motion.button
      className="fab"
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
      aria-label="Refresh Location"
      onClick={onRefresh}
    >
      <RiMapPinLine size={24} />
    </motion.button>
  );
}



export default Dashboard;   