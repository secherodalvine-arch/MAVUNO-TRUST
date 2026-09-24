import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, TrendingUp, Calculator, Lock, FileText, Scale,
  CheckCircle2, ArrowRight, Mic, ShieldCheck,
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
      'Access current and recent agricultural market price information across key counties to make informed selling decisions.',
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

const tradeCapabilities = [
  { label: 'Verified dealer regulatory licence checking' },
  { label: 'Farmer crop listings & direct buyer matching' },
  { label: 'Trade offers, counteroffers & agreement tracking' },
  { label: 'Transparent delivery milestones & payment confirmation' },
  { label: 'Farmer legal rights centre & dispute resolution' },
];

const toolCapabilities = [
  { label: 'Live commodity market price trends across Kenyan counties' },
  { label: 'Private production cost & break-even calculator' },
  { label: 'Direct real-time private messaging between trade partners' },
  { label: 'In-app transaction reminders & milestone alerts' },
  { label: 'Multi-lingual customer support voice assistant (English & Kiswahili)' },
];

const LandingPage = () => {
  // IntersectionObserver to animate elements inner-to-out as the user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-emerged');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.emerge-item');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleLaunchVoice = () => {
    window.dispatchEvent(new CustomEvent('open-voice-widget'));
  };

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
          <h1 className="hero-title" id="hero-heading">
            Verified Connections.<br />
            <span className="gradient-text">Fairer Agricultural Trade.</span>
          </h1>

          <p className="hero-subtitle">
            Transparent market prices. Direct trade agreements. Real-time dealer verification.
          </p>

          <p className="hero-desc">
            MavunoTrust connects Kenyan farmers and agricultural dealers with verified licence
            information, transparent market prices, private break-even calculations, and secure
            direct trade offers.
          </p>

          <div className="hero-actions">
            <Link
              id="cta-register"
              className="btn btn-primary-white"
              to="/register"
            >
              <span>Get Started</span>
              <ArrowRight size={18} />
            </Link>
            <Link id="cta-login" className="btn btn-outline" to="/login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ PHOTO GALLERY ══════════ */}
      <section className="landing-gallery" aria-labelledby="gallery-heading">
        <div className="container">
          <div className="gallery-header emerge-item">
            <h2 className="section-title" id="gallery-heading">
              Farmers at Work Across Kenya
            </h2>
            <p className="section-description">
              MavunoTrust is built for the real people who feed our nation — farmers working
              the land every day, harvesting with pride, and selling with confidence.
            </p>
          </div>
          <div className="gallery-grid">
            <figure className="gallery-item gallery-item--tall emerge-item">
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
            <figure className="gallery-item emerge-item">
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
            <figure className="gallery-item emerge-item">
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
      <section id="features" className="landing-features" aria-labelledby="features-heading">
        <div className="container">
          <div className="features-header emerge-item">
            <h2 className="section-title" id="features-heading">
              Platform Capabilities &amp; Services
            </h2>
            <p className="section-description">
              Explore the full suite of tools built to empower farmers and transparent
              agricultural dealers across Kenya.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="feature-card emerge-item"
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
          <div className="voice-card emerge-item">
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
              <div
                className="voice-card-cta"
                onClick={handleLaunchVoice}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLaunchVoice(); }}
                title="Click to launch AI Voice Assistant"
              >
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

      {/* ══════════ PLATFORM CAPABILITIES (2 CARDS) ══════════ */}
      <section className="landing-status" aria-labelledby="status-heading">
        <div className="container">
          <div className="status-section-header emerge-item">
            <h2 id="status-heading" className="status-section-title">Key Platform Capabilities</h2>
            <p className="status-section-subtitle">
              Practical, transparent tools built for everyday agricultural commerce across Kenya.
            </p>
          </div>

          <div className="status-cards-grid">
            {/* Card 1: Verified Trade & Compliance */}
            <div className="status-card emerge-item">
              <div className="status-card-header">
                <div className="status-card-icon">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="status-card-title">Trade &amp; Verification</h3>
                  <p className="status-card-desc">
                    Direct workflows connecting verified Kenyan farmers and agricultural dealers with full regulatory compliance.
                  </p>
                </div>
              </div>
              <ul className="status-list" aria-label="Trade and verification capabilities">
                {tradeCapabilities.map((item) => (
                  <li key={item.label}>
                    <span className="icon-done" aria-label="Completed">
                      <CheckCircle2 size={16} />
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2: Market Intelligence & Smart Tools */}
            <div className="status-card emerge-item">
              <div className="status-card-header">
                <div className="status-card-icon">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="status-card-title">Market Intelligence &amp; Tools</h3>
                  <p className="status-card-desc">
                    Real-time commodity prices, financial calculators, private messaging, and AI voice assistance.
                  </p>
                </div>
              </div>
              <ul className="status-list" aria-label="Market intelligence and tools capabilities">
                {toolCapabilities.map((item) => (
                  <li key={item.label}>
                    <span className="icon-done" aria-label="Completed">
                      <CheckCircle2 size={16} />
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA STRIP ══════════ */}
      <section className="landing-cta" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-card emerge-item">
            <h2 id="cta-heading">Ready to trade with confidence?</h2>
            <p>Join thousands of Kenyan farmers and verified dealers on MavunoTrust.</p>
            <Link to="/register" className="btn btn-primary-white">
              <span>Create Your Account</span>
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
