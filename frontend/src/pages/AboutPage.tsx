import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Scale,
  Sprout,
  Users,
  Handshake,
  ArrowRight,
  Lock,
  TrendingUp,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import '../styles/AboutPage.css';

export const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      {/* ══════════ HERO SECTION ══════════ */}
      <section className="about-hero" aria-labelledby="about-hero-title">
        <div className="about-container">
          <h1 id="about-hero-title" className="about-hero-title">
            About <span className="gradient-text">MavunoTrust</span>
          </h1>
          <p className="about-hero-subtitle">
            Pioneering transparency, regulatory compliance, and fair economic returns
            for agricultural producers and verified dealers across Kenya.
          </p>
        </div>
      </section>

      {/* ══════════ MISSION & VISION ══════════ */}
      <section className="about-section" aria-labelledby="mission-heading">
        <div className="about-container">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <div className="card-top-icon">
                <Sprout size={28} />
              </div>
              <h2 id="mission-heading" className="card-heading">Our Mission</h2>
              <p className="card-body-text">
                To empower Kenyan farmers with accurate real-time market data, direct access to
                verified agricultural buyers, and private financial break-even tools — eliminating
                exploitative information asymmetry and ensuring fair compensation for every harvest.
              </p>
            </div>

            <div className="vision-card">
              <div className="card-top-icon">
                <TrendingUp size={28} />
              </div>
              <h2 className="card-heading">Our Vision</h2>
              <p className="card-body-text">
                A digitally transparent, equitable national food market where every trade is governed
                by verified credentials, clear mutual agreements, and comprehensive legal protections
                for both producers and licensed distributors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CORE VALUES ══════════ */}
      <section className="about-section" aria-labelledby="values-heading">
        <div className="about-container">
          <div className="about-section-header">
            <h2 id="values-heading" className="about-section-title">Core Principles</h2>
            <p className="about-section-desc">
              Every feature of MavunoTrust is designed around fairness, privacy, and accountability.
            </p>
          </div>

          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">
                <Scale size={24} />
              </div>
              <h3 className="value-title">Fair Bargaining Power</h3>
              <p className="value-desc">
                Providing farmers with cost-of-production break-even analysis so they negotiate
                confidently with data instead of being pressured into below-cost sales.
              </p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <ShieldCheck size={24} />
              </div>
              <h3 className="value-title">Regulatory Verification</h3>
              <p className="value-desc">
                Validating dealer regulatory credentials and demonstration AFA licences to protect
                farmers from unlicensed middle-tier exploitation.
              </p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <Lock size={24} />
              </div>
              <h3 className="value-title">Strict Data Confidentiality</h3>
              <p className="value-desc">
                Private input cost sheets, farm coordinates, and bilateral chats are never sold,
                never broadcast, and remain solely under user control.
              </p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <Handshake size={24} />
              </div>
              <h3 className="value-title">Structured Trade Terms</h3>
              <p className="value-desc">
                Formalizing agreements with transparent quantities, pickup milestones, and formal
                complaint channels for dispute mitigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW WE SERVE KENYA ══════════ */}
      <section className="about-section" aria-labelledby="serve-heading">
        <div className="about-container">
          <div className="about-section-header">
            <h2 id="serve-heading" className="about-section-title">Serving Both Sides of the Market</h2>
            <p className="about-section-desc">
              MavunoTrust bridges the divide between smallholder growers and commercial produce dealers.
            </p>
          </div>

          <div className="serve-grid">
            {/* Farmers */}
            <div className="serve-box">
              <span className="serve-role-badge">For Kenyan Farmers</span>
              <h3 className="serve-title">Security &amp; Market Clout</h3>
              <ul className="serve-list">
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Market Intelligence:</strong> Live price observations across 47 counties
                    sourced from key agricultural markets nationwide.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Break-Even Security:</strong> Know exact production costs per unit before
                    reviewing or counter-offering bids.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Farmer Rights Centre:</strong> Instant access to legal protections, KENAFF
                    advisories, and breach remedy guidelines.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Voice Accessibility:</strong> Natural language Kiswahili &amp; English
                    AI voice assistant for hands-free assistance.
                  </span>
                </li>
              </ul>
            </div>

            {/* Dealers */}
            <div className="serve-box">
              <span className="serve-role-badge">For Licensed Dealers</span>
              <h3 className="serve-title">Direct Sourcing &amp; Compliance</h3>
              <ul className="serve-list">
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Direct Farm Sourcing:</strong> Connect with growers offering verified
                    harvest volumes in specific sub-counties.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Credibility Badge:</strong> Build trust with registered growers by
                    verifying official regulatory licences.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Milestone Tracking:</strong> Transparent delivery, acceptance, and payment
                    status records stored permanently.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="serve-bullet-icon" />
                  <span>
                    <strong>Private Communications:</strong> Real-time messaging to agree on collection,
                    quality specs, and logistics.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ INSTITUTIONAL GOVERNANCE ══════════ */}
      <section className="about-section" aria-labelledby="governance-heading">
        <div className="about-container">
          <div className="governance-strip">
            <h2 id="governance-heading" className="about-section-title">Institutional Alignment</h2>
            <p className="about-section-desc" style={{ margin: '0 auto', maxWidth: '640px' }}>
              MavunoTrust works in compliance with Kenyan agricultural statutes and standards.
            </p>

            <div className="governance-grid">
              <div className="gov-card">
                <Building2 size={24} style={{ color: '#5ec285', marginBottom: '10px' }} />
                <h4>AFA Alignment</h4>
                <p>
                  Demonstration licence verification designed to mirror Agriculture and Food Authority
                  regulatory compliance frameworks.
                </p>
              </div>

              <div className="gov-card">
                <TrendingUp size={24} style={{ color: '#5ec285', marginBottom: '10px' }} />
                <h4>Market Price Transparency</h4>
                <p>
                  Unbiased, observation-based market pricing benchmarks across commodity categories to guide fair negotiations.
                </p>
              </div>

              <div className="gov-card">
                <Users size={24} style={{ color: '#5ec285', marginBottom: '10px' }} />
                <h4>KENAFF Representation</h4>
                <p>
                  Integrated farmer rights resources built in reference to Kenya National Farmers'
                  Federation agricultural advisories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ BOTTOM CALL TO ACTION ══════════ */}
      <section className="about-cta" aria-labelledby="about-cta-title">
        <div className="about-container">
          <div className="about-cta-card">
            <h2 id="about-cta-title" className="about-cta-title">
              Ready to Experience Fair Agricultural Trade?
            </h2>
            <p className="about-cta-desc">
              Join thousands of Kenyan farmers and verified produce dealers transforming
              how agricultural commodities are valued and traded.
            </p>
            <div className="about-cta-actions">
              <Link to="/register" className="btn btn-primary-white">
                <span>Create Your Account</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
