import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  BarChart3,
  MapPin,
  Sprout,
  ArrowRight,
} from 'lucide-react';
import { LoadSpinner } from './LoadSpinner';
import {
  getNDVIHistoryApi,
  getFarmLocationApi,
  type NDVIObservationDTO,
  type FarmInfoDTO,
} from '../services/farmerService';

function getSeverityColor(severity: string | undefined): string {
  switch (severity) {
    case 'good': return '#10b981';
    case 'moderate': return '#f59e0b';
    case 'concern': return '#ef4444';
    default: return '#94a3b8';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
  });
}

function TrendIndicator({ observations }: { observations: NDVIObservationDTO[] }) {
  if (observations.length < 2) return null;
  const latest = observations[0].meanNDVI ?? 0;
  const previous = observations[1].meanNDVI ?? 0;
  const delta = latest - previous;
  if (Math.abs(delta) < 0.01) return <Minus size={14} color="#94a3b8" />;
  if (delta > 0) return <TrendingUp size={14} color="#10b981" />;
  return <TrendingDown size={14} color="#ef4444" />;
}

export const NDVIHistoryChart: React.FC = () => {
  const [history, setHistory] = useState<NDVIObservationDTO[]>([]);
  const [farmInfo, setFarmInfo] = useState<FarmInfoDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getNDVIHistoryApi(20);
      setHistory(data.observations || []);

      if (data.farm) {
        setFarmInfo(data.farm);
      } else {
        // Fallback: fetch farm location directly
        const loc = await getFarmLocationApi().catch(() => null);
        if (loc) {
          setFarmInfo({
            farmName: 'Registered Farmland',
            county: loc.county,
            subCounty: loc.subCounty,
            generalArea: loc.generalArea,
            farmSizeAcres: loc.farmSizeAcres,
            latitude: loc.latitude,
            longitude: loc.longitude,
            hasRegisteredCoordinates: loc.hasRegisteredCoordinates,
            locationText:
              [loc.generalArea, loc.subCounty, loc.county].filter(Boolean).join(', ') ||
              (loc.latitude && loc.longitude
                ? `${Number(loc.latitude).toFixed(4)}°, ${Number(loc.longitude).toFixed(4)}°`
                : 'Location not registered'),
          });
        }
      }
    } catch {
      // Non-critical: defaults to empty history state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: '12px',
          padding: '24px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <LoadSpinner size="sm" text="quering..." />
      </div>
    );
  }

  // Render Observed Farm & Location Summary Banner
  const renderFarmLocationBanner = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '10px',
        padding: '10px 14px',
        background: 'var(--color-surface-raised, rgba(255,255,255,0.03))',
        borderRadius: '8px',
        border: '1px solid var(--color-surface-border)',
        fontSize: '0.82rem',
      }}
    >
      {/* Farm Name & Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
        <Sprout size={16} color="#10b981" style={{ flexShrink: 0 }} />
        <span>Observed Farm:</span>
        <span style={{ color: '#10b981' }}>{farmInfo?.farmName || 'Registered Farmland'}</span>
        {farmInfo?.farmSizeAcres ? (
          <span
            style={{
              fontSize: '0.72rem',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: 500,
            }}
          >
            {farmInfo.farmSizeAcres} Acres
          </span>
        ) : null}
      </div>

      <span style={{ color: 'var(--color-text-muted)' }}>•</span>

      {/* Farm Location Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
        <MapPin size={15} color="#0d9488" style={{ flexShrink: 0 }} />
        <span>
          <strong>Location: </strong>
          {farmInfo?.locationText || 'Location not specified'}
        </span>
        {farmInfo?.latitude && farmInfo?.longitude ? (
          <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>
            ({Number(farmInfo.latitude).toFixed(4)}°, {Number(farmInfo.longitude).toFixed(4)}°)
          </span>
        ) : null}
      </div>

      {(!farmInfo || !farmInfo.hasRegisteredCoordinates) && (
        <Link
          to="/farmer/profile"
          style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            color: '#38bdf8',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Set Farm Location <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );

  if (history.length === 0) {
    return (
      <div
        style={{
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                Vegetation Health History
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Historical NDVI Time-Series &amp; Satellite Monitoring
              </p>
            </div>
          </div>

          <button
            onClick={loadHistory}
            style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>

        {/* Observed Farm and Location Details */}
        {renderFarmLocationBanner()}

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '14px', marginBottom: 0 }}>
          No historical NDVI observations recorded yet for <strong>{farmInfo?.farmName || 'this farm'}</strong>. Run your first satellite analysis to track vegetation trends over time.
        </p>
      </div>
    );
  }

  // Prepare chart data (chronological order for display)
  const chartData = [...history].reverse(); // oldest first for chart
  const ndviValues = chartData.map((o) => o.meanNDVI ?? 0);
  const minVal = Math.min(...ndviValues, -0.1);
  const maxVal = Math.max(...ndviValues, 0.8);
  const range = maxVal - minVal || 1;

  const chartWidth = 600;
  const chartHeight = 120;
  const padLeft = 36;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 24;

  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const xStep = chartData.length > 1 ? plotWidth / (chartData.length - 1) : plotWidth;

  const toX = (i: number) => padLeft + i * (chartData.length > 1 ? xStep : 0);
  const toY = (val: number) => padTop + plotHeight - ((val - minVal) / range) * plotHeight;

  // Build SVG path
  const linePath = chartData
    .map((o, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(o.meanNDVI ?? 0).toFixed(1)}`)
    .join(' ');

  // Fill area under line
  const fillPath =
    linePath +
    ` L${toX(chartData.length - 1).toFixed(1)},${(padTop + plotHeight).toFixed(1)} L${padLeft},${(padTop + plotHeight).toFixed(1)} Z`;

  // Y-axis reference lines
  const refLines = [0.6, 0.4, 0.2, 0.0].filter((v) => v >= minVal && v <= maxVal);

  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-surface-border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={18} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                margin: 0,
                color: 'var(--color-text-primary)',
              }}
            >
              Vegetation Health History
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Vegetation health trend · Last {history.length} observations
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendIndicator observations={history} />
          <button
            onClick={loadHistory}
            style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Observed Farm and Location Details */}
      {renderFarmLocationBanner()}

      {/* SVG Line Chart */}
      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', minWidth: '300px', height: 'auto', display: 'block' }}
          aria-label="NDVI vegetation health trend chart"
        >
          {/* Reference band: healthy range (0.4–0.8) */}
          <rect
            x={padLeft}
            y={toY(0.8)}
            width={plotWidth}
            height={toY(0.4) - toY(0.8)}
            fill="rgba(16, 185, 129, 0.08)"
          />

          {/* Y-axis reference lines */}
          {refLines.map((v) => (
            <g key={v}>
              <line
                x1={padLeft}
                y1={toY(v)}
                x2={padLeft + plotWidth}
                y2={toY(v)}
                stroke="var(--color-surface-border, #334155)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x={padLeft - 4} y={toY(v) + 4} textAnchor="end" fontSize="8" fill="var(--color-text-muted, #64748b)">
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Fill area */}
          <path d={fillPath} fill="rgba(16,185,129,0.08)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />

          {/* Data points */}
          {chartData.map((o, i) => {
            const cx = toX(i);
            const cy = toY(o.meanNDVI ?? 0);
            const color = getSeverityColor(o.vegetationSeverity);
            return (
              <g key={o._id}>
                <circle cx={cx} cy={cy} r="4" fill={color} stroke="var(--color-surface-card, #1e293b)" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* X-axis date labels (show up to 7) */}
          {chartData
            .filter((_, i) => {
              const step = Math.max(1, Math.floor(chartData.length / 7));
              return i % step === 0 || i === chartData.length - 1;
            })
            .map((o) => {
              const origIdx = chartData.findIndex((d) => d._id === o._id);
              return (
                <text
                  key={o._id}
                  x={toX(origIdx)}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--color-text-muted, #64748b)"
                >
                  {formatDate(o.observationDate)}
                </text>
              );
            })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
        {[
          { color: '#10b981', label: 'Good (>0.4)' },
          { color: '#f59e0b', label: 'Moderate (0.2–0.4)' },
          { color: '#ef4444', label: 'Low (<0.2)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Recent observations table */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '6px' }}>
          RECENT OBSERVATIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {history.slice(0, 5).map((o) => (
            <div
              key={o._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                background: 'var(--color-surface-raised, rgba(255,255,255,0.025))',
                border: '1px solid var(--color-surface-border)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {formatDate(o.observationDate)}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: getSeverityColor(o.vegetationSeverity),
                    fontWeight: 500,
                  }}
                >
                  {o.vegetationLabel || 'Unknown'}
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: getSeverityColor(o.vegetationSeverity),
                    minWidth: '48px',
                    textAlign: 'right',
                  }}
                >
                  {o.meanNDVI !== null ? o.meanNDVI.toFixed(3) : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
