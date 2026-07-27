import { motion } from 'framer-motion'; 
import { updateLocation } from "../../../services/locationService";
import { getProfile } from "../../../services/profileService";
import {
  RiMapPinLine,
  RiWifiLine,
  RiUserLocationLine,
  RiRefreshLine,
} from 'react-icons/ri';
import './LocationCard.css';

function LocationCard({ user, setUser }) {
  if (!user) {
    return null;
}
  /* ============================================================
     TODO: API call — Refresh user location
     POST /api/location/refresh/
     ============================================================ */
  const handleRefreshLocation = () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await updateLocation(
          position.coords.latitude,
          position.coords.longitude
        );

        const updatedProfile = await getProfile();

        setUser(updatedProfile);

        alert("Location refreshed successfully!");
      } catch (error) {
        console.error(error);
        alert("Failed to refresh location.");
      }
    },
    (error) => {
      console.error(error);
      alert("Unable to access your location.");
    }
  );
};

  return (
    <motion.div
      className="location-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="location-header">
        <div className="location-title">
          <div className="location-title-icon">
            <RiMapPinLine size={20} />
          </div>
          <h3>Current Location</h3>
        </div>
        <div className="location-status active">
          <span className="pulse-dot" />
          Active
        </div>
      </div>

      <div className="location-details">
        <div className="location-detail">
          <div className="loc-detail-icon">
            <RiUserLocationLine size={18} />
          </div>
          <div className="loc-detail-content">
            <span className="loc-detail-label">Latitude</span>
            <span className="loc-detail-value">{user.latitude !== null
    ? user.latitude.toFixed(6)
    : "Not Available"}</span>
          </div>
        </div>

        <div className="location-detail">
          <div className="loc-detail-icon">
            <RiUserLocationLine size={18} />
          </div>
          <div className="loc-detail-content">
            <span className="loc-detail-label">Longitude</span>
            <span className="loc-detail-value">{user.longitude !== null
    ? user.longitude.toFixed(6)
    : "Not Available"}</span>
          </div>
        </div>

        <div className="location-detail">
          <div className="loc-detail-icon">
            <RiWifiLine size={18} />
          </div>
          <div className="loc-detail-content">
            <span className="loc-detail-label">IP Address</span>
            <span className="loc-detail-value">
  {user.ip_address ?? "Not Available"}
</span>
          </div>
        </div>
      </div>

      <motion.button
        className="refresh-location-btn"
        onClick={handleRefreshLocation}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <RiRefreshLine size={18} />
        Refresh Location
      </motion.button>
    </motion.div>
  );
}

export default LocationCard;
