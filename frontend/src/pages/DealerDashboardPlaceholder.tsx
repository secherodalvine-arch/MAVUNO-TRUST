import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const DealerDashboardPlaceholder: React.FC = () => {
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
          <span style={{ fontSize: '2rem' }}>💼</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#f8fafc' }}>
              Dealer Hub
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Welcome back, <strong>{user?.fullName}</strong> ({user?.email})
            </p>
          </div>
        </div>

        {/* Step 5 Action Banner */}
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            color: '#93c5fd',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>
            💼 Step 5 Features Active
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Update your business profile, specify operating counties and crops dealt, and enter your AFA licence number for future verification.
          </p>
          <Link
            to="/dealer/profile"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Manage Dealer Profile & Licence →
          </Link>
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
            <div style={cardIconStyle}>🏢</div>
            <h4 style={cardTitleStyle}>Business Profile</h4>
            <p style={cardBodyStyle}>Configure operating regions, crops dealt, purchasing capacity, and licence number.</p>
            <Link to="/dealer/profile" style={linkStyle}>Edit Profile →</Link>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>🏛️</div>
            <h4 style={cardTitleStyle}>AFA Verification</h4>
            <p style={cardBodyStyle}>Licence status remains PENDING (NOT CHECKED) until verification service runs in future step.</p>
            <Link to="/dealer/profile" style={linkStyle}>View Status →</Link>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}>🔍</div>
            <h4 style={cardTitleStyle}>Farmer Crop Match</h4>
            <p style={cardBodyStyle}>Future step: Search verified crop listings by county and crop type.</p>
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
  color: '#60a5fa',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
};
