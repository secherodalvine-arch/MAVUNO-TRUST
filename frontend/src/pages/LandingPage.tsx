import React from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Calculator, Lock, FileText, Scale, Sprout, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import '../styles/LandingPage.css';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Search size={24} style={{ color: '#60a5fa' }} />,
    title: 'Dealer Verification',
    description:
      'Check whether an agricultural dealer or broker holds a valid, current licence before agreeing to a transaction.',
  },
  {
    icon: <TrendingUp size={24} style={{ color: '#4ade80' }} />,
    title: 'Market Information',
    description:
      'Access current and recent agricultural market price information powered by ShambaRecords to make informed selling decisions.',
  },
  {
    icon: <Calculator size={24} style={{ color: '#f59e0b' }} />,
    title: 'Business Calculator',
    description:
      'Enter your private production costs and estimate your break-even price, cost per unit, and expected profit or loss.',
  },
  {
    icon: <Lock size={24} style={{ color: '#a855f7' }} />,
    title: 'Private Communication',
    description:
      'Communicate with dealers privately and securely via Socket.io messaging. Your conversations are completely confidential.',
  },
  {
    icon: <FileText size={24} style={{ color: '#38bdf8' }} />,
    title: 'Transaction Records',
    description:
      'Keep a clear record of offers, counteroffers, agreements, delivery status, and payments — all in one transparent place.',
  },
  {
    icon: <Scale size={24} style={{ color: '#ec4899' }} />,
    title: 'Farmer Rights Centre',
    description:
      'Learn what rights you have under Kenya agricultural law before, during, and after a sale — and get support guidance when needed.',
  },
];

const buildStatusItems = [
  { label: 'Project foundation & responsive design', done: true },
  { label: 'Authentication & Role Security (Farmer/Dealer/Admin)', done: true },
  { label: 'Farmer profiles & crop listings management', done: true },
  { label: 'ShambaRecords HMAC live market price engine', done: true },
  { label: 'Dealer profile & AFA licence verification', done: true },
  { label: 'Production cost & break-even calculator', done: true },
  { label: 'Real-time WebSocket private chat', done: true },
  { label: 'Trade offers, counteroffers & transactions tracking', done: true },
  { label: 'Farmer Rights Centre & dispute pathways', done: true },
  { label: 'ElevenLabs AI voice & speech accessibility', done: true },
];

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* ===================== HERO ===================== */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="container">
          <div className="hero-badge" aria-label="MavunoTrust Network">
            <Sprout size={16} style={{ color: '#4ade80' }} />
            <span>Empowering Kenya's Agricultural Trade</span>
          </div>

          <h1 className="hero-title" id="hero-heading">
            <span className="gradient-text">MavunoTrust</span>
          </h1>

          <p className="hero-subtitle">
            Verified connections. Informed decisions. Fairer agricultural trade.
          </p>

          <p className="hero-subtitle" style={{ marginBottom: 'var(--space-8)' }}>
            MavunoTrust connects Kenyan farmers and agricultural dealers with verified licence information,
            transparent market prices, private break-even calculations, and secure direct trade offers.
          </p>

          <div className="hero-actions">
            <Link id="cta-register" className="btn btn-primary" to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </Link>
            <Link id="cta-learn-more" className="btn btn-outline" to="/rights">
              Explore Rights Centre
            </Link>
          </div>

          <div className="hero-status">
            <span className="status-dot" aria-hidden="true" />
            <span>Platform operational · Verified licensing & live market pricing connected</span>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="landing-features" aria-labelledby="features-heading">
        <div className="container">
          <p className="section-label">Core Capabilities</p>
          <h2 className="section-title" id="features-heading">
            Platform Capabilities & Services
          </h2>
          <p className="section-description">
            Explore the full suite of tools built to empower farmers and transparent agricultural dealers across Kenya.
          </p>
          <div className="features-grid">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="feature-card"
                aria-label={feature.title}
              >
                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
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
            <h2 id="status-heading">Platform System Capabilities</h2>
            <p>
              MavunoTrust features transparent system status and strict data privacy safeguards.
            </p>
            <ul className="status-list" aria-label="Build status checklist">
              {buildStatusItems.map((item) => (
                <li key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className={item.done ? 'icon-done' : 'icon-pending'}
                    aria-label={item.done ? 'Complete' : 'Pending'}
                  >
                    {item.done ? <CheckCircle2 size={16} style={{ color: '#4ade80' }} /> : <Circle size={16} style={{ color: '#94a3b8' }} />}
                  </span>
                  <span>{item.label}</span>
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

