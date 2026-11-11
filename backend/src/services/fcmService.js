/**
 * Firebase Cloud Messaging (FCM) Service — MavunoTrust Phase 5
 *
 * Provides push notifications for farmers:
 * 1. Farm health observations & satellite alerts.
 * 2. Agricultural assistance referral status.
 *
 * Supports:
 * - Modern FCM HTTP v1 API using Google Service Account (OAuth2 bearer token)
 *   from Render Secret File (/etc/secrets/firebase-service-account.json) or env.
 * - Graceful fallback to legacy FCM HTTP API if serverKey is provided.
 * - Zero new dependencies (uses native fetch + native crypto).
 * - Safe error handling: returns graceful status when FCM is unconfigured.
 * - Never leaks farmer private coordinates.
 */

import { getFirebaseCredentials, getGoogleOAuth2Token } from '../config/googleCredentials.js';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

export class FCMService {
  constructor() {
    this.refreshCredentials();
  }

  refreshCredentials() {
    this.credentials = getFirebaseCredentials();
    return this.credentials;
  }

  isConfigured() {
    const creds = this.refreshCredentials();
    return creds.isConfigured;
  }

  getStatus() {
    const creds = this.refreshCredentials();
    return {
      configured: creds.isConfigured,
      type: creds.type,
      source: creds.source,
      path: creds.path,
      projectId: creds.projectId,
      clientEmail: creds.clientEmail,
    };
  }

  /**
   * Send a push notification to a specific device via FCM.
   * Prefers modern FCM HTTP v1; falls back to legacy HTTP if only serverKey is available.
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

    const creds = this.refreshCredentials();

    if (!creds.isConfigured) {
      return {
        success: false,
        configured: false,
        code: 'FCM_NOT_CONFIGURED',
        message:
          'Firebase Cloud Messaging is not configured. Provide /etc/secrets/firebase-service-account.json or FIREBASE_CREDENTIALS_PATH.',
      };
    }

    // 1. Modern FCM HTTP v1 with Service Account
    if (creds.type === 'service_account' && creds.clientEmail && creds.privateKey && creds.projectId) {
      return this._sendFcmV1({ creds, token, title, body, data });
    }

    // 2. Legacy FCM with Server Key
    if (creds.serverKey) {
      return this._sendLegacyFcm({ serverKey: creds.serverKey, token, title, body, data });
    }

    return {
      success: false,
      configured: false,
      code: 'FCM_CREDENTIALS_INCOMPLETE',
      message: 'FCM credentials are incomplete.',
    };
  }

  /**
   * Modern FCM HTTP v1 implementation
   */
  async _sendFcmV1({ creds, token, title, body, data }) {
    try {
      const accessToken = await getGoogleOAuth2Token(creds.clientEmail, creds.privateKey, FCM_SCOPE);
      const url = `https://fcm.googleapis.com/v1/projects/${creds.projectId}/messages:send`;

      // FCM v1 requires string values in data payload
      const stringData = {};
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          stringData[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
      }
      stringData.sentAt = new Date().toISOString();

      const payload = {
        message: {
          token,
          notification: {
            title,
            body,
          },
          data: stringData,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          code: `HTTP_${response.status}`,
          message: `FCM v1 push failed with HTTP ${response.status}: ${errorText}`,
        };
      }

      const resData = await response.json();
      return {
        success: true,
        messageId: resData.name || 'sent',
      };
    } catch (err) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: `Failed to deliver FCM v1 notification: ${err.message}`,
      };
    }
  }

  /**
   * Legacy FCM HTTP implementation
   */
  async _sendLegacyFcm({ serverKey, token, title, body, data }) {
    try {
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
          Authorization: `key=${serverKey}`,
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
        message: `Failed to deliver legacy FCM notification: ${err.message}`,
      };
    }
  }
}

export const fcmService = new FCMService();
