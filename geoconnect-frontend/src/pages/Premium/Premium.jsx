import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import {
  RiShieldLine,
  RiRobot2Line,
  RiHomeHeartLine,
  RiRouteLine,
  RiAlarmWarningLine,
  RiEarthLine,
  RiLockLine,
  RiTeamLine,
  RiWifiOffLine,
} from 'react-icons/ri';
import './PremiumCard.css';

const features = [
  {
    title: 'Guardian Intelligence',
    desc: 'AI-powered family protection with child monitoring, smart arrival alerts, and safe-route insights.',
    icon: RiShieldLine,
    color: 'teal',
  },
  {
    title: 'GeoConnect AI',
    desc: 'Receive intelligent travel suggestions, safety recommendations, and predictive ETA updates.',
    icon: RiRobot2Line,
    color: 'purple',
  },
  {
    title: 'Smart Safe Zones',
    desc: 'Create intelligent safe places with automatic check-ins, departures, and custom guardian automations.',
    icon: RiHomeHeartLine,
    color: 'green',
  },
  {
    title: 'Route Replay',
    desc: 'Replay journeys on an interactive timeline with travel history, visited places, and movement analytics.',
    icon: RiRouteLine,
    color: 'blue',
  },
  {
    title: 'Emergency Response Center',
    desc: 'One-tap SOS with live tracking, emergency contacts, and coordinated guardian response.',
    icon: RiAlarmWarningLine,
    color: 'red',
  },
  {
    title: 'Live World View',
    desc: 'See friends moving in real time, nearby activity, shared events, and smart meetup suggestions.',
    icon: RiEarthLine,
    color: 'blue',
  },
  {
    title: 'Privacy First Controls',
    desc: 'Choose Exact, Neighborhood or City-level sharing with expiring permissions and invisible mode.',
    icon: RiLockLine,
    color: 'gray',
  },
  {
    title: 'Family Command Center',
    desc: 'Manage every family member from one dashboard with activity feeds, permissions, and safety reports.',
    icon: RiTeamLine,
    color: 'orange',
  },
  {
    title: 'Offline Sync',
    desc: 'Continue recording important locations without internet and automatically sync when you\'re back online.',
    icon: RiWifiOffLine,
    color: 'indigo',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      'Basic location sharing',
      'Friend requests',
      'Chat messaging',
      'Profile customization',
      'Manual location refresh',
    ],
    buttonText: 'Available Now',
    disabled: false,
    popular: false,
  },
  {
    name: 'Premium',
    price: '$4.99',
    period: '/month',
    features: [
      'Everything in Free',
      'Live location sharing',
      'SOS emergency alerts',
      'Push notifications',
      'Online status tracking',
      'Location history (30 days)',
      'Advanced privacy controls',
      'Priority support',
    ],
    buttonText: 'Coming Soon',
    disabled: true,
    popular: true,
  },
  {
    name: 'Family',
    price: '$9.99',
    period: '/month',
    features: [
      'Everything in Premium',
      'Guardian & family dashboard',
      'Safe zone management',
      'Group location sharing',
      'Location history (1 year)',
      'Up to 10 family members',
      'Priority support',
    ],
    buttonText: 'Coming Soon',
    disabled: true,
    popular: false,
  },
];

function Premium() {
  const navigate = useNavigate();
  return (
    <div className="premium-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="premium-container">
        <motion.div
          className="premium-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="coming-soon-badge">
            <RiVipCrownFill size={16} />
            Coming Soon
          </div>
          <h1 className="premium-title">GeoConnect Premium</h1>
          <p className="premium-subtitle">
            Something powerful is on the way. Stay tuned for the next level of safety, connection, and control.
          </p>
        </motion.div>

        <motion.div
          className="premium-features-header"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2>Coming soon</h2>
          <p>A sneak peek at the features we are building for you.</p>
        </motion.div>

        <motion.div
          className="features-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              className="feature-card coming-soon-card"
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + index * 0.05 }}
            >
              <div className={`feature-icon ${feature.color}`}>
                <feature.icon size={22} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="premium-pricing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2>Plans launching soon</h2>
          <div className="pricing-cards">
            {plans.map((plan, index) => (
              <motion.div
                className={`pricing-card ${plan.popular ? 'popular' : ''}`}
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.65 + index * 0.08 }}
              >
                {plan.popular && <div className="pricing-badge">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="pricing-price">
                  {plan.price}<span>{plan.period}</span>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex}>{feature}</li>
                  ))}
                </ul>
                <button
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} ${plan.disabled ? 'btn-disabled' : ''}`}
                  disabled={plan.disabled}
                >
                  {plan.buttonText}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Premium;
