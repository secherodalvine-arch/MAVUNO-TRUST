import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin } from 'lucide-react';

interface FarmLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  county?: string;
  subCounty?: string;
  readonly?: boolean;
}

const TILE_LAYERS = {
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

export const FarmLocationMap: React.FC<FarmLocationMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  county,
  subCounty,
  readonly = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'streets'>('satellite');

  const defaultLat = latitude && !isNaN(latitude) ? latitude : -0.2833;
  const defaultLng = longitude && !isNaN(longitude) ? longitude : 36.0663;

  // Create custom GPS location pin icon with pulse animation
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-farm-pin',
      html: `
        <div style="
          position: relative;
          width: 36px;
          height: 46px;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <!-- Pulse animation ring -->
          <div style="
            position: absolute;
            top: 0; left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(22, 163, 74, 0.2);
            animation: gps-pulse 2s ease-out infinite;
            pointer-events: none;
          "></div>
          <!-- Pin SVG -->
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Drop shadow -->
            <ellipse cx="18" cy="43" rx="6" ry="2" fill="rgba(0,0,0,0.25)"/>
            <!-- Pin shape -->
            <path d="M18 1C10.82 1 5 6.82 5 14c0 10.5 13 29 13 29s13-18.5 13-29c0-7.18-5.82-13-13-13z"
              fill="#16a34a" stroke="#ffffff" stroke-width="2"/>
            <!-- Inner white circle -->
            <circle cx="18" cy="14" r="6.5" fill="white"/>
            <!-- Center dot -->
            <circle cx="18" cy="14" r="3.5" fill="#16a34a"/>
            <!-- Cross-hair lines -->
            <line x1="18" y1="9" x2="18" y2="11" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="18" y1="17" x2="18" y2="19" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="13" y1="14" x2="15" y2="14" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="21" y1="14" x2="23" y2="14" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <style>
            @keyframes gps-pulse {
              0% { transform: translateX(-50%) scale(0.4); opacity: 0.9; }
              100% { transform: translateX(-50%) scale(1.5); opacity: 0; }
            }
          </style>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 44],
      popupAnchor: [0, -46],
    });
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: latitude && longitude ? 15 : 12,
        zoomControl: true,
      });

      const initialLayerConfig = TILE_LAYERS[activeLayer];
      const tiles = L.tileLayer(initialLayerConfig.url, {
        subdomains: initialLayerConfig.subdomains,
        maxZoom: initialLayerConfig.maxZoom,
        attribution: initialLayerConfig.attribution,
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;

      // Handle map click to reposition pin
      if (!readonly && onLocationChange) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const newLat = parseFloat(e.latlng.lat.toFixed(6));
          const newLng = parseFloat(e.latlng.lng.toFixed(6));
          onLocationChange(newLat, newLng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch basemap tile layer
  const handleToggleLayer = () => {
    if (!mapInstanceRef.current) return;
    const nextLayer = activeLayer === 'satellite' ? 'streets' : 'satellite';
    setActiveLayer(nextLayer);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const nextConfig = TILE_LAYERS[nextLayer];
    const newTiles = L.tileLayer(nextConfig.url, {
      subdomains: nextConfig.subdomains,
      maxZoom: nextConfig.maxZoom,
      attribution: nextConfig.attribution,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTiles;
  };

  // Update marker position when lat/lng changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
      const pos: L.LatLngTuple = [latitude, longitude];

      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        const marker = L.marker(pos, {
          icon: createPinIcon(),
          draggable: !readonly,
        }).addTo(map);

        if (!readonly && onLocationChange) {
          marker.on('dragend', () => {
            const latlng = marker.getLatLng();
            onLocationChange(
              parseFloat(latlng.lat.toFixed(6)),
              parseFloat(latlng.lng.toFixed(6))
            );
          });
        }

        markerRef.current = marker;
      }

      // Bind location popup
      const locationLabel = [subCounty, county].filter(Boolean).join(', ') || 'Farm Location';
      markerRef.current.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; color: #1e293b; padding: 4px;">
          <strong style="color: #16a34a; font-size: 14px;">${locationLabel}</strong>
          <div style="margin-top: 4px; color: #64748b; font-size: 12px;">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </div>
          ${!readonly ? '<div style="margin-top: 4px; font-size: 11px; color: #0284c7;">Drag pin or click map to adjust position</div>' : ''}
        </div>
      `);

      map.panTo(pos);
    } else {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [latitude, longitude, county, subCounty, readonly, onLocationChange]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '240px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-surface-border)' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Basemap Toggle Control */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={handleToggleLayer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          <Layers size={14} color="#38bdf8" />
          <span>{activeLayer === 'satellite' ? 'Satellite View' : 'Streets View'}</span>
        </button>
      </div>

      {/* Interactive Helper Overlay */}
      {!readonly && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '10px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}
        >
          <MapPin size={12} color="#16a34a" />
          <span>Click anywhere on the map or drag the green pin to set your exact farm spot</span>
        </div>
      )}
    </div>
  );
};

