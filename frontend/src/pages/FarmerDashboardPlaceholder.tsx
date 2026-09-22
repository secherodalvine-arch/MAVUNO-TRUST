import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const FarmerDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '2rem' }}>🧑‍🌾</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#f8fafc' }}>
              Farmer Hub
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Welcome back, <strong>{user?.fullName}</strong> ({user?.email})
            </p>
          </div>
        </div>

        {/* Step 5 Action Banner */}
        <div
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            color: '#86efac',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>
            🌱 Step 5 Features Active
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            You can now manage your public farmer profile, control exact-location privacy, and publish available crop listings for dealer matching.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/farmer/profile"
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Manage Farmer Profile →
            </Link>
            <Link
              to="/farmer/crops"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#f8fafc',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              My Crop Listings →
            </Link>
            <Link
              to="/farmer/market"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              📊 View Market Prices →
            </Link>
            <Link
              to="/dealers"
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              🔍 Search Verified Dealers →
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginTop: '28px',
          }}
        >
          <div style={cardStyle}>
            <div style={cardIconStyle}>🔍</div>
            <h4 style={cardTitleStyle}>Search Dealers & Brokers</h4>
            <p style={cardBodyStyle}>Find and connect with verified active dealers and brokers across Kenya.</p>
            <Link to="/dealers" style={linkStyle}>Search Dealers →</Link>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>🧑‍🌾</div>
            <h4 style={cardTitleStyle}>Farmer Profile</h4>
            <p style={cardBodyStyle}>Public general area display with protected exact farm location controls.</p>
            <Link to="/farmer/profile" style={linkStyle}>Edit Profile →</Link>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>🌾</div>
            <h4 style={cardTitleStyle}>Crop Listings</h4>
            <p style={cardBodyStyle}>Post available crop quantities, units, and harvest periods for dealers.</p>
            <Link to="/farmer/crops" style={linkStyle}>Manage Crops →</Link>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>📊</div>
            <h4 style={cardTitleStyle}>Market Information</h4>
            <p style={cardBodyStyle}>Real-time reference agricultural prices from ShambaRecords.</p>
            <Link to="/farmer/market" style={linkStyle}>Browse Market Prices →</Link>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>🧮</div>
            <h4 style={cardTitleStyle}>Private Calculator</h4>
            <p style={cardBodyStyle}>Calculate private production costs and break-even estimates.</p>
            <Link to="/farmer/calculator" style={linkStyle}>Open Calculator →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const cardIconStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  marginBottom: '8px',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 6px 0',
  color: '#f8fafc',
  fontSize: '1rem',
};

const cardBodyStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#94a3b8',
  fontSize: '0.85rem',
  lineHeight: 1.4,
};

const linkStyle: React.CSSProperties = {
  color: '#4ade80',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
};
