import { useState, useEffect } from "react";
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
  RiAddLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import {
  getGuardianDashboard,
  addFamilyMember,
  addSafePlace,
  addEmergencyContact,
} from "../services/guardianService";
import "./styles/GuardianDashboard.css";

function GuardianDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    is_guardian: false,
    profile: null,
    family_members: [],
    safe_places: [],
    emergency_contacts: [],
  });

  const [familyForm, setFamilyForm] = useState({ name: "", relation: "", phone: "", email: "" });
  const [safePlaceForm, setSafePlaceForm] = useState({ name: "", address: "", latitude: "", longitude: "", radius: 500 });
  const [emergencyForm, setEmergencyForm] = useState({ name: "", phone: "", contact_type: "" });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getGuardianDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch guardian dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    try {
      await addFamilyMember(familyForm);
      setFamilyForm({ name: "", relation: "", phone: "", email: "" });
      fetchDashboard();
    } catch (error) {
      console.error("Failed to add family member:", error);
    }
  };

  const handleAddSafePlace = async (e) => {
    e.preventDefault();
    try {
      await addSafePlace(safePlaceForm);
      setSafePlaceForm({ name: "", address: "", latitude: "", longitude: "", radius: 500 });
      fetchDashboard();
    } catch (error) {
      console.error("Failed to add safe place:", error);
    }
  };

  const handleAddEmergencyContact = async (e) => {
    e.preventDefault();
    try {
      await addEmergencyContact(emergencyForm);
      setEmergencyForm({ name: "", phone: "", contact_type: "" });
      fetchDashboard();
    } catch (error) {
      console.error("Failed to add emergency contact:", error);
    }
  };

  const familyMembers = dashboardData.family_members;
  const safePlaces = dashboardData.safe_places;
  const emergencyContacts = dashboardData.emergency_contacts;

  const tabs = [
    { id: "overview", label: "Overview", icon: RiShieldLine },
    { id: "family", label: "Family", icon: RiTeamLine },
    { id: "safe-places", label: "Safe Places", icon: RiMapPinLine },
    { id: "emergency", label: "Emergency", icon: RiAlarmWarningLine },
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
        <StatCard icon={RiMapPinLine} label="Safe Places" value={safePlaces.length} color="green" />
        <StatCard icon={RiAlarmWarningLine} label="Emergency Contacts" value={emergencyContacts.length} color="red" />
        <StatCard icon={RiShieldLine} label="Guardian Status" value={dashboardData.is_guardian ? "Active" : "Inactive"} color="purple" />
      </div>

      {dashboardData.profile && (
        <div className="guardian-section">
          <h3>Guardian Profile</h3>
          <div className="guardian-profile-info">
            <p><strong>Name:</strong> {dashboardData.profile.guardian_name}</p>
            <p><strong>Phone:</strong> {dashboardData.profile.guardian_phone}</p>
            <p><strong>Relation:</strong> {dashboardData.profile.guardian_relation}</p>
            {dashboardData.profile.address && <p><strong>Address:</strong> {dashboardData.profile.address}</p>}
          </div>
        </div>
      )}

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
          <button className="guardian-action-btn" onClick={() => setActiveTab("settings")}>
            <RiSettingsLine size={20} />
            Settings
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
              <div className="avatar-placeholder">{member.name.charAt(0)}</div>
            </div>
            <div className="member-info">
              <h4>{member.name}</h4>
              <span className="member-role">{member.relation}</span>
            </div>
            <div className="member-status">
              <span className="status-badge online">{member.relation}</span>
            </div>
            <div className="member-actions">
              {member.phone && (
                <button className="icon-btn" title="Call">
                  <RiPhoneLine size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="guardian-add-form" onSubmit={handleAddFamilyMember}>
        <h4>Add Family Member</h4>
        <div className="form-row">
          <input
            type="text"
            placeholder="Full Name"
            value={familyForm.name}
            onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Relation (e.g. Child, Spouse)"
            value={familyForm.relation}
            onChange={(e) => setFamilyForm({ ...familyForm, relation: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={familyForm.phone}
            onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={familyForm.email}
            onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })}
          />
        </div>
        <button type="submit" className="guardian-submit-btn">
          <RiAddLine size={18} /> Add Member
        </button>
      </form>
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
          </div>
        ))}
      </div>

      <form className="guardian-add-form" onSubmit={handleAddSafePlace}>
        <h4>Add Safe Place</h4>
        <div className="form-row">
          <input
            type="text"
            placeholder="Place Name"
            value={safePlaceForm.name}
            onChange={(e) => setSafePlaceForm({ ...safePlaceForm, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Address"
            value={safePlaceForm.address}
            onChange={(e) => setSafePlaceForm({ ...safePlaceForm, address: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={safePlaceForm.latitude}
            onChange={(e) => setSafePlaceForm({ ...safePlaceForm, latitude: e.target.value })}
            required
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={safePlaceForm.longitude}
            onChange={(e) => setSafePlaceForm({ ...safePlaceForm, longitude: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="number"
            placeholder="Radius (meters)"
            value={safePlaceForm.radius}
            onChange={(e) => setSafePlaceForm({ ...safePlaceForm, radius: parseInt(e.target.value) || 0 })}
          />
        </div>
        <button type="submit" className="guardian-submit-btn">
          <RiAddLine size={18} /> Add Place
        </button>
      </form>
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
            <div className="emergency-info">
              <h4>{contact.name}</h4>
              <span className="emergency-type">{contact.contact_type}</span>
            </div>
            <div className="emergency-phone">
              <RiPhoneLine size={18} />
              <span>{contact.phone}</span>
            </div>
          </div>
        ))}
      </div>

      <form className="guardian-add-form" onSubmit={handleAddEmergencyContact}>
        <h4>Add Emergency Contact</h4>
        <div className="form-row">
          <input
            type="text"
            placeholder="Contact Name"
            value={emergencyForm.name}
            onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={emergencyForm.phone}
            onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="text"
            placeholder="Contact Type (e.g. Medical, Family)"
            value={emergencyForm.contact_type}
            onChange={(e) => setEmergencyForm({ ...emergencyForm, contact_type: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="guardian-submit-btn">
          <RiAddLine size={18} /> Add Contact
        </button>
      </form>
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
    if (loading) {
      return (
        <div className="guardian-loading">
          <p>Loading guardian data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "overview": return renderOverview();
      case "family": return renderFamily();
      case "safe-places": return renderSafePlaces();
      case "emergency": return renderEmergency();
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
          <p>Manage your family's safety and location</p>
        </header>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GuardianDashboard;
