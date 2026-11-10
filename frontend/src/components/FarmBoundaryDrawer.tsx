import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  Satellite,
  Compass,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getFarmBoundaryApi,
  updateFarmBoundaryApi,
  clearFarmBoundaryApi,
  getSatelliteStatusApi,
  type FarmBoundaryDTO,
  type GeoJSONPolygon,
  type SatelliteStatusDTO,
} from '../services/farmerService';

interface FarmBoundaryDrawerProps {
  referenceLat?: number | null;
  referenceLng?: number | null;
  farmSizeAcres?: number | null;
  onBoundarySaved?: (boundary: FarmBoundaryDTO) => void;
}

// Geodesic area calculation in acres on client-side for instant feedback
function calculateLocalAreaAcres(points: [number, number][]): number {
  if (points.length < 3) return 0;

  const R = 6378137.0; // Earth radius in meters
  let total = 0;
  const closed = [...points];
  if (
    closed[0][0] !== closed[closed.length - 1][0] ||
    closed[0][1] !== closed[closed.length - 1][1]
  ) {
    closed.push([...closed[0]]);
  }

  for (let i = 0; i < closed.length - 1; i++) {
    const lon1 = (closed[i][0] * Math.PI) / 180.0;
    const lat1 = (closed[i][1] * Math.PI) / 180.0;
    const lon2 = (closed[i + 1][0] * Math.PI) / 180.0;
    const lat2 = (closed[i + 1][1] * Math.PI) / 180.0;
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const sqMeters = Math.abs((total * R * R) / 4.0);
  return parseFloat((sqMeters / 4046.8564224).toFixed(2));
}

export const FarmBoundaryDrawer: React.FC<FarmBoundaryDrawerProps> = ({
  referenceLat,
  referenceLng,
  farmSizeAcres,
  onBoundarySaved,
}) => {
  const [boundaryData, setBoundaryData] = useState<FarmBoundaryDTO | null>(null);
  const [satelliteStatus, setSatelliteStatus] = useState<SatelliteStatusDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active drawing points as [lng, lat]
  const [points, setPoints] = useState<[number, number][]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(16);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [manualGeoJson, setManualGeoJson] = useState<string>('');

  // Default center coordinate
  const centerLat = referenceLat && !isNaN(referenceLat) ? referenceLat : -0.2833;
  const centerLng = referenceLng && !isNaN(referenceLng) ? referenceLng : 36.0663;

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: centerLat,
    lng: centerLng,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bData, satData] = await Promise.all([
        getFarmBoundaryApi().catch(() => null),
        getSatelliteStatusApi().catch(() => null),
      ]);

      if (bData) {
        setBoundaryData(bData);
        if (bData.hasBoundary && bData.farmBoundary?.coordinates?.[0]) {
          const ring = bData.farmBoundary.coordinates[0];
          // Strip duplicate closing point for editable points array
          const editPoints: [number, number][] =
            ring.length > 3 &&
            ring[0][0] === ring[ring.length - 1][0] &&
            ring[0][1] === ring[ring.length - 1][1]
              ? ring.slice(0, ring.length - 1).map((p) => [p[0], p[1]])
              : ring.map((p) => [p[0], p[1]]);
          setPoints(editPoints);
        }
      }

      if (satData) {
        setSatelliteStatus(satData);
      }
    } catch {
      // Non-critical init failure
    } finally {
      setIsLoading(false);
    }
  };

  // Convert GPS [lng, lat] to SVG coordinate relative to current mapCenter
  const toSvgCoords = (lng: number, lat: number) => {
    const scale = Math.pow(2, zoomLevel) * 0.08;
    const x = 300 + (lng - mapCenter.lng) * scale * 111320;
    const y = 200 - (lat - mapCenter.lat) * scale * 111320;
    return { x, y };
  };

  // Convert SVG pixel coordinate back to GPS [lng, lat]
  const toGpsCoords = (x: number, y: number): [number, number] => {
    const scale = Math.pow(2, zoomLevel) * 0.08;
    const lng = mapCenter.lng + (x - 300) / (scale * 111320);
    const lat = mapCenter.lat - (y - 200) / (scale * 111320);
    return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))];
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const [newLng, newLat] = toGpsCoords(clickX, clickY);
    setPoints((prev) => [...prev, [newLng, newLat]]);
    setMessage(null);
  };

  const handleUndoPoint = () => {
    setPoints((prev) => prev.slice(0, prev.length - 1));
    setMessage(null);
  };

  const handleClearPoints = () => {
    setPoints([]);
    setMessage(null);
  };

  // Helper template: Creates an initial 4-corner box matching farm size around reference GPS
  const handleGenerateTemplateBox = () => {
    const acres = farmSizeAcres && farmSizeAcres > 0 ? farmSizeAcres : 2.0;
    // 1 acre ≈ 4047 m²; square side = sqrt(acres * 4047)
    const sideMeters = Math.sqrt(acres * 4046.86);
    const halfSideDegLat = (sideMeters / 2.0) / 111320.0;
    const halfSideDegLng = (sideMeters / 2.0) / (111320.0 * Math.cos((centerLat * Math.PI) / 180.0));

    const p1: [number, number] = [parseFloat((centerLng - halfSideDegLng).toFixed(6)), parseFloat((centerLat - halfSideDegLat).toFixed(6))];
    const p2: [number, number] = [parseFloat((centerLng + halfSideDegLng).toFixed(6)), parseFloat((centerLat - halfSideDegLat).toFixed(6))];
    const p3: [number, number] = [parseFloat((centerLng + halfSideDegLng).toFixed(6)), parseFloat((centerLat + halfSideDegLat).toFixed(6))];
    const p4: [number, number] = [parseFloat((centerLng - halfSideDegLng).toFixed(6)), parseFloat((centerLat + halfSideDegLat).toFixed(6))];

    setPoints([p1, p2, p3, p4]);
    setMapCenter({ lat: centerLat, lng: centerLng });
    setMessage({
      type: 'success',
      text: `Generated initial perimeter template matching ${acres} acres. You can click points to add corners, or click Save Farm Boundary to confirm.`,
    });
  };

  // Apply manual GeoJSON string
  const handleApplyManualGeoJson = () => {
    try {
      const parsed = JSON.parse(manualGeoJson);
      let ring: number[][] | null = null;
      if (parsed.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
        ring = parsed.coordinates[0];
      } else if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        ring = parsed[0];
      }

      if (ring && ring.length >= 3) {
        const clean: [number, number][] = ring.map((pt: any) => [Number(pt[0]), Number(pt[1])]);
        setPoints(clean);
        setMessage({ type: 'success', text: `Loaded ${clean.length} boundary coordinates from GeoJSON!` });
      } else {
        setMessage({ type: 'error', text: 'Invalid GeoJSON: Expected Polygon with at least 3 coordinates.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `GeoJSON parse error: ${err.message}` });
    }
  };

  // Save Boundary API Call
  const handleSaveBoundary = async () => {
    if (points.length < 3) {
      setMessage({
        type: 'error',
        text: 'A farm boundary requires at least 3 perimeter corner points.',
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    // Auto-close ring for submission
    const closedRing = [...points];
    if (
      closedRing[0][0] !== closedRing[closedRing.length - 1][0] ||
      closedRing[0][1] !== closedRing[closedRing.length - 1][1]
    ) {
      closedRing.push([...closedRing[0]]);
    }

    const payload: GeoJSONPolygon = {
      type: 'Polygon',
      coordinates: [closedRing],
    };

    try {
      const result = await updateFarmBoundaryApi(payload);
      setBoundaryData(result.boundary);
      setMessage({
        type: 'success',
        text: `Farm boundary saved successfully! Perimeter area: ${result.boundary.boundaryAreaAcres} acres. Satellite monitoring is now linked.`,
      });
      if (onBoundarySaved) {
        onBoundarySaved(result.boundary);
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error?.message || 'Failed to save farm boundary.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Boundary API Call
  const handleClearBoundaryFromDb = async () => {
    if (!window.confirm('Are you sure you want to remove your registered farm boundary?')) {
      return;
    }
    setIsSaving(true);
    try {
      await clearFarmBoundaryApi();
      setBoundaryData(null);
      setPoints([]);
      setMessage({ type: 'success', text: 'Farm boundary polygon removed.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to clear farm boundary.' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculatedAcres = calculateLocalAreaAcres(points);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        <Layers size={20} style={{ color: '#2dd4bf', animation: 'spin 2s linear infinite' }} />
        <span style={{ marginLeft: '8px' }}>Loading Farm Boundary &amp; Satellite Status...</span>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Layers size={22} style={{ color: '#2dd4bf' }} />
            <h2 style={styles.cardTitle}>Farm Boundary Polygon &amp; Sentinel-2 Area Scope</h2>
          </div>
          <p style={styles.cardDesc}>
            Draw or define your exact farm perimeter. Sentinel-2 satellite observations will calculate vegetation index (NDVI) strictly within this registered polygon.
          </p>
        </div>

        {/* Boundary Registration Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
            backgroundColor: boundaryData?.hasBoundary ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: boundaryData?.hasBoundary ? '#4ade80' : '#fbbf24',
            border: `1px solid ${boundaryData?.hasBoundary ? 'rgba(34, 197, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
          }}
        >
          {boundaryData?.hasBoundary ? <Check size={14} /> : <MapPin size={14} />}
          <span>
            {boundaryData?.hasBoundary
              ? `Boundary Linked (${boundaryData.boundaryAreaAcres} Acres)`
              : 'Boundary Not Yet Drawn'}
          </span>
        </div>
      </div>

      {/* ── Privacy & GEE Readiness Banner ── */}
      <div style={styles.privacyNoticeBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 700, marginBottom: '6px' }}>
          <Shield size={18} />
          <span>Strict Boundary Confidentiality &amp; GEE Satellite Scope</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Your farm polygon coordinates are strictly confidential and <strong>never published on dealer searches or public profiles</strong>. The boundary is used exclusively to filter Copernicus Sentinel-2 Level-2A surface reflectance pixels (10m resolution) for cloud-masked NDVI calculations.
        </p>
      </div>

      {message && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            borderColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
            color: message.type === 'success' ? '#86efac' : '#fca5a5',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Drawing Toolbar ── */}
      <div style={styles.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
            Corners: <strong style={{ color: '#2dd4bf' }}>{points.length}</strong>
          </span>

          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginLeft: '12px' }}>
            Calculated Area: <strong style={{ color: calculatedAcres > 0 ? '#4ade80' : '#94a3b8' }}>{calculatedAcres} Acres</strong>
          </span>

          {farmSizeAcres && farmSizeAcres > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              (Profile size: {farmSizeAcres} acres)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleGenerateTemplateBox}
            style={styles.toolBtn}
            title="Generate initial perimeter template matching your registered acres"
          >
            <Compass size={14} />
            <span>Generate Initial Perimeter Template</span>
          </button>

          {points.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleUndoPoint}
                style={styles.toolBtn}
                title="Remove the most recent corner point"
              >
                <RotateCcw size={14} />
                <span>Undo Point</span>
              </button>

              <button
                type="button"
                onClick={handleClearPoints}
                style={{ ...styles.toolBtn, color: '#f87171' }}
                title="Clear current drawing points"
              >
                <Trash2 size={14} />
                <span>Clear Canvas</span>
              </button>
            </>
          )}

          {/* Zoom controls */}
          <div style={{ display: 'flex', border: '1px solid #475569', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 1, 19))}
              style={styles.zoomBtn}
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 1, 13))}
              style={styles.zoomBtn}
              title="Zoom Out"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* ── Interactive Map Drawing Viewport ── */}
      <div style={styles.canvasContainer}>
        <div style={styles.canvasInstructions}>
          <span>Click anywhere inside the map canvas to place boundary corner pins.</span>
        </div>

        <svg
          ref={svgRef}
          onClick={handleSvgClick}
          viewBox="0 0 600 400"
          style={styles.svgViewport}
        >
          {/* Background grid */}
          <defs>
            <pattern id="farmGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="600" height="400" fill="#0b1329" />
          <rect width="600" height="400" fill="url(#farmGrid)" />

          {/* Center reference point pin */}
          {(() => {
            const { x, y } = toSvgCoords(centerLng, centerLat);
            return (
              <g transform={`translate(${x}, ${y})`}>
                <circle r="6" fill="#f59e0b" fillOpacity="0.3" />
                <circle r="3" fill="#f59e0b" />
                <text x="8" y="4" fill="#f59e0b" fontSize="10" fontFamily="sans-serif">
                  Farm Center
                </text>
              </g>
            );
          })()}

          {/* Polygon fill & stroke */}
          {points.length >= 2 && (
            <polyline
              points={points
                .map((p) => {
                  const { x, y } = toSvgCoords(p[0], p[1]);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill={points.length >= 3 ? 'rgba(45, 212, 191, 0.22)' : 'none'}
              stroke="#2dd4bf"
              strokeWidth="2.5"
              strokeDasharray={points.length >= 3 ? 'none' : '4,4'}
            />
          )}

          {/* Polygon closing line if 3 or more points */}
          {points.length >= 3 && (() => {
            const first = toSvgCoords(points[0][0], points[0][1]);
            const last = toSvgCoords(points[points.length - 1][0], points[points.length - 1][1]);
            return (
              <line
                x1={last.x}
                y1={last.y}
                x2={first.x}
                y2={first.y}
                stroke="#2dd4bf"
                strokeWidth="2.5"
                strokeDasharray="3,3"
              />
            );
          })()}

          {/* Point vertices markers */}
          {points.map((p, idx) => {
            const { x, y } = toSvgCoords(p[0], p[1]);
            return (
              <g key={idx} transform={`translate(${x}, ${y})`}>
                <circle r="7" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend / Status overlay inside canvas */}
        <div style={styles.canvasOverlayLegend}>
          <span>Scale: ~10m/pixel (Sentinel-2 SR resolution)</span>
          <span>Center: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}</span>
        </div>
      </div>

      {/* ── Coordinates Table & Advanced Toggle ── */}
      <div style={{ marginTop: '16px' }}>
        <button
          type="button"
          onClick={() => setShowAdvancedCoords(!showAdvancedCoords)}
          style={{
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '8px',
          }}
        >
          {showAdvancedCoords ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{showAdvancedCoords ? 'Hide Coordinate Points & GeoJSON Import' : 'View Coordinate Points & GeoJSON Import'}</span>
        </button>

        {showAdvancedCoords && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px', marginTop: '6px' }}>
            {points.length > 0 ? (
              <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '12px' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', color: '#cbd5e1', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                      <th style={{ padding: '4px 8px' }}>Corner #</th>
                      <th style={{ padding: '4px 8px' }}>Longitude</th>
                      <th style={{ padding: '4px 8px' }}>Latitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '4px 8px', fontWeight: 600 }}>Vertex {idx + 1}</td>
                        <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{p[0].toFixed(6)}</td>
                        <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{p[1].toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 10px 0' }}>
                No coordinates placed yet. Click on the map above to add corner vertices.
              </p>
            )}

            {/* GeoJSON Import Box */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Paste GeoJSON Polygon (Surveyor/GPS Export):
              </label>
              <textarea
                rows={2}
                value={manualGeoJson}
                onChange={(e) => setManualGeoJson(e.target.value)}
                style={styles.textarea}
                placeholder='{"type": "Polygon", "coordinates": [[[36.066, -0.283], ...]]}'
              />
              <button
                type="button"
                onClick={handleApplyManualGeoJson}
                style={{ ...styles.toolBtn, marginTop: '6px' }}
              >
                Apply GeoJSON Coordinates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleSaveBoundary}
          disabled={isSaving || points.length < 3}
          style={{
            ...styles.primaryActionBtn,
            backgroundColor: points.length >= 3 ? '#0d9488' : '#334155',
            cursor: points.length >= 3 ? 'pointer' : 'not-allowed',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{boundaryData?.hasBoundary ? 'UPDATE FARM BOUNDARY' : 'SAVE FARM BOUNDARY'}</span>
        </button>

        {boundaryData?.hasBoundary && (
          <button
            type="button"
            onClick={handleClearBoundaryFromDb}
            disabled={isSaving}
            style={styles.clearBtn}
          >
            Clear Registered Boundary
          </button>
        )}

        {boundaryData?.boundaryUpdatedAt && (
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <Info size={14} />
            Boundary updated: {new Date(boundaryData.boundaryUpdatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* ── Satellite Service GEE Readiness Status Card ── */}
      <div style={styles.geeStatusCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Satellite size={16} style={{ color: satelliteStatus?.ready ? '#4ade80' : '#fbbf24' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
            Sentinel-2 &amp; Earth Engine Readiness
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
          {satelliteStatus?.ready
            ? 'Earth Engine credentials verified. Sentinel-2 Surface Reflectance (COPERNICUS/S2_SR_HARMONIZED) is ready to compute 10m NDVI.'
            : 'Satellite pipeline architecture is active. Waiting for Google Earth Engine project registration (GEE_PROJECT_ID in backend/.env) to stream real Copernicus observations.'}
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: '4px 0 0 0',
    lineHeight: 1.4,
  },
  privacyNoticeBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    borderRadius: '10px',
    padding: '12px 16px',
    margin: '16px 0',
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: '0.88rem',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '10px',
  },
  toolBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  zoomBtn: {
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    border: 'none',
    padding: '4px 10px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  canvasContainer: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #475569',
    backgroundColor: '#0b1329',
  },
  canvasInstructions: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    color: '#cbd5e1',
    pointerEvents: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  canvasOverlayLegend: {
    position: 'absolute',
    bottom: '8px',
    right: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontSize: '0.72rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  svgViewport: {
    width: '100%',
    height: '340px',
    display: 'block',
    cursor: 'crosshair',
  },
  textarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '0.82rem',
    color: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    outline: 'none',
  },
  primaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '11px 22px',
    fontSize: '0.92rem',
    fontWeight: 600,
  },
  clearBtn: {
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '11px 16px',
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  geeStatusCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '18px',
  },
};

export default FarmBoundaryDrawer;
