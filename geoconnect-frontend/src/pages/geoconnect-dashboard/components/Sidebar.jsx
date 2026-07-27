import { motion } from 'framer-motion';
import { NavLink, useNavigate } from "react-router-dom";
import {
  RiDashboardLine,
  RiSearchLine,
  RiGroupLine,
  RiUserReceivedLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiMapPinLine,
  RiVipCrownFill,
} from "react-icons/ri";
import "./Sidebar.css";

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: RiDashboardLine, path: '/dashboard' },
  { id: 'search', label: 'Search Users', icon: RiSearchLine, path: '/search' },
  { id: 'friends', label: 'Friends', icon: RiGroupLine, path: '/friends' },
  { id: 'requests', label: 'Friend Requests', icon: RiUserReceivedLine, path: '/requests' },
  { id: 'premium', label: 'Premium', icon: RiVipCrownFill, path: '/premium' },

  // { id: 'settings', label: 'Settings', icon: RiSettings4Line, path: '/settings' },
];

function Sidebar({ mobileOpen, toggleMobile}) {
  
  const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  navigate("/login");
};

  return (
    <>
      <button className="mobile-menu-toggle" onClick={toggleMobile}>
        {mobileOpen ? <RiCloseLine size={24} /> : <RiMenuLine size={24} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <RiMapPinLine size={28} />
          </div>
          <span className="logo-text">GeoConnect</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            

            return (
                <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.2 }}
              whileHover={{ x: 4 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <div className="link-icon">
                  <Icon size={22} />
                </div>

                <span className="link-label">
                  {item.label}
                </span>
              </NavLink>
            </motion.div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <motion.button
            className="sidebar-logout"
            onClick={handleLogout}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="link-icon">
              <RiLogoutBoxLine size={22} />
            </div>
            <span className="link-label">Logout</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
