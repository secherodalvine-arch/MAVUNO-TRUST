import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { getMyDealerProfileApi, updateMyDealerProfileApi, getPublicDealerProfileApi } from '../services/dealerService';
import type { DealerProfileDTO } from '../services/dealerService';
import { verifyDealerLicenceApi } from '../services/verificationService';
import type { VerificationResultDTO } from '../services/verificationService';
import { createOrGetConversation } from '../services/chatService';
import { ArrowLeft, MessageSquare, HandshakeIcon } from 'lucide-react';

export const DealerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [profile, setProfile] = useState<DealerProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStartChat = async () => {
    const targetId = profile?.userId || id;
    if (!targetId) return;
    try {
      setStartingChat(true);
      const conv = await createOrGetConversation(targetId);
      navigate(`/messages?conversationId=${conv._id}`);
    } catch (err: any) {
      console.error('Failed to open chat from dealer profile:', err);
      navigate(`/messages?recipientId=${targetId}&name=${encodeURIComponent(profile?.displayName || profile?.businessName || '')}`);
    } finally {
      setStartingChat(false);
    }
  };

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [generalOperatingArea, setGeneralOperatingArea] = useState('');
  const [countiesServedStr, setCountiesServedStr] = useState('');
  const [cropsDealtStr, setCropsDealtStr] = useState('');
  const [purchasingCapacityKg, setPurchasingCapacityKg] = useState<number | ''>('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');

  // Verification verification result state
  const [verificationResult, setVerificationResult] = useState<VerificationResultDTO | null>(null);

  const fetchProfile = async () => {
    try {
      const isPublicView = Boolean(id);
      let data: any;

      if (isPublicView) {
        data = await getPublicDealerProfileApi(id!);
      } else {
        data = await getMyDealerProfileApi();
      }
      
      setProfile(data);
      setBusinessName(data.businessName || '');
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setGeneralOperatingArea(data.generalOperatingArea || '');
      setCountiesServedStr(data.countiesServed ? data.countiesServed.join(', ') : '');
      setCropsDealtStr(data.cropsDealt ? data.cropsDealt.join(', ') : '');
      setPurchasingCapacityKg(data.purchasingCapacityKg !== undefined ? data.purchasingCapacityKg : '');
      setBusinessRegNumber(data.businessRegNumber || '');
      setLicenceNumber(data.licence?.licenceNumber || '');
    } catch {
      setMessage({ type: 'error', text: 'Failed to load dealer profile.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      const countiesServed = countiesServedStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const cropsDealt = cropsDealtStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateMyDealerProfileApi({
        businessName: businessName.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        generalOperatingArea: generalOperatingArea.trim(),
        countiesServed,
        cropsDealt,
        purchasingCapacityKg: purchasingCapacityKg === '' ? undefined : Number(purchasingCapacityKg),
        businessRegNumber: businessRegNumber.trim(),
        licenceNumber: licenceNumber.trim(),
      });

      setProfile(updated);
      setMessage({ type: 'success', text: 'Dealer profile saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunVerification = async (targetLicence?: string) => {
    const licToTest = targetLicence || licenceNumber;
    if (!licToTest.trim()) {
      setMessage({ type: 'error', text: 'Please enter a licence number to verify.' });
      return;
    }

    setLicenceNumber(licToTest);
    setIsVerifying(true);
    setMessage(null);

    try {
      const res = await verifyDealerLicenceApi(licToTest.trim());
      setVerificationResult(res.verificationResult);
      setProfile(res.profile);
      setMessage({
        type: 'success',
        text: `Demo Verification complete! Result: ${res.verificationResult.status}`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Licence verification failed.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        💼 Loading Dealer Profile...
      </div>
    );
  }

  const isPublicView = Boolean(id);
  const isProfileComplete = Boolean(businessName && countiesServedStr && cropsDealtStr && licenceNumber);
  const licenceStatus = profile?.licence?.status || 'PENDING';
  const licenceSource = profile?.licence?.source || 'NOT_CHECKED';

  const demoTestLicences = [
    { code: 'AFA-DEMO-001', label: 'ACTIVE' },
    { code: 'AFA-DEMO-002', label: 'EXPIRED' },
    { code: 'AFA-DEMO-003', label: 'SUSPENDED' },
    { code: 'AFA-DEMO-004', label: 'REVOKED' },
    { code: 'AFA-DEMO-005', label: 'INACTIVE' },
    { code: 'AFA-DEMO-006', label: 'UNABLE_TO_VERIFY' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <span style={styles.badge}>💼 Dealer / Broker Management</span>
          <h1 style={styles.title}>{isPublicView ? profile?.businessName || profile?.displayName : 'Dealer Business Profile & Verification'}</h1>
          <p style={styles.subtitle}>
            {isPublicView ? profile?.bio : 'Enter business details, purchasing capacity, and verify your AFA licence against the Demo Provider.'}
          </p>
        </div>
      </div>

      {!isProfileComplete && !isPublicView && (
        <div style={styles.warningBanner}>
          ⚠️ <strong>Profile Notice:</strong> Your dealer profile is incomplete. Please enter your business name, operating counties, crops dealt, and licence number below.
        </div>
      )}

      {message && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: message.type === 'success' ? '#86efac' : '#fca5a5',
          }}
        >
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Demo AFA Verification Service Panel */}
      <div style={styles.verificationCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={styles.cardTitle}>🏛️ Demo AFA Dealer Licence Verification Service</h2>
          <span style={styles.demoPill}>DEMO AFA VERIFICATION</span>
        </div>

        {!isPublicView && (
          <>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              This service connects to the <strong>Demo AFA Verification Provider</strong> to evaluate dealer regulatory compliance. Test hackathon demonstration licence numbers below:
            </p>

            {/* Hackathon Test Quick-Select Buttons */}
            <div style={styles.testBtnGrid}>
              {demoTestLicences.map((lic) => (
                <button
                  key={lic.code}
                  type="button"
                  onClick={() => handleRunVerification(lic.code)}
                  style={styles.testBtn}
                >
                  <span style={{ fontWeight: 700 }}>{lic.code}</span>
                  <span style={styles.testBtnLabel}>({lic.label})</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
                placeholder="Enter licence identifier (e.g. AFA-DEMO-001)"
              />
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleRunVerification()}
                style={{
                  ...styles.verifyActionBtn,
                  opacity: isVerifying ? 0.7 : 1,
                }}
              >
                {isVerifying ? 'Verifying...' : '⚡ Run AFA Verification Check'}
              </button>
            </div>
          </>
        )}

        {/* Verification Result Display */}
        {(verificationResult || profile?.licence) && (
          <div style={styles.resultDisplayBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 700 }}>
                Licence Status:
              </span>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor:
                    (verificationResult?.status || licenceStatus) === 'ACTIVE'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : (verificationResult?.status || licenceStatus) === 'EXPIRED'
                      ? 'rgba(234, 179, 8, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  color:
                    (verificationResult?.status || licenceStatus) === 'ACTIVE'
                      ? '#4ade80'
                      : (verificationResult?.status || licenceStatus) === 'EXPIRED'
                      ? '#fde047'
                      : '#fca5a5',
                }}
              >
                {verificationResult?.status || licenceStatus}
              </span>
            </div>

            <div style={styles.resultGrid}>
              <div>
                <span style={styles.resLabel}>Licence Identifier:</span>
                <div style={styles.resVal}>{verificationResult?.licenceNumber || licenceNumber || 'None'}</div>
              </div>
              <div>
                <span style={styles.resLabel}>Verification Source:</span>
                <div style={styles.resVal}>{verificationResult?.source || licenceSource}</div>
              </div>
              <div>
                <span style={styles.resLabel}>Sector / Type:</span>
                <div style={styles.resVal}>
                  {verificationResult?.cropSector || profile?.licence?.cropSector || 'General Agriculture'}
                </div>
              </div>
              <div>
                <span style={styles.resLabel}>Timestamp:</span>
                <div style={styles.resVal}>
                  {verificationResult?.checkedAt
                    ? new Date(verificationResult.checkedAt).toLocaleString()
                    : profile?.licence?.verifiedAt
                    ? new Date(profile.licence.verifiedAt).toLocaleString()
                    : 'Not checked'}
                </div>
              </div>
            </div>

            {/* Mandatory Disclaimer Notice */}
            <div style={styles.disclaimerNotice}>
              🛡️ <strong>Demonstration only — not a live AFA verification result.</strong>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                Verification data is provided by the Demo AFA Verification Provider for hackathon demonstration. It does not represent an official government verification or transaction guarantee.
              </div>
            </div>

            {user?.role === 'FARMER' && (verificationResult?.status || licenceStatus) === 'ACTIVE' && profile && (
              <div style={{ marginTop: '20px', padding: '15px', borderTop: '1px solid #334155' }}>
                <button
                  onClick={() => navigate(`/farmer/offers/create/${profile.userId}`)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Make an Offer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isPublicView ? (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏢 Public Business & Operating Details</h2>

          <div style={{ display: 'grid', gap: '16px', color: '#cbd5e1', fontSize: '0.95rem' }}>
            {profile?.bio && (
              <div>
                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '4px' }}>Business Overview / Bio:</strong>
                <p style={{ margin: 0, lineHeight: 1.5, color: '#94a3b8' }}>{profile.bio}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div>
                <span style={styles.resLabel}>Operating Region:</span>
                <div style={styles.resVal}>{profile?.generalOperatingArea || 'General Trade'}</div>
              </div>
              <div>
                <span style={styles.resLabel}>Counties Served:</span>
                <div style={styles.resVal}>
                  {profile?.countiesServed && profile.countiesServed.length > 0
                    ? profile.countiesServed.join(', ')
                    : 'Not specified'}
                </div>
              </div>
              <div>
                <span style={styles.resLabel}>Crops Dealt With:</span>
                <div style={styles.resVal}>
                  {profile?.cropsDealt && profile.cropsDealt.length > 0
                    ? profile.cropsDealt.join(', ')
                    : 'General Produce'}
                </div>
              </div>
              <div>
                <span style={styles.resLabel}>Purchasing Capacity:</span>
                <div style={styles.resVal}>
                  {profile?.purchasingCapacityKg
                    ? `${profile.purchasingCapacityKg.toLocaleString()} Kg / month`
                    : 'Unspecified'}
                </div>
              </div>
            </div>

            {/* Farmer Direct Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/dealers')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ArrowLeft size={16} /> Back to Dealer Directory
              </button>

              <button
                type="button"
                onClick={handleStartChat}
                disabled={startingChat}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: startingChat ? 'wait' : 'pointer',
                  opacity: startingChat ? 0.75 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageSquare size={16} /> {startingChat ? 'Connecting to Chat…' : 'Start Private Conversation'}
              </button>

              {user?.role === 'FARMER' && (profile?.licence?.status === 'ACTIVE') && (
                <button
                  type="button"
                  onClick={() => navigate(`/farmer/offers/create/${profile.userId}`)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <HandshakeIcon size={16} /> Make an Offer
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.grid}>
          {/* Business Information Form */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🏢 Business & Operating Details</h2>

            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Business / Company Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Rift Valley Produce Dealers Ltd"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Public Display Name *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Rift Valley Dealers"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>General Operating Area / Head Office Region</label>
              <input
                type="text"
                value={generalOperatingArea}
                onChange={(e) => setGeneralOperatingArea(e.target.value)}
                style={styles.input}
                placeholder="e.g. Nakuru Town West / Rift Valley Central"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Counties Served (comma-separated)</label>
              <input
                type="text"
                value={countiesServedStr}
                onChange={(e) => setCountiesServedStr(e.target.value)}
                style={styles.input}
                placeholder="e.g. Nakuru, Uasin Gishu, Trans Nzoia, Narok"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Crops / Products Dealt With (comma-separated)</label>
              <input
                type="text"
                value={cropsDealtStr}
                onChange={(e) => setCropsDealtStr(e.target.value)}
                style={styles.input}
                placeholder="e.g. Maize, Beans, Wheat, Potatoes"
              />
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Est. Purchasing Capacity (Kg / Month)</label>
                <input
                  type="number"
                  min="0"
                  value={purchasingCapacityKg}
                  onChange={(e) => setPurchasingCapacityKg(e.target.value ? Number(e.target.value) : '')}
                  style={styles.input}
                  placeholder="e.g. 50000"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Private Business Registration Number</label>
                <input
                  type="text"
                  value={businessRegNumber}
                  onChange={(e) => setBusinessRegNumber(e.target.value)}
                  style={styles.input}
                  placeholder="Private reg number — not shown on public searches"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Company Overview / Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={styles.textarea}
                placeholder="Provide information on your buying policies, trade terms, and storage capabilities..."
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                ...styles.submitBtn,
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Saving Dealer Profile...' : 'Save Dealer Profile Details →'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  header: {
    marginBottom: '20px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
  },
  warningBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    border: '1px solid rgba(234, 179, 8, 0.3)',
    color: '#fde047',
    padding: '14px 18px',
    borderRadius: '10px',
    fontSize: '0.875rem',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },
  verificationCard: {
    backgroundColor: '#0f172a',
    border: '2px solid #2563eb',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '28px',
  },
  demoPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '12px',
  },
  testBtnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '8px',
    marginBottom: '12px',
  },
  testBtn: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'center',
  },
  testBtnLabel: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginTop: '2px',
  },
  verifyActionBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  resultDisplayBox: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
    marginTop: '10px',
  },
  resLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  resVal: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#f8fafc',
    marginTop: '2px',
  },
  disclaimerNotice: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    border: '1px solid rgba(234, 179, 8, 0.3)',
    color: '#fde047',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginTop: '14px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '28px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 16px 0',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: '#f8fafc',
    outline: 'none',
  },
  textarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: '#f8fafc',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '12px',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    marginTop: '12px',
    cursor: 'pointer',
    width: '100%',
  },
};
