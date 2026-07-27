import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import {
  RiGroupLine,
  RiUserReceivedLine,
  RiMapPinLine,
  RiGlobalLine,
} from 'react-icons/ri';
import './StatsCards.css';

/* ============================================================
   Animated Counter — smoothly counts up to target value
   ============================================================ */
function AnimatedCounter({ value, duration = 1.5 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return controls.stop;
  }, [value, count, duration]);

  return <span>{displayValue}</span>;
}

/* ============================================================
   Single Stat Card
   ============================================================ */
function StatCard({ icon: Icon, label, value, format, color, delay }) {
  return (
    <motion.div
      className={`stat-card ${color}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <div className="stat-card-inner">
        <div className="stat-icon-wrapper">
          <Icon size={24} />
        </div>
        <div className="stat-content">
          <h4 className="stat-value">
            {format === "coordinate"
    ? (
        value !== null && value !== undefined
            ? value.toFixed(4)
            : "N/A"
      )
    : (
        <AnimatedCounter value={value ?? 0} />
      )}
          </h4>
          <p className="stat-label">{label}</p>
        </div>
      </div>
      <div className="stat-card-glow" />
    </motion.div>
  );
}


function StatsCards({ user, friends, pendingRequests }) {
  if (!user) {
    return null;
}
  const stats = [
    {
      icon: RiGroupLine,
      label: 'Total Friends',
      value: friends.length,
      format: 'number',
      color: 'blue',
      delay: 0.2,
    },
    {
      icon: RiUserReceivedLine,
      label: 'Pending Requests',
      value: pendingRequests.length,
      format: 'number',
      color: 'orange',
      delay: 0.3,
    },
    {
      icon: RiMapPinLine,
      label: 'Current Latitude',
      value: user.latitude,
      format: 'coordinate',
      color: 'green',
      delay: 0.4,
    },
    {
      icon: RiGlobalLine,
      label: 'Current Longitude',
      value: user.longitude,
      format: 'coordinate',
      color: 'purple',
      delay: 0.5,
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

export default StatsCards;
