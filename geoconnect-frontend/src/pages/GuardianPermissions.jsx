import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RiShieldLine,
  RiUserLine,
  RiMapPinLine,
  RiLockLine,
  RiArrowLeftLine,
  RiCloseLine,
  RiCheckLine,
  RiEyeLine,
  RiEyeOffLine,
  RiPauseLine,
  RiHomeLine,
  RiSchoolLine,
  RiAlarmWarningLine,
  RiSettingsLine,
  RiAlertLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import {
  getFamilyMembers,
  getLocationPermissions,
  updateLocationPermission,
  removeFamilyMember,
  getFamilyInvitations,
  respondToFamilyInvitation,
} from "../services/guardianService";
import "./styles/GuardianPermissions.css";

const PERMISSION_OPTIONS = [
  { value: "always", label: "Always share live location", desc: "Guardians can see your real-time location anytime", icon: RiEyeLine, color: "green" },
  { value: "school_hours", label: "School hours only", desc: "Share location only during expected school hours (8am - 4pm)", icon: RiSchoolLine, color: "blue" },
  { value: "safe_places", label: "Safe places only", desc: "Share only when arriving at or leaving safe places", icon: RiHomeLine, color: "purple" },
  { value: "emergencies_only", label: "Emergencies only", desc: "Share location only during SOS alerts", icon: RiAlarmWarningLine, color: "red" },
  { value: "paused", label: "Pause sharing", desc: "Temporarily stop sharing for a chosen duration", icon: RiPauseLine, color: "gray" },
  { value: "approximate", label: "Approximate location", desc: "Share general area instead of precise location", icon: RiEyeOffLine, color: "orange" },
];

function GuardianPermissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState("always");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [members, perms, invites] = await Promise.all([
        getFamilyMembers().catch(() => []),
        getLocationPermissions().catch(() => []),
        getFamilyInvitations().catch(() => []),
      ]);
      setFamilyMembers(members);
      setPermissions(perms);
      setInvitations(invites);
    } catch (error) {
      console.error("Failed to fetch permissions data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (guardianId, permissionType) => {
    try {
      await updateLocationPermission(guardianId, permissionType);
      await fetchData();
      setShowPermissionModal(false);
    } catch (error) {
      console.error("Failed to update permission:", error);
    }
  };

  const handleRemoveGuardian = async (guardianId) => {
    if (!window.confirm("Are you sure you want to remove this guardian? They will no longer see your location.")) {
      return;
    }
    try {
      await removeFamilyMember(guardianId);
      await fetchData();
      setSelectedGuardian(null);
    } catch (error) {
      console.error("Failed to remove guardian:", error);
    }
  };

  const handleRespondInvitation = async (invitationId, action) => {
    try {
      const permType = action === "accept" ? "always" : "always";
      await respondToFamilyInvitation(invitationId, action, permType);
      await fetchData();
    } catch (error) {
      console.error("Failed to respond to invitation:", error);
    }
  };

  const getPermissionDetails = (type) => {
    return PERMISSION_OPTIONS.find((p) => p.value === type) || PERMISSION_OPTIONS[0];
  };

  if (loading) {
    return (
      <div className="permissions-page">
        <div className="permissions-loading">
          <div className="loading-spinner" />
          <p>Loading your guardians...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="permissions-page">
      <div className="permissions-container">
        <header className="permissions-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <RiArrowLeftLine size={20} />
          </button>
          <div>
            <h1>Guardian Permissions</h1>
            <p>Manage who can see your location and how</p>
          </div>
        </header>

        {invitations.length > 0 && (
          <section className="permissions-section">
            <h2>Pending Invitations</h2>
            <div className="invitations-list">
              {invitations.map((inv) => (
                <div key={inv.id} className="invitation-card">
                  <div className="invitation-info">
                    <div className="invitation-avatar">
                      <div className="avatar-placeholder">{inv.guardian_username.charAt(0).toUpperCase()}</div>
                    </div>
                    <div>
                      <h4>{inv.guardian_username}</h4>
                      <p>Wants to add you as {inv.relation}</p>
                    </div>
                  </div>
                  <div className="invitation-actions">
                    <button className="btn-accept" onClick={() => handleRespondInvitation(inv.id, "accept")}>
                      <RiCheckLine size={16} /> Accept
                    </button>
                    <button className="btn-decline" onClick={() => handleRespondInvitation(inv.id, "decline")}>
                      <RiCloseLine size={16} /> Decline
                    </button>
                    <button className="btn-block" onClick={() => handleRespondInvitation(inv.id, "block")}>
                      <RiAlertLine size={16} /> Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="permissions-section">
          <h2>Connected Guardians</h2>
          {familyMembers.length === 0 ? (
            <div className="empty-state">
              <RiShieldLine size={48} />
              <p>No guardians connected</p>
              <span>When someone sends you a family invitation, it will appear here</span>
            </div>
          ) : (
            <div className="guardians-list">
              {familyMembers.map((member) => {
                const perm = permissions.find((p) => p.guardian_id === member.guardian_id) || permissions.find((p) => p.child_id === member.id);
                const permType = perm?.permission_type || "always";
                const permDetails = getPermissionDetails(permType);
                const PermIcon = permDetails.icon;

                return (
                  <motion.div
                    key={member.id}
                    className="guardian-card"
                    whileHover={{ y: -2 }}
                  >
                    <div className="guardian-card-header">
                      <div className="guardian-avatar">
                        {member.guardian_profile_picture || member.child_profile_picture ? (
                          <img
                            src={member.guardian_profile_picture || member.child_profile_picture}
                            alt={member.guardian_username || member.child_username}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {(member.guardian_username || member.child_username).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="guardian-info">
                        <h4>{member.guardian_username || member.child_username}</h4>
                        <span className="guardian-relation">{member.relation}</span>
                      </div>
                    </div>

                    <div className="permission-display">
                      <div className={`permission-badge ${permDetails.color}`}>
                        <PermIcon size={14} />
                        {permDetails.label}
                      </div>
                      <p className="permission-desc">{permDetails.desc}</p>
                    </div>

                    <div className="guardian-actions">
                      <button
                        className="permission-btn"
                        onClick={() => {
                          setSelectedGuardian(member);
                          setSelectedPermission(permType);
                          setShowPermissionModal(true);
                        }}
                      >
                        <RiSettingsLine size={16} />
                        Change Permission
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveGuardian(member.guardian_id || member.id)}
                      >
                        <RiCloseLine size={16} />
                        Remove
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <section className="permissions-section info-section">
          <h2>How Permissions Work</h2>
          <div className="info-grid">
            <div className="info-card">
              <RiLockLine size={24} />
              <h4>You're in control</h4>
              <p>You decide exactly who can see your location and when. Guardians cannot override your settings.</p>
            </div>
            <div className="info-card">
              <RiEyeLine size={24} />
              <h4>Granular sharing</h4>
              <p>Choose from different sharing modes: always, school hours, safe places only, emergencies, or paused.</p>
            </div>
            <div className="info-card">
              <RiAlertLine size={24} />
              <h4>Emergency access</h4>
              <p>During SOS alerts, your precise location is automatically shared with all connected guardians.</p>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showPermissionModal && selectedGuardian && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPermissionModal(false)}
          >
            <motion.div
              className="permission-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Change Permission</h3>
                <button className="modal-close" onClick={() => setShowPermissionModal(false)}>
                  <RiCloseLine size={20} />
                </button>
              </div>
              <p className="modal-subtitle">
                Choose how {selectedGuardian.guardian_username || selectedGuardian.child_username} can see your location
              </p>
              <div className="permission-options">
                {PERMISSION_OPTIONS.map((option) => {
                  const OptionIcon = option.icon;
                  return (
                    <button
                      key={option.value}
                      className={`permission-option ${selectedPermission === option.value ? "selected" : ""} ${option.color}`}
                      onClick={() => setSelectedPermission(option.value)}
                    >
                      <div className="option-icon">
                        <OptionIcon size={24} />
                      </div>
                      <div className="option-content">
                        <h4>{option.label}</h4>
                        <p>{option.desc}</p>
                      </div>
                      {selectedPermission === option.value && (
                        <div className="option-check">
                          <RiCheckLine size={20} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowPermissionModal(false)}>
                  Cancel
                </button>
                <button
                  className="modal-save"
                  onClick={() => handlePermissionChange(selectedGuardian.guardian_id || selectedGuardian.id, selectedPermission)}
                >
                  Save Permission
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GuardianPermissions;
