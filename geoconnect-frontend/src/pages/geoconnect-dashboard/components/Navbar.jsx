import { motion } from 'framer-motion';
import {
  RiNotification3Line,
  RiSettings3Line,
  RiMenuLine,
} from 'react-icons/ri';
import './Navbar.css';

function Navbar({ user, toggleMobileMenu }) {
    if (!user) {
    return null;
  }
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
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
          {/* ============================================================
              TODO: API call — Fetch notifications
              GET /api/notifications/
              ============================================================ */}
          <motion.button
            className="nav-icon-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Notifications"
          >
            <RiNotification3Line size={22} />
            <span className="notification-badge">3</span>
          </motion.button>

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
              <img src= {user.username} />
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
