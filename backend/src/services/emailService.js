/**
 * Email Service — MavunoTrust Notification System
 *
 * Implements multi-channel email delivery using either:
 * 1. The dedicated MavunoTrust Email API relay (FastAPI microservice at EMAIL_API_URL).
 * 2. Direct Gmail SMTP via Nodemailer (with TLS certificate proxy fallback).
 *
 * Referenced from REINOGENTS email-api architecture with MavunoTrust green branding.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || GMAIL_USER;
const EMAIL_API_URL = (process.env.EMAIL_API_URL || '').trim().replace(/\/+$/, '');
const EMAIL_API_KEY = (process.env.EMAIL_API_KEY || '').trim();

let smtpTransporter = null;

function getSmtpTransporter() {
  if (!smtpTransporter && GMAIL_USER && GMAIL_APP_PASSWORD) {
    smtpTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Prevents failure behind local Windows TLS proxies
      },
    });
  }
  return smtpTransporter;
}

/**
 * Renders a responsive, branded HTML email template for MavunoTrust.
 */
function renderMavunoEmail({ title, greeting, details = [], ctaUrl = '', ctaText = '', footer = '' }) {
  const detailParagraphs = details
    .map((line) => `<p style="margin:0 0 14px;line-height:1.6;color:#374151;">${line.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const ctaButton = ctaUrl && ctaText
    ? `
      <div style="text-align:center;margin:28px 0 22px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 2px 6px rgba(22,163,74,0.3);">
          ${ctaText}
        </a>
      </div>`
    : '';

  const textBody = [
    greeting,
    '',
    ...details,
    '',
    ctaUrl ? `Action: ${ctaUrl}` : '',
    '',
    footer,
  ].filter(Boolean).join('\n');

  const htmlBody = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;">
          MavunoTrust Kenya
        </span>
      </div>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;color:#111827;">${title}</h1>
      <p style="margin:0 0 16px;line-height:1.6;color:#374151;font-size:15px;">${greeting}</p>
      ${detailParagraphs}
      ${ctaButton}
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0 18px;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
        ${footer || 'This message was delivered by MavunoTrust agricultural notification system.'}
      </p>
    </div>
  </div>
</body>
</html>`;

  return { textBody, htmlBody };
}

/**
 * Dispatch an email through Email API relay or direct SMTP.
 */
export async function sendEmail({ to, subject, html, text = '', replyTo = null }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return { success: false, code: 'INVALID_RECIPIENT', message: 'Valid recipient email required.' };
  }

  // 1. Try sending via Email API microservice if configured
  if (EMAIL_API_URL && EMAIL_API_KEY) {
    try {
      const response = await fetch(`${EMAIL_API_URL}/send_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${EMAIL_API_KEY}`,
        },
        body: JSON.stringify({
          to_email: to,
          subject,
          html,
          text,
          reply_to: replyTo || SUPPORT_EMAIL || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, provider: 'email-api', data };
      }
    } catch (apiErr) {
      console.warn('[EmailService] Email API relay unreachable, falling back to direct SMTP:', apiErr.message);
    }
  }

  // 2. Fallback to direct Gmail SMTP
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `MavunoTrust <${GMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        replyTo: replyTo || SUPPORT_EMAIL,
      });
      return { success: true, provider: 'smtp-gmail', messageId: info.messageId };
    } catch (smtpErr) {
      console.error('[EmailService] Gmail SMTP delivery failed:', smtpErr.message);
      return { success: false, code: 'SMTP_ERROR', message: smtpErr.message };
    }
  }

  return {
    success: false,
    code: 'NOT_CONFIGURED',
    message: 'Neither Email API nor Gmail SMTP credentials are configured.',
  };
}

/**
 * Send Farm Health / Satellite Advisory Email.
 */
export async function sendFarmAdvisoryEmail({
  email,
  name = 'Farmer',
  title,
  body,
  severity = 'moderate',
  label = 'Vegetation Observation',
  observationDate = new Date().toISOString(),
  link = '/farmer/dashboard',
}) {
  const greeting = `Hi ${name || 'Farmer'},`;
  const formattedDate = new Date(observationDate).toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const details = [
    `We have completed a satellite vegetation scan over your registered farm parcel for <strong>${formattedDate}</strong>.`,
    `<strong>Observation Status:</strong> ${label} (${severity.toUpperCase()})`,
    body,
    'Our Smart Farm Advisor has generated specific crop care recommendations and weather guidance to help you protect your harvest.',
  ];

  const fullUrl = link.startsWith('http') ? link : `https://mavunotrust.onrender.com${link}`;
  const { textBody, htmlBody } = renderMavunoEmail({
    title,
    greeting,
    details,
    ctaUrl: fullUrl,
    ctaText: 'Review Dashboard Advisory',
    footer: 'MavunoTrust Automated Satellite Monitoring — strictly private farm coordinates.',
  });

  return sendEmail({
    to: email,
    subject: `[MavunoTrust] ${title}`,
    html: htmlBody,
    text: textBody,
  });
}

/**
 * Send Agricultural Assistance Referral Confirmation Email.
 */
export async function sendAssistanceConfirmationEmail({
  email,
  name = 'Farmer',
  organizationName,
  assistanceType,
  referenceNumber,
  notes = '',
}) {
  const greeting = `Hi ${name || 'Farmer'},`;
  const details = [
    `Your agricultural assistance request to <strong>${organizationName}</strong> has been successfully registered.`,
    `<strong>Reference Number:</strong> ${referenceNumber}`,
    `<strong>Assistance Category:</strong> ${assistanceType.replace(/_/g, ' ')}`,
    notes ? `<strong>Your Notes:</strong> ${notes}` : '',
    `A field agronomist from ${organizationName} will reach out to you using your registered phone number.`,
  ].filter(Boolean);

  const { textBody, htmlBody } = renderMavunoEmail({
    title: `Agricultural Support Referral: ${organizationName}`,
    greeting,
    details,
    ctaUrl: 'https://mavunotrust.onrender.com/farmer/profile',
    ctaText: 'View Profile & Support Status',
    footer: 'For urgent inquiries, contact MavunoTrust support or reply directly to this email.',
  });

  return sendEmail({
    to: email,
    subject: `[MavunoTrust] Referral Confirmation — ${organizationName}`,
    html: htmlBody,
    text: textBody,
  });
}

/**
 * Send General Notification Email.
 */
export async function sendGeneralNotificationEmail({
  email,
  name = 'Farmer',
  title,
  body,
  link = null,
}) {
  const greeting = `Hi ${name || 'there'},`;
  const details = [body];
  const ctaUrl = link ? (link.startsWith('http') ? link : `https://mavunotrust.onrender.com${link}`) : '';

  const { textBody, htmlBody } = renderMavunoEmail({
    title,
    greeting,
    details,
    ctaUrl,
    ctaText: ctaUrl ? 'Open Notification' : '',
    footer: 'MavunoTrust Platform Notifications.',
  });

  return sendEmail({
    to: email,
    subject: `[MavunoTrust] ${title}`,
    html: htmlBody,
    text: textBody,
  });
}

