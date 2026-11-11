import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadSpinner } from './LoadSpinner';
import {
  Satellite,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Send,
  Sparkles,
  Info,
  MapPin,
  RefreshCw,
  ChevronRight,
  Phone,
  Languages,
  Cloud,
} from 'lucide-react';
import {
  getFarmAdvisoryApi,
  getFarmBoundaryApi,
  getAssistancePartnersApi,
  requestAssistanceReferralApi,
  getMyFarmerProfileApi,
  type FarmAdvisoryDTO,
  type FarmBoundaryDTO,
  type AgriculturalPartnerDTO,
  type AssistanceReferralResponse,
} from '../services/farmerService';

export const SmartFarmAdvisorSection: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [boundary, setBoundary] = useState<FarmBoundaryDTO | null>(null);
  const [advisory, setAdvisory] = useState<FarmAdvisoryDTO | null>(null);
  const [partners, setPartners] = useState<AgriculturalPartnerDTO[]>([]);

  // Assistance section state
  const [assistanceAnswer, setAssistanceAnswer] = useState<'yes' | 'no' | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('TUPANDE_ONE_ACRE_FUND');
  const [assistanceType, setAssistanceType] = useState<string>('INPUTS_AND_TRAINING');
  const [assistanceNotes, setAssistanceNotes] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>(() => {
    return localStorage.getItem('farmer_profile_phone') || user?.phoneNumber || '';
  });
  const [referralPhone, setReferralPhone] = useState<string>(() => {
    return localStorage.getItem('farmer_profile_phone') || user?.phoneNumber || '';
  });
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [submittingReferral, setSubmittingReferral] = useState<boolean>(false);
  const [referralResult, setReferralResult] = useState<AssistanceReferralResponse | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [boundaryRes, partnersRes, profileRes] = await Promise.all([
        getFarmBoundaryApi().catch(() => null),
        getAssistancePartnersApi().catch(() => []),
        getMyFarmerProfileApi().catch(() => null),
      ]);
      setBoundary(boundaryRes);
      setPartners(partnersRes);

      // Pre-fill referral phone from stored profile phone number
      const resolvedPhone = profileRes?.phoneNumber || user?.phoneNumber || localStorage.getItem('farmer_profile_phone') || '';
      if (resolvedPhone) {
        setProfilePhone(resolvedPhone);
        localStorage.setItem('farmer_profile_phone', resolvedPhone);
        setReferralPhone((prev) => (prev.trim() ? prev : resolvedPhone));
      }

      if (boundaryRes?.hasBoundary) {
        const advRes = await getFarmAdvisoryApi().catch((err) => ({
          success: false,
          code: 'FETCH_ERROR',
          message: err.message,
        }));
        setAdvisory(advRes);
      }
    } catch (err) {
      console.error('[SmartFarmAdvisor] Failed to load data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setReferralError('You must check the explicit consent box before submitting a referral.');
      return;
    }
    if (!referralPhone.trim()) {
      setReferralError('Please enter your phone number so we can send you the SMS confirmation.');
      return;
    }
    setSubmittingReferral(true);
    setReferralError(null);

    try {
      const res = await requestAssistanceReferralApi({
        organizationId: selectedPartnerId,
        assistanceType,
        notes: assistanceNotes,
        consentGiven: true,
        phoneNumber: referralPhone.trim(),
      });

      if (res.success) {
        setReferralResult(res);
      } else {
        setReferralError(res.message || 'Failed to submit referral request.');
      }
    } catch (err: any) {
      setReferralError(err.response?.data?.message || err.message || 'Error submitting referral.');
    } finally {
      setSubmittingReferral(false);
    }
  };

  const activePartner =
    partners.find((p) => p.id === selectedPartnerId) || partners[0];

  return (
    <div
      style={{
        background: 'var(--color-surface, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--color-border, #334155)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Satellite size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary, #f8fafc)' }}>
              Smart Farm Advisor &amp; Satellite Monitoring
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #94a3b8)', margin: '2px 0 0 0' }}>
              Satellite Crop Vegetation Health &amp; AI Farm Advisory
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border, #334155)',
            background: 'transparent',
            color: 'var(--color-text-secondary, #94a3b8)',
            cursor: loading || refreshing ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Checking Satellite...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
          <LoadSpinner size="md" text="quering..." />
        </div>
      ) : !boundary?.hasBoundary ? (
        /* Case 1: No Boundary Registered */
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={20} color="#eab308" />
            <strong style={{ color: '#eab308', fontSize: '1rem' }}>Farm Boundary Required for Satellite Monitoring</strong>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #cbd5e1)', margin: 0 }}>
            To calculate crop vegetation health and generate personalized agronomic advice, you must register your farm perimeter.
            Our satellite service processes crop observations strictly over your registered polygon.
          </p>
          <div>
            <Link
              to="/farmer/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#10b981',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Draw Farm Boundary in Profile <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      ) : advisory?.code === 'GEE_CREDENTIALS_REQUIRED' || !advisory?.success ? (
        /* Case 2: Satellite data not yet available — detailed explanation */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Status banner */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Satellite size={22} color="#10b981" />
              <strong style={{ color: '#10b981', fontSize: '1rem' }}>
                Farm Boundary Linked — Sentinel-2 Scan Queued
              </strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
              Your farm boundary of <strong style={{ color: '#f8fafc' }}>{boundary?.boundaryAreaAcres || '—'} acres</strong> is
              registered and confirmed. The system is querying real Sentinel-2 satellite imagery from the
              European Space Agency (ESA) Copernicus programme directly over your registered farm polygon.
            </p>
            {advisory?.message && (
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '10px 0 0 0', fontStyle: 'italic' }}>
                ⚠ Satellite status: {advisory.message}
              </p>
            )}
          </div>

          {/* What is NDVI — farmer-friendly explanation */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '10px',
              padding: '18px 20px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px 0' }}>
              🛰️ How Your Farm Is Being Observed
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                {
                  icon: '📡',
                  label: 'Satellite',
                  value: 'Sentinel-2 (ESA / Copernicus)',
                  desc: 'Europe\'s free, open Earth-observation satellite with 10-metre resolution',
                },
                {
                  icon: '📐',
                  label: 'Your Farm Area',
                  value: `${boundary?.boundaryAreaAcres || '—'} acres`,
                  desc: 'Observation is strictly limited to your registered boundary — private to you only',
                },
                {
                  icon: '📅',
                  label: 'Revisit Cadence',
                  value: 'Every 5 days',
                  desc: 'Sentinel-2 passes over Kenya approximately every 5 days',
                },
                {
                  icon: '🌿',
                  label: 'Measurement',
                  value: 'NDVI (Vegetation Index)',
                  desc: 'NDVI measures how green and dense your crop canopy appears from space — values 0.6–0.9 indicate healthy dense crops',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>{item.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NDVI scale explainer */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '10px',
              padding: '16px 20px',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px 0' }}>
              🌱 What NDVI Scores Mean For Your Crops
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { range: '0.6 – 0.9', label: 'Dense, Healthy Canopy', color: '#16a34a', desc: 'Crops are growing vigorously. Good canopy cover observed.' },
                { range: '0.4 – 0.6', label: 'Moderate Vegetation', color: '#65a30d', desc: 'Reasonable crop growth. Worth monitoring for any changes.' },
                { range: '0.2 – 0.4', label: 'Sparse / Young Crops', color: '#d97706', desc: 'Could indicate young seedlings, partial ground cover, or early stress.' },
                { range: '0.0 – 0.2', label: 'Very Low Vegetation', color: '#dc2626', desc: 'Bare ground, stressed crops, or recently harvested fields.' },
              ].map((row) => (
                <div key={row.range} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '72px',
                      flexShrink: 0,
                      background: row.color,
                      color: '#fff',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}
                  >
                    {row.range}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{row.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>{row.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '0.82rem',
              color: '#94a3b8',
            }}
          >
            <Info size={16} style={{ flexShrink: 0, color: '#10b981', marginTop: '1px' }} />
            <span>
              <strong style={{ color: '#10b981' }}>100% Private:</strong>{' '}
              Your farm boundary coordinates and satellite readings are strictly confidential. They are never shared with
              dealers, other farmers, or any third party — used solely to generate your personal crop health advisory.
            </span>
          </div>
        </div>
      ) : (
        /* Case 3: Real Satellite Observation & AI Advisory Available */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* NDVI Health Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Vegetation Health card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  advisory.ndviClassification?.severity === 'good'
                    ? 'rgba(16, 185, 129, 0.35)'
                    : advisory.ndviClassification?.severity === 'moderate'
                    ? 'rgba(245, 158, 11, 0.35)'
                    : 'rgba(239, 68, 68, 0.35)'
                }`,
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🌿 Crop Canopy Health
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color:
                    advisory.ndviClassification?.severity === 'good'
                      ? '#10b981'
                      : advisory.ndviClassification?.severity === 'moderate'
                      ? '#f59e0b'
                      : '#ef4444',
                  marginBottom: '4px',
                }}
              >
                {advisory.ndviClassification?.label || 'Observed'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {advisory.ndviClassification?.description}
              </div>
            </div>

            {/* NDVI score card with visual bar */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📡 Satellite NDVI Score
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
                  {advisory.dataQuality?.meanNDVI !== undefined
                    ? Number(advisory.dataQuality.meanNDVI).toFixed(3)
                    : 'N/A'}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>/ 1.0 scale</span>
              </div>
              {/* Visual NDVI bar */}
              {advisory.dataQuality?.meanNDVI !== undefined && (
                <div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0, top: 0, bottom: 0,
                      width: `${Math.max(0, Math.min(100, Number(advisory.dataQuality.meanNDVI) * 100))}%`,
                      background: advisory.ndviClassification?.severity === 'good'
                        ? '#10b981'
                        : advisory.ndviClassification?.severity === 'moderate'
                        ? '#f59e0b'
                        : '#ef4444',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                📅 Observed: <strong style={{ color: '#cbd5e1' }}>{advisory.observationDate || 'Recent pass'}</strong>
              </div>
            </div>

            {/* Cloud cover / data quality */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ☁ Image Quality
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                {advisory.dataQuality?.cloudCoverPercent !== null && advisory.dataQuality?.cloudCoverPercent !== undefined
                  ? `${advisory.dataQuality.cloudCoverPercent}% cloud cover`
                  : 'Clear observation'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {advisory.dataQuality?.cloudCoverPercent !== null && advisory.dataQuality?.cloudCoverPercent !== undefined
                  ? advisory.dataQuality.cloudCoverPercent < 10
                    ? '✅ Excellent clarity — very reliable reading'
                    : advisory.dataQuality.cloudCoverPercent < 25
                    ? '✅ Good image quality'
                    : '⚠ Moderate cloud cover — reading is an estimate'
                  : '✅ Clear sky over your farm'}
                <br />
                AI confidence: <strong style={{ color: '#f8fafc' }}>{advisory.advisory?.confidence || 'MEDIUM'}</strong>
              </div>
            </div>
          </div>

          {/* AI Agronomic Interpretation */}
          {advisory.advisory && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={18} color="#10b981" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#10b981' }}>
                  AI Crop Health Advisory — Based on Real Satellite Data
                </h3>
              </div>

              {/* English observation */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  fontSize: '0.9rem',
                  color: '#f8fafc',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: '#10b981', fontSize: '0.78rem', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🛰 Satellite Observation
                </strong>
                {advisory.advisory.vegetationObservation}
              </div>

              {/* Kiswahili translation */}
              {(advisory.advisory as any).vegetationObservationSw && (
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                    borderLeft: '3px solid rgba(16, 185, 129, 0.4)',
                    paddingLeft: '12px',
                  }}
                >
                  <Languages size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', color: '#10b981' }} />
                  <strong style={{ color: '#64748b' }}>Kiswahili:</strong>{' '}
                  {(advisory.advisory as any).vegetationObservationSw}
                </div>
              )}

              {/* Weather context */}
              {(advisory.advisory as any).weatherInfluence &&
                (advisory.advisory as any).weatherInfluence !== 'Weather data not available.' && (
                <div
                  style={{
                    background: 'rgba(251, 191, 36, 0.07)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.83rem',
                    color: '#fde047',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <Cloud size={15} style={{ flexShrink: 0, color: '#fbbf24', marginTop: '1px' }} />
                  <span>
                    <strong>Weather influence:</strong>{' '}
                    {(advisory.advisory as any).weatherInfluence}
                  </span>
                </div>
              )}

              {/* Practical Recommendations */}
              {advisory.advisory.practicalRecommendations?.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    ✅ What You Should Do Now
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {advisory.advisory.practicalRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: 1.5 }}>
                          <strong style={{ color: '#10b981' }}>{idx + 1}.</strong> {rec}
                        </div>
                        {(advisory.advisory as any).practicalRecommendationsSw?.[idx] && (
                          <div
                            style={{
                              color: '#64748b',
                              fontStyle: 'italic',
                              fontSize: '0.8rem',
                              marginTop: '4px',
                              paddingTop: '4px',
                              borderTop: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <Languages size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            {(advisory.advisory as any).practicalRecommendationsSw[idx]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.78rem',
                  color: '#fca5a5',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Important: </strong>
                  {advisory.advisory.disclaimer ||
                    'Satellite vegetation index measures plant canopy density — it is not a confirmed crop disease diagnosis. Always verify with on-ground field inspection before taking action.'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section: Farmer Assistance (One Acre Fund / Tupande) ───────────── */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-border, #334155)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <HelpCircle size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary, #f8fafc)' }}>
            Do you need additional agricultural assistance?
          </h3>
        </div>

        {assistanceAnswer === null && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setAssistanceAnswer('yes')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CheckCircle size={16} /> YES, I NEED HELP
            </button>
            <button
              onClick={() => setAssistanceAnswer('no')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              NO, THANK YOU
            </button>
          </div>
        )}

        {assistanceAnswer === 'no' && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
              Glad things are going well on your farm! You can request assistance anytime.
            </p>
            <button
              onClick={() => setAssistanceAnswer(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Change Answer
            </button>
          </div>
        )}

        {assistanceAnswer === 'yes' && (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            {referralResult ? (
              /* Referral Confirmed */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <CheckCircle size={28} />
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
                  Assistance Referral Confirmed!
                </h4>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    color: '#38bdf8',
                    marginBottom: '12px',
                  }}
                >
                  Referral ID: {referralResult.data?.referralId}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', maxWidth: '520px', margin: '0 auto 16px' }}>
                  {referralResult.data?.instructions}
                </p>
                {/* SMS delivery status */}
                {referralResult.phoneDelivered !== undefined && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: referralResult.phoneDelivered ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                      border: `1px solid ${referralResult.phoneDelivered ? 'rgba(16,185,129,0.3)' : 'rgba(234,179,8,0.3)'}`,
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      color: referralResult.phoneDelivered ? '#4ade80' : '#fbbf24',
                      marginBottom: '16px',
                    }}
                  >
                    <Phone size={14} />
                    {referralResult.phoneDelivered
                      ? `SMS confirmation sent to ${referralResult.phoneNumber || referralPhone}`
                      : 'Add a phone number in your profile to receive SMS confirmations'}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {referralResult.data?.partner.ussdCode && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <strong style={{ color: '#10b981' }}>Dial USSD: </strong>
                      {referralResult.data.partner.ussdCode}
                    </div>
                  )}
                  {referralResult.data?.partner.tollFreeHotline && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <strong style={{ color: '#38bdf8' }}>Toll-Free Hotline: </strong>
                      {referralResult.data.partner.tollFreeHotline}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Referral Form */
              <form onSubmit={handleReferralSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#cbd5e1',
                      marginBottom: '6px',
                    }}
                  >
                    Select Agricultural Support Partner:
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--mt-input-bg, var(--color-surface-raised))',
                      border: '1px solid var(--mt-input-border, var(--color-surface-border))',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id} style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-primary)' }}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Partner Information Card */}
                {activePartner && (
                  <div
                    style={{
                      background: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-surface-border)',
                      borderRadius: '8px',
                      padding: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ color: '#0284c7', fontSize: '0.95rem' }}>{activePartner.name}</strong>
                      {activePartner.ussdCode && (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#16a34a',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          USSD: {activePartner.ussdCode}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', margin: '0 0 8px 0' }}>
                      {activePartner.description}
                    </p>
                    {activePartner.services?.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {activePartner.services.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    )}
                    {activePartner.tollFreeHotline && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Toll-Free Hotline: <strong style={{ color: 'var(--color-text-primary)' }}>{activePartner.tollFreeHotline}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Type of Assistance Needed:
                  </label>
                  <select
                    value={assistanceType}
                    onChange={(e) => setAssistanceType(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--mt-input-bg, var(--color-surface-raised))',
                      border: '1px solid var(--mt-input-border, var(--color-surface-border))',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="INPUTS_AND_TRAINING" style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-primary)' }}>
                      Certified Seeds &amp; Fertilizer Financing (Tupande Package)
                    </option>
                    <option value="AGRONOMY_ADVICE" style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-primary)' }}>
                      Agronomy Extension &amp; Crop Disease Identification
                    </option>
                    <option value="POST_HARVEST_STORAGE" style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-primary)' }}>
                      PICS Crop Storage Bags &amp; Solar Lighting
                    </option>
                    <option value="SOIL_HEALTH" style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-primary)' }}>
                      Soil Testing &amp; Fertility Optimization
                    </option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Optional Farm Notes or Questions:
                  </label>
                  <textarea
                    rows={2}
                    value={assistanceNotes}
                    onChange={(e) => setAssistanceNotes(e.target.value)}
                    placeholder="e.g. My maize parcel is showing pale leaves; need advice on top dressing fertilizer."
                    style={{
                      width: '100%',
                      background: 'var(--mt-input-bg, var(--color-surface-raised))',
                      border: '1px solid var(--mt-input-border, var(--color-surface-border))',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Phone Number for SMS Confirmation */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} />
                      Phone Number for SMS Confirmation: <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={referralPhone}
                    onChange={(e) => setReferralPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    required
                    style={{
                      width: '100%',
                      background: 'var(--mt-input-bg, var(--color-surface-raised))',
                      border: `1px solid ${!referralPhone.trim() ? 'rgba(239,68,68,0.5)' : 'var(--mt-input-border, var(--color-surface-border))'}`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Info size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>
                      {profilePhone
                        ? `Defaulted to your profile phone number (${profilePhone}). You can change it here or in Profile.`
                        : <span>No phone number saved in your profile yet. <Link to="/farmer/profile" style={{ color: '#10b981', textDecoration: 'underline' }}>Set it in Profile</Link> to auto-fill here.</span>}
                    </span>
                  </div>
                </div>

                {/* Explicit Consent Requirement */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#e2e8f0',
                      lineHeight: 1.4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <span>
                      <strong style={{ color: '#10b981' }}>Explicit Consent: </strong>
                      I authorize MavunoTrust to create a referral with{' '}
                      <strong>{activePartner?.name || 'the agricultural partner'}</strong> and share my general area,
                      crop types, and registered contact phone number. My exact GPS coordinates will remain private and
                      will NOT be shared.
                    </span>
                  </label>
                </div>

                {referralError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      color: '#f87171',
                      fontSize: '0.85rem',
                      marginBottom: '14px',
                    }}
                  >
                    {referralError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="submit"
                    disabled={!consentChecked || submittingReferral}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: !consentChecked || submittingReferral ? '#475569' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: !consentChecked || submittingReferral ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submittingReferral ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Submitting Referral...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Assistance Request</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssistanceAnswer(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
