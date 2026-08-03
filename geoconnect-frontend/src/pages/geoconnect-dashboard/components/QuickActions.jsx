import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import {
  RiSearchLine,
  RiUserAddLine,
  RiUserReceivedLine,
  RiGroupLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import './QuickActions.css';



const actions = [
  {
    id: 'search',
    label: 'Search Users',
    icon: RiSearchLine,
    color: 'blue',
    description: 'Find people nearby',
  },
  {
    id: 'add-friend',
    label: 'Add Friend',
    icon: RiUserAddLine,
    color: 'green',
    description: 'Send a request',
  },
  {
    id: 'requests',
    label: 'Friend Requests',
    icon: RiUserReceivedLine,
    color: 'orange',
    description: 'View pending',
  },
  {
    id: 'friends',
    label: 'Friends List',
    icon: RiGroupLine,
    color: 'purple',
    description: 'See your network',
  },
  // {
  //   id: 'refresh',
  //   label: 'Refresh Location',
  //   icon: RiRefreshLine,
  //   color: 'teal',
  //   description: 'Update position',
  // },
];

function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (id) => {
    switch (id) {
      case "search":
        navigate("/search");
        break;

      case "add-friend":
        navigate("/search");
        break;

      case "requests":
        navigate("/requests");
        break;

      case "friends":
        navigate("/friends");
        break;

      default:
        console.log(`Action triggered: ${id}`);
    }
  };

  return (
    <motion.div
      className="quick-actions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <h3 className="section-title">Quick Actions</h3>
      <div className="actions-grid">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              className={`action-btn ${action.color}`}
              onClick={() => handleAction(action.id)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="action-icon">
                <Icon size={22} />
              </div>
              <div className="action-content">
                <span className="action-label">{action.label}</span>
                <span className="action-desc">{action.description}</span>
              </div>
              <RiArrowRightLine className="action-arrow" size={18} />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default QuickActions;
