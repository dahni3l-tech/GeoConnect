import { motion } from 'framer-motion'; 
import { useState, useEffect } from 'react';
import { updateLocation } from "../../../services/locationService";
import {
  RiMapPinLine,
  RiWifiLine,
  RiUserLocationLine,
  RiRefreshLine,
  RiShareLine,
  RiBatteryLine,
  RiAlarmWarningLine,
} from 'react-icons/ri';
import './LocationCard.css';

function LocationCard({ user, setUser, sharingLocation, onStartSharing, onStopSharing }) {
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);

  useEffect(() => {
    if (!navigator.getBattery) return;
    navigator.getBattery().then((battery) => {
      setBatteryLevel(Math.round(battery.level * 100));
      battery.addEventListener('levelchange', () => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }).catch(() => {});
  }, []);

  const getBatteryColor = (level) => {
    if (level === null) return 'gray';
    if (level > 50) return 'green';
    if (level > 20) return 'orange';
    return 'red';
  };

  const handleSOS = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'https://geoconnect-afte.onrender.com/api'}/guardian/sos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access')}`,
        },
        body: JSON.stringify({
          latitude: user.latitude,
          longitude: user.longitude,
        }),
      });
      setShowSOSConfirm(false);
      alert('SOS alert sent to your guardians!');
    } catch {
      alert('Failed to send SOS alert. Please try again.');
    }
  };

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

          setUser((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
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
            <span className="loc-detail-value">{typeof user.latitude === "number"
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
            <span className="loc-detail-value">{typeof user.longitude === "number"
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

        {batteryLevel !== null && (
          <div className="location-detail">
            <div className="loc-detail-icon">
              <RiBatteryLine size={18} />
            </div>
            <div className="loc-detail-content">
              <span className="loc-detail-label">Battery</span>
              <span className={`loc-detail-value battery-${getBatteryColor(batteryLevel)}`}>
                {batteryLevel}%
              </span>
            </div>
          </div>
        )}
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

        <motion.button
          className="sos-btn"
          onClick={() => setShowSOSConfirm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Send SOS Alert"
        >
          <RiAlarmWarningLine size={18} />
          SOS
        </motion.button>
      </div>

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
            <p>This will immediately notify all your guardians with your current location.</p>
            <div className="sos-confirm-actions">
              <button className="btn-cancel" onClick={() => setShowSOSConfirm(false)}>Cancel</button>
              <button className="btn-sos-confirm" onClick={handleSOS}>Send SOS</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default LocationCard;
