import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Shield, Lock, ScrollText, Building2, Scale } from 'lucide-react';

export const AdminDashboardPlaceholder: React.FC = () => {
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
          <Shield size={32} style={{ color: '#eab308' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#f8fafc' }}>
              Administrator Control Panel
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Authenticated Admin: <strong>{user?.fullName}</strong> ({user?.email})
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px',
            color: '#fde047',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} /> Strict Admin Role Boundary Enforced
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Public self-registration for ADMIN is blocked by backend security rules. Admin accounts can only be provisioned via secure database seeding/bootstrap scripts. Access to this page requires server-side `requireRole('ADMIN')` authorization.
          </p>
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
            <div style={cardIconStyle}><ScrollText size={22} style={{ color: '#fde047' }} /></div>
            <h4 style={cardTitleStyle}>Audit Logs</h4>
            <p style={cardBodyStyle}>Review immutable audit logs of login events, role updates, and dispute resolutions.</p>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}><Building2 size={22} style={{ color: '#60a5fa' }} /></div>
            <h4 style={cardTitleStyle}>Dealer Verification Override</h4>
            <p style={cardBodyStyle}>Manual audit and verification overrides for dealer AFA licence claims.</p>
          </div>
          <div style={cardStyle}>
            <div style={cardIconStyle}><Scale size={22} style={{ color: '#4ade80' }} /></div>
            <h4 style={cardTitleStyle}>Rights & Remedies Admin</h4>
            <p style={cardBodyStyle}>Publish official laws, regulations, and escalation remedies for farmers.</p>
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
};

const cardIconStyle: React.CSSProperties = {
  marginBottom: '8px',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 6px 0',
  color: '#f8fafc',
  fontSize: '1rem',
};

const cardBodyStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: '0.85rem',
  lineHeight: 1.4,
};

