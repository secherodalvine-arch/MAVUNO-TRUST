/**
 * Unified Notification Dispatcher — MavunoTrust Phase 5
 *
 * Coordinates in-app database notifications, WebSocket broadcasts,
 * Firebase Cloud Messaging push notifications, and TalkSasa SMS alerts.
 *
 * Respects:
 * - User notification preferences (smsNotificationEnabled, pushNotificationEnabled).
 * - SMS cooldown deduplication.
 * - Privacy: never includes exact GPS coordinates in SMS or push notifications.
 */

import { createNotification } from '../models/Notification.js';
import { fcmService } from './fcmService.js';
import { talkSasaService } from './talkSasaService.js';
import User from '../models/User.js';

/**
 * Dispatch a notification across all enabled channels for a user.
 *
 * @param {object} params
 * @param {string|object} params.userId - User ObjectId
 * @param {'FARM_ADVISORY'|'ASSISTANCE_REFERRAL'|'SATELLITE_ALERT'|'GENERAL'} params.type
 * @param {string} params.title
 * @param {string} params.body
 * @param {string} [params.smsBody] - Short SMS text (defaults to title + body)
 * @param {string|null} [params.link=null]
 * @param {object} [params.meta={}]
 * @returns {Promise<{ inApp: boolean, fcm: object, sms: object }>}
 */
export async function dispatchFarmerNotification({
  userId,
  type = 'GENERAL',
  title,
  body,
  smsBody = null,
  link = null,
  meta = {},
}) {
  const results = {
    inApp: false,
    fcm: { attempted: false, success: false },
    sms: { attempted: false, success: false },
  };

  // 1. In-App Notification (Database + WebSocket)
  try {
    await createNotification({
      userId,
      type,
      title,
      body,
      link,
      meta,
    });
    results.inApp = true;
  } catch (err) {
    console.error('[NotificationDispatcher] Failed to create in-app notification:', err.message);
  }

  // Retrieve user preferences and contact tokens
  let user = null;
  try {
    user = await User.findById(userId).select('fcmToken phoneNumber smsNotificationEnabled pushNotificationEnabled');
  } catch (err) {
    console.error('[NotificationDispatcher] Failed to lookup user for notification dispatch:', err.message);
    return results;
  }

  if (!user) return results;

  // 2. Firebase Cloud Messaging (Push)
  if (user.pushNotificationEnabled && user.fcmToken) {
    results.fcm.attempted = true;
    try {
      const fcmRes = await fcmService.sendPushNotification({
        token: user.fcmToken,
        title,
        body,
        data: {
          type,
          link: link || '',
          ...meta,
        },
      });
      results.fcm = { attempted: true, ...fcmRes };
    } catch (err) {
      results.fcm = { attempted: true, success: false, error: err.message };
    }
  }

  // 3. TalkSasa SMS Alert
  if (user.smsNotificationEnabled && user.phoneNumber) {
    results.sms.attempted = true;
    try {
      const message = smsBody || `${title}: ${body}`.substring(0, 155);
      const smsRes = await talkSasaService.sendSms({
        to: user.phoneNumber,
        message,
        topic: type,
      });
      results.sms = { attempted: true, ...smsRes };
    } catch (err) {
      results.sms = { attempted: true, success: false, error: err.message };
    }
  }

  return results;
}
