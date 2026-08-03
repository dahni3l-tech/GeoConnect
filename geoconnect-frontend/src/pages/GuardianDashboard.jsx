import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiShieldLine,
  RiUserLine,
  RiMapPinLine,
  RiAlarmWarningLine,
  RiContactsLine,
  RiTeamLine,
  RiAlarmLine,
  RiLockLine,
  RiSettingsLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiBellLine,
  RiPhoneLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import "./styles/GuardianDashboard.css";

function GuardianDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const familyMembers = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Child",
      avatar: null,
      online: true,
      location: { lat: 40.7128, lng: -74.006 },
      lastSeen: "2 min ago",
      locationSharing: true,
    },
    {
      id: 2,
      name: "Michael Johnson",
      role: "Spouse",
      avatar: null,
      online: true,
      location: { lat: 40.758, lng: -73.9855 },
      lastSeen: "5 min ago",
      locationSharing: true,
    },
    {
      id: 3,
      name: "Emily Johnson",
      role: "Child",
      avatar: null,
      online: false,
      location: null,
      lastSeen: "3 hours ago",
      locationSharing: false,
    },
  ];

  const safePlaces = [
    { id: 1, name: "Home", address: "123 Main St, New York", lat: 40.7128, lng: -74.006, radius: 500 },
    { id: 2, name: "School", address: "456 Education Ave, New York", lat: 40.7282, lng: -73.7949, radius: 300 },
    { id: 3, name: "Grandma's House", address: "789 Family Rd, Brooklyn", lat: 40.6782, lng: -73.9442, radius: 400 },
  ];

  const emergencyContacts = [
    { id: 1, name: "911", type: "Emergency", icon: RiAlarmWarningLine },
    { id: 2, name: "John Johnson (Father)", type: "Family", icon: RiContactsLine },
    { id: 3, name: "Jane Johnson (Mother)", type: "Family", icon: RiContactsLine },
    { id: 4, name: "Dr. Smith", type: "Medical", icon: RiPhoneLine },
  ];

  const guardianRequests = [
    { id: 1, from: "Alex Thompson", relation: "Parent", status: "pending", time: "10 min ago" },
    { id: 2, from: "Maria Garcia", relation: "Aunt", status: "accepted", time: "2 hours ago" },
    { id: 3, from: "David Lee", relation: "Uncle", status: "rejected", time: "1 day ago" },
  ];

  const sosHistory = [
    { id: 1, type: "SOS", location: "40.7128, -74.006", time: "15 min ago", status: "Resolved" },
    { id: 2, type: "SOS", location: "40.758, -73.9855", time: "2 days ago", status: "Resolved" },
    { id: 3, type: "Location Alert", location: "40.6782, -73.9442", time: "5 days ago", status: "Reviewed" },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: RiShieldLine },
    { id: "family", label: "Family", icon: RiTeamLine },
    { id: "safe-places", label: "Safe Places", icon: RiMapPinLine },
    { id: "emergency", label: "Emergency", icon: RiAlarmWarningLine },
    { id: "requests", label: "Requests", icon: RiUserLine },
    { id: "sos", label: "SOS History", icon: RiAlarmLine },
    { id: "privacy", label: "Privacy", icon: RiLockLine },
    { id: "settings", label: "Settings", icon: RiSettingsLine },
  ];

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`guardian-stat-card ${color}`}>
      <div className="guardian-stat-icon">
        <Icon size={24} />
      </div>
      <div className="guardian-stat-content">
        <span className="guardian-stat-value">{value}</span>
        <span className="guardian-stat-label">{label}</span>
      </div>
    </div>
  );

  const renderOverview = () => (
    <motion.div
      className="guardian-overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="guardian-stats-grid">
        <StatCard icon={RiTeamLine} label="Family Members" value={familyMembers.length} color="blue" />
        <StatCard icon={RiMapPinLine} label="Active Locations" value={familyMembers.filter((m) => m.online).length} color="green" />
        <StatCard icon={RiAlarmWarningLine} label="Emergency Contacts" value={emergencyContacts.length} color="red" />
        <StatCard icon={RiShieldLine} label="Safe Places" value={safePlaces.length} color="purple" />
      </div>

      <div className="guardian-section">
        <h3>Recent Activity</h3>
        <div className="guardian-activity-list">
          {sosHistory.slice(0, 3).map((item) => (
            <div key={item.id} className="guardian-activity-item">
              <div className={`activity-dot ${item.type === "SOS" ? "sos" : "location"}`} />
              <div className="activity-content">
                <span className="activity-type">{item.type}</span>
                <span className="activity-location">{item.location}</span>
              </div>
              <span className="activity-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="guardian-section">
        <h3>Quick Actions</h3>
        <div className="guardian-quick-actions">
          <button className="guardian-action-btn" onClick={() => setActiveTab("family")}>
            <RiTeamLine size={20} />
            Manage Family
          </button>
          <button className="guardian-action-btn" onClick={() => setActiveTab("safe-places")}>
            <RiMapPinLine size={20} />
            Safe Places
          </button>
          <button className="guardian-action-btn" onClick={() => setActiveTab("emergency")}>
            <RiAlarmWarningLine size={20} />
            Emergency
          </button>
          <button className="guardian-action-btn" onClick={() => setActiveTab("privacy")}>
            <RiLockLine size={20} />
            Privacy
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderFamily = () => (
    <motion.div
      className="guardian-family"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Family Members</h3>
      <div className="guardian-member-list">
        {familyMembers.map((member) => (
          <div key={member.id} className="guardian-member-card">
            <div className="member-avatar">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} />
              ) : (
                <div className="avatar-placeholder">{member.name.charAt(0)}</div>
              )}
              <span className={`online-badge ${member.online ? "online" : "offline"}`} />
            </div>
            <div className="member-info">
              <h4>{member.name}</h4>
              <span className="member-role">{member.role}</span>
            </div>
            <div className="member-status">
              {member.online ? (
                <span className="status-badge online">Online</span>
              ) : (
                <span className="status-badge offline">{member.lastSeen}</span>
              )}
            </div>
            <div className="member-actions">
              <button className="icon-btn" title="View Location">
                <RiMapPinLine size={18} />
              </button>
              <button className="icon-btn" title="Contact">
                <RiPhoneLine size={18} />
              </button>
              <button className="icon-btn" title="Settings">
                <RiSettingsLine size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderSafePlaces = () => (
    <motion.div
      className="guardian-safe-places"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Safe Places</h3>
      <div className="guardian-safe-places-list">
        {safePlaces.map((place) => (
          <div key={place.id} className="guardian-safe-place-card">
            <div className="place-icon">
              <RiMapPinLine size={24} />
            </div>
            <div className="place-info">
              <h4>{place.name}</h4>
              <p>{place.address}</p>
              <span className="place-radius">Radius: {place.radius}m</span>
            </div>
            <div className="place-actions">
              <button className="icon-btn" title="Edit">
                <RiSettingsLine size={18} />
              </button>
              <button className="icon-btn danger" title="Remove">
                <RiCloseLine size={18} />
              </button>
            </div>
          </div>
        ))}
        <button className="add-safe-place-btn">
          <span>+</span> Add Safe Place
        </button>
      </div>
    </motion.div>
  );

  const renderEmergency = () => (
    <motion.div
      className="guardian-emergency"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Emergency Contacts</h3>
      <div className="guardian-emergency-list">
        {emergencyContacts.map((contact) => (
          <div key={contact.id} className="guardian-emergency-card">
            <div className="emergency-icon">
              <contact.icon size={24} />
            </div>
            <div className="emergency-info">
              <h4>{contact.name}</h4>
              <span className="emergency-type">{contact.type}</span>
            </div>
            <button className="icon-btn">
              <RiPhoneLine size={18} />
            </button>
          </div>
        ))}
      </div>
      <button className="add-emergency-btn">
        <span>+</span> Add Emergency Contact
      </button>
    </motion.div>
  );

  const renderRequests = () => (
    <motion.div
      className="guardian-requests"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Guardian Requests</h3>
      <div className="guardian-request-list">
        {guardianRequests.map((req) => (
          <div key={req.id} className="guardian-request-card">
            <div className="request-info">
              <h4>{req.from}</h4>
              <span className="request-relation">{req.relation}</span>
              <span className="request-time">{req.time}</span>
            </div>
            <div className="request-status">
              {req.status === "pending" ? (
                <span className="status-badge pending">Pending</span>
              ) : req.status === "accepted" ? (
                <span className="status-badge accepted">Accepted</span>
              ) : (
                <span className="status-badge rejected">Rejected</span>
              )}
            </div>
            {req.status === "pending" && (
              <div className="request-actions">
                <button className="btn-accept">
                  <RiCheckLine size={16} /> Accept
                </button>
                <button className="btn-reject">
                  <RiCloseLine size={16} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderSOS = () => (
    <motion.div
      className="guardian-sos"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>SOS History</h3>
      <div className="guardian-sos-list">
        {sosHistory.map((item) => (
          <div key={item.id} className="guardian-sos-card">
            <div className={`sos-icon ${item.type === "SOS" ? "active" : "info"}`}>
              {item.type === "SOS" ? <RiAlarmWarningLine size={20} /> : <RiBellLine size={20} />}
            </div>
            <div className="sos-info">
              <span className="sos-type">{item.type}</span>
              <span className="sos-location">{item.location}</span>
            </div>
            <div className="sos-meta">
              <span className="sos-time">{item.time}</span>
              <span className={`sos-status ${item.status === "Resolved" ? "resolved" : "reviewed"}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderPrivacy = () => (
    <motion.div
      className="guardian-privacy"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Privacy Controls</h3>
      <div className="guardian-privacy-list">
        {[
          { id: "location-sharing", label: "Location Sharing", desc: "Control who can see your location", enabled: true },
          { id: "profile-visibility", label: "Profile Visibility", desc: "Who can view your profile", enabled: true },
          { id: "notification-permissions", label: "Notification Permissions", desc: "Manage notification preferences", enabled: true },
          { id: "data-sharing", label: "Data Sharing", desc: "Control data sharing with third parties", enabled: false },
          { id: "location-history", label: "Location History", desc: "Store and manage location history", enabled: true },
          { id: "emergency-access", label: "Emergency Access", desc: "Allow emergency contacts to access location", enabled: true },
        ].map((setting) => (
          <div key={setting.id} className="guardian-privacy-item">
            <div className="privacy-info">
              <h4>{setting.label}</h4>
              <p>{setting.desc}</p>
            </div>
            <button
              className={`toggle-btn ${setting.enabled ? "active" : ""}`}
              onClick={() => {}}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div
      className="guardian-settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Guardian Settings</h3>
      <div className="guardian-settings-list">
        {[
          { id: "notifications", label: "Notification Preferences", desc: "Manage how you receive alerts", icon: RiBellLine },
          { id: "guardian-prefs", label: "Guardian Preferences", desc: "Customize your guardian experience", icon: RiSettingsLine },
          { id: "location-precision", label: "Location Precision", desc: "Set location accuracy level", icon: RiMapPinLine },
          { id: "security", label: "Security", desc: "Manage account security settings", icon: RiShieldLine },
        ].map((setting) => (
          <div key={setting.id} className="guardian-setting-item">
            <div className="setting-icon">
              <setting.icon size={20} />
            </div>
            <div className="setting-info">
              <h4>{setting.label}</h4>
              <p>{setting.desc}</p>
            </div>
            <RiArrowLeftLine size={16} className="setting-arrow" />
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "family": return renderFamily();
      case "safe-places": return renderSafePlaces();
      case "emergency": return renderEmergency();
      case "requests": return renderRequests();
      case "sos": return renderSOS();
      case "privacy": return renderPrivacy();
      case "settings": return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="guardian-dashboard">
      <div className="guardian-sidebar">
        <div className="guardian-sidebar-header">
          <div className="guardian-logo">
            <RiShieldLine size={28} />
            <span>Guardian</span>
          </div>
          <button className="guardian-back-btn" onClick={() => navigate("/dashboard")}>
            <RiArrowLeftLine size={18} />
            Back to Dashboard
          </button>
        </div>
        <nav className="guardian-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`guardian-nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="guardian-main">
        <header className="guardian-header">
          <h1>Guardian Dashboard</h1>
          <p>Monitor and manage your family's safety and location</p>
        </header>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GuardianDashboard;