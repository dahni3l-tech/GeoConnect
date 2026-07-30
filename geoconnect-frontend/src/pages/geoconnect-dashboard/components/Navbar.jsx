import { motion, AnimatePresence } from 'framer-motion';
import {
  RiNotification3Line,
  RiSettings3Line,
  RiMenuLine,
  RiCheckLine,
  RiCloseLine,
} from 'react-icons/ri';
import { useState, useEffect, useRef } from 'react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  unsubscribeUser,
  getSubscriptionStatus,
  checkBackendSubscription,
} from '../../../services/pushNotificationService';
import './Navbar.css';

function Navbar({ user, toggleMobileMenu }) {
    if (!user) {
    return null;
  }
  console.log(user.profile_picture);
  
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
    };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    checkPushSubscription();
  }, []);

  const checkPushSubscription = async () => {
    try {
      const backendSubscribed = await checkBackendSubscription();
      setPushSubscribed(backendSubscribed);
    } catch (err) {
      console.error("Failed to check push subscription:", err);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await unsubscribeUser();
      setPushSubscribed(false);
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      alert(err.message || "Failed to unsubscribe from notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.results || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleMarkRead = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

    return (
      <motion.header
        className="navbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="navbar-left">
          <button className="sidebar-toggle" onClick={toggleMobileMenu}>
            <RiMenuLine size={22} />
          </button>

          <div className="greeting">
            <h2>{getGreeting()},</h2>
            <span className="user-name">{user.username} 👋</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="notification-wrapper" ref={dropdownRef}>
            <motion.button
              className="nav-icon-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Notifications"
              onClick={handleToggleDropdown}
            >
              <RiNotification3Line size={22} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  className="notification-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {loading && <div className="notification-loading">Loading...</div>}

                    {!loading && notifications.length === 0 && (
                      <div className="notification-empty">No notifications yet</div>
                    )}

                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                        onClick={() => !notification.is_read && handleMarkRead(event, notification.id)}
                      >
                        <div className="notification-content">
                          <p className="notification-title">{notification.title}</p>
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">{formatTime(notification.created_at)}</span>
                        </div>
                        {!notification.is_read && (
                          <button
                            className="mark-read-btn"
                            onClick={(e) => handleMarkRead(e, notification.id)}
                            title="Mark as read"
                          >
                            <RiCheckLine size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pushSubscribed && (
                    <div className="notification-footer">
                      <button
                        className="unsubscribe-btn"
                        onClick={handleUnsubscribe}
                        disabled={loading}
                      >
                        {loading ? "Unsubscribing..." : "Unsubscribe from Notifications"}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* <motion.button
            className="nav-icon-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Settings"
          >
            <RiSettings3Line size={22} />
          </motion.button> */}

          <div className="user-avatar">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            <span className="online-status" title="Online" />
          </div>
        </div>
      </motion.header>
    );
  }

export default Navbar;
