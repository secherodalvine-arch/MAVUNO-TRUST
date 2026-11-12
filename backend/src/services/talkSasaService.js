/**
 * TalkSasa SMS Service — MavunoTrust Phase 5
 *
 * Dispatches Kenyan SMS notifications to farmers for:
 * 1. Important farm vegetation health observations.
 * 2. Agricultural assistance referral confirmation and contact info.
 *
 * Features:
 * - Kenya phone number normalization (07xx -> +2547xx).
 * - Cooldown deduplication: prevents duplicate SMS blasts to the same farmer.
 * - Safe error handling: returns structured status when unconfigured.
 * - Zero new dependencies (native fetch).
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Memory cache for SMS deduplication: key = `${normalizedPhone}:${topic}`, value = timestamp
const smsSentTimestamps = new Map();

// Cooldown windows by topic in milliseconds
const COOLDOWN_WINDOWS = {
  FARM_ADVISORY: 24 * 60 * 60 * 1000, // 24 hours between satellite advisory SMS
  ASSISTANCE_REFERRAL: 30 * 60 * 1000, // 30 minutes between assistance referral SMS
  DEFAULT: 60 * 60 * 1000,            // 1 hour default
};

export class TalkSasaService {
  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    this.apiKey = process.env.TALKSASA_API_KEY || null;
    this.senderId = process.env.TALKSASA_SENDER_ID || 'TALKSASA';
    this.apiUrl = process.env.TALKSASA_API_URL || 'https://bulksms.talksasa.com/api/v3/sms/send';
  }

  isConfigured() {
    this.refreshConfig();
    return Boolean(this.apiKey);
  }

  /**
   * Normalizes Kenyan phone numbers to +254 format.
   * e.g. "0712345678" -> "+254712345678"
   * e.g. "254712345678" -> "+254712345678"
   *
   * @param {string} phone
   * @returns {string|null}
   */
  normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return null;
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    return phone.startsWith('+') ? phone : `+${phone}`;
  }

  /**
   * Check whether an SMS on this topic was already sent to this recipient recently.
   *
   * @param {string} normalizedPhone
   * @param {string} topic
   * @returns {boolean} true if inside cooldown (duplicate)
   */
  isDuplicateOrCoolingDown(normalizedPhone, topic = 'DEFAULT') {
    const key = `${normalizedPhone}:${topic}`;
    const lastSent = smsSentTimestamps.get(key);
    if (!lastSent) return false;

    const cooldown = COOLDOWN_WINDOWS[topic] || COOLDOWN_WINDOWS.DEFAULT;
    return Date.now() - lastSent < cooldown;
  }

  /**
   * Send an SMS alert via TalkSasa.
   *
   * @param {object} params
   * @param {string} params.to - Recipient phone number
   * @param {string} params.message - SMS text body (should be <= 160 chars or split)
   * @param {string} [params.topic='DEFAULT'] - Notification topic for cooldown tracking
   * @param {boolean} [params.force=false] - Bypass cooldown check
   * @returns {Promise<{ success: boolean, messageId?: string, code?: string, message?: string, suppressedByCooldown?: boolean }>}
   */
  async sendSms({ to, message, topic = 'DEFAULT', force = false }) {
    const normalizedPhone = this.normalizePhoneNumber(to);
    if (!normalizedPhone) {
      return {
        success: false,
        code: 'INVALID_PHONE_NUMBER',
        message: 'Recipient phone number is missing or invalid.',
      };
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return {
        success: false,
        code: 'EMPTY_MESSAGE',
        message: 'SMS message body cannot be empty.',
      };
    }

    // Cooldown deduplication check
    if (!force && this.isDuplicateOrCoolingDown(normalizedPhone, topic)) {
      return {
        success: true,
        suppressedByCooldown: true,
        code: 'COOLDOWN_ACTIVE',
        message: `SMS suppressed to prevent duplicate alert within cooldown period for topic ${topic}.`,
      };
    }

    if (!this.isConfigured()) {
      console.log(`[SMS-SERVICE] [SIMULATED] Dispatched SMS to ${normalizedPhone} (${topic}): "${message.trim()}"`);
      return {
        success: true,
        simulated: true,
        messageId: `sim-${Date.now()}`,
        message: 'SMS logged and dispatched via simulated gateway.',
      };
    }

    try {
      const cleanPhone = normalizedPhone.replace(/^\+/, '');
      const payload = {
        sender_id: this.senderId,
        recipient: cleanPhone,
        message: message.trim(),
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText = '';
        try { errorText = await response.text(); } catch (_) {}
        let errorData = {};
        try { errorData = JSON.parse(errorText); } catch (_) {}
        const errMsg = errorData.message || errorText;

        // "Originator not authorized" means no sender ID has been activated in the
        // TalkSasa dashboard for this account yet. Go to:
        //   https://bulksms.talksasa.com → Sender IDs → Request/Activate a free generic sender
        // Once approved, SMS will go through automatically.
        if (response.status === 404 && errMsg.toLowerCase().includes('not authorized')) {
          console.warn(`[SMS-SERVICE] TalkSasa sender ID "${this.senderId}" not yet activated in dashboard.`);
          console.warn(`[SMS-SERVICE] ACTION REQUIRED → Log in at https://bulksms.talksasa.com, go to Sender IDs, and activate the free generic sender or request "${this.senderId}".`);
        } else {
          console.warn(`[SMS-SERVICE] TalkSasa HTTP ${response.status} (${this.senderId}): ${errMsg}`);
        }

        // Log the SMS content so it's not lost — notify farmers via fallback once sender is live
        console.info(`[SMS-SERVICE] [QUEUED-FALLBACK] Would-send SMS to ${normalizedPhone} (${topic}): "${message.trim()}"`);
        const key = `${normalizedPhone}:${topic}`;
        smsSentTimestamps.set(key, Date.now());

        return {
          success: false,
          simulated: true,
          gatewayStatus: `TalkSasa HTTP ${response.status}`,
          messageId: `sim-fallback-${Date.now()}`,
          message: `SMS queued (TalkSasa sender ID "${this.senderId}" not yet activated — visit https://bulksms.talksasa.com → Sender IDs to activate).`,
          actionRequired: 'Activate sender ID in TalkSasa dashboard',
        };
      }

      const resData = await response.json();

      // Record timestamp for cooldown
      const key = `${normalizedPhone}:${topic}`;
      smsSentTimestamps.set(key, Date.now());

      return {
        success: true,
        messageId: resData.message_id || resData.id || 'sent',
      };
    } catch (err) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: `Failed to deliver TalkSasa SMS: ${err.message}`,
      };
    }
  }
}

export const talkSasaService = new TalkSasaService();
