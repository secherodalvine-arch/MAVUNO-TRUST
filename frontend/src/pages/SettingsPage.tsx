import React, { useState, useEffect } from 'react';
import { Settings, Monitor, Sun, Moon, Bell, Shield, User, Palette } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/pages.css';
import './SettingsPage.css';

type Theme = 'dark' | 'light' | 'system';

const themes: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'dark',   label: 'Dark',   icon: <Moon size={18} />,    desc: 'Deep forest dark — easy on the eyes at night' },
  { value: 'light',  label: 'Light',  icon: <Sun size={18} />,     desc: 'Clean light theme for bright environments' },
  { value: 'system', label: 'System', icon: <Monitor size={18} />, desc: 'Follows your device system preference' },
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('mavuno-theme') as Theme) || 'dark';
  });

  const [notifPush, setNotifPush] = useState(() => localStorage.getItem('notif-push') !== 'false');
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('notif-email') !== 'false');

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const effective = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    root.setAttribute('data-theme', effective);
    localStorage.setItem('mavuno-theme', theme);
  }, [theme]);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
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
        <div className="settings-section-header">
          <Bell size={16} />
          <h2 className="section-heading" style={{ marginBottom: 0 }}>Notifications</h2>
        </div>
        <p className="settings-desc">Control what notifications you receive.</p>

        <div className="settings-toggle-list">
          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">In-App Notifications</p>
              <p className="settings-toggle-sub">Offers, messages, transactions, and system alerts</p>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={notifPush}
                onChange={e => { setNotifPush(e.target.checked); localStorage.setItem('notif-push', String(e.target.checked)); }}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">Email Notifications</p>
              <p className="settings-toggle-sub">Receive summaries and important alerts via email</p>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={e => { setNotifEmail(e.target.checked); localStorage.setItem('notif-email', String(e.target.checked)); }}
              />
              <span className="settings-toggle-slider" />
            </label>
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
