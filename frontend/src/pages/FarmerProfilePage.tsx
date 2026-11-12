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
  MapPin,
  Satellite,
  Compass,
  RefreshCw,
  Info,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  KENYA_COUNTIES,
  getSubCounties,
  getWards,
  resolveKenyaPlace,
  getCountyCoordinates,
  findNearestKenyaLocation,
  reverseGeocodeKenyaLocation,
} from '../constants/kenyaLocations';

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

        // Auto-adjust County and Sub-County from nearest Kenya administrative centroid
        const nearest = findNearestKenyaLocation(lat, lng);
        if (nearest) {
          if (nearest.county) setCounty(nearest.county);
          if (nearest.subCounty) setSubCounty(nearest.subCounty);
        }

        // Asynchronously refine with reverse geocoding
        reverseGeocodeKenyaLocation(lat, lng).then((geo) => {
          if (geo) {
            if (geo.county) {
              const matched = KENYA_COUNTIES.find(
                (c) => c.toLowerCase() === geo.county?.toLowerCase()
              );
              if (matched) setCounty(matched);
            }
            if (geo.subCounty) {
              setSubCounty(geo.subCounty);
            }
            if (geo.ward) {
              setGeneralArea(geo.ward);
            }
          }
        });

        setIsLocatingDevice(false);
        setLocationMessage({
          type: 'success',
          text: `Current location detected (${lat}, ${lng})${nearest ? ' near ' + (nearest.subCounty ? nearest.subCounty + ', ' : '') + nearest.county : ''}. Administrative fields adjusted. Click Save Farm Location to store.`,
        });
      },
      (err) => {
        setIsLocatingDevice(false);
        setLocationMessage({
          type: 'error',
          text: `Unable to access location: ${err.message || 'Permission denied or signal unavailable'}. You can enter coordinates manually or select your county.`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Dedicated Clear Farm Location & Coordinates Handler
  const handleClearLocation = async () => {
    setIsSavingLocation(true);
    setLocationMessage(null);
    setCounty('');
    setSubCounty('');
    setGeneralArea('');
    setFarmSizeAcres('');
    setLatitude('');
    setLongitude('');

    try {
      await updateFarmLocationApi({
        county: '',
        subCounty: '',
        generalArea: '',
        farmSizeAcres: null,
        latitude: null,
        longitude: null,
      });

      setHasRegisteredCoordinates(false);
      setLocationUpdatedAt(null);
      setLocationMessage({
        type: 'success',
        text: 'County, Sub-County, Ward, Farm Size, and Coordinates cleared successfully.',
      });
    } catch (err: any) {
      setLocationMessage({
        type: 'error',
        text: err.response?.data?.error?.message || err.response?.data?.message || 'Failed to clear farm location.',
      });
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Dedicated Save / Update Farm Location Handler
  const handleSaveLocationOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLocation(true);
    setLocationMessage(null);

    // Auto-derive coordinates from county/sub-county if not explicitly provided
    let targetLat = latitude.trim();
    let targetLng = longitude.trim();

    if ((!targetLat || !targetLng) && county.trim()) {
      const derived = getCountyCoordinates(county.trim(), subCounty.trim());
      if (derived) {
        targetLat = String(derived.lat);
        targetLng = String(derived.lng);
        setLatitude(targetLat);
        setLongitude(targetLng);
      }
    }

    // Coordinate validation
    let parsedLat: number | null = null;
    let parsedLng: number | null = null;

    if (targetLat !== '' || targetLng !== '') {
      if (targetLat === '' || targetLng === '') {
        setLocationMessage({
          type: 'error',
          text: 'Both latitude and longitude must be provided together.',
        });
        setIsSavingLocation(false);
        return;
      }

      parsedLat = parseFloat(targetLat);
      parsedLng = parseFloat(targetLng);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.headerIcon}>
            <Sprout size={22} />
          </div>
          <h1 style={styles.title}>Farmer Profile &amp; Farm Location</h1>
        </div>
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

      {/* ── 1. SECURE FARM LOCATION & COORDINATES REGISTRATION SECTION ── */}
      <div style={{ ...styles.card, borderColor: hasRegisteredCoordinates ? 'rgba(34, 197, 94, 0.4)' : '#334155', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Satellite size={22} style={{ color: '#2dd4bf' }} />
          <h2 style={{ ...styles.cardTitle, color: 'var(--color-text-primary, #f8fafc)', margin: 0 }}>
            Farm Location &amp; Coordinates
          </h2>
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
        <div style={{ marginTop: '16px' }}>
          <div style={styles.fieldRow}>
            {/* County Select */}
            <div style={styles.field}>
              <label style={styles.label}>County *</label>
              <select
                value={county}
                onChange={(e) => {
                  const newCounty = e.target.value;
                  setCounty(newCounty);
                  setSubCounty('');
                  setGeneralArea('');
                  const coords = getCountyCoordinates(newCounty);
                  if (coords) {
                    setLatitude(String(coords.lat));
                    setLongitude(String(coords.lng));
                    setLocationMessage({
                      type: 'success',
                      text: `Map adjusted to ${newCounty} (${coords.lat}, ${coords.lng}). Click Save Farm Location to update.`,
                    });
                  }
                }}
                style={styles.select}
              >
                <option value="">Select County...</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sub-County Selection */}
            <div style={styles.field}>
              <label style={styles.label}>Sub-County</label>
              {county && getSubCounties(county).length > 0 ? (
                <select
                  value={subCounty}
                  onChange={(e) => {
                    const newSub = e.target.value;
                    setSubCounty(newSub);
                    setGeneralArea('');
                    const coords = getCountyCoordinates(county, newSub);
                    if (coords) {
                      setLatitude(String(coords.lat));
                      setLongitude(String(coords.lng));
                      setLocationMessage({
                        type: 'success',
                        text: `Map adjusted to ${newSub}, ${county} (${coords.lat}, ${coords.lng}). Click Save Farm Location to update.`,
                      });
                    }
                  }}
                  style={styles.select}
                >
                  <option value="">Select Sub-County in {county}...</option>
                  {getSubCounties(county).map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                  {subCounty && !getSubCounties(county).includes(subCounty) && (
                    <option value={subCounty}>{subCounty} (Custom)</option>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={subCounty}
                  onChange={(e) => setSubCounty(e.target.value)}
                  style={styles.input}
                  placeholder={county ? "Enter sub-county" : "Select county first"}
                />
              )}
            </div>
          </div>

          <div style={styles.fieldRow}>
            {/* General Area / Ward Selection */}
            <div style={styles.field}>
              <label style={styles.label}>General Area / Ward</label>
              {county && subCounty && getWards(county, subCounty).length > 0 ? (
                <select
                  value={generalArea}
                  onChange={(e) => setGeneralArea(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select Ward / Area in {subCounty}...</option>
                  {getWards(county, subCounty).map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                  {generalArea && !getWards(county, subCounty).includes(generalArea) && (
                    <option value={generalArea}>{generalArea} (Custom)</option>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={generalArea}
                  onChange={(e) => setGeneralArea(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Ruiru Ward, Gitothua"
                />
              )}
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
                Location Coordinates (Decimal Degrees)
              </span>

              {/* Location Auto-detect Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocatingDevice}
                style={styles.secondaryBtn}
              >
                {isLocatingDevice ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Detecting location...</span>
                  </>
                ) : (
                  <>
                    <Compass size={14} />
                    <span>My current location</span>
                  </>
                )}
              </button>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Latitude</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  style={styles.input}
                  placeholder="-1.153289"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Longitude</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  style={styles.input}
                  placeholder="36.963183"
                />
              </div>
            </div>

            {/* Resolved Place Name Display */}
            {hasValidEnteredCoords && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.86rem',
                  color: '#16a34a',
                }}
              >
                <MapPin size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Place: </strong>
                  {resolveKenyaPlace(numLat, numLng)}
                </span>
              </div>
            )}

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
                generalArea={generalArea}
                onLocationChange={(newLat, newLng) => {
                  setLatitude(String(newLat));
                  setLongitude(String(newLng));
                  const nearest = findNearestKenyaLocation(newLat, newLng);
                  if (nearest && nearest.distanceKm <= 35) {
                    setCounty(nearest.county);
                    if (nearest.subCounty) setSubCounty(nearest.subCounty);
                  }
                  setLocationMessage({
                    type: 'success',
                    text: `Farm pin repositioned to (${newLat}, ${newLng})${nearest ? ' near ' + (nearest.subCounty ? nearest.subCounty + ', ' : '') + nearest.county : ''}. Click Save Farm Location to confirm.`,
                  });
                }}
                onRequestGPS={handleDetectGPS}
                isLocatingDevice={isLocatingDevice}
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

            {(hasRegisteredCoordinates || latitude || longitude || county || subCounty || generalArea || farmSizeAcres !== '') && (
              <button
                type="button"
                onClick={handleClearLocation}
                disabled={isSavingLocation}
                style={styles.clearBtn}
              >
                Clear Farm Location &amp; Coordinates
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
          <h2 style={{ ...styles.cardTitle, marginBottom: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.15)', borderRadius: '6px', color: '#38bdf8' }}>
                <Smartphone size={14} />
              </span>
              Contact & Notification Details
            </span>
          </h2>

          <div style={styles.fieldRow}>
            {/* Phone Number */}
            <div style={styles.field}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={styles.input}
                placeholder="e.g. +254 712 345 678"
              />
            </div>

            {/* Email — read-only display */}
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
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
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
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
