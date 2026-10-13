import React, { useState, useEffect } from 'react';
import {
  Truck,
  Navigation,
  AlertTriangle,
  Scale,
  Sparkles,
  Info,
  Send,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  transportService,
  type SubmitRecordParams,
} from '../services/transportService';
import type {
  TransportEstimateDTO,
  TransportRecordDTO,
  RouteDetailsDTO,
  VehicleCategory,
  TripArrangement,
  PriceEvidenceType,
} from '../types/transport';
import LoadSpinner from './LoadSpinner';

const KENYA_LOCATIONS = [
  'Eldoret, Uasin Gishu',
  'Kitale, Trans Nzoia',
  'Nakuru Town',
  'Nairobi - Wakulima Market',
  'Mombasa - Kongowea Market',
  'Kisumu - Kibuye Market',
  'Nyeri Town',
  'Meru Town',
  'Machakos Market',
  'Naivasha Town',
  'Thika Wholesale',
  'Narok Town',
];

interface Props {
  initialOrigin?: string;
  initialDestination?: string;
  compact?: boolean;
}

export const TransportIntelligenceSection: React.FC<Props> = ({
  initialOrigin = 'Eldoret, Uasin Gishu',
  initialDestination = 'Nairobi - Wakulima Market',
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'ESTIMATE' | 'CONTRIBUTE' | 'MY_RECORDS'>('ESTIMATE');

  // Estimate state
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('SMALL_TRUCK');
  const [tripArrangement, setTripArrangement] = useState<TripArrangement>('EXCLUSIVE');
  const [loadWeightKg, setLoadWeightKg] = useState<string>('3000');
  const [lang, setLang] = useState<'EN' | 'SW'>('EN');

  const [routeInfo, setRouteInfo] = useState<RouteDetailsDTO | null>(null);
  const [estimateData, setEstimateData] = useState<TransportEstimateDTO | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Contribute state
  const [contribOrigin, setContribOrigin] = useState(initialOrigin);
  const [contribDest, setContribDest] = useState(initialDestination);
  const [contribVehicle, setContribVehicle] = useState<VehicleCategory>('SMALL_TRUCK');
  const [contribPrice, setContribPrice] = useState<string>('');
  const [contribEvidence, setContribEvidence] = useState<PriceEvidenceType>('REPORTED_COMPLETED_JOURNEY');
  const [contribArrangement, setContribArrangement] = useState<TripArrangement>('EXCLUSIVE');
  const [contribWeight, setContribWeight] = useState<string>('3000');
  const [contribNotes, setContribNotes] = useState<string>('');
  const [contribSubmitting, setContribSubmitting] = useState(false);
  const [contribSuccessMsg, setContribSuccessMsg] = useState<string | null>(null);

  // My Records state
  const [myRecords, setMyRecords] = useState<TransportRecordDTO[]>([]);
  const [myRecordsLoading, setMyRecordsLoading] = useState(false);
  const [appealTargetId, setAppealTargetId] = useState<string | null>(null);
  const [appealNotes, setAppealNotes] = useState<string>('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  // Fetch initial route and estimate
  useEffect(() => {
    handleCalculateEstimate();
  }, []);

  // Fetch my records when tab opened
  useEffect(() => {
    if (activeTab === 'MY_RECORDS') {
      loadMyRecords();
    }
  }, [activeTab]);

  const loadMyRecords = async () => {
    setMyRecordsLoading(true);
    try {
      const res = await transportService.getMyRecords();
      if (res.success) {
        setMyRecords(res.data);
      }
    } catch {
      // ignore
    } finally {
      setMyRecordsLoading(false);
    }
  };

  const handleCalculateEstimate = async () => {
    if (!origin.trim() || !destination.trim()) {
      setErrorMsg('Please provide both origin and destination.');
      return;
    }

    setErrorMsg(null);
    setEstimateLoading(true);

    try {
      const res = await transportService.getEstimate({
        origin: origin.trim(),
        destination: destination.trim(),
        vehicleCategory,
        tripArrangement,
        loadWeightKg: loadWeightKg ? Number(loadWeightKg) : undefined,
      });

      if (res.success && res.data) {
        setEstimateData(res.data);
        if (res.data.routeDetails) {
          setRouteInfo(res.data.routeDetails);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to calculate transport estimate.';
      setErrorMsg(msg);
    } finally {
      setEstimateLoading(false);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribPrice || Number(contribPrice) <= 0) {
      setErrorMsg('Please enter a valid reported total price in KSh.');
      return;
    }

    setErrorMsg(null);
    setContribSubmitting(true);
    setContribSuccessMsg(null);

    try {
      const payload: SubmitRecordParams = {
        origin: { name: contribOrigin.trim() },
        destination: { name: contribDest.trim() },
        vehicleCategory: contribVehicle,
        reportedPriceKSh: Number(contribPrice),
        evidenceType: contribEvidence,
        tripArrangement: contribArrangement,
        loadWeightKg: contribWeight ? Number(contribWeight) : undefined,
        journeyDate: new Date().toISOString(),
        notes: contribNotes.trim() || undefined,
      };

      const res = await transportService.submitRecord(payload);
      if (res.success) {
        setContribSuccessMsg(res.message || 'Record saved successfully.');
        setContribPrice('');
        setContribNotes('');
        loadMyRecords();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Submission failed.';
      setErrorMsg(msg);
    } finally {
      setContribSubmitting(false);
    }
  };

  const handleAppealSubmit = async (recordId: string) => {
    if (!appealNotes.trim()) return;
    setAppealSubmitting(true);
    try {
      const res = await transportService.appealRecord(recordId, {
        appealNotes: appealNotes.trim(),
      });
      if (res.success) {
        setAppealTargetId(null);
        setAppealNotes('');
        loadMyRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit appeal');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const getConfidenceBadgeColor = (conf: string) => {
    switch (conf) {
      case 'HIGH':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' };
      case 'MEDIUM':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
      case 'LOW':
        return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div
      className="transport-intel-container"
      style={{
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: compact ? 16 : 24,
        marginBottom: 'var(--space-6)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              Shared Transport-Cost Intelligence
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                OpenStreetMap &amp; OSRM Powered
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
              Genuine driving distance calculations & crowdsourced haulier rate intelligence across Kenya.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 8,
            padding: 3,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('ESTIMATE')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'ESTIMATE' ? 'var(--color-primary, #16a34a)' : 'transparent',
              color: activeTab === 'ESTIMATE' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Cost Estimator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CONTRIBUTE')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'CONTRIBUTE' ? 'var(--color-primary, #16a34a)' : 'transparent',
              color: activeTab === 'CONTRIBUTE' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Log Journey Record
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MY_RECORDS')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'MY_RECORDS' ? 'var(--color-primary, #16a34a)' : 'transparent',
              color: activeTab === 'MY_RECORDS' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            My Submissions
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── TAB 1: ESTIMATOR ── */}
      {activeTab === 'ESTIMATE' && (
        <div>
          {/* Controls form */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Origin */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Origin (Farm / Sub-county)
              </label>
              <input
                type="text"
                list="origin-list"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Eldoret, Uasin Gishu"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
              <datalist id="origin-list">
                {KENYA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Destination */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Destination (Wholesale Market)
              </label>
              <input
                type="text"
                list="dest-list"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Nairobi - Wakulima Market"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
              <datalist id="dest-list">
                {KENYA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Vehicle Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Vehicle Class
              </label>
              <select
                value={vehicleCategory}
                onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              >
                <option value="PICKUP">Pickup (approx. 1–1.5 T)</option>
                <option value="SMALL_TRUCK">Small Truck / Canter (3–5 T)</option>
                <option value="MEDIUM_LORRY">Medium Lorry / Fuso (7–10 T)</option>
                <option value="LARGE_LORRY">Large Lorry / Trailer (15+ T)</option>
                <option value="OTHER">Other / Specialized</option>
              </select>
            </div>

            {/* Trip Arrangement & Load */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Hire Mode &amp; Cargo Weight (KG)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={tripArrangement}
                  onChange={(e) => setTripArrangement(e.target.value as TripArrangement)}
                  style={{
                    flex: 1,
                    padding: '9px 8px',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '0.84rem',
                  }}
                >
                  <option value="EXCLUSIVE">Exclusive Charter</option>
                  <option value="SHARED">Shared Load</option>
                </select>
                <input
                  type="number"
                  value={loadWeightKg}
                  onChange={(e) => setLoadWeightKg(e.target.value)}
                  placeholder="KG"
                  style={{
                    width: 90,
                    padding: '9px 8px',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '0.84rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button
              type="button"
              onClick={handleCalculateEstimate}
              disabled={estimateLoading}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 20px',
                fontSize: '0.88rem',
              }}
            >
              {estimateLoading ? <LoadSpinner fullPage={false} size="sm" /> : <TrendingUp size={16} />}
              Calculate Transport Benchmark
            </button>
          </div>

          {/* Results section */}
          {estimateLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <LoadSpinner fullPage={false} size="lg" text="Routing real road network & compiling historical estimates..." />
            </div>
          ) : estimateData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Card 1: Route & Distance */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#38bdf8' }}>
                  <Navigation size={18} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Road Network Route</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Drivable Road Distance:</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                      {estimateData.distanceKm.toLocaleString()} km
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>
                        ({(estimateData.distanceMeters || Math.round(estimateData.distanceKm * 1000)).toLocaleString()} metres)
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    <strong>Origin:</strong> {origin}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    <strong>Destination:</strong> {destination}
                  </div>

                  {routeInfo?.durationSeconds ? (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                      Estimated Driving Time: ~{Math.round(routeInfo.durationSeconds / 3600)}h {Math.round((routeInfo.durationSeconds % 3600) / 60)}m
                    </div>
                  ) : null}

                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: 4 }}>
                    Routing data © OpenStreetMap contributors, OSRM
                  </div>
                </div>
              </div>

              {/* Card 2: Cost Estimate Breakdown */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80' }}>
                    <Scale size={18} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Estimated Cost (KSh)</span>
                  </div>
                  {(() => {
                    const badge = getConfidenceBadgeColor(estimateData.confidenceLevel);
                    return (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 8,
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {estimateData.confidenceLevel} CONFIDENCE
                      </span>
                    );
                  })()}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f8fafc' }}>
                    KSh {estimateData.estimatedPriceMedian.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Expected Range: <strong>KSh {estimateData.estimatedPriceMin.toLocaleString()}</strong> – <strong>KSh {estimateData.estimatedPriceMax.toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10, fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>Baseline Rate / km:</span>
                  <strong style={{ color: '#cbd5e1' }}>~KSh {estimateData.baselineRatePerKm} / km</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>Supporting Records:</span>
                  <strong style={{ color: '#cbd5e1' }}>{estimateData.sampleSize} reports ({estimateData.contributorCount} contributors)</strong>
                </div>
              </div>

              {/* Card 3: Plain Language & Bilingual Advice */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#facc15' }}>
                    <Sparkles size={18} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      Logistics Advice &amp; Transparency Notice
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setLang('EN')}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: lang === 'EN' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        color: lang === 'EN' ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('SW')}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: lang === 'SW' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        color: lang === 'SW' ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      Kiswahili
                    </button>
                  </div>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                  {lang === 'SW'
                    ? estimateData.explanation?.swahiliSummary || 'Makadirio haya ya usafiri yanasaidia wakulima na wafanyabiashara kupata picha halisi ya gharama lakini hayahakikishi bei ya mwisho ya dereva.'
                    : estimateData.explanation?.englishSummary || 'This estimate provides an empirical benchmark based on community records and genuine road distances. Always negotiate directly with transporters.'}
                </p>

                {estimateData.assumptions && estimateData.assumptions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, padding: '8px 12px', background: 'rgba(250, 204, 21, 0.08)', borderRadius: 6, border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#facc15', marginBottom: 2 }}>
                      Methodology Assumptions:
                    </div>
                    {estimateData.assumptions.map((a, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <span style={{ color: '#facc15', fontSize: '0.9rem' }}>•</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}

                {estimateData.warnings && estimateData.warnings.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                    {estimateData.warnings.map((w, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8' }}>
                        <Info size={13} style={{ color: '#facc15', flexShrink: 0 }} />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── TAB 2: CONTRIBUTE RECORD ── */}
      {activeTab === 'CONTRIBUTE' && (
        <form onSubmit={handleContributeSubmit} style={{ maxWidth: 640 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Log a Transport Price Record
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Your reported costs help empower the community with honest transport pricing. All submissions undergo automated outlier checks.
            </p>
          </div>

          {contribSuccessMsg && (
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
              <span>{contribSuccessMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Origin
              </label>
              <input
                type="text"
                list="contrib-origin-list"
                value={contribOrigin}
                onChange={(e) => setContribOrigin(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
              <datalist id="contrib-origin-list">
                {KENYA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Destination
              </label>
              <input
                type="text"
                list="contrib-dest-list"
                value={contribDest}
                onChange={(e) => setContribDest(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
              <datalist id="contrib-dest-list">
                {KENYA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Vehicle Class
              </label>
              <select
                value={contribVehicle}
                onChange={(e) => setContribVehicle(e.target.value as VehicleCategory)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              >
                <option value="PICKUP">Pickup (1–1.5 T)</option>
                <option value="SMALL_TRUCK">Small Truck / Canter (3–5 T)</option>
                <option value="MEDIUM_LORRY">Medium Lorry / Fuso (7–10 T)</option>
                <option value="LARGE_LORRY">Large Lorry / Semi-trailer (15+ T)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Total Paid / Quoted Price (KSh)
              </label>
              <input
                type="number"
                value={contribPrice}
                onChange={(e) => setContribPrice(e.target.value)}
                placeholder="e.g. 15000"
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Evidence Type
              </label>
              <select
                value={contribEvidence}
                onChange={(e) => setContribEvidence(e.target.value as PriceEvidenceType)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              >
                <option value="REPORTED_COMPLETED_JOURNEY">Completed Journey (Actual Paid)</option>
                <option value="TRANSPORTER_QUOTATION">Transporter Quotation</option>
                <option value="COMPLETED_JOURNEY_WITH_RECEIPT">Completed with Official Receipt</option>
                <option value="USER_ESTIMATE">User Estimate / Negotiation</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Hire Arrangement &amp; Weight (KG)
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={contribArrangement}
                  onChange={(e) => setContribArrangement(e.target.value as TripArrangement)}
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '0.82rem',
                  }}
                >
                  <option value="EXCLUSIVE">Exclusive</option>
                  <option value="SHARED">Shared</option>
                </select>
                <input
                  type="number"
                  value={contribWeight}
                  onChange={(e) => setContribWeight(e.target.value)}
                  placeholder="KG"
                  style={{
                    width: 80,
                    padding: '8px 6px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '0.82rem',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
              Optional Notes / Transporter Details
            </label>
            <textarea
              rows={2}
              value={contribNotes}
              onChange={(e) => setContribNotes(e.target.value)}
              placeholder="e.g. Included loading labour, dry weather route, tarmac all the way."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={contribSubmitting}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', fontSize: '0.88rem' }}
          >
            {contribSubmitting ? <LoadSpinner fullPage={false} size="sm" /> : <Send size={16} />}
            Submit Transport Record
          </button>
        </form>
      )}

      {/* ── TAB 3: MY SUBMISSIONS ── */}
      {activeTab === 'MY_RECORDS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                My Submitted Transport Records
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Review past reports, verification badges, and appeal anomalous flags if necessary.
              </p>
            </div>
            <button
              type="button"
              onClick={loadMyRecords}
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              Refresh
            </button>
          </div>

          {myRecordsLoading ? (
            <div style={{ padding: 30, textAlign: 'center' }}>
              <LoadSpinner fullPage={false} size="md" text="Loading records..." />
            </div>
          ) : myRecords.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
              You have not submitted any transport records yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myRecords.map((rec) => {
                const isQuarantined = rec.verificationStatus === 'QUARANTINED';
                return (
                  <div
                    key={rec._id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: `1px solid ${isQuarantined ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: 10,
                      padding: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                          {rec.origin?.name} → {rec.destination?.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background:
                              rec.verificationStatus === 'VERIFIED'
                                ? 'rgba(34, 197, 94, 0.15)'
                                : rec.verificationStatus === 'QUARANTINED'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(234, 179, 8, 0.15)',
                            color:
                              rec.verificationStatus === 'VERIFIED'
                                ? '#4ade80'
                                : rec.verificationStatus === 'QUARANTINED'
                                ? '#f87171'
                                : '#facc15',
                          }}
                        >
                          {rec.verificationStatus}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Distance: <strong>{rec.routing?.distanceKm} km</strong> | Vehicle: <strong>{rec.vehicleCategory}</strong> | Date: {new Date(rec.journeyDate).toLocaleDateString()}
                      </div>

                      {isQuarantined && rec.anomalyFlags && rec.anomalyFlags.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#fca5a5' }}>
                          <strong>Flag:</strong> {rec.anomalyFlags[0].details || rec.anomalyFlags[0].flag}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80' }}>
                        KSh {rec.reportedPriceKSh?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        ~KSh {Math.round(rec.reportedPriceKSh / (rec.routing?.distanceKm || 1))} / km
                      </div>

                      {isQuarantined && !rec.isAppealRequested && (
                        <button
                          type="button"
                          onClick={() => setAppealTargetId(rec._id)}
                          style={{
                            marginTop: 6,
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            borderRadius: 4,
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5',
                            cursor: 'pointer',
                          }}
                        >
                          Request Review
                        </button>
                      )}

                      {rec.isAppealRequested && (
                        <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'block', marginTop: 4 }}>
                          Appeal Pending Review
                        </span>
                      )}
                    </div>

                    {/* Inline appeal modal / drawer */}
                    {appealTargetId === rec._id && (
                      <div
                        style={{
                          width: '100%',
                          marginTop: 10,
                          padding: 10,
                          borderRadius: 8,
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: 4 }}>
                          Provide context or receipt details to administrative reviewer:
                        </span>
                        <input
                          type="text"
                          value={appealNotes}
                          onChange={(e) => setAppealNotes(e.target.value)}
                          placeholder="e.g. Transporter charged extra due to mud/rain on feeder road."
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(15,23,42,0.8)',
                            color: '#fff',
                            fontSize: '0.82rem',
                            marginBottom: 8,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setAppealTargetId(null)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.76rem',
                              border: 'none',
                              background: 'transparent',
                              color: '#94a3b8',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAppealSubmit(rec._id)}
                            disabled={appealSubmitting}
                            style={{
                              padding: '4px 12px',
                              fontSize: '0.76rem',
                              borderRadius: 4,
                              border: 'none',
                              background: 'var(--color-primary, #16a34a)',
                              color: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            {appealSubmitting ? 'Submitting...' : 'Submit Appeal'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransportIntelligenceSection;
