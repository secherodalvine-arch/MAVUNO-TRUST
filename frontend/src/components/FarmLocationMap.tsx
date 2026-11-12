import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Search, Compass, X, RefreshCw } from 'lucide-react';
import {
  KENYA_LOCATIONS,
  KENYA_COUNTY_COORDINATES,
  KENYA_SUBCOUNTY_COORDINATES,
} from '../constants/kenyaLocations';

// Fix Leaflet default icon paths in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface FarmLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  county?: string;
  subCounty?: string;
  generalArea?: string;
  readonly?: boolean;
  onRequestGPS?: () => void;
  isLocatingDevice?: boolean;
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
  generalArea,
  readonly = false,
  onRequestGPS,
  isLocatingDevice = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [activeLayer, setActiveLayer] = useState<'satellite' | 'streets'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);

  const defaultLat = latitude && !isNaN(latitude) ? latitude : -0.2833;
  const defaultLng = longitude && !isNaN(longitude) ? longitude : 36.0663;

  // Build local search suggestions from Kenyan database
  const localSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: Array<{ name: string; type: string; lat: number; lng: number }> = [];

    // Match sub-counties
    for (const [subName, coords] of Object.entries(KENYA_SUBCOUNTY_COORDINATES)) {
      if (subName.toLowerCase().includes(q)) {
        let parentCounty = '';
        for (const [cName, subs] of Object.entries(KENYA_LOCATIONS)) {
          if (subs.some((s) => s.name.toLowerCase() === subName.toLowerCase())) {
            parentCounty = cName;
            break;
          }
        }
        results.push({
          name: `${subName}${parentCounty ? ', ' + parentCounty : ''}`,
          type: 'Sub-County',
          lat: coords.lat,
          lng: coords.lng,
        });
      }
    }

    // Match counties
    for (const [cName, coords] of Object.entries(KENYA_COUNTY_COORDINATES)) {
      if (cName.toLowerCase().includes(q)) {
        results.push({
          name: `${cName} County`,
          type: 'County',
          lat: coords.lat,
          lng: coords.lng,
        });
      }
    }

    // Match wards
    if (results.length < 5) {
      for (const [cName, subs] of Object.entries(KENYA_LOCATIONS)) {
        for (const sub of subs) {
          for (const ward of sub.wards) {
            if (ward.toLowerCase().includes(q)) {
              const subCoords = KENYA_SUBCOUNTY_COORDINATES[sub.name] || KENYA_COUNTY_COORDINATES[cName];
              if (subCoords) {
                results.push({
                  name: `${ward} Ward (${sub.name}, ${cName})`,
                  type: 'Ward',
                  lat: subCoords.lat,
                  lng: subCoords.lng,
                });
              }
            }
          }
        }
      }
    }

    return results.slice(0, 7);
  }, [searchQuery]);

  // Create custom high-visibility location pin icon with pulsing anchor ring
  const createPinIcon = () => {
    return L.divIcon({
      className: 'farm-location-pin-wrapper',
      html: `
        <div style="
          position: relative;
          width: 38px;
          height: 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <!-- Pulse animation ring at the anchor point -->
          <div style="
            position: absolute;
            bottom: 0px;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(22, 163, 74, 0.35);
            animation: farm-pin-pulse 1.8s ease-out infinite;
            pointer-events: none;
          "></div>
          <!-- Real Location Pin SVG with sharp pin-point -->
          <svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.55));">
            <path d="M19 0C8.507 0 0 8.507 0 19C0 33.25 19 50 19 50C19 50 38 33.25 38 19C38 8.507 29.493 0 19 0Z" fill="#16a34a" stroke="#ffffff" stroke-width="2.5"/>
            <circle cx="19" cy="19" r="8.5" fill="#ffffff"/>
            <circle cx="19" cy="19" r="5" fill="#15803d"/>
          </svg>
          <style>
            .farm-location-pin-wrapper {
              background: transparent !important;
              border: none !important;
            }
            @keyframes farm-pin-pulse {
              0% { transform: translateX(-50%) scale(0.4); opacity: 0.9; }
              100% { transform: translateX(-50%) scale(1.7); opacity: 0; }
            }
          </style>
        </div>
      `,
      iconSize: [38, 52],
      iconAnchor: [19, 50],
      popupAnchor: [0, -50],
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

      // Handle map click to reposition or place pin
      if (!readonly && onLocationChange) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const newLat = parseFloat(e.latlng.lat.toFixed(6));
          const newLng = parseFloat(e.latlng.lng.toFixed(6));
          onLocationChange(newLat, newLng);
        });
      }

      // Ensure proper viewport sizing
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
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

  // Update marker position and popup when lat/lng change
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
      const locationLabel = [generalArea, subCounty, county].filter(Boolean).join(', ') || 'Farm Location';
      markerRef.current.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; color: #1e293b; padding: 4px; min-width: 170px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #16a34a;"></span>
            <strong style="color: #16a34a; font-size: 14px;">${locationLabel}</strong>
          </div>
          <div style="color: #475569; font-size: 12px; font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-top: 4px;">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </div>
          ${!readonly ? '<div style="margin-top: 6px; font-size: 11px; color: #0284c7; font-weight: 500;">📍 Drag pin or click map to reposition</div>' : ''}
        </div>
      `);

      if (map.getZoom() < 13) {
        map.flyTo(pos, 14, { duration: 0.8 });
      } else {
        map.flyTo(pos, map.getZoom(), { duration: 0.6 });
      }
    } else {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [latitude, longitude, county, subCounty, generalArea, readonly, onLocationChange]);

  // Online search fallback (OpenStreetMap Nominatim Kenya)
  const handlePerformOnlineSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearchingOnline(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Kenya')}&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.map((d: any) => ({
          name: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        }));
        setOnlineResults(results);
      }
    } catch {
      // Ignore network search errors
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Select a searched place
  const handleSelectPlace = (place: { name: string; lat: number; lng: number }) => {
    setShowSearchResults(false);
    setSearchQuery(place.name.split(',')[0]);
    if (onLocationChange) {
      onLocationChange(place.lat, place.lng);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([place.lat, place.lng], 15, { duration: 0.9 });
    }
  };

  // Trigger GPS detection
  const handleTriggerGPS = () => {
    if (onRequestGPS) {
      onRequestGPS();
      return;
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        if (onLocationChange) onLocationChange(lat, lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 0.8 });
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-surface-border)' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Top Controls Bar: Search & Location Actions */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {/* Location Search Bar */}
        {!readonly && (
          <div style={{ position: 'relative', width: '280px', maxWidth: '60%', pointerEvents: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '4px 10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              }}
            >
              <Search size={14} color="#38bdf8" style={{ flexShrink: 0, marginRight: '6px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (localSuggestions.length > 0) {
                      handleSelectPlace(localSuggestions[0]);
                    } else {
                      handlePerformOnlineSearch();
                    }
                  }
                }}
                placeholder="Search town, ward, county..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <X size={13} color="#94a3b8" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSearchResults && (localSuggestions.length > 0 || onlineResults.length > 0 || isSearchingOnline) && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 1002,
                }}
              >
                {localSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectPlace(item)}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      color: '#f1f5f9',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#16a34a" />
                      <span>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                      {item.type}
                    </span>
                  </div>
                ))}

                {onlineResults.map((item, idx) => (
                  <div
                    key={`online-${idx}`}
                    onClick={() => handleSelectPlace(item)}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <MapPin size={13} color="#38bdf8" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  </div>
                ))}

                {searchQuery.length >= 2 && (
                  <div
                    onClick={handlePerformOnlineSearch}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      background: 'rgba(56, 189, 248, 0.08)',
                    }}
                  >
                    {isSearchingOnline ? 'Searching OpenStreetMap...' : `Search OpenStreetMap for "${searchQuery}"`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Action Buttons: GPS Locate & Basemap Switcher */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
          {/* GPS My Location Button */}
          {!readonly && (
            <button
              type="button"
              onClick={handleTriggerGPS}
              disabled={isLocatingDevice}
              title="Detect my current location via GPS"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                color: isLocatingDevice ? '#fbbf24' : '#2dd4bf',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {isLocatingDevice ? (
                <>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Compass size={14} />
                  <span>Locate Me</span>
                </>
              )}
            </button>
          )}

          {/* Toggle Layer View Button */}
          <button
            type="button"
            onClick={handleToggleLayer}
            title="Toggle between Satellite and Streets View"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Layers size={14} color="#38bdf8" />
            <span>{activeLayer === 'satellite' ? 'Satellite' : 'Roads'}</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Helper / Pin Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '10px',
          right: '10px',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <MapPin size={13} color="#16a34a" />
          <span>
            {latitude && longitude
              ? `Pinned: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
              : 'Click anywhere on map or drag pin to mark your farm spot'}
          </span>
        </div>
      </div>
    </div>
  );
};
