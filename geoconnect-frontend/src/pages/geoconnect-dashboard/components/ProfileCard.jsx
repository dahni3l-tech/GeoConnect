import { motion } from 'framer-motion';
import {
  RiMapPinLine,
  RiMailLine,
  RiWifiLine,
  RiUserLocationLine,
} from 'react-icons/ri';
import './ProfileCard.css';

function ProfileCard({ user }) {
  if (!user) {
  return null;
  }
  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.username}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div
            className={`location-status-badge ${
              user.locationActive ? 'active' : ''
            }`}
          >
            <RiMapPinLine size={12} />
          </div>
        </div>

        <div className="profile-info">
          <h3 className="profile-name">{user.username}</h3>
          <p className="profile-email">
            <RiMailLine size={14} />
            {user.email}
          </p>
          <div
            className={`status-badge ${
                user.latitude != null && user.longitude != null
                  ? "active"
                  : "inactive"
              }`}
              >
                <span className="status-dot" />
                {user.latitude != null && user.longitude != null
                  ? "Location Active"
                  : "Location Inactive"}
          </div>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-item">
          <div className="detail-icon">
            <RiWifiLine size={18} />
          </div>
          <div className="detail-content">
            <span className="detail-label">IP Address</span>
            <span className="detail-value">{user.ip_address}</span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <div className="detail-icon">
              <RiUserLocationLine size={18} />
            </div>
            <div className="detail-content">
              <span className="detail-label">Latitude</span>
              <span className="detail-value">{typeof user.latitude === "number"
    ? user.latitude.toFixed(4)
    : "Not Available"}</span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">
              <RiUserLocationLine size={18} />
            </div>
            <div className="detail-content">
              <span className="detail-label">Longitude</span>
              <span className="detail-value">{typeof user.longitude === "number"
    ? user.longitude.toFixed(4)
    : "Not Available"}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileCard;
