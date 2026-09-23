import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Briefcase, Building2, Search, ArrowRight, Receipt, MessageSquare } from 'lucide-react';

export const DealerDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>Dealer Hub</h1>
            <p className="page-subtitle">
              Welcome back, <strong style={{ color: 'var(--color-text-primary)' }}>{user?.fullName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Action banner */}
      <div className="alert-banner blue" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{
          margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700,
          color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Briefcase size={17} />
          Dealer features active
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Update your business profile, specify operating counties and crops dealt, and
          enter your AFA licence number for verification.
        </p>
        <Link to="/dealer/profile" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>
          Manage Profile &amp; Licence <ArrowRight size={15} />
        </Link>
      </div>

      {/* Dashboard cards */}
      <div className="dash-grid">
        <Link to="/dealer/profile" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
            <Briefcase size={20} />
          </div>
          <span className="dash-card-title">Business Profile</span>
          <p className="dash-card-desc">Configure operating regions, crops dealt, purchasing capacity, and licence number.</p>
          <span className="dash-card-link">Edit Profile <ArrowRight size={13} /></span>
        </Link>

        <Link to="/dealer/profile" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc' }}>
            <Building2 size={20} />
          </div>
          <span className="dash-card-title">AFA Verification</span>
          <p className="dash-card-desc">Licence status check powered by the AFA Verification Provider.</p>
          <span className="dash-card-link">View Status <ArrowRight size={13} /></span>
        </Link>

        <div className="dash-card" style={{ cursor: 'default' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(39,137,79,0.1)', color: '#5ec285' }}>
            <Search size={20} />
          </div>
          <span className="dash-card-title">Farmer Crop Match</span>
          <p className="dash-card-desc">Search verified farmer crop listings by county and crop type.</p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>Coming soon</span>
        </div>

        <Link to="/offers" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(245,166,35,0.1)', color: '#f8c06a' }}>
            <Search size={20} />
          </div>
          <span className="dash-card-title">Trade Offers</span>
          <p className="dash-card-desc">Review incoming offers and manage counteroffers with farmers.</p>
          <span className="dash-card-link">View Offers <ArrowRight size={13} /></span>
        </Link>

        <Link to="/messages" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
            <MessageSquare size={20} />
          </div>
          <span className="dash-card-title">Messages</span>
          <p className="dash-card-desc">Private secure real-time chat with farmers.</p>
          <span className="dash-card-link">Open Messages <ArrowRight size={13} /></span>
        </Link>

        <Link to="/transactions" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(52,168,98,0.1)', color: '#5ec285' }}>
            <Receipt size={20} />
          </div>
          <span className="dash-card-title">Transactions</span>
          <p className="dash-card-desc">Track completed deals, payment status, and delivery records.</p>
          <span className="dash-card-link">View Transactions <ArrowRight size={13} /></span>
        </Link>
      </div>
    </div>
  );
};
