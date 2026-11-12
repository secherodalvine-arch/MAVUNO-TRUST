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
import {
  sendFarmAdvisoryEmail,
  sendAssistanceConfirmationEmail,
  sendGeneralNotificationEmail,
} from './emailService.js';
import User from '../models/User.js';
import FarmerProfile from '../models/FarmerProfile.js';

/**
 * Dispatch a notification across all enabled channels for a user.
 * Channels:
 *  1. In-App Database & WebSocket
 *  2. Firebase Cloud Messaging (Push)
 *  3. TalkSasa SMS Alert
 *  4. Email Notification (via Email API / Gmail SMTP)
 *
 * @param {object} params
 * @param {string|object} params.userId - User ObjectId
 * @param {'FARM_ADVISORY'|'ASSISTANCE_REFERRAL'|'SATELLITE_ALERT'|'GENERAL'} params.type
 * @param {string} params.title
 * @param {string} params.body
 * @param {string} [params.smsBody] - Short SMS text (defaults to title + body)
 * @param {string|null} [params.link=null]
 * @param {object} [params.meta={}]
 * @param {string|null} [params.phoneNumber=null]
 * @param {boolean} [params.forceSms=false]
 * @param {string|null} [params.email=null]
 * @returns {Promise<{ inApp: boolean, fcm: object, sms: object, email: object }>}
 */
export async function dispatchFarmerNotification({
  userId,
  type = 'GENERAL',
  title,
  body,
  smsBody = null,
  link = null,
  meta = {},
  phoneNumber = null,
  forceSms = false,
  email = null,
}) {
  const results = {
    inApp: false,
    fcm: { attempted: false, success: false },
    sms: { attempted: false, success: false },
    email: { attempted: false, success: false },
  };

  // Retrieve user preferences and contact tokens
  let user = null;
  let farmerProfile = null;
  try {
    [user, farmerProfile] = await Promise.all([
      User.findById(userId).select(
        'displayName name fcmToken phoneNumber email smsNotificationEnabled pushNotificationEnabled inAppNotificationEnabled emailNotificationEnabled'
      ),
      FarmerProfile.findOne({ userId }).select('+phoneNumber email displayName'),
    ]);
  } catch (err) {
    console.error('[NotificationDispatcher] Failed to lookup user/profile for notification dispatch:', err.message);
  }

  // 1. In-App Notification (Database + WebSocket) - respects inAppNotificationEnabled
  if (!user || user.inAppNotificationEnabled !== false) {
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
  }

  // 2. Firebase Cloud Messaging (Push)
  if (user && user.pushNotificationEnabled && user.fcmToken) {
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
  const targetPhone = phoneNumber || user?.phoneNumber || farmerProfile?.phoneNumber;
  const isSmsEnabled = forceSms || (user ? user.smsNotificationEnabled !== false : Boolean(targetPhone));

  if (isSmsEnabled && targetPhone) {
    results.sms.attempted = true;
    try {
      const message = smsBody || `${title}: ${body}`.substring(0, 155);
      const smsRes = await talkSasaService.sendSms({
        to: targetPhone,
        message,
        topic: type,
        force: forceSms,
      });
      results.sms = { attempted: true, ...smsRes };
    } catch (err) {
      results.sms = { attempted: true, success: false, error: err.message };
    }
  }

  // 4. Email Notification (Email API / Gmail SMTP)
  const targetEmail = email || user?.email || farmerProfile?.email;
  const isEmailEnabled = user ? user.emailNotificationEnabled !== false : Boolean(targetEmail);

  if (isEmailEnabled && targetEmail) {
    results.email.attempted = true;
    try {
      const recipientName = user?.displayName || user?.name || farmerProfile?.displayName || 'Farmer';
      let emailRes;

      if (type === 'FARM_ADVISORY') {
        emailRes = await sendFarmAdvisoryEmail({
          email: targetEmail,
          name: recipientName,
          title,
          body,
          severity: meta.severity || 'moderate',
          label: meta.label || 'Vegetation Observation',
          observationDate: meta.observationDate || new Date().toISOString(),
          link: link || '/farmer/dashboard',
        });
      } else if (type === 'ASSISTANCE_REFERRAL') {
        emailRes = await sendAssistanceConfirmationEmail({
          email: targetEmail,
          name: recipientName,
          organizationName: meta.organizationName || 'Agricultural Support Partner',
          assistanceType: meta.assistanceType || 'INPUTS_AND_TRAINING',
          referenceNumber: meta.referenceNumber || `REF-${Date.now().toString(36).toUpperCase()}`,
          notes: meta.notes || '',
        });
      } else {
        emailRes = await sendGeneralNotificationEmail({
          email: targetEmail,
          name: recipientName,
          title,
          body,
          link,
        });
      }

      results.email = { attempted: true, ...emailRes };
    } catch (err) {
      results.email = { attempted: true, success: false, error: err.message };
    }
  }

  return results;
}
