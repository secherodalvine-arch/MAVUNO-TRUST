import '../styles/LandingPage.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '🔍',
    title: 'Dealer Verification',
    description:
      'Check whether an agricultural dealer or broker holds a valid, current licence before agreeing to a transaction.',
  },
  {
    icon: '💹',
    title: 'Market Information',
    description:
      'Access current and recent agricultural market price information to make informed selling decisions.',
  },
  {
    icon: '🧮',
    title: 'Business Calculator',
    description:
      'Enter your private production costs and estimate your break-even price, cost per unit, and expected profit or loss.',
  },
  {
    icon: '🔒',
    title: 'Private Communication',
    description:
      'Communicate with dealers privately and securely. Your conversations are not publicly visible.',
  },
  {
    icon: '📋',
    title: 'Transaction Records',
    description:
      'Keep a clear record of offers, agreements, delivery status, and payment — all in one place.',
  },
  {
    icon: '⚖️',
    title: 'Farmer Rights Centre',
    description:
      'Learn what rights you have before, during, and after a sale — and what to do if something goes wrong.',
  },
];

const buildStatusItems = [
  { label: 'Project foundation', done: true },
  { label: 'Authentication system', done: false },
  { label: 'Farmer profiles & crop listings', done: false },
  { label: 'Market price information', done: false },
  { label: 'Dealer verification (AFA)', done: false },
  { label: 'Private messaging', done: false },
  { label: 'Transaction records', done: false },
  { label: 'Farmer Rights Centre', done: false },
];

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* ===================== HERO ===================== */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="container">
          <div className="hero-badge" aria-label="Platform under development">
            <span>🌱</span> Under Active Development
          </div>

          <h1 className="hero-title" id="hero-heading">
            <span className="gradient-text">MavunoTrust</span>
          </h1>

          <p className="hero-subtitle">
            Verified connections. Informed decisions. Fairer agricultural trade.
          </p>

          <p className="hero-subtitle" style={{ marginBottom: 'var(--space-8)' }}>
            MavunoTrust is being built to help farmers and agricultural dealers
            connect with verified information, understand transaction details, and
            access rights and remedy guidance in one trusted platform.
          </p>

          <div className="hero-actions">
            {/* Buttons will become functional when auth is implemented */}
            <button id="cta-register" className="btn btn-primary" disabled aria-disabled="true">
              Get started — coming soon
            </button>
            <button id="cta-learn-more" className="btn btn-outline" disabled aria-disabled="true">
              Learn more
            </button>
          </div>

          <div className="hero-status">
            <span className="status-dot" aria-hidden="true" />
            <span>Platform foundation initialised · Features being built</span>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="landing-features" aria-labelledby="features-heading">
        <div className="container">
          <p className="section-label">What we're building</p>
          <h2 className="section-title" id="features-heading">
            Planned platform capabilities
          </h2>
          <p className="section-description">
            These features are part of the planned MavunoTrust roadmap.
            Not all features are live yet — this page will be updated as each module is completed.
          </p>
          <div className="features-grid">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="feature-card"
                aria-label={feature.title}
              >
                <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== BUILD STATUS ===================== */}
      <section className="landing-status" aria-labelledby="status-heading">
        <div className="container">
          <div className="status-card">
            <h2 id="status-heading">Current Build Status</h2>
            <p>
              MavunoTrust is in active development. The list below reflects the
              current state of the platform honestly. No features are claimed to be
              operational before they are built and verified.
            </p>
            <ul className="status-list" aria-label="Build status checklist">
              {buildStatusItems.map((item) => (
                <li key={item.label}>
                  <span
                    className={item.done ? 'icon-done' : 'icon-pending'}
                    aria-label={item.done ? 'Complete' : 'Pending'}
                  >
                    {item.done ? '✓' : '○'}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
