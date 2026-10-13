import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Handshake,
  Receipt,
  AlertTriangle,
  Sprout,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  notificationService,
  type ActivityReminder,
} from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';
import './InAppReminderPopup.css';

interface InAppReminderPopupProps {
  onRefreshNotifications?: () => void;
}

const SNOOZE_STORAGE_KEY = 'mavuno_snoozed_reminders_v1';
const SNOOZE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export const InAppReminderPopup: React.FC<InAppReminderPopupProps> = ({
  onRefreshNotifications,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<ActivityReminder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [snoozedKeys, setSnoozedKeys] = useState<Record<string, number>>(() => {
    try {
      const stored = sessionStorage.getItem(SNOOZE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Clean expired snoozes and save
  const cleanAndSaveSnoozes = useCallback((updated: Record<string, number>) => {
    const now = Date.now();
    const active: Record<string, number> = {};
    for (const [key, expires] of Object.entries(updated)) {
      if (expires > now) {
        active[key] = expires;
      }
    }
    setSnoozedKeys(active);
    try {
      sessionStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(active));
    } catch {
      // storage quota or disabled
    }
    return active;
  }, []);

  // Fetch reminders from backend
  const fetchReminders = useCallback(async () => {
    try {
      const data = await notificationService.getReminders();
      const now = Date.now();
      const currentSnoozes = snoozedKeys;

      // Filter out items that are marked read, currently snoozed, or farmer-only for dealers
      const activeUnread = (data.unreadReminders || []).filter((r) => {
        // Guard: dealers / brokers must never see farmer crop listing reminders
        if (user?.role === 'DEALER' && (r.category === 'LISTING' || r.link?.startsWith('/farmer/crops') || r.reminderKey?.startsWith('no_crops_'))) {
          return false;
        }
        const snoozeExpiry = currentSnoozes[r.reminderKey];
        if (snoozeExpiry && snoozeExpiry > now) {
          return false;
        }
        return true;
      });

      setReminders(activeUnread);
      if (activeUnread.length > 0) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch {
      // Non-critical background reminder fetch
    }
  }, [snoozedKeys, user?.role]);

  useEffect(() => {
    fetchReminders();
    // Poll every 35 seconds to keep activities up to date
    const timer = setInterval(fetchReminders, 35_000);
    return () => clearInterval(timer);
  }, [fetchReminders]);

  // Active current reminder
  const currentReminder = useMemo(() => {
    if (reminders.length === 0) return null;
    const safeIdx = Math.min(currentIndex, reminders.length - 1);
    return reminders[safeIdx] || null;
  }, [reminders, currentIndex]);

  // Navigate to target action link
  const handleActionClick = async () => {
    if (!currentReminder) return;

    if (currentReminder.notificationId) {
      await notificationService.markRead(currentReminder.notificationId).catch(() => {});
    }

    if (onRefreshNotifications) {
      onRefreshNotifications();
    }

    // Remove from active queue
    const remaining = reminders.filter((r) => r.reminderKey !== currentReminder.reminderKey);
    setReminders(remaining);
    if (remaining.length === 0) {
      setIsOpen(false);
    } else {
      setCurrentIndex((prev) => Math.min(prev, remaining.length - 1));
    }

    if (currentReminder.link) {
      navigate(currentReminder.link);
    }
  };

  // Snooze reminder for 10 minutes
  const handleSnooze = () => {
    if (!currentReminder) return;
    const nextSnoozes = {
      ...snoozedKeys,
      [currentReminder.reminderKey]: Date.now() + SNOOZE_DURATION_MS,
    };
    cleanAndSaveSnoozes(nextSnoozes);

    const remaining = reminders.filter((r) => r.reminderKey !== currentReminder.reminderKey);
    setReminders(remaining);
    if (remaining.length === 0) {
      setIsOpen(false);
    } else {
      setCurrentIndex((prev) => Math.min(prev, remaining.length - 1));
    }
  };

  // Dismiss notification permanently (mark read)
  const handleDismiss = async () => {
    if (!currentReminder) return;

    if (currentReminder.notificationId) {
      await notificationService.markRead(currentReminder.notificationId).catch(() => {});
    }

    // Persist dismissal so recurring polling doesn't immediately resurface it
    const nextSnoozes = {
      ...snoozedKeys,
      [currentReminder.reminderKey]: Date.now() + 24 * 60 * 60 * 1000,
    };
    cleanAndSaveSnoozes(nextSnoozes);

    if (onRefreshNotifications) {
      onRefreshNotifications();
    }

    const remaining = reminders.filter((r) => r.reminderKey !== currentReminder.reminderKey);
    setReminders(remaining);
    if (remaining.length === 0) {
      setIsOpen(false);
    } else {
      setCurrentIndex((prev) => Math.min(prev, remaining.length - 1));
    }
  };

  if (!isOpen || !currentReminder) {
    return null;
  }

  // Choose visual accent based on category
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'OFFER':
        return {
          icon: <Handshake size={18} />,
          badgeClass: 'reminder-badge--offer',
          glowClass: 'reminder-popup--offer',
          tagText: 'Trade Offer Pending',
        };
      case 'TRANSACTION':
        return {
          icon: <Receipt size={18} />,
          badgeClass: 'reminder-badge--tx',
          glowClass: 'reminder-popup--tx',
          tagText: 'Transaction Alert',
        };
      case 'COMPLAINT':
        return {
          icon: <AlertTriangle size={18} />,
          badgeClass: 'reminder-badge--complaint',
          glowClass: 'reminder-popup--complaint',
          tagText: 'Rights Case Active',
        };
      case 'LISTING':
        return {
          icon: <Sprout size={18} />,
          badgeClass: 'reminder-badge--listing',
          glowClass: 'reminder-popup--listing',
          tagText: 'Crops Reminder',
        };
      default:
        return {
          icon: <Clock size={18} />,
          badgeClass: 'reminder-badge--general',
          glowClass: 'reminder-popup--general',
          tagText: 'Activity Reminder',
        };
    }
  };

  const theme = getCategoryTheme(currentReminder.category);

  return (
    <div
      className={`in-app-reminder-popup ${theme.glowClass}`}
      role="alert"
      aria-live="polite"
      aria-labelledby="reminder-popup-title"
    >
      {/* Top Bar with Category Tag, Multi-item controls, and Close */}
      <div className="reminder-header">
        <div className={`reminder-tag ${theme.badgeClass}`}>
          <span className="reminder-tag-icon">{theme.icon}</span>
          <span className="reminder-tag-text">{theme.tagText}</span>
          <span className="reminder-live-pulse" />
        </div>

        <div className="reminder-header-right">
          {reminders.length > 1 && (
            <div className="reminder-pagination">
              <span className="reminder-counter">
                {currentIndex + 1} of {reminders.length}
              </span>
              <button
                type="button"
                className="reminder-nav-btn"
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : reminders.length - 1))}
                title="Previous pending item"
                aria-label="Previous reminder"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                className="reminder-nav-btn"
                onClick={() => setCurrentIndex((prev) => (prev < reminders.length - 1 ? prev + 1 : 0))}
                title="Next pending item"
                aria-label="Next reminder"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="reminder-close-btn"
            onClick={handleSnooze}
            title="Snooze for 10 minutes"
            aria-label="Snooze reminder"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="reminder-body">
        <h4 id="reminder-popup-title" className="reminder-title">
          {currentReminder.title}
        </h4>
        <p className="reminder-desc">{currentReminder.body}</p>
      </div>

      {/* Interactive Action Footer */}
      <div className="reminder-footer">
        <button
          type="button"
          className="reminder-action-btn"
          onClick={handleActionClick}
        >
          <span>{currentReminder.actionLabel || 'Take Action'}</span>
          <ArrowRight size={14} />
        </button>

        <div className="reminder-secondary-actions">
          <button
            type="button"
            className="reminder-snooze-btn"
            onClick={handleSnooze}
            title="Remind me again in 10 minutes"
          >
            <Clock size={13} />
            <span>Remind Later</span>
          </button>

          <button
            type="button"
            className="reminder-dismiss-btn"
            onClick={handleDismiss}
            title="Mark as done / dismissed"
          >
            <Check size={13} />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InAppReminderPopup;
