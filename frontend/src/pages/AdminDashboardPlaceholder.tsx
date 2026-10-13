import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Shield,
  Lock,
  ScrollText,
  Building2,
  Scale,
  Receipt,
  Users,
  Truck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { transportService } from '../services/transportService';
import LoadSpinner from '../components/LoadSpinner';

export const AdminDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  const [flaggedRecords, setFlaggedRecords] = useState<any[]>([]);
  const [loadingFlagged, setLoadingFlagged] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<string>('APPROVE');
  const [reviewReason, setReviewReason] = useState<string>('LEGITIMATE_OUTLIER_CONFIRMED');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadFlaggedRecords();
  }, [filterStatus]);

  const loadFlaggedRecords = async () => {
    setLoadingFlagged(true);
    setActionSuccessMsg(null);
    try {
      const res = await transportService.getAdminFlaggedRecords(filterStatus);
      if (res.success) {
        setFlaggedRecords(res.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingFlagged(false);
    }
  };

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setActionSubmitting(true);
    setActionSuccessMsg(null);

    try {
      const res = await transportService.adminReviewRecord(selectedRecord._id, {
        action: reviewAction,
        reasonCode: reviewReason,
        notes: reviewNotes.trim() || undefined,
      });

      if (res.success) {
        setActionSuccessMsg(`Record successfully updated (${res.data?.verificationStatus}).`);
        setSelectedRecord(null);
        setReviewNotes('');
        loadFlaggedRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Moderation action failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #713f12, #eab308)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              Administrator Control Panel
            </h1>
            <p className="page-subtitle">
              Authenticated Admin:{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>{user?.fullName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div className="alert-banner amber" style={{ marginBottom: 'var(--space-6)' }}>
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#f8c06a',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Lock size={17} />
          Strict Admin Role Boundary Enforced
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Public self-registration for ADMIN is blocked by backend security rules. Admin accounts
          can only be provisioned via secure database seeding or bootstrap scripts. Access to this
          page requires server-side{' '}
          <code
            style={{
              background: 'rgba(255,255,255,0.07)',
              padding: '1px 5px',
              borderRadius: 4,
              fontSize: '0.82em',
            }}
          >
            requireRole('ADMIN')
          </code>{' '}
          authorization.
        </p>
      </div>

      {/* ── Transport Quality & Anti-Manipulation Review Panel ── */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Transport Moderation &amp; Anti-Manipulation Review
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Inspect quarantined records, statistical outliers, Sybil clusters, and user appeals.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '0.82rem',
              }}
            >
              <option value="ALL">All Flagged Submissions</option>
              <option value="QUARANTINED">Quarantined Only</option>
              <option value="APPEAL">User Appeals Only</option>
            </select>

            <button
              type="button"
              onClick={loadFlaggedRecords}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              title="Refresh flagged records"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {actionSuccessMsg && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#4ade80',
              fontSize: '0.85rem',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {loadingFlagged ? (
          <div style={{ padding: 30, textAlign: 'center' }}>
            <LoadSpinner fullPage={false} size="md" text="Loading flagged submissions..." />
          </div>
        ) : flaggedRecords.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem' }}>
            No quarantined or flagged transport submissions require administrative action at this time.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {flaggedRecords.map((rec) => {
              const isQuarantined = rec.verificationStatus === 'QUARANTINED';
              return (
                <div
                  key={rec._id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${isQuarantined ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                        {rec.origin?.name} → {rec.destination?.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: isQuarantined ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: isQuarantined ? '#f87171' : '#facc15',
                        }}
                      >
                        {rec.verificationStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
                      Submitter: <strong>{rec.userId?.fullName || 'User'}</strong> ({rec.userRole}) | Vehicle: <strong>{rec.vehicleCategory}</strong>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 6 }}>
                      Distance: <strong>{rec.routing?.distanceKm} km</strong> | Reported Price: <strong style={{ color: '#4ade80' }}>KSh {rec.reportedPriceKSh?.toLocaleString()}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginLeft: 6 }}>
                        (~KSh {Math.round(rec.reportedPriceKSh / (rec.routing?.distanceKm || 1))}/km)
                      </span>
                    </div>

                    {rec.anomalyFlags && rec.anomalyFlags.length > 0 && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontSize: '0.75rem',
                          color: '#fca5a5',
                          marginBottom: 6,
                        }}
                      >
                        <strong>Anomaly Reason:</strong> {rec.anomalyFlags[0].details || rec.anomalyFlags[0].flag}
                      </div>
                    )}

                    {rec.isAppealRequested && (
                      <div
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontSize: '0.75rem',
                          color: '#7dd3fc',
                        }}
                      >
                        <strong>User Appeal Note:</strong> {rec.appealNotes}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10, textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(rec);
                        setReviewAction('APPROVE');
                        setReviewReason('LEGITIMATE_OUTLIER_CONFIRMED');
                      }}
                      className="btn btn-outline"
                      style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                    >
                      Audit &amp; Moderate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Moderation Action */}
        {selectedRecord && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                padding: 24,
                width: '100%',
                maxWidth: 520,
                color: '#fff',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                Moderate Transport Record
              </h3>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 16 }}>
                Route: <strong>{selectedRecord.origin?.name} → {selectedRecord.destination?.name}</strong> ({selectedRecord.routing?.distanceKm} km)<br />
                Reported Price: <strong>KSh {selectedRecord.reportedPriceKSh?.toLocaleString()}</strong> by {selectedRecord.userId?.fullName || 'User'}
              </div>

              <form onSubmit={handleModerationSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                    Decision Action
                  </label>
                  <select
                    value={reviewAction}
                    onChange={(e) => setReviewAction(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="APPROVE">Approve &amp; Verify (Include in Shared Estimates)</option>
                    <option value="RESTORE_APPEAL">Restore from Appeal</option>
                    <option value="QUARANTINE">Quarantine (Isolate from Estimates)</option>
                    <option value="REJECT">Reject Permanently</option>
                    <option value="REQUEST_INFO">Request Additional Proof / Receipt</option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                    Reason Code
                  </label>
                  <select
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="LEGITIMATE_OUTLIER_CONFIRMED">Legitimate Outlier Confirmed (Rain/Terrain/Peak Season)</option>
                    <option value="RECEIPT_VERIFIED">Official Haulier Receipt Verified</option>
                    <option value="SUSPECTED_TAMPERING">Suspected Price Tampering / Fabricated</option>
                    <option value="IMPLAUSIBLE_AMOUNT">Implausible Rate for Route</option>
                    <option value="INSUFFICIENT_DOCUMENTATION">Insufficient Documentation</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                    Audit Notes &amp; Rationale
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter audit trail rationale..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    {actionSubmitting ? 'Recording Decision...' : 'Commit Moderation Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard cards */}
      <div className="dash-grid">
        <div className="dash-card">
          <div
            className="dash-card-icon"
            style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#2dd4bf' }}
          >
            <Truck size={20} />
          </div>
          <span className="dash-card-title">Transport Records Moderation</span>
          <p className="dash-card-desc">
            Review crowdsourced transit cost reports, quarantine suspicious rates, and audit haulier receipts.
          </p>
          <span className="dash-card-link" style={{ color: '#2dd4bf' }}>Active Control</span>
        </div>

        <div className="dash-card">
          <div
            className="dash-card-icon"
            style={{ background: 'rgba(245,166,35,0.1)', color: '#f8c06a' }}
          >
            <ScrollText size={20} />
          </div>
          <span className="dash-card-title">Audit Logs</span>
          <p className="dash-card-desc">
            Review immutable audit logs of login events, role updates, and dispute resolutions.
          </p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>
            Coming soon
          </span>
        </div>

        <div className="dash-card">
          <div
            className="dash-card-icon"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd' }}
          >
            <Building2 size={20} />
          </div>
          <span className="dash-card-title">Dealer Verification Override</span>
          <p className="dash-card-desc">
            Manual audit and verification overrides for dealer AFA licence claims.
          </p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>
            Coming soon
          </span>
        </div>

        <div className="dash-card">
          <div
            className="dash-card-icon"
            style={{ background: 'rgba(39,137,79,0.1)', color: '#5ec285' }}
          >
            <Scale size={20} />
          </div>
          <span className="dash-card-title">Rights &amp; Remedies</span>
          <p className="dash-card-desc">
            Publish official laws, regulations, and escalation remedies for farmers.
          </p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>
            Coming soon
          </span>
        </div>

        <div className="dash-card">
          <div
            className="dash-card-icon"
            style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}
          >
            <Users size={20} />
          </div>
          <span className="dash-card-title">User Management</span>
          <p className="dash-card-desc">
            View and manage all registered farmer and dealer accounts on the platform.
          </p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>
            Coming soon
          </span>
        </div>

        <div className="dash-card">
          <div
            className="dash-card-icon"
            style={{ background: 'rgba(52,168,98,0.1)', color: '#5ec285' }}
          >
            <Receipt size={20} />
          </div>
          <span className="dash-card-title">All Transactions</span>
          <p className="dash-card-desc">
            Platform-wide transaction review, dispute flags, and resolution records.
          </p>
          <span className="dash-card-link" style={{ color: 'var(--color-text-muted)' }}>
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
};
