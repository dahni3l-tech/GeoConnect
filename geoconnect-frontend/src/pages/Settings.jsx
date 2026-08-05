import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  RiPaletteLine,
  RiLockLine,
  RiMapPinLine,
  RiTeamLine,
  RiNotificationLine,
  RiUserLine,
  RiShieldLine,
  RiSaveLine,
  RiArrowLeftLine,
  RiLogoutBoxLine,
} from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { clearUserCache } from "../services/profileService";
import "./styles/Settings.css";

const STORAGE_KEY = "geoconnect_settings";

function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore parse errors
    }
    return {
      theme: "dark",
      locationPrecision: "high",
      notifications: {
        push: true,
        email: true,
        sound: false,
      },
      privacy: {
        showLocation: true,
        showProfile: true,
        allowRequests: true,
      },
      guardian: {
        enableGuardian: false,
        shareWithGuardian: false,
        emergencyContacts: [],
      },
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore storage errors
    }
  };

  const handleToggle = (category, key) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key],
      },
    }));
  };

  const handleLogout = async () => {
    await logout();
    clearUserCache();
    navigate("/login");
  };

  const sections = [
    { id: "profile", label: "Profile", icon: RiUserLine },
    { id: "appearance", label: "Appearance", icon: RiPaletteLine },
    { id: "privacy", label: "Privacy", icon: RiLockLine },
    { id: "location", label: "Location", icon: RiMapPinLine },
    { id: "notifications", label: "Notifications", icon: RiNotificationLine },
    { id: "guardian", label: "Guardian", icon: RiTeamLine },
    { id: "security", label: "Security", icon: RiShieldLine },
  ];

  const renderProfile = () => (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Profile Settings</h3>
      <div className="setting-field">
        <label>Display Name</label>
        <input type="text" defaultValue="Your Username" />
      </div>
      <div className="setting-field">
        <label>Email</label>
        <input type="email" defaultValue="your@email.com" />
      </div>
      <div className="setting-field">
        <label>Bio</label>
        <textarea rows={3} placeholder="Tell people about yourself..." />
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Save Profile
      </button>
    </motion.div>
  );

  const renderAppearance = () => (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Appearance</h3>
      <div className="setting-field">
        <label>Theme</label>
        <div className="theme-options">
          {["dark", "light", "system"].map((theme) => (
            <button
              key={theme}
              className={`theme-btn ${settings.theme === theme ? "active" : ""}`}
              onClick={() =>
                setSettings((prev) => ({ ...prev, theme }))
              }
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Save Appearance
      </button>
    </motion.div>
  );

  const renderPrivacy = () => (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Privacy Controls</h3>
      {[
        { key: "showLocation", label: "Show My Location", desc: "Allow friends to see your location" },
        { key: "showProfile", label: "Public Profile", desc: "Allow others to view your profile" },
        { key: "allowRequests", label: "Friend Requests", desc: "Allow people to send you friend requests" },
      ].map((item) => (
        <div key={item.key} className="setting-toggle">
          <div className="toggle-info">
            <h4>{item.label}</h4>
            <p>{item.desc}</p>
          </div>
          <button
            className={`toggle-btn ${settings.privacy[item.key] ? "active" : ""}`}
            onClick={() => handleToggle("privacy", item.key)}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      ))}
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Save Privacy Settings
      </button>
    </motion.div>
  );

  const renderLocation = () => (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Location Settings</h3>
      <div className="setting-field">
        <label>Location Precision</label>
        <div className="precision-options">
          {["low", "medium", "high"].map((level) => (
            <button
              key={level}
              className={`precision-btn ${settings.locationPrecision === level ? "active" : ""}`}
              onClick={() =>
                setSettings((prev) => ({ ...prev, locationPrecision: level }))
              }
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-toggle">
        <div className="toggle-info">
          <h4>Share Location with Friends</h4>
          <p>Allow your friends to see your live location</p>
        </div>
        <button
          className={`toggle-btn ${settings.privacy.showLocation ? "active" : ""}`}
          onClick={() => handleToggle("privacy", "showLocation")}
        >
          <span className="toggle-knob" />
        </button>
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Save Location Settings
      </button>
    </motion.div>
  );

  const renderNotifications = () => (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Notification Preferences</h3>
      {[
        { key: "push", label: "Push Notifications", desc: "Receive push notifications on your device" },
        { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
        { key: "sound", label: "Sound Alerts", desc: "Play sound for new notifications" },
      ].map((item) => (
        <div key={item.key} className="setting-toggle">
          <div className="toggle-info">
            <h4>{item.label}</h4>
            <p>{item.desc}</p>
          </div>
          <button
            className={`toggle-btn ${settings.notifications[item.key] ? "active" : ""}`}
            onClick={() => handleToggle("notifications", item.key)}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      ))}
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Save Notification Settings
      </button>
    </motion.div>
  );

  const renderGuardian = () => (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Guardian Settings</h3>
      <div className="setting-toggle">
        <div className="toggle-info">
          <h4>Enable Guardian Mode</h4>
          <p>Activate guardian monitoring for your account</p>
        </div>
        <button
          className={`toggle-btn ${settings.guardian.enableGuardian ? "active" : ""}`}
          onClick={() => handleToggle("guardian", "enableGuardian")}
        >
          <span className="toggle-knob" />
        </button>
      </div>
      <div className="setting-toggle">
        <div className="toggle-info">
          <h4>Share Location with Guardian</h4>
          <p>Allow your guardian to view your live location</p>
        </div>
        <button
          className={`toggle-btn ${settings.guardian.shareWithGuardian ? "active" : ""}`}
          onClick={() => handleToggle("guardian", "shareWithGuardian")}
        >
          <span className="toggle-knob" />
        </button>
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Save Guardian Settings
      </button>
    </motion.div>
  );

  const renderSecurity = () => (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Security Settings</h3>
      <div className="setting-field">
        <label>Current Password</label>
        <input type="password" placeholder="Enter current password" />
      </div>
      <div className="setting-field">
        <label>New Password</label>
        <input type="password" placeholder="Enter new password" />
      </div>
      <div className="setting-field">
        <label>Confirm New Password</label>
        <input type="password" placeholder="Confirm new password" />
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Update Password
      </button>

      <div className="settings-danger-zone" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #E5E7EB' }}>
        <h4 style={{ color: '#EF4444', marginBottom: 12 }}>Danger Zone</h4>
        <button className="btn btn-danger" onClick={handleLogout}>
          <RiLogoutBoxLine size={18} />
          Logout
        </button>
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "profile": return renderProfile();
      case "appearance": return renderAppearance();
      case "privacy": return renderPrivacy();
      case "location": return renderLocation();
      case "notifications": return renderNotifications();
      case "guardian": return renderGuardian();
      case "security": return renderSecurity();
      default: return renderProfile();
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-sidebar">
        <h2>Settings</h2>
        <nav className="settings-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon size={20} />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="settings-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button className="settings-back-btn" onClick={() => navigate(-1)}>
            <RiArrowLeftLine size={18} />
            Back
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: '#10B981', fontWeight: 600, fontSize: '14px' }}
            >
              Saved successfully!
            </motion.span>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

export default Settings;
