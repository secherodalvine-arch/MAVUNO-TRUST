/**
 * Firebase Cloud Messaging (FCM) Service — MavunoTrust Phase 5
 *
 * Provides push notifications for farmers:
 * 1. Farm health observations & satellite alerts.
 * 2. Agricultural assistance referral status.
 *
 * Strictly adheres to:
 * - Zero new dependencies (uses native fetch).
 * - Safe error handling: returns graceful status when FCM is unconfigured.
 * - Never leaks farmer private coordinates.
 */

export class FCMService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || null;
    this.serverKey = process.env.FIREBASE_SERVER_KEY || null;
  }

  isConfigured() {
    return Boolean(this.serverKey || this.projectId);
  }

  /**
   * Send a push notification to a specific device via FCM.
   *
   * @param {object} params
   * @param {string} params.token - Target device FCM registration token
   * @param {string} params.title - Notification title
   * @param {string} params.body - Notification body text
   * @param {object} [params.data={}] - Additional payload data
   * @returns {Promise<{ success: boolean, messageId?: string, code?: string, message?: string }>}
   */
  async sendPushNotification({ token, title, body, data = {} }) {
    if (!token || typeof token !== 'string') {
      return {
        success: false,
        code: 'INVALID_TOKEN',
        message: 'FCM recipient token is missing or invalid.',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        code: 'FCM_NOT_CONFIGURED',
        message: 'Firebase Cloud Messaging is not configured. Set FIREBASE_SERVER_KEY in environment.',
      };
    }

    try {
      // Legacy FCM HTTP protocol (simple & reliable with API Key)
      const url = 'https://fcm.googleapis.com/fcm/send';
      const payload = {
        to: token,
        notification: {
          title,
          body,
          sound: 'default',
        },
        data: {
          ...data,
          sentAt: new Date().toISOString(),
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.serverKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          code: `HTTP_${response.status}`,
          message: `FCM push failed with HTTP ${response.status}: ${errorText}`,
        };
      }

      const resData = await response.json();
      if (resData.failure > 0 && resData.results && resData.results[0]?.error) {
        return {
          success: false,
          code: resData.results[0].error,
          message: `FCM error: ${resData.results[0].error}`,
        };
      }

      return {
        success: true,
        messageId: resData.results?.[0]?.message_id || 'sent',
      };
    } catch (err) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: `Failed to deliver FCM notification: ${err.message}`,
      };
    }
  }
}

export const fcmService = new FCMService();
