import React, { useState, useEffect } from 'react';
import { Settings, Monitor, Sun, Moon, Bell, Shield, User, Palette, CheckCircle2, MessageSquare, Mail, Smartphone, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import '../styles/pages.css';
import './SettingsPage.css';

type Theme = 'dark' | 'light' | 'system';
type NotificationCadence = 'NOW' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

const themes: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'dark',   label: 'Dark',   icon: <Moon size={18} />,    desc: 'Deep forest dark — easy on the eyes at night' },
  { value: 'light',  label: 'Light',  icon: <Sun size={18} />,     desc: 'Clean light theme for bright environments' },
  { value: 'system', label: 'System', icon: <Monitor size={18} />, desc: 'Follows your device system preference' },
];

const cadences: { value: NotificationCadence; label: string; sub: string }[] = [
  { value: 'NOW',     label: 'Now (Real-Time)', sub: 'Instant delivery as events, offers, and alerts occur' },
  { value: 'DAILY',   label: 'Daily Digest',    sub: 'Consolidated summary sent once each evening' },
  { value: 'WEEKLY',  label: 'Weekly Summary',  sub: 'Weekly market movements and farm advisory roundup' },
  { value: 'MONTHLY', label: 'Monthly Report',  sub: 'Monthly agricultural and transaction ledger' },
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('mavuno-theme') as Theme) || 'dark';
  });

  const [notifInApp, setNotifInApp] = useState(() => localStorage.getItem('notif-inapp') !== 'false');
  const [notifSms, setNotifSms] = useState(() => localStorage.getItem('notif-sms') !== 'false');
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('notif-email') !== 'false');
  const [notifCadence, setNotifCadence] = useState<NotificationCadence>(() => {
    return (localStorage.getItem('notif-cadence') as NotificationCadence) || 'NOW';
  });
  const [isUpdatingNotifs, setIsUpdatingNotifs] = useState(false);
  const [notifSavedMsg, setNotifSavedMsg] = useState<string | null>(null);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const effective = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    root.setAttribute('data-theme', effective);
    localStorage.setItem('mavuno-theme', theme);
  }, [theme]);

  // Fetch real notification preferences from the backend
  useEffect(() => {
    let isMounted = true;
    apiClient.get('/notifications/preferences')
      .then(res => {
        if (isMounted && res.data?.success && res.data?.data) {
          const { inAppNotifications, emailNotifications, smsNotifications, notificationCadence } = res.data.data;
          setNotifInApp(inAppNotifications !== false);
          setNotifSms(smsNotifications !== false);
          setNotifEmail(emailNotifications !== false);
          if (notificationCadence) {
            setNotifCadence(notificationCadence as NotificationCadence);
            localStorage.setItem('notif-cadence', notificationCadence);
          }
          localStorage.setItem('notif-inapp', String(inAppNotifications !== false));
          localStorage.setItem('notif-sms', String(smsNotifications !== false));
          localStorage.setItem('notif-email', String(emailNotifications !== false));
        }
      })
      .catch(() => {
        // Fallback to local storage
      });

    return () => { isMounted = false; };
  }, []);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
  };

  const handleTogglePreference = async (
    key: 'inAppNotifications' | 'emailNotifications' | 'smsNotifications',
    value: boolean
  ) => {
    if (key === 'inAppNotifications') {
      setNotifInApp(value);
      localStorage.setItem('notif-inapp', String(value));
    } else if (key === 'smsNotifications') {
      setNotifSms(value);
      localStorage.setItem('notif-sms', String(value));
    } else if (key === 'emailNotifications') {
      setNotifEmail(value);
      localStorage.setItem('notif-email', String(value));
    }

    setIsUpdatingNotifs(true);
    try {
      await apiClient.put('/notifications/preferences', { [key]: value });
      setNotifSavedMsg('Preferences saved.');
      setTimeout(() => setNotifSavedMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update notification preference:', err);
    } finally {
      setIsUpdatingNotifs(false);
    }
  };

  const handleCadenceChange = async (cadence: NotificationCadence) => {
    setNotifCadence(cadence);
    localStorage.setItem('notif-cadence', cadence);
    setIsUpdatingNotifs(true);
    try {
      await apiClient.put('/notifications/preferences', { notificationCadence: cadence });
      setNotifSavedMsg(`Delivery frequency set to ${cadence.toLowerCase()}.`);
      setTimeout(() => setNotifSavedMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update notification cadence:', err);
    } finally {
      setIsUpdatingNotifs(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-icon green">
          <Settings size={22} />
        </div>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customise your MavunoTrust experience.</p>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="page-card page-card--spaced settings-section">
        <div className="settings-section-header">
          <Palette size={16} />
          <h2 className="section-heading" style={{ marginBottom: 0 }}>Appearance</h2>
        </div>
        <p className="settings-desc">Choose how MavunoTrust looks on your device.</p>

        <div className="settings-theme-grid">
          {themes.map(t => (
            <button
              key={t.value}
              className={`settings-theme-card ${theme === t.value ? 'settings-theme-card--active' : ''}`}
              onClick={() => handleThemeChange(t.value)}
              aria-pressed={theme === t.value}
            >
              <div className="settings-theme-icon">{t.icon}</div>
              <span className="settings-theme-label">{t.label}</span>
              <span className="settings-theme-desc">{t.desc}</span>
              {theme === t.value && (
                <span className="settings-theme-check" aria-hidden="true">Active</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="page-card page-card--spaced settings-section">
        <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} />
            <h2 className="section-heading" style={{ marginBottom: 0 }}>Notifications &amp; Alerts</h2>
          </div>
          {notifSavedMsg && (
            <span style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              {notifSavedMsg}
            </span>
          )}
        </div>
        <p className="settings-desc">Configure your preferred delivery channels and notification frequency.</p>

        {/* Delivery Modes (Toggles) */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
            Mode of Delivery
          </h3>
          <div className="settings-toggle-list">
            {/* In-App */}
            <div className="settings-toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#0284c7' }}><MessageSquare size={18} /></div>
                <div>
                  <p className="settings-toggle-label">In-App Notifications</p>
                  <p className="settings-toggle-sub">Live alerts, price updates, trades, and chat notifications</p>
                </div>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={notifInApp}
                  disabled={isUpdatingNotifs}
                  onChange={e => handleTogglePreference('inAppNotifications', e.target.checked)}
                />
                <span className="settings-toggle-slider" />
              </label>
            </div>

            {/* SMS */}
            <div className="settings-toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#16a34a' }}><Smartphone size={18} /></div>
                <div>
                  <p className="settings-toggle-label">SMS Notifications</p>
                  <p className="settings-toggle-sub">Direct SMS for urgent farm alerts, trade confirmations, and support referrals</p>
                </div>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={notifSms}
                  disabled={isUpdatingNotifs}
                  onChange={e => handleTogglePreference('smsNotifications', e.target.checked)}
                />
                <span className="settings-toggle-slider" />
              </label>
            </div>

            {/* Email */}
            <div className="settings-toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#eab308' }}><Mail size={18} /></div>
                <div>
                  <p className="settings-toggle-label">Email Notifications</p>
                  <p className="settings-toggle-sub">Important market receipts, agreements, and periodic summaries</p>
                </div>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={notifEmail}
                  disabled={isUpdatingNotifs}
                  onChange={e => handleTogglePreference('emailNotifications', e.target.checked)}
                />
                <span className="settings-toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Frequency / Cadence Selection */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} style={{ color: '#16a34a' }} />
            Delivery Frequency
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
            Choose how frequently non-urgent summaries and market digests are delivered.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {cadences.map(c => {
              const isSelected = notifCadence === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleCadenceChange(c.value)}
                  disabled={isUpdatingNotifs}
                  style={{
                    background: isSelected ? 'rgba(22, 163, 74, 0.12)' : 'var(--color-surface-raised)',
                    border: `1.5px solid ${isSelected ? '#16a34a' : 'var(--color-surface-border)'}`,
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#16a34a' : 'var(--color-text-primary)' }}>
                      {c.label}
                    </span>
                    {isSelected && <CheckCircle2 size={16} color="#16a34a" />}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', lineHeight: 1.4 }}>
                    {c.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Account ── */}
      <div className="page-card page-card--spaced settings-section">
        <div className="settings-section-header">
          <User size={16} />
          <h2 className="section-heading" style={{ marginBottom: 0 }}>Account</h2>
        </div>
        <p className="settings-desc">Manage your account details and security.</p>

        <div className="settings-account-info">
          <div className="settings-account-avatar">
            {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="settings-account-name">{user?.fullName}</p>
            <p className="settings-account-role">{user?.role}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigate(user?.role === 'FARMER' ? '/farmer/profile' : '/dealer/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <User size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* ── Security ── */}
      <div className="page-card page-card--spaced settings-section">
        <div className="settings-section-header">
          <Shield size={16} />
          <h2 className="section-heading" style={{ marginBottom: 0 }}>Security</h2>
        </div>
        <p className="settings-desc">Keep your account safe.</p>

        <div className="settings-toggle-list">
          <div className="kv-row">
            <span className="kv-label">Account type</span>
            <span className="kv-value">{user?.role}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">Session</span>
            <span className="kv-value green">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
