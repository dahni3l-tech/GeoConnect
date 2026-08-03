import './PremiumCard.css';


const features = [
  {
    title: 'Real-time Messaging',
    desc: 'Instant, reliable messaging with typing indicators and rich media support.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    title: 'Live Location Sharing',
    desc: 'Share your real-time location with trusted contacts for safety and coordination.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: 'Upload Profile Picture',
    desc: 'Personalize your identity with high-resolution profile and cover photos.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    title: 'Read Receipts',
    desc: 'Know exactly when your messages have been seen by recipients.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 6 11.5 15.5 8 12" />
        <polyline points="16 6 6.5 15.5 3 12" />
      </svg>
    ),
  },
  {
    title: 'End-to-End Encryption',
    desc: 'Military-grade encryption ensuring only you and the receiver can read messages.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'AI Safety Alerts',
    desc: 'Smart AI detection of unsafe content, behavior, and emergency situations.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    title: 'Family & Parent Dashboard',
    desc: 'Monitor activity, manage privacy, and set safety controls for family accounts.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Community Groups',
    desc: 'Create and join interest-based groups with advanced moderation tools.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: 'Business & Organization Accounts',
    desc: 'Professional profiles, analytics, and team management for organizations.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: 'Priority Support',
    desc: 'Skip the queue with 24/7 dedicated customer support.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
  {
    title: 'Premium Verification Badge',
    desc: 'Get the exclusive blue verification badge to build trust and credibility.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
  {
    title: 'Cloud Backup',
    desc: 'Automatic, secure cloud backups of chats, media, and settings.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
  },
];

function Premium() {
  return (
    <div className="premium-page">
      <div className="premium-container">
        <div className="premium-hero">
          <div className="premium-badge">
            <span className="premium-badge-icon">★</span>
            Premium
          </div>
          <h1 className="premium-title">GeoConnect Premium</h1>
          <p className="premium-subtitle">
            Unlock powerful features designed for safer, smarter, and more connected experiences.
          </p>
          <div className="premium-cta-hero">
            <button className="upgrade-btn premium">Upgrade to Premium</button>
            <p className="premium-note">Premium features are currently under development.</p>
          </div>
        </div>

        <div className="premium-features-header">
          <h2>Everything you need, all in one place</h2>
          <p>Premium features designed to keep you connected, safe, and in control.</p>
        </div>

        <div className="features-grid premium">
          {features.map((feature, index) => (
            <div className="feature-card premium" key={index}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="premium-pricing">
          <h2>Choose your plan</h2>
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Free</h3>
              <div className="pricing-price">$0<span>/month</span></div>
              <ul className="pricing-features">
                <li>Basic location sharing</li>
                <li>Friend requests</li>
                <li>Chat messaging</li>
                <li>Profile customization</li>
              </ul>
              <button className="btn btn-outline">Get Started</button>
            </div>
            <div className="pricing-card premium">
              <div className="pricing-badge">Most Popular</div>
              <h3>Premium</h3>
              <div className="pricing-price">$4.99<span>/month</span></div>
              <ul className="pricing-features">
                <li>Everything in Free</li>
                <li>Real-time messaging</li>
                <li>Read receipts</li>
                <li>End-to-end encryption</li>
                <li>AI safety alerts</li>
                <li>Priority support</li>
              </ul>
              <button className="btn btn-primary">Upgrade Now</button>
            </div>
            <div className="pricing-card">
              <h3>Family</h3>
              <div className="pricing-price">$9.99<span>/month</span></div>
              <ul className="pricing-features">
                <li>Everything in Premium</li>
                <li>Family dashboard</li>
                <li>Guardian controls</li>
                <li>Safe zone management</li>
                <li>Up to 10 family members</li>
              </ul>
              <button className="btn btn-outline">Get Started</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
