import apiClient from './apiClient';

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  meta?: {
    reminderKey?: string;
    actionLabel?: string;
    category?: string;
    priority?: string;
    itemId?: string;
    [key: string]: any;
  };
}

export interface ActivityReminder {
  reminderKey: string;
  title: string;
  body: string;
  link: string | null;
  actionLabel: string;
  category: 'OFFER' | 'TRANSACTION' | 'COMPLAINT' | 'LISTING' | string;
  priority: 'high' | 'medium' | 'low';
  notificationId: string | null;
  read: boolean;
  createdAt: string;
}

export interface RemindersResponse {
  reminders: ActivityReminder[];
  unreadReminders: ActivityReminder[];
  hasPendingActivities: boolean;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const notificationService = {
  async getAll(): Promise<NotificationsResponse> {
    const res = await apiClient.get('/notifications');
    return res.data.data;
  },

  async getReminders(): Promise<RemindersResponse> {
    const res = await apiClient.get('/notifications/reminders');
    return res.data.data;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  async deleteOne(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  async clearAll(): Promise<void> {
    await apiClient.delete('/notifications');
  },
};
