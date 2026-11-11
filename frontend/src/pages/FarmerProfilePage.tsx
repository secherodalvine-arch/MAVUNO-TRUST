import React, { useState, useEffect } from 'react';
import {
  getMyFarmerProfileApi,
  updateMyFarmerProfileApi,
  getFarmLocationApi,
  updateFarmLocationApi,
  type FarmLocationDTO,
} from '../services/farmerService';
import { FarmBoundaryDrawer } from '../components/FarmBoundaryDrawer';
import { FarmLocationMap } from '../components/FarmLocationMap';
import { LoadSpinner } from '../components/LoadSpinner';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Lock,
  Shield,
  MapPin,
  Satellite,
  Compass,
  Check,
  RefreshCw,
  Info,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
  'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a',
  'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const KENYA_AG_PRESETS = [
  { label: 'Nakuru (Njoro / Rongai)', lat: -0.2833, lng: 36.0663, county: 'Nakuru', subCounty: 'Njoro' },
  { label: 'Uasin Gishu (Eldoret / Moiben)', lat: 0.5143, lng: 35.2698, county: 'Uasin Gishu', subCounty: 'Moiben' },
  { label: 'Trans Nzoia (Kitale / Cherangany)', lat: 1.0167, lng: 35.0062, county: 'Trans Nzoia', subCounty: 'Cherangany' },
  { label: 'Nyeri (Mathira / Tetu)', lat: -0.4201, lng: 36.9476, county: 'Nyeri', subCounty: 'Mathira' },
  { label: 'Meru (Imenti / Buuri)', lat: 0.0463, lng: 37.6559, county: 'Meru', subCounty: 'Central Imenti' },
  { label: 'Kiambu (Limuru / Gatundu)', lat: -1.1714, lng: 36.8304, county: 'Kiambu', subCounty: 'Limuru' },
  { label: 'Kisumu (Muhoroni / Nyando)', lat: -0.0917, lng: 34.7617, county: 'Kisumu', subCounty: 'Muhoroni' },
  { label: 'Machakos (Kangundo / Yatta)', lat: -1.5177, lng: 37.2634, county: 'Machakos', subCounty: 'Kangundo' },
];

export const FarmerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [locationMessage, setLocationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General Profile Form States
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [county, setCounty] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [generalArea, setGeneralArea] = useState('');
  const [privateExactLocation, setPrivateExactLocation] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [primaryCrops, setPrimaryCrops] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Private Farm Location & Satellite Coordinate States
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(null);
  const [hasRegisteredCoordinates, setHasRegisteredCoordinates] = useState<boolean>(false);

  useEffect(() => {
    fetchProfileAndLocation();
  }, []);

  const fetchProfileAndLocation = async () => {
    setIsLoading(true);
    try {
      const [profileData, locationData] = await Promise.all([
        getMyFarmerProfileApi().catch(() => null),
        getFarmLocationApi().catch(() => null),
      ]);

      if (profileData) {
        setDisplayName(profileData.displayName || user?.fullName || '');
        setCounty(profileData.county || '');
        setSubCounty(profileData.subCounty || '');
        setGeneralArea(profileData.generalArea || '');
        setPrimaryCrops(profileData.primaryCrops ? profileData.primaryCrops.join(', ') : '');
        setBio(profileData.bio || '');
        setPrivateExactLocation(profileData._privateExactLocation || '');
        setIsPublicProfile(profileData.isPublicProfile !== false);
        setFarmSizeAcres(profileData.farmSizeAcres ?? '');
        const resolvedPhone = profileData.phoneNumber || user?.phoneNumber || '';
        setPhoneNumber(resolvedPhone);
        if (resolvedPhone) {
          localStorage.setItem('farmer_profile_phone', resolvedPhone);
        }
        setUserEmail(profileData.email || user?.email || '');
      } else {
        setDisplayName(user?.fullName || '');
        if (user?.phoneNumber) {
          setPhoneNumber(user.phoneNumber);
          localStorage.setItem('farmer_profile_phone', user.phoneNumber);
        }
        setUserEmail(user?.email || '');
      }

      if (locationData) {
        if (locationData.county && !profileData?.county) setCounty(locationData.county);
        if (locationData.subCounty && !profileData?.subCounty) setSubCounty(locationData.subCounty);
        if (locationData.generalArea && !profileData?.generalArea) setGeneralArea(locationData.generalArea);
        if (locationData.farmSizeAcres !== null && locationData.farmSizeAcres !== undefined) {
          setFarmSizeAcres(locationData.farmSizeAcres);
        }
        if (locationData.latitude !== null && locationData.latitude !== undefined) {
          setLatitude(String(locationData.latitude));
        }
        if (locationData.longitude !== null && locationData.longitude !== undefined) {
          setLongitude(String(locationData.longitude));
        }
        setLocationUpdatedAt(locationData.locationUpdatedAt || null);
        setHasRegisteredCoordinates(locationData.hasRegisteredCoordinates);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile details.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Device GPS auto-detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationMessage({
        type: 'error',
        text: 'Geolocation is not supported by your current browser.',
      });
      return;
    }

    setIsLocatingDevice(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(String(lat));
        setLongitude(String(lng));
        setIsLocatingDevice(false);
        setLocationMessage({
          type: 'success',
          text: `Device GPS location detected (${lat}, ${lng}) with accuracy to ±${Math.round(pos.coords.accuracy)}m. Click Save Farm Location to store.`,
        });
      },
      (err) => {
        setIsLocatingDevice(false);
        setLocationMessage({
          type: 'error',
          text: `Unable to access GPS: ${err.message || 'Permission denied or signal unavailable'}. You can enter coordinates manually or choose an agricultural preset.`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Agricultural Preset selection
  const handleSelectPreset = (preset: typeof KENYA_AG_PRESETS[0]) => {
    setLatitude(String(preset.lat));
    setLongitude(String(preset.lng));
    if (!county) setCounty(preset.county);
    if (!subCounty) setSubCounty(preset.subCounty);
    setLocationMessage({
      type: 'success',
      text: `Applied preset for ${preset.label}. Click Save Farm Location to confirm.`,
    });
  };

  // Dedicated Save / Update Farm Location Handler
  const handleSaveLocationOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLocation(true);
    setLocationMessage(null);

    // Coordinate validation
    let parsedLat: number | null = null;
    let parsedLng: number | null = null;

    if (latitude.trim() !== '' || longitude.trim() !== '') {
      if (latitude.trim() === '' || longitude.trim() === '') {
        setLocationMessage({
          type: 'error',
          text: 'Both latitude and longitude must be provided together.',
        });
        setIsSavingLocation(false);
        return;
      }

      parsedLat = parseFloat(latitude.trim());
      parsedLng = parseFloat(longitude.trim());

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        setLocationMessage({
          type: 'error',
          text: 'Latitude and longitude must be valid numbers.',
        });
        setIsSavingLocation(false);
        return;
      }

      if (parsedLat < -90 || parsedLat > 90) {
        setLocationMessage({
          type: 'error',
          text: 'Latitude must be between -90 and 90 degrees.',
        });
        setIsSavingLocation(false);
        return;
      }

      if (parsedLng < -180 || parsedLng > 180) {
        setLocationMessage({
          type: 'error',
          text: 'Longitude must be between -180 and 180 degrees.',
        });
        setIsSavingLocation(false);
        return;
      }
    }

    try {
      const result = await updateFarmLocationApi({
        county: county.trim(),
        subCounty: subCounty.trim(),
        generalArea: generalArea.trim(),
        farmSizeAcres: farmSizeAcres === '' ? null : Number(farmSizeAcres),
        latitude: parsedLat,
        longitude: parsedLng,
      });

      const updatedLoc: FarmLocationDTO = result.location;
      setHasRegisteredCoordinates(updatedLoc.hasRegisteredCoordinates);
      setLocationUpdatedAt(updatedLoc.locationUpdatedAt);
      setLocationMessage({
        type: 'success',
        text: result.message || 'Farm location and coordinates registered successfully!',
      });
    } catch (err: any) {
      setLocationMessage({
        type: 'error',
        text: err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save farm location.',
      });
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Full Profile Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const cropsArray = primaryCrops
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    let parsedLat: number | null | undefined = undefined;
    let parsedLng: number | null | undefined = undefined;

    if (latitude.trim() !== '' || longitude.trim() !== '') {
      if (latitude.trim() === '' || longitude.trim() === '') {
        setMessage({
          type: 'error',
          text: 'Both latitude and longitude must be provided together.',
        });
        setIsSaving(false);
        return;
      }
      parsedLat = parseFloat(latitude.trim());
      parsedLng = parseFloat(longitude.trim());
      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        setMessage({ type: 'error', text: 'Coordinates must be valid numbers.' });
        setIsSaving(false);
        return;
      }
    }

    try {
      await updateMyFarmerProfileApi({
        displayName: displayName.trim(),
        county: county.trim(),
        subCounty: subCounty.trim(),
        generalArea: generalArea.trim(),
        farmSizeAcres: farmSizeAcres === '' ? undefined : Number(farmSizeAcres),
        primaryCrops: cropsArray,
        bio: bio.trim(),
        isPublicProfile,
        _privateExactLocation: privateExactLocation.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        phoneNumber: phoneNumber.trim(),
      });

      if (phoneNumber.trim()) {
        localStorage.setItem('farmer_profile_phone', phoneNumber.trim());
        try {
          const cached = localStorage.getItem('mavuno_user');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.phoneNumber = phoneNumber.trim();
            localStorage.setItem('mavuno_user', JSON.stringify(parsed));
          }
        } catch (_) {}
      }

      setMessage({ type: 'success', text: 'Farmer profile and location updated successfully!' });
      if (parsedLat !== undefined && parsedLng !== undefined) {
        setHasRegisteredCoordinates(parsedLat !== null && parsedLng !== null);
        setLocationUpdatedAt(new Date().toISOString());
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update farmer profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadSpinner size="lg" text="quering..." />
      </div>
    );
  }

  const numLat = parseFloat(latitude);
  const numLng = parseFloat(longitude);
  const hasValidEnteredCoords = !isNaN(numLat) && !isNaN(numLng) && numLat >= -90 && numLat <= 90 && numLng >= -180 && numLng <= 180;

  return (
    <div style={styles.container}>
      {/* ── Page Header ── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={styles.headerIcon}>
            <Sprout size={22} />
          </div>
          <h1 style={styles.title}>Farmer Profile &amp; Farm Location</h1>
        </div>
        <p style={styles.subtitle}>
          Manage your public marketplace presence and securely register private farm coordinates for automated satellite monitoring.
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

      {/* ── 1. SECURE FARM LOCATION & SATELLITE COORDINATES REGISTRATION SECTION ── */}
      <div style={{ ...styles.card, borderColor: hasRegisteredCoordinates ? 'rgba(34, 197, 94, 0.4)' : '#334155', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Satellite size={22} style={{ color: '#2dd4bf' }} />
              <h2 style={{ ...styles.cardTitle, color: '#f8fafc', display: 'inline-block' }}>
                Farm Location &amp; Satellite Monitoring Coordinates
              </h2>
            </div>
            <p style={styles.cardDesc}>
              Precision farm coordinates allow automated satellite observation to monitor crop vegetation health, canopy vigor, and seasonal trends over time.
            </p>
          </div>

          {/* Coordinate Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: hasRegisteredCoordinates ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: hasRegisteredCoordinates ? '#4ade80' : '#fbbf24',
              border: `1px solid ${hasRegisteredCoordinates ? 'rgba(34, 197, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            }}
          >
            {hasRegisteredCoordinates ? <Check size={14} /> : <MapPin size={14} />}
            <span>
              {hasRegisteredCoordinates
                ? 'Satellite Monitoring Active (Coordinates Linked)'
                : 'Coordinates Pending Registration'}
            </span>
          </div>
        </div>

        {/* Satellite Privacy Banner */}
        <div style={styles.satellitePrivacyBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, marginBottom: '6px' }}>
            <Shield size={18} />
            <span>Privacy Guarantee: Confidential Farm Coordinates</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Your exact latitude and longitude coordinates are <strong>100% private</strong>. They are never published on dealer searches, public profiles, or market feeds. Only your general area ({county || 'County not set'}, {subCounty || 'Sub-county not set'}) is shown to potential buyers.
          </p>
        </div>

        {locationMessage && (
          <div
            style={{
              ...styles.alert,
              backgroundColor: locationMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              borderColor: locationMessage.type === 'success' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
              color: locationMessage.type === 'success' ? '#16a34a' : '#ef4444',
              marginTop: '12px',
            }}
          >
            {locationMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{locationMessage.text}</span>
          </div>
        )}

        {/* Location Form Controls */}
        <div style={{ marginTop: '20px' }}>
          <div style={styles.fieldRow}>
            {/* County Select */}
            <div style={styles.field}>
              <label style={styles.label}>County *</label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                style={styles.select}
              >
                <option value="">Select County...</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sub-County */}
            <div style={styles.field}>
              <label style={styles.label}>Sub-County</label>
              <input
                type="text"
                value={subCounty}
                onChange={(e) => setSubCounty(e.target.value)}
                style={styles.input}
                placeholder="e.g. Njoro, Moiben, Cherangany"
              />
            </div>
          </div>

          <div style={styles.fieldRow}>
            {/* General Area */}
            <div style={styles.field}>
              <label style={styles.label}>General Area / Ward</label>
              <input
                type="text"
                value={generalArea}
                onChange={(e) => setGeneralArea(e.target.value)}
                style={styles.input}
                placeholder="e.g. Egerton Ward, Chebororwa"
              />
            </div>

            {/* Farm Size */}
            <div style={styles.field}>
              <label style={styles.label}>Farm Size (Acres)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={farmSizeAcres}
                onChange={(e) => setFarmSizeAcres(e.target.value === '' ? '' : Number(e.target.value))}
                style={styles.input}
                placeholder="e.g. 5.0"
              />
            </div>
          </div>

          {/* Coordinates Inputs */}
          <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)', borderRadius: '12px', padding: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} style={{ color: '#0d9488' }} />
                GPS Coordinates (Decimal Degrees)
              </span>

              {/* GPS Auto-detect Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocatingDevice}
                style={styles.secondaryBtn}
              >
                {isLocatingDevice ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <Compass size={14} />
                    <span>Use My Current Device GPS</span>
                  </>
                )}
              </button>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Latitude (-90° to +90°)</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. -0.2833"
                />
                <span style={styles.helperText}>Kenya latitudes range approx -4.7° to +5.5°</span>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Longitude (-180° to +180°)</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. 36.0663"
                />
                <span style={styles.helperText}>Kenya longitudes range approx 33.9° to 41.9°</span>
              </div>
            </div>

            {/* Quick Presets for Agricultural Hubs */}
            <div style={{ marginTop: '14px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                Quick Preset Hubs (click to populate typical county center):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {KENYA_AG_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={styles.presetChip}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Farm Location & Satellite Map */}
            <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'var(--color-surface-raised)', borderRadius: '10px', border: '1px solid var(--color-surface-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} style={{ color: '#16a34a' }} />
                  Interactive Farm Spot &amp; Satellite View
                </span>
                {hasValidEnteredCoords && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {numLat.toFixed(5)}, {numLng.toFixed(5)}
                  </span>
                )}
              </div>

              <FarmLocationMap
                latitude={hasValidEnteredCoords ? numLat : null}
                longitude={hasValidEnteredCoords ? numLng : null}
                county={county}
                subCounty={subCounty}
                onLocationChange={(newLat, newLng) => {
                  setLatitude(String(newLat));
                  setLongitude(String(newLng));
                  setLocationMessage({
                    type: 'success',
                    text: `Farm pin repositioned to (${newLat}, ${newLng}). Click Save Farm Location to confirm.`,
                  });
                }}
              />
            </div>
          </div>

          {/* Location Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSaveLocationOnly()}
              disabled={isSavingLocation}
              style={{
                ...styles.locationActionBtn,
                backgroundColor: hasRegisteredCoordinates ? '#0d9488' : '#16a34a',
                opacity: isSavingLocation ? 0.7 : 1,
              }}
            >
              {isSavingLocation ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving Farm Location...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{hasRegisteredCoordinates ? 'UPDATE FARM LOCATION' : 'SAVE FARM LOCATION'}</span>
                </>
              )}
            </button>

            {hasRegisteredCoordinates && (
              <button
                type="button"
                onClick={() => {
                  setLatitude('');
                  setLongitude('');
                  handleSaveLocationOnly();
                }}
                disabled={isSavingLocation}
                style={styles.clearBtn}
              >
                Clear GPS Coordinates
              </button>
            )}

            {locationUpdatedAt && (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                <Info size={14} />
                Last updated: {new Date(locationUpdatedAt).toLocaleDateString()} {new Date(locationUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. SECURE FARM BOUNDARY POLYGON DRAWER (PHASE 2) ── */}
      <FarmBoundaryDrawer
        referenceLat={numLat && !isNaN(numLat) ? numLat : null}
        referenceLng={numLng && !isNaN(numLng) ? numLng : null}
        farmSizeAcres={farmSizeAcres === '' ? null : Number(farmSizeAcres)}
      />

      {/* ── 3. GENERAL FARMER PROFILE FORM ── */}
      <form onSubmit={handleSubmit} style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Globe size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#60a5fa' }} />
            Public Profile Information
          </h2>
          <p style={styles.cardDesc}>
            This information is visible to verified dealers searching for crop matches in your area.
          </p>

          <div style={styles.field}>
            <label style={styles.label}>Display / Farm Name *</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={styles.input}
              placeholder="e.g. Green Valley Organic Farm"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Primary Crops (comma separated)</label>
            <input
              type="text"
              value={primaryCrops}
              onChange={(e) => setPrimaryCrops(e.target.value)}
              style={styles.input}
              placeholder="e.g. Maize, Beans, Potatoes, Tomatoes"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Farm Bio / Description</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={styles.textarea}
              placeholder="Brief description of your farm, farming practices, or experience..."
            />
          </div>
        </div>

        {/* Confidential Delivery Address Controls */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Lock size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#a855f7' }} />
            Trade Delivery Exact Address (Optional)
          </h2>
          <p style={styles.cardDesc}>
            Private physical directions for goods collection. Stored in encrypted format and only shared with verified dealers during a confirmed transaction.
          </p>

          <div style={styles.field}>
            <label style={styles.label}>Private Collection Directions / Land Plot Number</label>
            <textarea
              rows={3}
              value={privateExactLocation}
              onChange={(e) => setPrivateExactLocation(e.target.value)}
              style={styles.textarea}
              placeholder="e.g. Plot 42, 2km past Egerton main gate, turn left at the dispensary..."
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="isPublicProfile"
              checked={isPublicProfile}
              onChange={(e) => setIsPublicProfile(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary, #16a34a)' }}
            />
            <label htmlFor="isPublicProfile" style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>
              Enable Public Profile (allows verified dealers to discover your general crop offerings)
            </label>
          </div>
        </div>

        {/* Contact & Notification Details */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.15)', borderRadius: '6px', color: '#38bdf8' }}>
                <Smartphone size={14} />
              </span>
              Contact & Notification Details
            </span>
          </h2>
          <p style={styles.cardDesc}>
            Your phone number is used to receive SMS referral confirmations and farm alerts. Your email is linked to your account login.
          </p>

          <div style={styles.fieldRow}>
            {/* Phone Number */}
            <div style={styles.field}>
              <label style={styles.label}>Phone Number (for SMS Notifications)</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={styles.input}
                placeholder="e.g. +254 712 345 678"
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
                Used to receive SMS referral confirmations and farm health alerts.
              </span>
            </div>

            {/* Email — read-only display */}
            <div style={styles.field}>
              <label style={styles.label}>Email (Account Login)</label>
              <input
                type="email"
                value={userEmail}
                readOnly
                style={{ ...styles.input, opacity: 0.6, cursor: 'not-allowed' }}
                placeholder="your@email.com"
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
                To change your login email, please contact support.
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          style={{
            ...styles.submitBtn,
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? 'Saving Profile Changes...' : 'Save Full Profile Changes →'}
        </button>
      </form>
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
    marginBottom: '24px',
  },
  headerIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--color-text-secondary)',
    margin: '4px 0 0 0',
    lineHeight: 1.5,
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: '0.9rem',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: 'var(--color-surface-card)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: 'var(--shadow-sm)',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: '0 0 4px 0',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    margin: '0 0 16px 0',
    lineHeight: 1.4,
  },
  satellitePrivacyBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '14px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  },
  helperText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  input: {
    backgroundColor: 'var(--mt-input-bg, var(--color-surface-raised))',
    border: '1px solid var(--mt-input-border, var(--color-surface-border))',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
  select: {
    backgroundColor: 'var(--mt-input-bg, var(--color-surface-raised))',
    border: '1px solid var(--mt-input-border, var(--color-surface-border))',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: 'var(--color-text-primary)',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    backgroundColor: 'var(--mt-input-bg, var(--color-surface-raised))',
    border: '1px solid var(--mt-input-border, var(--color-surface-border))',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: 'var(--color-text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    color: '#0d9488',
    border: '1px solid rgba(13, 148, 136, 0.3)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  presetChip: {
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '6px',
    color: 'var(--color-text-secondary)',
    padding: '4px 10px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  locationActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '11px 22px',
    fontSize: '0.92rem',
    fontWeight: 600,
    cursor: 'pointer',
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
  submitBtn: {
    backgroundColor: 'var(--color-primary, #16a34a)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    marginTop: '16px',
    cursor: 'pointer',
    width: '100%',
  },
};

export default FarmerProfilePage;
