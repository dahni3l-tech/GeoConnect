import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  RiTeamLine,
  RiNotificationLine,
  RiUserLine,
  RiShieldLine,
  RiSaveLine,
  RiArrowLeftLine,
  RiLogoutBoxLine,
} from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { clearUserCache, getProfile, updateProfile } from "../services/profileService";
import {
  checkBackendSubscription,
  subscribeUser,
  unsubscribeUser,
} from "../services/pushNotificationService";
import api from "../api/axios";
import "./styles/Settings.css";

const STORAGE_KEY = "geoconnect_settings";

function Settings() {
  const { logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [checkingSub, setCheckingSub] = useState(true);

  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
    }
    return {
      notifications: {
        push: true,
        email: true,
        sound: false,
      },
      guardian: {
        enableGuardian: false,
        shareWithGuardian: false,
        emergencyContacts: [],
      },
    };
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        setSettings((prev) => ({
          ...prev,
          profile: {
            displayName: profile.username || "",
            email: profile.email || "",
            bio: profile.bio || "",
          },
        }));
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const checkSub = async () => {
      try {
        const subscribed = await checkBackendSubscription();
        setPushSubscribed(subscribed);
      } catch {
        setPushSubscribed(false);
      } finally {
        setCheckingSub(false);
      }
    };
    checkSub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      if (settings.profile) {
        const updates = {};
        if (settings.profile.displayName !== undefined) updates.username = settings.profile.displayName;
        if (settings.profile.bio !== undefined) updates.bio = settings.profile.bio;

        if (Object.keys(updates).length > 0) {
          try {
            const updated = await updateProfile(updates);
            setUserProfile(updated);
            setUser(updated);
          } catch (err) {
            console.error("Failed to update profile:", err);
          }
        }
       }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
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

  const handlePushToggle = async () => {
    if (pushSubscribed) {
      try {
        await unsubscribeUser();
        setPushSubscribed(false);
        setSettings((prev) => ({
          ...prev,
          notifications: { ...prev.notifications, push: false },
        }));
      } catch (err) {
        console.error("Failed to disable push:", err);
      }
    } else {
      try {
        await subscribeUser();
        setPushSubscribed(true);
        setSettings((prev) => ({
          ...prev,
          notifications: { ...prev.notifications, push: true },
        }));
      } catch (err) {
        alert(err.message || "Failed to enable push notifications.");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    clearUserCache();
    navigate("/login");
  };

  const sections = [
    { id: "profile", label: "Profile", icon: RiUserLine },
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
        <input
          type="text"
          value={settings.profile?.displayName ?? userProfile?.username ?? ""}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              profile: { ...prev.profile, displayName: e.target.value },
            }))
          }
          disabled={profileLoading}
        />
      </div>
      <div className="setting-field">
        <label>Email</label>
        <input type="email" value={userProfile?.email ?? ""} disabled />
      </div>
      <div className="setting-field">
        <label>Bio</label>
        <textarea
          rows={3}
          placeholder="Tell people about yourself..."
          value={settings.profile?.bio ?? userProfile?.bio ?? ""}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              profile: { ...prev.profile, bio: e.target.value },
            }))
          }
        />
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        <RiSaveLine size={18} />
        Save Profile
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
        {
          key: "push",
          label: "Push Notifications",
          desc: "Receive push notifications on your device",
          toggle: pushSubscribed,
          onToggle: handlePushToggle,
          disabled: checkingSub,
        },
        { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
        { key: "sound", label: "Sound Alerts", desc: "Play sound for new notifications" },
      ].map((item) => (
        <div key={item.key} className="setting-toggle">
          <div className="toggle-info">
            <h4>{item.label}</h4>
            <p>{item.desc}</p>
          </div>
          <button
            className={`toggle-btn ${item.toggle !== undefined ? item.toggle : settings.notifications[item.key] ? "active" : ""}`}
            onClick={item.onToggle || (() => handleToggle("notifications", item.key))}
            disabled={item.disabled}
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
      <button
        className="btn btn-primary"
        onClick={async () => {
          try {
            const profileData = await api.get("guardian/profile/");
            await api.put("guardian/profile/", {
              is_guardian: settings.guardian.enableGuardian,
              emergency_contacts: settings.guardian.emergencyContacts,
            });
          } catch {
          }
          handleSave();
        }}
      >
        <RiSaveLine size={18} />
        Save Guardian Settings
      </button>
    </motion.div>
  );

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });

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
        <input
          type="password"
          placeholder="Enter current password"
          value={passwords.old}
          onChange={(e) => setPasswords((p) => ({ ...p, old: e.target.value }))}
        />
      </div>
      <div className="setting-field">
        <label>New Password</label>
        <input
          type="password"
          placeholder="Enter new password"
          value={passwords.new}
          onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
        />
      </div>
      <div className="setting-field">
        <label>Confirm New Password</label>
        <input
          type="password"
          placeholder="Confirm new password"
          value={passwords.confirm}
          onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={async () => {
          if (!passwords.old || !passwords.new) {
            alert("Please fill in all password fields.");
            return;
          }
          if (passwords.new !== passwords.confirm) {
            alert("New passwords do not match.");
            return;
          }
          try {
            await api.post("change-password/", {
              old_password: passwords.old,
              new_password: passwords.new,
            });
            alert("Password changed successfully!");
            setPasswords({ old: "", new: "", confirm: "" });
          } catch (err) {
            alert(err.response?.data?.old_password || "Failed to change password.");
          }
        }}
      >
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
          <button className="settings-back-btn" onClick={() => navigate('/dashboard')}>
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
