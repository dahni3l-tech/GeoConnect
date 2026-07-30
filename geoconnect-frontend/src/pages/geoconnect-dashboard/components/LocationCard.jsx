import { motion } from 'framer-motion'; 
import { getProfile } from "../../../services/profileService";
import {
  RiMapPinLine,
  RiWifiLine,
  RiUserLocationLine,
  RiRefreshLine,
  RiShareLine,
} from 'react-icons/ri';
import './LocationCard.css';

function LocationCard({ user, setUser, sharingLocation, onStartSharing, onStopSharing }) {
  if (!user) {
    return null;
  }

  const handleRefreshLocation = async () => {
    if (!navigator.geolocation) {
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
        } catch (error) {
          console.error(error);
        }
      },
      (error) => {
        console.error(error);
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
        <div className={`location-status ${sharingLocation ? "active" : "inactive"}`}>
          <span className="pulse-dot" />
          {sharingLocation ? "Sharing Live" : "Idle"}
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

      <div className="location-actions">
        <motion.button
          className="refresh-location-btn"
          onClick={handleRefreshLocation}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RiRefreshLine size={18} />
          Refresh
        </motion.button>

        {!sharingLocation ? (
          <motion.button
            className="share-location-btn"
            onClick={onStartSharing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RiShareLine size={18} />
            Start Sharing
          </motion.button>
        ) : (
          <motion.button
            className="stop-sharing-btn"
            onClick={onStopSharing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RiShareLine size={18} />
            Stop Sharing
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default LocationCard;
