import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, Bell, User, Settings, LogOut,
  CheckCheck, Trash2, ChevronDown, X,
  MessageSquare, HandshakeIcon, Receipt, AlertTriangle,
  Sprout, Info, Headphones,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { notificationService, type AppNotification } from '../services/notificationService';
import { socketService } from '../services/socketService';
import CustomerSupportWidget from './CustomerSupportWidget';
import './AppHeader.css';

const routeTitles: Record<string, string> = {
  '/farmer/dashboard':   'Dashboard',
  '/dealer/dashboard':   'Dashboard',
  '/admin/dashboard':    'Control Panel',
  '/farmer/profile':     'My Profile',
  '/dealer/profile':     'My Profile',
  '/farmer/crops':       'My Crops',
  '/farmer/market':      'Market Prices',
  '/farmer/calculator':  'Production Calculator',
  '/farmer/rights':      'Rights Centre',
  '/farmer/complaints':  'My Complaints',
  '/dealers':            'Find Dealers',
  '/offers':             'Offers',
  '/messages':           'Messages',
  '/transactions':       'Transactions',
  '/settings':           'Settings',
};

const notifTypeIcon: Record<string, React.ReactNode> = {
  WELCOME:              <Sprout size={14} />,
  OFFER_RECEIVED:       <HandshakeIcon size={14} />,
  OFFER_ACCEPTED:       <HandshakeIcon size={14} />,
  OFFER_REJECTED:       <HandshakeIcon size={14} />,
  TRANSACTION_CREATED:  <Receipt size={14} />,
  TRANSACTION_COMPLETED:<Receipt size={14} />,
  MESSAGE_RECEIVED:     <MessageSquare size={14} />,
  DISPUTE_RAISED:       <AlertTriangle size={14} />,
  GENERAL:              <Info size={14} />,
};

interface AppHeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, sidebarCollapsed }) => {
  const { user, accessToken, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Notification state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false);

  // Customer support voice agent modal state
  const [supportOpen, setSupportOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const title = routeTitles[pathname] ?? 'MavunoTrust';

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Non-critical — fail silently
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Setup real-time WebSocket notification listener
    if (accessToken) {
      socketService.connect(accessToken);
      socketService.onNewNotification((newNotif: AppNotification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((c) => c + 1);
      });
    }

    // Poll every 30 seconds as fallback
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications, accessToken]);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mark one notification as read and optionally navigate
  const handleNotifClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await notificationService.markRead(notif._id).catch(() => {});
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.link) {
      setNotifOpen(false);
      navigate(notif.link);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationService.deleteOne(id).catch(() => {});
    const removed = notifications.find(n => n._id === id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (removed && !removed.read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClearAll = async () => {
    await notificationService.clearAll().catch(() => {});
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const roleLabel = user?.role === 'FARMER' ? 'Farmer'
    : user?.role === 'DEALER' ? 'Dealer / Broker'
    : 'Admin';

  const roleClass = user?.role === 'FARMER' ? 'role-farmer'
    : user?.role === 'DEALER' ? 'role-dealer'
    : 'role-admin';

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <header className="app-header" role="banner">
      {/* Hamburger — only shown on mobile (CSS hides on desktop) */}
      <button
        className="app-header-menu-btn"
        onClick={onMenuClick}
        aria-label="Toggle navigation"
        aria-expanded={!sidebarCollapsed}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="app-header-title" aria-live="polite">
        <h1 className="app-header-heading">{title}</h1>
      </div>

      {/* Right side */}
      <div className="app-header-right">

        {/* ── Customer Support Voice Agent ── */}
        <button
          className="app-header-support-btn"
          onClick={() => {
            setSupportOpen(true);
            setNotifOpen(false);
            setProfileOpen(false);
          }}
          aria-label="Open Customer Support AI voice assistant"
          title="Customer Support AI Voice Assistant"
        >
          <Headphones size={16} className="ah-support-icon" />
          <span className="ah-support-label">Support</span>
          <span className="ah-support-dot" aria-hidden="true" />
        </button>

        {/* ── Notification Bell ── */}
        <div className="ah-notif-wrap" ref={notifRef}>
          <button
            className="app-header-icon-btn ah-bell-btn"
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={notifOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="ah-badge" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {notifOpen && (
            <div className="ah-panel ah-notif-panel" role="dialog" aria-label="Notifications">
              <div className="ah-panel-header">
                <span className="ah-panel-title">
                  <Bell size={14} /> Notifications
                  {unreadCount > 0 && <span className="ah-badge-inline">{unreadCount}</span>}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {unreadCount > 0 && (
                    <button className="ah-text-btn" onClick={handleMarkAllRead} title="Mark all read">
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button className="ah-text-btn ah-text-btn--danger" onClick={handleClearAll} title="Clear all">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="ah-notif-list">
                {notifLoading && notifications.length === 0 && (
                  <div className="ah-notif-empty">Loading…</div>
                )}
                {!notifLoading && notifications.length === 0 && (
                  <div className="ah-notif-empty">
                    <Bell size={22} />
                    <span>You're all caught up</span>
                  </div>
                )}
                {notifications.map(n => (
                  <div
                    key={n._id}
                    className={`ah-notif-item ${!n.read ? 'ah-notif-item--unread' : ''} ${n.link ? 'ah-notif-item--clickable' : ''}`}
                    onClick={() => handleNotifClick(n)}
                    role={n.link ? 'button' : undefined}
                    tabIndex={n.link ? 0 : undefined}
                    onKeyDown={n.link ? (e) => { if (e.key === 'Enter') handleNotifClick(n); } : undefined}
                  >
                    <div className="ah-notif-icon" aria-hidden="true">
                      {notifTypeIcon[n.type] || <Info size={14} />}
                    </div>
                    <div className="ah-notif-content">
                      <p className="ah-notif-title">{n.title}</p>
                      <p className="ah-notif-body">{n.body}</p>
                      <span className="ah-notif-time">{timeAgo(n.createdAt)}</span>
                    </div>
                    <button
                      className="ah-notif-del"
                      onClick={(e) => handleDelete(e, n._id)}
                      aria-label="Delete notification"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── User Profile Button ── */}
        <div className="ah-profile-wrap" ref={profileRef}>
          <button
            className="ah-profile-btn"
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            <div className="app-header-avatar" aria-hidden="true">
              {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="ah-profile-info">
              <span className="ah-profile-name">{user?.fullName}</span>
              <span className={`ah-profile-role ${roleClass}`}>{roleLabel}</span>
            </div>
            <ChevronDown size={14} className={`ah-chevron ${profileOpen ? 'ah-chevron--open' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="ah-panel ah-profile-panel" role="menu">
              {/* Identity block */}
              <div className="ah-profile-identity">
                <div className="ah-profile-avatar-lg" aria-hidden="true">
                  {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="ah-identity-name">{user?.fullName}</p>
                  <p className="ah-identity-email">{(user as any)?.email}</p>
                  <span className={`ah-identity-role ${roleClass}`}>{roleLabel}</span>
                </div>
              </div>

              <div className="ah-profile-divider" />

              <button
                className="ah-profile-menu-item"
                role="menuitem"
                onClick={() => { setProfileOpen(false); navigate(user?.role === 'FARMER' ? '/farmer/profile' : '/dealer/profile'); }}
              >
                <User size={15} /> My Profile
              </button>

              <button
                className="ah-profile-menu-item"
                role="menuitem"
                onClick={() => { setProfileOpen(false); navigate('/settings'); }}
              >
                <Settings size={15} /> Settings
              </button>

              <div className="ah-profile-divider" />

              <button
                className="ah-profile-menu-item ah-profile-menu-item--danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer Support Voice Modal ── */}
      <CustomerSupportWidget
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </header>
  );
};

export default AppHeader;
