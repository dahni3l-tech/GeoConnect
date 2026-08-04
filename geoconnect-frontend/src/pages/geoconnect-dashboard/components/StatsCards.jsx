import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import {
  RiGroupLine,
  RiUserReceivedLine,
  RiMapPinLine,
  RiGlobalLine,
  RiCheckLine,
  RiBatteryLine,
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
  const displayValue = value ?? "N/A";
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
              ? (displayValue !== null && displayValue !== undefined && displayValue !== "N/A"
                  ? Number(displayValue).toFixed(4)
                  : "N/A")
              : (
                  <AnimatedCounter value={typeof displayValue === "number" ? displayValue : 0} />
                )}
          </h4>
          <p className="stat-label">{label}</p>
        </div>
      </div>
      <div className="stat-card-glow" />
    </motion.div>
  );
}


function StatsCards({ user, friends, pendingRequests, batteryLevel }) {
  if (!user) {
    return null;
  }
  const safeFriends = Array.isArray(friends) ? friends : [];
  const safePending = Array.isArray(pendingRequests) ? pendingRequests : [];
  const onlineFriends = safeFriends.filter((f) => f && f.is_online);

  const stats = [
    {
      icon: RiGroupLine,
      label: 'Total Friends',
      value: safeFriends.length,
      format: 'number',
      color: 'blue',
      delay: 0.2,
    },
    {
      icon: RiCheckLine,
      label: 'Online Now',
      value: onlineFriends.length,
      format: 'number',
      color: 'green',
      delay: 0.3,
    },
    {
      icon: RiUserReceivedLine,
      label: 'Pending Requests',
      value: safePending.length,
      format: 'number',
      color: 'orange',
      delay: 0.4,
    },
    {
      icon: RiMapPinLine,
      label: 'Current Latitude',
      value: user.latitude ?? null,
      format: 'coordinate',
      color: 'blue',
      delay: 0.5,
    },
    {
      icon: RiGlobalLine,
      label: 'Current Longitude',
      value: user.longitude ?? null,
      format: 'coordinate',
      color: 'purple',
      delay: 0.6,
    },
    {
      icon: RiBatteryLine,
      label: 'Battery Level',
      value: batteryLevel ?? null,
      format: 'number',
      color: batteryLevel !== null && batteryLevel < 20 ? 'red' : 'gray',
      delay: 0.7,
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
