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

  // Create custom marker icon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-farm-pin',
      html: `
        <div style="
          width: 34px;
          height: 34px;
          background: #16a34a;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32],
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

