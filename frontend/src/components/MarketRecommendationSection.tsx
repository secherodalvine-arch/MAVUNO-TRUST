import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Building2,
  AlertCircle,
  Info,
  ShieldCheck,
  Loader2,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getMarketRecommendationApi,
  type MarketRecommendationData,
  type MarketRecommendationQuery
} from '../services/aiService';

const POPULAR_CROPS = [
  'Maize',
  'Dry Maize',
  'White Maize',
  'Beans (Yellow)',
  'Beans (Rosecoco)',
  'Beans (Mwitemania)',
  'Irish Potatoes',
  'Sweet Potatoes',
  'Tomatoes',
  'Cabbage',
  'Kales (Sukuma Wiki)',
  'Spinach',
  'Red Bulb Onions',
  'Spring Onions',
  'Rice (Pishori)',
  'Rice (Sindano)',
  'Watermelon',
  'Carrots',
  'Capsicum (Pilipili Hoho)',
  'Avocado (Hass)',
  'Bananas (Cooking)',
  'Bananas (Ripe)',
  'Green Grams (Ndengu)',
  'Sorghum',
  'Finger Millet'
];

const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
  'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a',
  'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const QUANTITY_UNITS = ['bags', 'KG', 'tonnes', 'crates', 'sacks', 'buckets'];

export const MarketRecommendationSection: React.FC = () => {
  // Form State
  const [crop, setCrop] = useState('Maize');
  const [quantity, setQuantity] = useState<number | string>(100);
  const [unit, setUnit] = useState('bags');
  const [county, setCounty] = useState('Nairobi');

  // UI State
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<MarketRecommendationData | null>(null);
  const [showFullEvidence, setShowFullEvidence] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    // Validation
    const trimmedCrop = crop.trim();
    const numQuantity = Number(quantity);
    const trimmedUnit = unit.trim();
    const trimmedCounty = county.trim();

    if (!trimmedCrop) {
      setValidationError('Please enter or select a crop / produce item.');
      return;
    }
    if (isNaN(numQuantity) || !isFinite(numQuantity) || numQuantity <= 0) {
      setValidationError('Please enter a valid positive quantity greater than 0.');
      return;
    }
    if (!trimmedUnit) {
      setValidationError('Please select a unit of measurement.');
      return;
    }
    if (!trimmedCounty) {
      setValidationError('Please select or enter your county.');
      return;
    }

    const payload: MarketRecommendationQuery = {
      crop: trimmedCrop,
      quantity: numQuantity,
      unit: trimmedUnit,
      county: trimmedCounty
    };

    setLoading(true);

    try {
      const data = await getMarketRecommendationApi(payload);
      setResult(data);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Unable to connect to market intelligence service. Please try again.';
      setApiError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    const conf = (confidence || 'medium').toLowerCase();
    if (conf === 'high') {
      return (
        <span
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          High Confidence
        </span>
      );
    }
    if (conf === 'low') {
      return (
        <span
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          Low Confidence
        </span>
      );
    }
    return (
      <span
        style={{
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}
      >
        Medium Confidence
      </span>
    );
  };

  return (
    <div
      className="card"
      style={{
        background: 'var(--color-surface, #111e16)',
        border: '1px solid rgba(94, 194, 133, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}
      >
        <div
          style={{
            background: 'rgba(94, 194, 133, 0.15)',
            color: '#5ec285',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Sparkles size={24} />
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--color-text-primary, #ffffff)'
            }}
          >
            Autonomous Market Recommendation
          </h2>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.88rem',
              color: 'var(--color-text-secondary, #a3b8ac)'
            }}
          >
            Compare live KAMIS market benchmark prices and verified AFA dealer capacity to determine your best selling option.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}
        >
          {/* Crop Selection */}
          <div>
            <label
              htmlFor="crop-select"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #a3b8ac)',
                marginBottom: '6px'
              }}
            >
              Crop / Produce
            </label>
            <input
              id="crop-select"
              type="text"
              list="crops-list"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="e.g. Maize, Beans, Potatoes"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
            <datalist id="crops-list">
              {POPULAR_CROPS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #a3b8ac)',
                marginBottom: '6px'
              }}
            >
              Quantity
            </label>
            <input
              id="quantity-input"
              type="number"
              min="1"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 100"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Unit */}
          <div>
            <label
              htmlFor="unit-select"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #a3b8ac)',
                marginBottom: '6px'
              }}
            >
              Unit
            </label>
            <select
              id="unit-select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              {QUANTITY_UNITS.map((u) => (
                <option key={u} value={u} style={{ background: '#111e16', color: '#fff' }}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* County */}
          <div>
            <label
              htmlFor="county-select"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #a3b8ac)',
                marginBottom: '6px'
              }}
            >
              County
            </label>
            <select
              id="county-select"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              {KENYA_COUNTIES.map((c) => (
                <option key={c} value={c} style={{ background: '#111e16', color: '#fff' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Validation Warning */}
        {validationError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.88rem',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={18} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            background: loading
              ? 'rgba(94, 194, 133, 0.3)'
              : 'linear-gradient(135deg, #27894f 0%, #5ec285 100%)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(39, 137, 79, 0.3)'
          }}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Analyzing available market and buyer evidence...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Get Market Recommendation</span>
            </>
          )}
        </button>
      </form>

      {/* API Error Notification */}
      {apiError && (
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.9rem'
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', color: '#f87171', marginBottom: '2px' }}>
              Recommendation Request Error
            </strong>
            <span>{apiError}</span>
          </div>
        </div>
      )}

      {/* Results Rendering */}
      {result && (
        <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          
          {/* Recommendation Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(39,137,79,0.18) 0%, rgba(17,30,22,0.8) 100%)',
              border: '1px solid rgba(94, 194, 133, 0.35)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#5ec285' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>
                  Recommended Action Strategy
                </h3>
              </div>
              {getConfidenceBadge(result.recommendation?.confidence)}
            </div>

            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#6ee7b7',
                marginBottom: '10px',
                lineHeight: 1.4
              }}
            >
              {result.recommendation?.option}
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.93rem',
                color: '#d1d5db',
                lineHeight: 1.6
              }}
            >
              {result.recommendation?.reason}
            </p>

            {/* Recommendation Limitations */}
            {result.recommendation?.limitations && result.recommendation.limitations.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Recommendation Caveats & Considerations
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#9ca3af', fontSize: '0.85rem' }}>
                  {result.recommendation.limitations.map((lim, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Market Options Grid */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <TrendingUp size={20} style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                Market Options Compared ({result.marketOptions.length})
              </h3>
            </div>

            {result.marketOptions.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No direct market price options returned for this query.</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '14px'
                }}
              >
                {result.marketOptions.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{m.market}</span>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: '6px' }}>
                        {m.county}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80', marginBottom: '8px' }}>
                      {m.price} KES <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 400 }}>/ {m.unit}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.4 }}>
                      <div><strong>Source:</strong> {m.source}</div>
                      {m.observedDate && (
                        <div><strong>Observed:</strong> {new Date(m.observedDate).toLocaleDateString()}</div>
                      )}
                      {m.evidence && (
                        <div style={{ marginTop: '4px', color: '#6b7280' }}>{m.evidence}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buyer Options Grid */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Building2 size={20} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                Verified Dealer Options ({result.buyerOptions.length})
              </h3>
            </div>

            {/* General Capacity vs Active Demand Caveat Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#93c5fd',
                fontSize: '0.83rem',
                marginBottom: '14px'
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Notice:</strong> Dealer purchasing capacity reflects general handling capability registered in the system. It does not guarantee active purchase demand for your exact quantity at this moment.
              </span>
            </div>

            {result.buyerOptions.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No matching registered buyers found for this commodity/county.</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '14px'
                }}
              >
                {result.buyerOptions.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{b.displayName}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.78rem',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 600
                        }}
                      >
                        <ShieldCheck size={12} />
                        {b.verificationStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', color: '#d1d5db', marginBottom: '8px' }}>
                      <strong>Handling Capacity:</strong>{' '}
                      <span style={{ color: '#6ee7b7', fontWeight: 600 }}>
                        {b.purchasingCapacityKg ? `${b.purchasingCapacityKg.toLocaleString()} KG` : 'Not specified'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.4 }}>
                      <div><strong>Counties Served:</strong> {b.countiesServed?.join(', ') || 'N/A'}</div>
                      <div><strong>Crops Dealt:</strong> {b.cropsDealt?.join(', ') || 'N/A'}</div>
                      <div><strong>AFA Source:</strong> {b.verificationSource || 'AFA_DEMO'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Limitations List */}
          {result.dataLimitations && result.dataLimitations.length > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#fbbf24', fontWeight: 600, fontSize: '0.95rem' }}>
                <AlertCircle size={18} />
                <span>System Data Limitations & Caveats</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#d1d5db', fontSize: '0.86rem', lineHeight: 1.5 }}>
                {result.dataLimitations.map((lim, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{lim}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Toggleable Evidence Detail */}
          {result.evidence && result.evidence.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowFullEvidence(!showFullEvidence)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <FileText size={16} />
                <span>{showFullEvidence ? 'Hide Full Grounding Evidence Details' : `Show Grounding Evidence Records (${result.evidence.length})`}</span>
                {showFullEvidence ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showFullEvidence && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '14px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    fontSize: '0.8rem',
                    color: '#9ca3af'
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {JSON.stringify(result.evidence, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
