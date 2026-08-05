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
  RiMap2Line,
  RiRouteLine,
  RiBatteryChargeLine,
  RiBatteryLine,
  RiBattery2Line,
  RiBatteryLowLine,
  RiHomeLine,
  RiSchoolLine,
  RiWalkLine,
  RiPauseLine,
  RiEyeLine,
  RiEyeOffLine,
  RiSendPlaneLine,
  RiTimeLine,
  RiUserAddLine,
  RiSearchLine,
  RiUserForbidLine,
  RiShieldCheckLine,
  RiMailLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import {
  getFamilyMapData,
  sendFamilyInvitation,
  getFamilyInvitations,
  respondToFamilyInvitation,
  getLocationPermissions,
  getSOSAlerts,
  resolveSOSAlert,
  getRouteHistory,
  getActivityLog,
  getGuardianDashboard,
  addSafePlace,
  addEmergencyContact,
  searchUsers,
} from "../services/guardianService";
import {
  getPendingLocationRequests,
  respondToLocationRequest,
  getNotifications,
  markNotificationRead,
} from "../services/pushNotificationService";
import "./styles/GuardianDashboard.css";

const PERMISSION_LABELS = {
  always: { label: "Live Location Enabled", color: "green", icon: RiEyeLine },
  school_hours: { label: "School Hours Only", color: "blue", icon: RiSchoolLine },
  safe_places: { label: "Safe Places Only", color: "purple", icon: RiHomeLine },
  emergencies_only: { label: "Emergencies Only", color: "red", icon: RiAlarmWarningLine },
  paused: { label: "Paused", color: "gray", icon: RiPauseLine },
  approximate: { label: "Approximate Location", color: "orange", icon: RiEyeOffLine },
};

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
  const [familyMap, setFamilyMap] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [safePlaceForm, setSafePlaceForm] = useState({ name: "", address: "", latitude: "", longitude: "", radius: 500 });
  const [emergencyForm, setEmergencyForm] = useState({ name: "", phone: "", contact_type: "Medical" });

  const [selectedChild, setSelectedChild] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showAddSafePlace, setShowAddSafePlace] = useState(false);
  const [showAddEmergency, setShowAddEmergency] = useState(false);
  const [showRoutePlayback, setShowRoutePlayback] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [inviteRoles, setInviteRoles] = useState({});
  const [invitingUsers, setInvitingUsers] = useState({});

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkSafePlaceProximity = (member) => {
    if (!member.latitude || !member.longitude || !dashboardData.safe_places.length) return null;
    for (const place of dashboardData.safe_places) {
      const distance = getDistance(member.latitude, member.longitude, place.latitude, place.longitude);
      if (distance !== null && distance <= (place.radius || 500)) {
        return { place, distance: Math.round(distance) };
      }
    }
    return null;
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [dashboard, mapData, invites, perms, sos, logs] = await Promise.all([
        getGuardianDashboard().catch(() => null),
        getFamilyMapData().catch(() => []),
        getFamilyInvitations().catch(() => []),
        getLocationPermissions().catch(() => []),
        getSOSAlerts().catch(() => []),
        getActivityLog().catch(() => []),
      ]);

      if (dashboard) setDashboardData(dashboard);
      setFamilyMap(mapData);
      setInvitations(invites);
      setPermissions(perms);
      setSosAlerts(sos);
      setActivityLogs(logs);
    } catch (error) {
      console.error("Failed to fetch guardian data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    try {
      const results = await searchUsers(query);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      setSearchResults([]);
      setSearchError("Failed to search users. Please try again.");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvitation = async (userId, role) => {
    setInvitingUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      await sendFamilyInvitation({
        child_identifier: userId,
        relation: role,
      });
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      setInvitingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      fetchAllData();
    } catch (error) {
      console.error("Failed to send invitation:", error);
      const message = error.response?.data?.error || "Failed to send invitation.";
      alert(message);
      setInvitingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleRespondInvitation = async (invitationId, action) => {
    try {
      await respondToFamilyInvitation(invitationId, action, "always");
      fetchAllData();
    } catch (error) {
      console.error("Failed to respond to invitation:", error);
      const message = error.response?.data?.error || "Failed to respond to invitation.";
      alert(message);
    }
  };

  const handleAddSafePlace = async (e) => {
    e.preventDefault();
    try {
      await addSafePlace(safePlaceForm);
      setSafePlaceForm({ name: "", address: "", latitude: "", longitude: "", radius: 500 });
      setShowAddSafePlace(false);
      fetchAllData();
    } catch (error) {
      console.error("Failed to add safe place:", error);
    }
  };

  const handleAddEmergencyContact = async (e) => {
    e.preventDefault();
    try {
      await addEmergencyContact(emergencyForm);
      setEmergencyForm({ name: "", phone: "", contact_type: "Medical" });
      setShowAddEmergency(false);
      fetchAllData();
    } catch (error) {
      console.error("Failed to add emergency contact:", error);
    }
  };

  const handleViewRoute = async (child) => {
    setSelectedChild(child);
    setShowRoutePlayback(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const history = await getRouteHistory(child.id, today);
      setRouteHistory(history);
    } catch (error) {
      console.error("Failed to fetch route history:", error);
    }
  };

  const handleResolveSOS = async (alertId) => {
    try {
      await resolveSOSAlert(alertId);
      fetchAllData();
    } catch (error) {
      console.error("Failed to resolve SOS:", error);
    }
  };

  const getBatteryIcon = (level) => {
    if (level === null || level === undefined) return RiBatteryLine;
    if (level > 75) return RiBatteryChargeLine;
    if (level > 50) return RiBattery2Line;
    return RiBatteryLowLine;
  };

  const getPermissionBadge = (permissionType) => {
    const perm = PERMISSION_LABELS[permissionType] || PERMISSION_LABELS.always;
    const Icon = perm.icon;
    return (
      <span className={`permission-badge ${perm.color}`}>
        <Icon size={12} />
        {perm.label}
      </span>
    );
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: RiShieldLine },
    { id: "family", label: "Family", icon: RiTeamLine },
    { id: "invitations", label: "Invitations", icon: RiMailLine },
    { id: "map", label: "Live Map", icon: RiMap2Line },
    { id: "timeline", label: "Timeline", icon: RiTimeLine },
    { id: "safe-places", label: "Safe Places", icon: RiHomeLine },
    { id: "emergency", label: "Emergency", icon: RiAlarmWarningLine },
    { id: "permissions", label: "Permissions", icon: RiLockLine },
    { id: "activity", label: "Activity", icon: RiBellLine },
  ];

  const activeSOS = sosAlerts.filter((a) => a.status === "active");

  const renderOverview = () => (
    <motion.div
      className="guardian-overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="guardian-stats-grid">
        <div className="guardian-stat-card blue">
          <div className="guardian-stat-icon"><RiTeamLine size={24} /></div>
          <div className="guardian-stat-content">
            <span className="guardian-stat-value">{familyMap.length}</span>
            <span className="guardian-stat-label">Family Members</span>
          </div>
        </div>
        <div className="guardian-stat-card green">
          <div className="guardian-stat-icon"><RiMapPinLine size={24} /></div>
          <div className="guardian-stat-content">
            <span className="guardian-stat-value">{familyMap.filter((m) => m.is_online).length}</span>
            <span className="guardian-stat-label">Online Now</span>
          </div>
        </div>
        <div className="guardian-stat-card red">
          <div className="guardian-stat-icon"><RiAlarmWarningLine size={24} /></div>
          <div className="guardian-stat-content">
            <span className="guardian-stat-value">{activeSOS.length}</span>
            <span className="guardian-stat-label">Active SOS</span>
          </div>
        </div>
        <div className="guardian-stat-card purple">
          <div className="guardian-stat-icon"><RiShieldLine size={24} /></div>
          <div className="guardian-stat-content">
            <span className="guardian-stat-value">{dashboardData.safe_places.length}</span>
            <span className="guardian-stat-label">Safe Places</span>
          </div>
        </div>
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

      {invitations.length > 0 && (
        <div className="guardian-section">
          <h3>Pending Invitations</h3>
          <div className="guardian-invitation-list">
            {invitations.map((inv) => (
              <div key={inv.id} className="guardian-invitation-card">
                <div className="invitation-info">
                  <h4>{inv.guardian_username} wants to add you to their Family Safety Hub</h4>
                  <span>As {inv.relation}</span>
                </div>
                <div className="invitation-actions">
                  <button className="btn-accept" onClick={() => handleRespondInvitation(inv.id, "accept")}>
                    <RiCheckLine size={16} /> Accept
                  </button>
                  <button className="btn-decline" onClick={() => handleRespondInvitation(inv.id, "decline")}>
                    <RiCloseLine size={16} /> Decline
                  </button>
                  <button className="btn-block" onClick={() => handleRespondInvitation(inv.id, "block")}>
                    <RiUserForbidLine size={16} /> Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSOS.length > 0 && (
        <div className="guardian-section sos-section">
          <h3>Active SOS Alerts</h3>
          <div className="guardian-sos-list">
            {activeSOS.map((alert) => (
              <div key={alert.id} className="guardian-sos-card active">
                <div className="sos-icon"><RiAlarmWarningLine size={20} /></div>
                <div className="sos-info">
                  <span className="sos-type">SOS from {alert.child_username}</span>
                  <span className="sos-location">
                    {alert.latitude && alert.longitude
                      ? `${parseFloat(alert.latitude).toFixed(4)}, ${parseFloat(alert.longitude).toFixed(4)}`
                      : "Location unavailable"}
                  </span>
                </div>
                <button className="btn-resolve" onClick={() => handleResolveSOS(alert.id)}>
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="guardian-section">
        <h3>Quick Actions</h3>
        <div className="guardian-quick-actions">
          <button className="guardian-action-btn" onClick={() => setActiveTab("family")}>
            <RiUserAddLine size={20} />
            Add Family Member
          </button>
          <button className="guardian-action-btn" onClick={() => setActiveTab("map")}>
            <RiMap2Line size={20} />
            Live Map
          </button>
          <button className="guardian-action-btn" onClick={() => setActiveTab("timeline")}>
            <RiTimeLine size={20} />
            Timeline
          </button>
          <button className="guardian-action-btn" onClick={() => setActiveTab("permissions")}>
            <RiLockLine size={20} />
            Permissions
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
      <div className="guardian-section-header">
        <h3>Family Circle</h3>
        <button className="guardian-primary-btn" onClick={() => setShowInviteForm(!showInviteForm)}>
          <RiUserAddLine size={18} />
          {showInviteForm ? "Cancel" : "Add Member"}
        </button>
      </div>

      {showInviteForm && (
        <motion.form
          className="guardian-invite-form"
          onSubmit={handleSearchUsers}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <h4>Search and Invite Family Member</h4>
          <p className="form-hint">Search by username or email to send a family invitation.</p>
          <div className="search-row">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="guardian-submit-btn" disabled={isSearching}>
              {isSearching ? (
                <>
                  <span className="btn-spinner" />
                  Searching...
                </>
              ) : (
                <>
                  <RiSearchLine size={18} />
                  Search
                </>
              )}
            </button>
          </div>

          {isSearching && (
            <div className="search-loading">
              <span className="btn-spinner" />
              <p>Searching for users...</p>
            </div>
          )}
          {searchError && <p className="search-error">{searchError}</p>}

          {searchResults.length > 0 && (
            <div className="invite-results">
              {searchResults.map((user) => {
                const role = inviteRoles[user.id] || "Child";
                const isInviting = invitingUsers[user.id];
                return (
                  <motion.div
                    key={user.id}
                    className="invite-glass-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  >
                    <div className="invite-user-info">
                      <div className="invite-avatar">
                        {user.profile_picture ? (
                          <img src={user.profile_picture} alt={user.username} />
                        ) : (
                          <div className="avatar-placeholder">{user.username.charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="invite-user-details">
                        <p className="invite-username">{user.username}</p>
                        <p className="invite-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="invite-controls">
                      <select
                        className="invite-role-select"
                        value={role}
                        onChange={(e) =>
                          setInviteRoles((prev) => ({ ...prev, [user.id]: e.target.value }))
                        }
                      >
                        <option value="Child">Child</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Grandparent">Grandparent</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                      <button
                        type="button"
                        className={`invite-send-btn ${isInviting ? "loading" : ""}`}
                        onClick={() => handleSendInvitation(user.id, role)}
                        disabled={isInviting}
                      >
                        {isInviting ? (
                          <>
                            <span className="btn-spinner" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RiSendPlaneLine size={16} />
                            Send Invitation
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && !searchError && (
            <div className="search-empty-state">
              <div className="empty-state-icon">
                <RiUserLine size={48} />
              </div>
              <p className="empty-state-title">No users found</p>
              <p className="empty-state-message">
                We couldn't find anyone matching "{searchQuery}". Try a different name or email.
              </p>
            </div>
          )}
        </motion.form>
      )}

      <div className="guardian-member-grid">
        {familyMap.map((member) => {
          const BatteryIcon = getBatteryIcon(member.latest_location?.battery_level);
          const batteryLevel = member.latest_location?.battery_level;
          const batteryColor = batteryLevel === null || batteryLevel === undefined
            ? "gray"
            : batteryLevel > 50
              ? "green"
              : batteryLevel > 20
                ? "orange"
                : "red";

          return (
            <motion.div
              key={member.id}
              className="guardian-member-card"
              whileHover={{ y: -4 }}
            >
              <div className="member-header">
                <div className="member-avatar">
                  {member.profile_picture ? (
                    <img src={member.profile_picture} alt={member.username} />
                  ) : (
                    <div className="avatar-placeholder">{member.username.charAt(0).toUpperCase()}</div>
                  )}
                  <span className={`online-badge ${member.is_online ? "online" : "offline"}`} />
                </div>
                <div className="member-info">
                  <h4>{member.nickname || member.username}</h4>
                  <span className="member-relation">{member.relation}</span>
                </div>
              </div>

              <div className="member-status-bar">
                {member.is_online ? (
                  <span className="status-badge online">Online</span>
                ) : (
                  <span className="status-badge offline">Last seen {formatLastSeen(member.last_seen)}</span>
                )}
                {getPermissionBadge(member.permission_type)}
              </div>

              <div className="member-details">
                <div className="detail-row">
                  <RiMapPinLine size={16} />
                  <span>
                    {member.latitude && member.longitude
                      ? `${parseFloat(member.latitude).toFixed(4)}, ${parseFloat(member.longitude).toFixed(4)}`
                      : "Location unavailable"}
                  </span>
                </div>
                {(() => {
                  const proximity = checkSafePlaceProximity(member);
                  if (proximity) {
                    return (
                      <div className="detail-row safe-place-indicator">
                        <RiHomeLine size={16} />
                        <span>At {proximity.place.name} ({proximity.distance}m away)</span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {batteryLevel !== null && batteryLevel !== undefined && (
                  <div className="detail-row">
                    <BatteryIcon size={16} />
                    <span className={`battery-text ${batteryColor}`}>{batteryLevel}%</span>
                  </div>
                )}
                {member.latest_location && (
                  <div className="detail-row">
                    <RiTimeLine size={16} />
                    <span>Updated {formatLastSeen(member.latest_location.created_at)}</span>
                  </div>
                )}
              </div>

              <div className="member-actions">
                <button className="icon-btn" title="View Route" onClick={() => handleViewRoute(member)}>
                  <RiRouteLine size={18} />
                </button>
                <button className="icon-btn" title="View on Map" onClick={() => setActiveTab("map")}>
                  <RiMap2Line size={18} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {familyMap.length === 0 && (
          <div className="empty-state">
            <RiTeamLine size={48} />
            <p>No family members yet</p>
            <span>Send an invitation to get started</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderMap = () => (
    <motion.div
      className="guardian-map"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Live Family Map</h3>
      <div className="map-container">
        <div className="map-placeholder">
          <RiMap2Line size={64} />
          <p>Family Map View</p>
          <span>{familyMap.filter((m) => m.latitude && m.longitude).length} members with location</span>
        </div>
        <div className="map-legend">
          {familyMap.map((member) => (
            <div key={member.id} className="map-legend-item">
              <div className="legend-avatar">
                {member.profile_picture ? (
                  <img src={member.profile_picture} alt={member.username} />
                ) : (
                  <div className="avatar-placeholder">{member.username.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="legend-info">
                <span className="legend-name">{member.nickname || member.username}</span>
                <span className="legend-status">{member.is_online ? "Online" : "Offline"}</span>
              </div>
              {getPermissionBadge(member.permission_type)}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderTimeline = () => (
    <motion.div
      className="guardian-timeline"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Today's Timeline</h3>
      <div className="timeline-container">
        {routeHistory.length === 0 ? (
          <div className="empty-state">
            <RiTimeLine size={48} />
            <p>No location history for today</p>
          </div>
        ) : (
          <div className="timeline-list">
            {routeHistory.map((point, index) => (
              <motion.div
                key={point.id}
                className="timeline-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <span className="timeline-time">
                    {new Date(point.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="timeline-coords">
                    {parseFloat(point.latitude).toFixed(4)}, {parseFloat(point.longitude).toFixed(4)}
                  </span>
                  {point.battery_level !== null && (
                    <span className="timeline-battery">{point.battery_level}%</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
      <div className="guardian-section-header">
        <h3>Safe Places</h3>
        <button className="guardian-primary-btn" onClick={() => setShowAddSafePlace(!showAddSafePlace)}>
          <RiAddLine size={18} />
          {showAddSafePlace ? "Cancel" : "Add Place"}
        </button>
      </div>

      {showAddSafePlace && (
        <motion.form
          className="guardian-add-form"
          onSubmit={handleAddSafePlace}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
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
            <RiAddLine size={18} /> Add Safe Place
          </button>
        </motion.form>
      )}

      <div className="guardian-safe-places-grid">
        {dashboardData.safe_places.map((place) => (
          <div key={place.id} className="guardian-safe-place-card">
            <div className="place-icon"><RiHomeLine size={24} /></div>
            <div className="place-info">
              <h4>{place.name}</h4>
              <p>{place.address}</p>
              <span className="place-radius">Radius: {place.radius}m</span>
            </div>
          </div>
        ))}
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
      <div className="guardian-section-header">
        <h3>Emergency Contacts</h3>
        <button className="guardian-primary-btn" onClick={() => setShowAddEmergency(!showAddEmergency)}>
          <RiAddLine size={18} />
          {showAddEmergency ? "Cancel" : "Add Contact"}
        </button>
      </div>

      {showAddEmergency && (
        <motion.form
          className="guardian-add-form"
          onSubmit={handleAddEmergencyContact}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
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
            <select
              value={emergencyForm.contact_type}
              onChange={(e) => setEmergencyForm({ ...emergencyForm, contact_type: e.target.value })}
            >
              <option value="Medical">Medical</option>
              <option value="Family">Family</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <button type="submit" className="guardian-submit-btn">
            <RiAddLine size={18} /> Add Contact
          </button>
        </motion.form>
      )}

      <div className="guardian-emergency-grid">
        {dashboardData.emergency_contacts.map((contact) => (
          <div key={contact.id} className="guardian-emergency-card">
            <div className="emergency-icon"><RiAlarmWarningLine size={24} /></div>
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
    </motion.div>
  );

  const renderPermissions = () => (
    <motion.div
      className="guardian-permissions"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Location Permissions</h3>
      <p className="section-subtitle">Children control their own location sharing. Guardians can only view current status.</p>

      <div className="permissions-grid">
        {permissions.map((perm) => (
          <div key={perm.id} className="permission-card">
            <div className="permission-header">
              <div className="permission-avatar">
                {perm.child_profile_picture ? (
                  <img src={perm.child_profile_picture} alt={perm.child_username} />
                ) : (
                  <div className="avatar-placeholder">{perm.child_username.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="permission-info">
                <h4>{perm.child_username}</h4>
                <span className="permission-relation">{perm.relation || "Family Member"}</span>
              </div>
            </div>
            <div className="permission-status">
              {getPermissionBadge(perm.permission_type)}
            </div>
            {perm.paused_until && (
              <div className="permission-paused">
                <RiPauseLine size={14} />
                Paused until {new Date(perm.paused_until).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {permissions.length === 0 && (
        <div className="empty-state">
          <RiLockLine size={48} />
          <p>No permissions configured</p>
          <span>Permissions are set when a child accepts a family invitation</span>
        </div>
      )}
    </motion.div>
  );

  const renderActivity = () => (
    <motion.div
      className="guardian-activity"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Family Activity Feed</h3>
      <div className="activity-feed">
        {activityLogs.map((log, index) => (
          <motion.div
            key={log.id}
            className={`activity-item ${log.activity_type}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="activity-icon">
              {log.activity_type === "family_joined" && <RiUserLine size={18} />}
              {log.activity_type === "family_left" && <RiCloseLine size={18} />}
              {log.activity_type === "permission_changed" && <RiLockLine size={18} />}
              {log.activity_type === "sos_triggered" && <RiAlarmWarningLine size={18} />}
              {log.activity_type === "sos_resolved" && <RiCheckLine size={18} />}
              {log.activity_type === "safe_place_arrived" && <RiHomeLine size={18} />}
              {log.activity_type === "safe_place_left" && <RiWalkLine size={18} />}
              {log.activity_type === "low_battery" && <RiBatteryLowLine size={18} />}
              {log.activity_type === "location_shared" && <RiMapPinLine size={18} />}
              {log.activity_type === "location_paused" && <RiPauseLine size={18} />}
            </div>
            <div className="activity-content">
              <p className="activity-message">{log.description}</p>
              <span className="activity-time">{formatLastSeen(log.created_at)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {activityLogs.length === 0 && (
        <div className="empty-state">
          <RiBellLine size={48} />
          <p>No activity yet</p>
        </div>
      )}
    </motion.div>
  );

  const renderInvitations = () => (
    <motion.div
      className="guardian-invitations"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Family Invitations</h3>
      <p className="section-subtitle">Manage your incoming family invitations. Accept to join a Family Safety Hub, or block to prevent future requests.</p>

      {invitations.length > 0 ? (
        <div className="invitations-list">
          {invitations.map((inv) => (
            <motion.div
              key={inv.id}
              className="invitation-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="invitation-card-header">
                <div className="invitation-card-avatar">
                  <RiShieldCheckLine size={20} />
                </div>
                <div>
                  <h4>{inv.guardian_username} wants to add you to their Family Safety Hub</h4>
                  <span className="invitation-meta">Role: {inv.relation}</span>
                </div>
              </div>
              <p className="invitation-description">
                {inv.guardian_username} wants to add you as their {inv.relation} in their Family Circle.
              </p>
              <div className="invitation-card-actions">
                <button className="btn-accept" onClick={() => handleRespondInvitation(inv.id, "accept")}>
                  <RiCheckLine size={16} /> Accept
                </button>
                <button className="btn-decline" onClick={() => handleRespondInvitation(inv.id, "decline")}>
                  <RiCloseLine size={16} /> Decline
                </button>
                <button className="btn-block" onClick={() => handleRespondInvitation(inv.id, "block")}>
                  <RiUserForbidLine size={16} /> Block
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <RiMailLine size={48} />
          <p>No pending invitations</p>
          <span>When someone invites you to their Family Safety Hub, it will appear here</span>
        </div>
      )}
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "family": return renderFamily();
      case "invitations": return renderInvitations();
      case "map": return renderMap();
      case "timeline": return renderTimeline();
      case "safe-places": return renderSafePlaces();
      case "emergency": return renderEmergency();
      case "permissions": return renderPermissions();
      case "activity": return renderActivity();
      default: return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="guardian-dashboard">
        <div className="guardian-loading">
          <div className="loading-spinner" />
          <p>Loading Family Safety Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guardian-dashboard">
      <div className="guardian-sidebar">
        <div className="guardian-sidebar-header">
          <div className="guardian-logo">
            <RiShieldLine size={28} />
            <span>Family Safety</span>
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

        <div className="sidebar-footer">
          <button className="guardian-invite-cta" onClick={() => setActiveTab("family")}>
            <RiUserAddLine size={18} />
            Invite Family
          </button>
        </div>
      </div>

      <div className="guardian-main">
        <header className="guardian-header">
          <div className="header-top">
            <div>
              <h1>Family Safety Hub</h1>
              <p>Monitor and protect your loved ones</p>
            </div>
            <div className="header-actions">
              {activeSOS.length > 0 && (
                <motion.div
                  className="sos-banner"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <RiAlarmWarningLine size={20} />
                  <span>{activeSOS.length} Active SOS</span>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GuardianDashboard;
