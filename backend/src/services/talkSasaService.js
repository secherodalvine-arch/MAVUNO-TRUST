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
    this.apiKey = process.env.TALKSASA_API_KEY || null;
    this.senderId = process.env.TALKSASA_SENDER_ID || 'MavunoTrust';
    this.apiUrl = process.env.TALKSASA_API_URL || 'https://api.talksasa.com/v1/send/sms';
  }

  isConfigured() {
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
      const payload = {
        sender_id: this.senderId,
        recipient: normalizedPhone,
        message: message.trim(),
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          code: `HTTP_${response.status}`,
          message: `TalkSasa responded with HTTP ${response.status}: ${errorText}`,
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
