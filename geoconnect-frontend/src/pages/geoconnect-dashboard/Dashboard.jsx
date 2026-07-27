import { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { RiMapPinLine } from 'react-icons/ri';
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
import PremiumCard from "../Premium/Premium";

function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [friends, setFriends] = useState([]);
const [pendingRequests, setPendingRequests] = useState([]);

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
}, [
  
]);


const handleRefreshLocation = async () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await updateLocation(
          position.coords.latitude,
          position.coords.longitude
        );

        const profile = await getProfile();

        setUser(profile);

        alert("Location updated successfully!");
      } catch (error) {
        console.error(error);
        alert("Failed to update location.");
      }
    },
    (error) => {
      console.error(error);
      alert("Unable to get your location.");
    },
    { 
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};


  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

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
              <PremiumCard />
            </div>

            <div className="dashboard-right-column">
              <LocationCard
                  user={user}
                  setUser={setUser}
              />
              {/* <ActivityFeed activities={activities} /> */}
              <MapPlaceholder user={user} />
            </div>
          </div>
        </motion.main>

        <FloatingActionButton
    onRefresh={handleRefreshLocation}
/>
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