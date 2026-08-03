import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  RiCameraLine,
  RiSaveLine,
  RiCloseLine,
  RiUserLine,
  RiMailLine,
  RiLogoutBoxLine,
} from "react-icons/ri";
import { updateProfile, uploadProfilePicture, clearUserCache, setUserCache } from "../services/profileService";
import { logout } from "../services/authService";
import "./styles/ProfilePage.css";

function ProfilePage({ user, setUser, onClose }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    bio: "",
    first_name: "",
    last_name: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (user && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
      setAvatarPreview(user.profile_picture || null);
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("avatar", file);

    uploadProfilePicture(fd)
      .then((data) => {
        const updatedUser = { ...user, profile_picture: data.profile_picture };
        setUser(updatedUser);
        setUserCache(updatedUser);
      })
      .catch((err) => {
        console.error("Failed to upload avatar:", err);
        alert("Failed to upload profile picture.");
      });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setUser((prev) => ({ ...prev, ...updated }));
      setUserCache({ ...user, ...updated });
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    clearUserCache();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <motion.div
      className="profile-page-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="profile-page-modal"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-page-header">
          <h2>Profile Settings</h2>
          <button className="profile-close-btn" onClick={onClose}>
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="profile-page-body">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large" onClick={handleAvatarClick}>
              {avatarPreview ? (
                <img src={avatarPreview} alt={user.username} />
              ) : (
                <div className="avatar-placeholder-large">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="avatar-upload-overlay">
                <RiCameraLine size={18} />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <h3 className="profile-username">{user.username}</h3>
            <span className="profile-email-display">
              <RiMailLine size={14} /> {user.email}
            </span>
          </div>

          <div className="profile-fields">
            <div className="field-row">
              <div className="field-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  disabled={!editing}
                  placeholder="First name"
                />
              </div>
              <div className="field-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  disabled={!editing}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="field-group">
              <label>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                disabled={!editing}
                placeholder="Username"
              />
            </div>

            <div className="field-group">
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                disabled={!editing}
                placeholder="Tell people about yourself..."
                rows={3}
              />
            </div>
          </div>

          <div className="profile-actions">
            {editing ? (
              <>
                <motion.button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RiSaveLine size={18} />
                  {saving ? "Saving..." : "Save Changes"}
                </motion.button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <motion.button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RiUserLine size={18} />
                Edit Profile
              </motion.button>
            )}
          </div>

          <div className="profile-danger-zone">
            <button className="btn btn-danger" onClick={handleLogout}>
              <RiLogoutBoxLine size={18} />
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ProfilePage;