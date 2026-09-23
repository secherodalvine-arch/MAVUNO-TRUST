import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Shield, Lock, ScrollText, Building2, Scale, Receipt, Users } from 'lucide-react';

export const AdminDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #713f12, #eab308)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>Administrator Control Panel</h1>
            <p className="page-subtitle">
              Authenticated Admin: <strong style={{ color: 'var(--color-text-primary)' }}>{user?.fullName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div className="alert-banner amber" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{
          margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700,
          color: '#f8c06a', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Lock size={17} />
          Strict Admin Role Boundary Enforced
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Public self-registration for ADMIN is blocked by backend security rules. Admin
          accounts can only be provisioned via secure database seeding or bootstrap scripts.
          Access to this page requires server-side <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: '0.82em' }}>requireRole('ADMIN')</code> authorization.
        </p>
      </div>

      {/* Dashboard cards */}
      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'rgba(245,166,35,0.1)', color: '#f8c06a' }}>
            <ScrollText size={20} />
          </div>
          <span className="dash-card-title">Audit Logs</span>
          <p className="dash-card-desc">Review immutable audit logs of login events, role updates, and dispute resolutions.</p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>Coming soon</span>
        </div>

        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd' }}>
            <Building2 size={20} />
          </div>
          <span className="dash-card-title">Dealer Verification Override</span>
          <p className="dash-card-desc">Manual audit and verification overrides for dealer AFA licence claims.</p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>Coming soon</span>
        </div>

        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'rgba(39,137,79,0.1)', color: '#5ec285' }}>
            <Scale size={20} />
          </div>
          <span className="dash-card-title">Rights &amp; Remedies</span>
          <p className="dash-card-desc">Publish official laws, regulations, and escalation remedies for farmers.</p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>Coming soon</span>
        </div>

        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
            <Users size={20} />
          </div>
          <span className="dash-card-title">User Management</span>
          <p className="dash-card-desc">View and manage all registered farmer and dealer accounts on the platform.</p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>Coming soon</span>
        </div>

        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'rgba(52,168,98,0.1)', color: '#5ec285' }}>
            <Receipt size={20} />
          </div>
          <span className="dash-card-title">All Transactions</span>
          <p className="dash-card-desc">Platform-wide transaction review, dispute flags, and resolution records.</p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>Coming soon</span>
        </div>
      </div>
    </div>
  );
};
