import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  User, Leaf, TrendingUp, Calculator, Search,
  HandshakeIcon, ArrowRight, Sprout,
} from 'lucide-react';

export const FarmerDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #175230, #34a862)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <Sprout size={24} />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>Farmer Hub</h1>
            <p className="page-subtitle">
              Welcome back, <strong style={{ color: 'var(--color-text-primary)' }}>{user?.fullName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Action banner */}
      <div className="alert-banner green" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{
          margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700,
          color: 'var(--color-primary-200)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Leaf size={17} />
          Your farmer features are active
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Manage your public farmer profile, control location privacy, and publish available
          crop listings for dealer matching.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/farmer/profile" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>
            Manage Profile <ArrowRight size={15} />
          </Link>
          <Link to="/farmer/crops" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>
            Crop Listings <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="dash-grid">
        <Link to="/dealers" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
            <Search size={20} />
          </div>
          <span className="dash-card-title">Find Dealers</span>
          <p className="dash-card-desc">Search and connect with verified dealers and brokers across Kenya.</p>
          <span className="dash-card-link">Search Dealers <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/profile" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(39,137,79,0.12)', color: '#5ec285' }}>
            <User size={20} />
          </div>
          <span className="dash-card-title">Farmer Profile</span>
          <p className="dash-card-desc">Public general area display with protected exact farm location controls.</p>
          <span className="dash-card-link">Edit Profile <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/crops" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(94,194,133,0.1)', color: '#5ec285' }}>
            <Leaf size={20} />
          </div>
          <span className="dash-card-title">Crop Listings</span>
          <p className="dash-card-desc">Post available crop quantities, units, and harvest periods for dealers.</p>
          <span className="dash-card-link">Manage Crops <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/market" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(245,166,35,0.1)', color: '#f8c06a' }}>
            <TrendingUp size={20} />
          </div>
          <span className="dash-card-title">Market Prices</span>
          <p className="dash-card-desc">Real-time reference agricultural prices from ShambaRecords.</p>
          <span className="dash-card-link">Browse Prices <ArrowRight size={13} /></span>
        </Link>

        <Link to="/farmer/calculator" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
            <Calculator size={20} />
          </div>
          <span className="dash-card-title">Production Calculator</span>
          <p className="dash-card-desc">Calculate private production costs and break-even estimates.</p>
          <span className="dash-card-link">Open Calculator <ArrowRight size={13} /></span>
        </Link>

        <Link to="/offers" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc' }}>
            <HandshakeIcon size={20} />
          </div>
          <span className="dash-card-title">My Offers</span>
          <p className="dash-card-desc">Review active trade offers and counteroffers from dealers.</p>
          <span className="dash-card-link">View Offers <ArrowRight size={13} /></span>
        </Link>
      </div>
    </div>
  );
};
