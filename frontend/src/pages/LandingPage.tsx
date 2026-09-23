import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search, TrendingUp, Calculator, Lock, FileText, Scale,
  CheckCircle2, Circle, ArrowRight, Mic,
} from 'lucide-react';
import VoiceWidget from '../components/VoiceWidget';
import '../styles/LandingPage.css';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Search size={22} />,
    title: 'Dealer Verification',
    description:
      'Check whether an agricultural dealer or broker holds a valid, current licence before agreeing to a transaction.',
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Market Information',
    description:
      'Access current and recent agricultural market price information powered by ShambaRecords to make informed selling decisions.',
  },
  {
    icon: <Calculator size={22} />,
    title: 'Business Calculator',
    description:
      'Enter your private production costs and estimate your break-even price, cost per unit, and expected profit or loss.',
  },
  {
    icon: <Lock size={22} />,
    title: 'Private Communication',
    description:
      'Communicate with dealers privately and securely via real-time messaging. Your conversations are completely confidential.',
  },
  {
    icon: <FileText size={22} />,
    title: 'Transaction Records',
    description:
      'Keep a clear record of offers, counteroffers, agreements, delivery status, and payments — all in one transparent place.',
  },
  {
    icon: <Scale size={22} />,
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

      {/* ══════════ HERO ══════════ */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="hero-illustration-bg" aria-hidden="true">
          <img src="/images/agritech-hero-bg.jpg" alt="" className="hero-illustration-img" />
          <div className="hero-illustration-overlay" />
        </div>
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="container hero-content-relative">
          <div className="hero-badge" aria-label="MavunoTrust">
            <img src="/logo.png" alt="MavunoTrust" className="hero-badge-logo" />
            <span>Empowering Kenya's Agricultural Trade</span>
          </div>

          <h1 className="hero-title" id="hero-heading">
            <span className="gradient-text">MavunoTrust</span>
          </h1>

          <p className="hero-subtitle">
            Verified connections. Informed decisions. Fairer agricultural trade.
          </p>

          <p className="hero-desc">
            MavunoTrust connects Kenyan farmers and agricultural dealers with verified licence
            information, transparent market prices, private break-even calculations, and secure
            direct trade offers.
          </p>

          <div className="hero-actions">
            <Link
              id="cta-register"
              className="btn btn-primary"
              to="/register"
            >
              <span>Get Started</span>
              <ArrowRight size={18} />
            </Link>
            <Link id="cta-login" className="btn btn-outline" to="/login">
              Sign In
            </Link>
          </div>

          <div className="hero-status">
            <span className="status-dot" aria-hidden="true" />
            <span>Platform operational · Verified licensing &amp; live market pricing connected</span>
          </div>
        </div>
      </section>

      {/* ══════════ PHOTO GALLERY ══════════ */}
      <section className="landing-gallery" aria-labelledby="gallery-heading">
        <div className="container">
          <p className="section-label">Real Impact</p>
          <h2 className="section-title" id="gallery-heading">
            Farmers at Work Across Kenya
          </h2>
          <p className="section-description">
            MavunoTrust is built for the real people who feed our nation — farmers working
            the land every day, harvesting with pride, and selling with confidence.
          </p>
          <div className="gallery-grid">
            <figure className="gallery-item gallery-item--tall">
              <img
                src="/images/farm1.jpg"
                alt="Two farmers tilling soil in a green field"
                loading="lazy"
              />
              <figcaption>
                <span className="gallery-tag">Soil Preparation</span>
                <p>Hard-working farmers preparing fertile ground for the next season's harvest.</p>
              </figcaption>
            </figure>
            <figure className="gallery-item">
              <img
                src="/images/farm2.jpg"
                alt="Farmer standing beside large harvest sacks in a field"
                loading="lazy"
              />
              <figcaption>
                <span className="gallery-tag">Post-Harvest</span>
                <p>A farmer with a successful grain harvest, ready to find the best market price.</p>
              </figcaption>
            </figure>
            <figure className="gallery-item">
              <img
                src="/images/farm3.jpg"
                alt="Hands harvesting maize cobs from dried stalks"
                loading="lazy"
              />
              <figcaption>
                <span className="gallery-tag">Maize Harvest</span>
                <p>Every cob harvested represents months of hard work, planning, and dedication.</p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="landing-features" aria-labelledby="features-heading">
        <div className="container">
          <p className="section-label">Core Capabilities</p>
          <h2 className="section-title" id="features-heading">
            Platform Capabilities &amp; Services
          </h2>
          <p className="section-description">
            Explore the full suite of tools built to empower farmers and transparent
            agricultural dealers across Kenya.
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

      {/* ══════════ VOICE ASSISTANT ══════════ */}
      <section className="landing-voice" aria-labelledby="voice-heading">
        <div className="container">
          <div className="voice-card">
            <div className="voice-card-icon" aria-hidden="true">
              <Mic size={28} />
            </div>
            <div className="voice-card-content">
              <h2 className="voice-card-title" id="voice-heading">
                AI Voice Assistant
              </h2>
              <p className="voice-card-desc">
                Have questions about MavunoTrust? Use our AI-powered voice assistant to learn
                about the platform, get help navigating features, or understand your rights
                as a farmer — all in a natural conversation.
              </p>
              <div className="voice-card-cta">
                <span className="voice-indicator" aria-hidden="true">
                  <span className="voice-dot" />
                  <span className="voice-dot" />
                  <span className="voice-dot" />
                </span>
                <span className="voice-cta-text">
                  Click the green microphone button in the bottom-right corner to start
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ BUILD STATUS ══════════ */}
      <section className="landing-status" aria-labelledby="status-heading">
        <div className="container">
          <div className="status-card">
            <h2 id="status-heading">Platform System Capabilities</h2>
            <p>
              MavunoTrust features transparent system status and strict data privacy safeguards.
            </p>
            <ul className="status-list" aria-label="Feature checklist">
              {buildStatusItems.map((item) => (
                <li key={item.label}>
                  <span
                    className={item.done ? 'icon-done' : 'icon-pending'}
                    aria-label={item.done ? 'Complete' : 'Pending'}
                  >
                    {item.done
                      ? <CheckCircle2 size={15} />
                      : <Circle size={15} />}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════ CTA STRIP ══════════ */}
      <section className="landing-cta" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-card">
            <img src="/logo.png" alt="MavunoTrust" className="cta-logo-img" />
            <h2 id="cta-heading">Ready to trade with confidence?</h2>
            <p>Join thousands of Kenyan farmers and verified dealers on MavunoTrust.</p>
            <Link to="/register" className="btn btn-primary">
              Create Your Account
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ VOICE WIDGET (homepage only) ══════════ */}
      <VoiceWidget />
    </div>
  );
};

export default LandingPage;
