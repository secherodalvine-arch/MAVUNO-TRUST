import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LoadSpinner } from './LoadSpinner';
import {
  MapPin,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  Compass,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Sparkles,
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

const BASEMAP_TILES = {
  satellite: {
    label: 'Satellite + Land',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: '0123',
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
  streets: {
    label: 'Roads & Streets',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: '0123',
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
};

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

  // Active drawing points as [lng, lat] (GeoJSON standard)
  const [points, setPoints] = useState<[number, number][]>([]);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'streets'>('satellite');
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [manualGeoJson, setManualGeoJson] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.Marker[]>([]);
  const centerMarkerRef = useRef<L.Marker | null>(null);

  // Fallback center: Nakuru, Kenya
  const centerLat = referenceLat && !isNaN(referenceLat) ? referenceLat : -0.2833;
  const centerLng = referenceLng && !isNaN(referenceLng) ? referenceLng : 36.0663;

  // Create clean vertex handle icon — solid dot, draggable
  const createVertexIcon = useCallback(() => {
    return L.divIcon({
      className: 'farm-boundary-vertex',
      html: `
        <div style="
          width: 12px;
          height: 12px;
          background: #10b981;
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4), 0 2px 6px rgba(0,0,0,0.5);
          cursor: grab;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        "></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }, []);

  const createCenterIcon = useCallback(() => {
    return L.divIcon({
      className: 'farm-center-icon',
      html: `
        <div style="
          position: relative;
          width: 36px;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <!-- Pulse ring -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.15);
            animation: pulse-ring 2s ease-out infinite;
            pointer-events: none;
          "></div>
          <!-- Pin body -->
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C10.268 0 4 6.268 4 14c0 10.5 14 30 14 30s14-19.5 14-30c0-7.732-6.268-14-14-14z"
              fill="#16a34a" stroke="#ffffff" stroke-width="2"/>
            <circle cx="18" cy="14" r="6" fill="white"/>
            <circle cx="18" cy="14" r="3" fill="#16a34a"/>
          </svg>
          <style>
            @keyframes pulse-ring {
              0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
              100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
            }
          </style>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -44],
    });
  }, []);

  // Fetch initial boundary & satellite readiness
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

  // Initialize Leaflet map
  useEffect(() => {
    if (isLoading || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 17,
        zoomControl: true,
      });

      const initialConfig = BASEMAP_TILES[activeLayer];
      const tiles = L.tileLayer(initialConfig.url, {
        subdomains: initialConfig.subdomains,
        maxZoom: initialConfig.maxZoom,
        attribution: initialConfig.attribution,
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;

      // Add center marker
      const centerMarker = L.marker([centerLat, centerLng], {
        icon: createCenterIcon(),
        interactive: true,
      }).addTo(map);
      centerMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; color: #1e293b; padding: 4px;">
          <strong style="color: #16a34a;">📍 Farm Reference Point</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            ${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}
          </div>
        </div>
      `);
      centerMarkerRef.current = centerMarker;

      // Click on real land adds boundary points
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        setPoints((prev) => [...prev, [newLng, newLat]]);
        setMessage(null);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoading]);

  // Redraw polygon and draggable vertex handles whenever points change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing vertex markers
    vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
    vertexMarkersRef.current = [];

    // Clear existing polygon layer
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (points.length === 0) return;

    // Convert [lng, lat] to Leaflet LatLng tuples [lat, lng]
    const latLngs: L.LatLngTuple[] = points.map((p) => [p[1], p[0]]);

    // Render polygon (or polyline if only 2 points)
    if (points.length >= 2) {
      const polygon = L.polygon(latLngs, {
        color: '#10b981',
        weight: 2.5,
        fillColor: '#10b981',
        fillOpacity: 0.35,
        dashArray: points.length < 3 ? '6, 6' : undefined,
      }).addTo(map);

      polygonLayerRef.current = polygon;
    }

    // Render interactive draggable markers for each vertex handle
    points.forEach((pt, index) => {
      const marker = L.marker([pt[1], pt[0]], {
        icon: createVertexIcon(),
        draggable: true,
      }).addTo(map);

      // Live stretch/drag update
      marker.on('drag', () => {
        const currentLatLng = marker.getLatLng();
        const updatedPoints = [...points];
        updatedPoints[index] = [
          parseFloat(currentLatLng.lng.toFixed(6)),
          parseFloat(currentLatLng.lat.toFixed(6)),
        ];

        // Update polygon in real time while dragging
        if (polygonLayerRef.current) {
          polygonLayerRef.current.setLatLngs(updatedPoints.map((p) => [p[1], p[0]]));
        }
      });

      // Update state when dragging completes
      marker.on('dragend', () => {
        const endLatLng = marker.getLatLng();
        setPoints((prev) => {
          const next = [...prev];
          next[index] = [
            parseFloat(endLatLng.lng.toFixed(6)),
            parseFloat(endLatLng.lat.toFixed(6)),
          ];
          return next;
        });
      });

      // Right-click or popup click to delete single vertex
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #1e293b; padding: 4px; text-align: center;">
          <div style="font-weight: 600; margin-bottom: 6px;">Perimeter Corner #${index + 1}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${pt[1].toFixed(5)}, ${pt[0].toFixed(5)}
          </div>
          <button
            id="delete-vertex-${index}"
            style="
              background: #ef4444;
              color: #ffffff;
              border: none;
              border-radius: 4px;
              padding: 4px 8px;
              font-size: 11px;
              cursor: pointer;
            "
          >
            Remove This Corner
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`delete-vertex-${index}`);
        if (btn) {
          btn.onclick = () => {
            setPoints((prev) => prev.filter((_, i) => i !== index));
            map.closePopup();
          };
        }
      });

      vertexMarkersRef.current.push(marker);
    });
  }, [points, createVertexIcon]);

  // Switch basemap layer
  const handleToggleLayer = () => {
    if (!mapInstanceRef.current) return;
    const nextLayer = activeLayer === 'satellite' ? 'streets' : 'satellite';
    setActiveLayer(nextLayer);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const nextConfig = BASEMAP_TILES[nextLayer];
    const newTiles = L.tileLayer(nextConfig.url, {
      subdomains: nextConfig.subdomains,
      maxZoom: nextConfig.maxZoom,
      attribution: nextConfig.attribution,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTiles;
  };

  // Center on farm coordinates
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([centerLat, centerLng], 17);
    }
  };

  // Fit bounds to polygon points
  const handleFitBounds = () => {
    if (mapInstanceRef.current && points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => [p[1], p[0]]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
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
    const halfSideDegLng =
      (sideMeters / 2.0) / (111320.0 * Math.cos((centerLat * Math.PI) / 180.0));

    const p1: [number, number] = [
      parseFloat((centerLng - halfSideDegLng).toFixed(6)),
      parseFloat((centerLat - halfSideDegLat).toFixed(6)),
    ];
    const p2: [number, number] = [
      parseFloat((centerLng + halfSideDegLng).toFixed(6)),
      parseFloat((centerLat - halfSideDegLat).toFixed(6)),
    ];
    const p3: [number, number] = [
      parseFloat((centerLng + halfSideDegLng).toFixed(6)),
      parseFloat((centerLat + halfSideDegLat).toFixed(6)),
    ];
    const p4: [number, number] = [
      parseFloat((centerLng - halfSideDegLng).toFixed(6)),
      parseFloat((centerLat + halfSideDegLat).toFixed(6)),
    ];

    setPoints([p1, p2, p3, p4]);
    setMessage({
      type: 'success',
      text: `Generated initial perimeter template matching ${acres} acres. Click and hold any green handle to stretch and move it to match your real fences.`,
    });

    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [p1[1], p1[0]],
        [p2[1], p2[0]],
        [p3[1], p3[0]],
        [p4[1], p4[0]],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
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
        handleFitBounds();
      } else {
        setMessage({ type: 'error', text: 'Invalid GeoJSON: Expected Polygon with at least 3 coordinates.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `GeoJSON parse error: ${err.message}` });
    }
  };

  // Helper to radially sort corner points around their centroid to prevent self-intersections or bow-ties
  const handleAutoArrangePoints = () => {
    if (points.length < 3) return;
    const cLng = points.reduce((s, p) => s + p[0], 0) / points.length;
    const cLat = points.reduce((s, p) => s + p[1], 0) / points.length;
    const sorted = [...points].sort((a, b) => {
      return Math.atan2(a[1] - cLat, a[0] - cLng) - Math.atan2(b[1] - cLat, b[0] - cLng);
    });
    setPoints(sorted);
    setMessage({
      type: 'success',
      text: 'Corner points auto-arranged around your farm center to form an open, non-overlapping boundary.',
    });
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

    let workingPoints = [...points];
    let localArea = calculateLocalAreaAcres(workingPoints);

    // If points form a bow-tie or zero area, attempt radial auto-repair
    if (localArea <= 0 && workingPoints.length >= 3) {
      const cLng = workingPoints.reduce((s, p) => s + p[0], 0) / workingPoints.length;
      const cLat = workingPoints.reduce((s, p) => s + p[1], 0) / workingPoints.length;
      const sorted = [...workingPoints].sort((a, b) => {
        return Math.atan2(a[1] - cLat, a[0] - cLng) - Math.atan2(b[1] - cLat, b[0] - cLng);
      });
      if (calculateLocalAreaAcres(sorted) > 0) {
        workingPoints = sorted;
        setPoints(sorted);
        localArea = calculateLocalAreaAcres(sorted);
      }
    }

    if (localArea <= 0) {
      setMessage({
        type: 'error',
        text: 'The drawn perimeter has zero enclosed area. Please drag the green corner pins outward on the map so they enclose your farm parcel.',
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    // Auto-close ring for submission
    const closedRing = [...workingPoints];
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
        text: `Farm boundary saved successfully! Perimeter area: ${result.boundary.boundaryAreaAcres} acres. Satellite monitoring is now active.`,
      });
      if (onBoundarySaved) {
        onBoundarySaved(result.boundary);
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text:
          err.response?.data?.message ||
          err.response?.data?.error?.message ||
          'Failed to save farm boundary.',
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
      setMessage({ type: 'success', text: 'Farm boundary perimeter removed.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to clear farm boundary.' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculatedAcres = calculateLocalAreaAcres(points);

  if (isLoading) {
    return (
      <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
        <LoadSpinner size="md" text="quering..." />
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Layers size={22} style={{ color: '#10b981' }} />
          <h2 style={styles.cardTitle}>Farm Boundary &amp; Land Perimeter</h2>
        </div>
        <p style={styles.cardDesc}>
          Draw or adjust your exact farm perimeter on the satellite map to monitor crop health, canopy development, and vegetation progress over time.
        </p>
      </div>

      {message && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            borderColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
            color: message.type === 'success' ? '#16a34a' : '#ef4444',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Drawing Toolbar ── */}
      <div style={styles.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Corners: <strong style={{ color: '#10b981' }}>{points.length}</strong>
          </span>

          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginLeft: '6px' }}>
            Calculated Area: <strong style={{ color: calculatedAcres > 0 ? '#10b981' : 'var(--color-text-muted)' }}>{calculatedAcres} Acres</strong>
          </span>

          {farmSizeAcres && farmSizeAcres > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              (Profile size: {farmSizeAcres} acres)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleGenerateTemplateBox}
            style={styles.toolBtn}
            title="Generate initial perimeter template matching your registered acres"
          >
            <Compass size={14} />
            <span>Generate Initial Template</span>
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
                style={{ ...styles.toolBtn, color: '#ef4444' }}
                title="Clear current perimeter points"
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>
            </>
          )}

          {points.length >= 3 && (
            <button
              type="button"
              onClick={handleAutoArrangePoints}
              style={{ ...styles.toolBtn, color: '#0284c7' }}
              title="Automatically arrange corners clockwise so boundary does not cross itself"
            >
              <Sparkles size={14} />
              <span>Auto-Arrange Corners</span>
            </button>
          )}

          {points.length >= 2 && (
            <button
              type="button"
              onClick={handleFitBounds}
              style={styles.toolBtn}
              title="Fit map view to boundary"
            >
              <Maximize2 size={14} />
              <span>Fit View</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            style={styles.toolBtn}
            title="Center map on farm coordinates"
          >
            <MapPin size={14} />
            <span>Center</span>
          </button>
        </div>
      </div>

      {/* ── Real Interactive Leaflet Satellite Farmland Viewport ── */}
      <div style={{ position: 'relative', width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-surface-border)' }}>
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating Basemap Switcher */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000 }}>
          <button
            type="button"
            onClick={handleToggleLayer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Layers size={14} color="#38bdf8" />
            <span>{activeLayer === 'satellite' ? 'Satellite View' : 'Streets View'}</span>
          </button>
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
            color: '#0284c7',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '8px',
            fontWeight: 500,
          }}
        >
          {showAdvancedCoords ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{showAdvancedCoords ? 'Hide Survey Coordinates & GeoJSON Import' : 'View Survey Coordinates & GeoJSON Import'}</span>
        </button>

        {showAdvancedCoords && (
          <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)', borderRadius: '8px', padding: '14px', marginTop: '6px' }}>
            {points.length > 0 ? (
              <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '12px' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', color: 'var(--color-text-primary)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-surface-border)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '6px 8px' }}>Corner</th>
                      <th style={{ padding: '6px 8px' }}>Longitude</th>
                      <th style={{ padding: '6px 8px' }}>Latitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>Point {idx + 1}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p[0].toFixed(6)}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p[1].toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
                No boundary coordinates placed yet. Click on the satellite map above to add perimeter corners.
              </p>
            )}

            {/* GeoJSON Import Box */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Paste GeoJSON Polygon (Surveyor/Location Export):
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
                style={{ ...styles.toolBtn, marginTop: '8px' }}
              >
                Apply GeoJSON Coordinates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleSaveBoundary}
          disabled={isSaving || points.length < 3 || calculatedAcres <= 0}
          style={{
            ...styles.primaryActionBtn,
            backgroundColor: points.length >= 3 && calculatedAcres > 0 ? '#16a34a' : 'var(--color-surface-border)',
            cursor: points.length >= 3 && calculatedAcres > 0 ? 'pointer' : 'not-allowed',
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
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <Info size={14} />
            Boundary updated: {new Date(boundaryData.boundaryUpdatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* ── Satellite Monitoring Status Card ── */}
      <div style={styles.geeStatusCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <CheckCircle2 size={16} style={{ color: satelliteStatus?.ready ? '#16a34a' : '#0284c7' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Satellite Crop Health Monitoring {satelliteStatus?.ready ? '· Feed Active' : ''}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          Automated satellite analysis observes your registered farm perimeter to calculate vegetation health and canopy trends over time.
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--color-surface-card)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: 'var(--shadow-sm)',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    margin: '4px 0 0 0',
    lineHeight: 1.5,
  },
  privacyNoticeBox: {
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '16px',
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
    padding: '10px 14px',
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  toolBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-surface-border)',
    backgroundColor: 'var(--color-surface-card)',
    color: 'var(--color-text-primary)',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  primaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  clearBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    backgroundColor: 'transparent',
    color: '#ef4444',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-surface-border)',
    backgroundColor: 'var(--color-surface-card)',
    color: 'var(--color-text-primary)',
    fontSize: '0.82rem',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  geeStatusCard: {
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginTop: '20px',
  },
};
