import React, { useState, useEffect } from 'react';
import { getMyFarmerProfileApi, updateMyFarmerProfileApi } from '../services/farmerService';
import { Sprout, CheckCircle2, AlertTriangle, Globe, Lock, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const FarmerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [county, setCounty] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [generalArea, setGeneralArea] = useState('');
  const [privateExactLocation, setPrivateExactLocation] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [primaryCrops, setPrimaryCrops] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState<number | ''>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getMyFarmerProfileApi();
      if (data) {
        setDisplayName(data.displayName || user?.fullName || '');
        setCounty(data.county || '');
        setGeneralArea(data.generalArea || '');
        setPrimaryCrops(data.primaryCrops ? data.primaryCrops.join(', ') : '');
        setBio(data.bio || '');
      } else {
        setDisplayName(user?.fullName || '');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile details.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const cropsArray = primaryCrops
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    try {
      await updateMyFarmerProfileApi({
        displayName: displayName.trim(),
        county: county.trim(),
        generalArea: generalArea.trim(),
        primaryCrops: cropsArray,
        bio: bio.trim(),
      });
      setMessage({ type: 'success', text: 'Farmer profile updated successfully!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update farmer profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Sprout size={20} style={{ color: '#4ade80' }} />
        <span>Loading Farmer Profile...</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Farmer Profile</h1>
          <p style={styles.subtitle}>
            Manage your public agricultural identity and private location controls.
          </p>
        </div>
      </div>

      {message && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: message.type === 'success' ? '#86efac' : '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.grid}>
        {/* Public Profile Card */}
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

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>County *</label>
              <input
                type="text"
                required
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                style={styles.input}
                placeholder="e.g. Nakuru"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Sub-County</label>
              <input
                type="text"
                value={subCounty}
                onChange={(e) => setSubCounty(e.target.value)}
                style={styles.input}
                placeholder="e.g. Njoro"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>General Area / Ward</label>
            <input
              type="text"
              value={generalArea}
              onChange={(e) => setGeneralArea(e.target.value)}
              style={styles.input}
              placeholder="e.g. Egerton Ward"
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
            <label style={styles.label}>Farm Size (Acres)</label>
            <input
              type="number"
              step="0.1"
              value={farmSizeAcres}
              onChange={(e) => setFarmSizeAcres(e.target.value === '' ? '' : Number(e.target.value))}
              style={styles.input}
              placeholder="e.g. 5"
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

        {/* Privacy & Location Controls */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Lock size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#a855f7' }} />
            Privacy & Exact Location Controls
          </h2>
          <p style={styles.cardDesc}>
            MavunoTrust protects your exact home/farm location. Your exact address is never surfaced on public searches or profiles.
          </p>

          <div style={styles.privacyNoticeBox}>
            <div style={{ fontWeight: 700, color: '#4ade80', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} /> Privacy Guarantee:
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              Public profile displays only your <strong>County</strong> and <strong>General Area</strong> ({county || 'Not set'}, {generalArea || 'Not set'}). Private exact location is stored in encrypted format and only shared with explicit consent during confirmed trade deliveries.
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Private Exact Farm Address / Coordinates (Optional)</label>
            <textarea
              rows={3}
              value={privateExactLocation}
              onChange={(e) => setPrivateExactLocation(e.target.value)}
              style={styles.textarea}
              placeholder="Private exact location — stored securely, hidden from public profile..."
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="isPublicProfile"
              checked={isPublicProfile}
              onChange={(e) => setIsPublicProfile(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
            />
            <label htmlFor="isPublicProfile" style={{ color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
              Enable Public Profile (allows verified dealers to discover your general crop offerings)
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              ...styles.submitBtn,
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile Changes →'}
          </button>
        </div>
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
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '28px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 4px 0',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: '0 0 20px 0',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: '#f8fafc',
    outline: 'none',
  },
  textarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: '#f8fafc',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  privacyNoticeBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '16px',
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    marginTop: '20px',
    cursor: 'pointer',
    width: '100%',
  },
};
