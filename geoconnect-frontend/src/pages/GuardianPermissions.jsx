import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  RiSendPlaneLine,
  RiLoader4Line,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import {
  getFamilyMembers,
  getLocationPermissions,
  removeFamilyMember,
  getFamilyInvitations,
  respondToFamilyInvitation,
  sendPermissionRequest,
  getPermissionRequests,
  respondToPermissionRequest,
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
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState("always");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [members, perms, invites, reqs] = await Promise.all([
        getFamilyMembers().catch(() => []),
        getLocationPermissions().catch(() => []),
        getFamilyInvitations().catch(() => []),
        getPermissionRequests().catch(() => []),
      ]);
      setFamilyMembers(members);
      setPermissions(perms);
      setInvitations(invites);
      setPermissionRequests(reqs);
    } catch (error) {
      console.error("Failed to fetch permissions data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPermissionRequest = async () => {
    if (!selectedGuardian) return;
    setSubmitting(true);
    try {
      await sendPermissionRequest({
        child_id: selectedGuardian.id,
        requested_permission: selectedPermission,
      });
      setShowRequestModal(false);
      await fetchData();
    } catch (error) {
      console.error("Failed to send permission request:", error);
      alert(error.response?.data?.error || "Failed to send request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      await respondToPermissionRequest(requestId, action);
      await fetchData();
    } catch (error) {
      console.error("Failed to respond to request:", error);
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
          <button className="back-btn" onClick={() => navigate('/guardian')}>
            <RiArrowLeftLine size={20} />
          </button>
          <div>
            <h1>Guardian Permissions</h1>
            <p>Manage who can see your location and how</p>
          </div>
        </header>

        {invitations.length > 0 && (
          <motion.section
            className="permissions-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.section>
        )}

        {permissionRequests.length > 0 && (
          <motion.section
            className="permissions-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <h2>Permission Change Requests</h2>
            <div className="requests-list">
              {permissionRequests.map((req) => {
                const current = getPermissionDetails(req.current_permission);
                const requested = getPermissionDetails(req.requested_permission);
                const CurrentIcon = current.icon;
                const RequestedIcon = requested.icon;

                return (
                  <motion.div
                    key={req.id}
                    className="request-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="request-header">
                      <div className="request-avatar">
                        <div className="avatar-placeholder">{req.guardian_username.charAt(0).toUpperCase()}</div>
                      </div>
                      <div className="request-info">
                        <h4>{req.guardian_username} requested a permission change</h4>
                        <p className="request-time">{new Date(req.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="request-comparison">
                      <div className={`request-permission-badge ${current.color}`}>
                        <CurrentIcon size={14} />
                        <span>Current: {current.label}</span>
                      </div>
                      <div className="request-arrow">
                        <RiArrowLeftLine size={16} style={{ transform: 'rotate(180deg)' }} />
                      </div>
                      <div className={`request-permission-badge ${requested.color}`}>
                        <RequestedIcon size={14} />
                        <span>Requested: {requested.label}</span>
                      </div>
                    </div>

                    {req.status === "pending" && (
                      <div className="request-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleRespondRequest(req.id, "accept")}
                        >
                          <RiCheckLine size={16} /> Accept
                        </button>
                        <button
                          className="btn-decline"
                          onClick={() => handleRespondRequest(req.id, "decline")}
                        >
                          <RiCloseLine size={16} /> Decline
                        </button>
                      </div>
                    )}

                    {req.status !== "pending" && (
                      <div className={`request-status-badge ${req.status}`}>
                        {req.status === "accepted" ? "Accepted" : "Declined"}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        <motion.section
          className="permissions-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
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
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
                        className="request-permission-btn"
                        onClick={() => {
                          setSelectedGuardian(member);
                          setSelectedPermission(permType);
                          setShowRequestModal(true);
                        }}
                      >
                        <RiSendPlaneLine size={16} />
                        Request Permission Change
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
        </motion.section>

        <motion.section
          className="permissions-section info-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2>How Permissions Work</h2>
          <div className="info-grid">
            <motion.div className="info-card" whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <RiLockLine size={24} />
              <h4>You're in control</h4>
              <p>You decide exactly who can see your location and when. Guardians cannot override your settings.</p>
            </motion.div>
            <motion.div className="info-card" whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <RiEyeLine size={24} />
              <h4>Granular sharing</h4>
              <p>Choose from different sharing modes: always, school hours, safe places only, emergencies, or paused.</p>
            </motion.div>
            <motion.div className="info-card" whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <RiAlertLine size={24} />
              <h4>Emergency access</h4>
              <p>During SOS alerts, your precise location is automatically shared with all connected guardians.</p>
            </motion.div>
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {showRequestModal && selectedGuardian && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              className="permission-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Request Permission Change</h3>
                <button className="modal-close" onClick={() => setShowRequestModal(false)}>
                  <RiCloseLine size={20} />
                </button>
              </div>
              <p className="modal-subtitle">
                Request how {selectedGuardian.guardian_username || selectedGuardian.child_username} can see your location
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
                <button className="modal-cancel" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </button>
                <button
                  className="modal-save"
                  onClick={handleSendPermissionRequest}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RiLoader4Line size={16} className="spinner" />
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
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
