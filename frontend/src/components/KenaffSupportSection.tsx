import React, { useState } from 'react';
import { KENAFF_CONTACTS } from '../utils/kenaffUtils';

interface KenaffSupportSectionProps {
  defaultOpen?: boolean;
  buttonLabel?: string;
  style?: React.CSSProperties;
}

export const KenaffSupportSection: React.FC<KenaffSupportSectionProps> = ({
  defaultOpen = false,
  buttonLabel = 'Get Support / Seek Remedy',
  style
}) => {
  const [showSection, setShowSection] = useState(defaultOpen);

  return (
    <div style={{ marginTop: '15px', marginBottom: '15px', ...style }}>
      {!showSection && (
        <button
          onClick={() => setShowSection(true)}
          style={{
            padding: '10px 18px',
            backgroundColor: '#15803d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🤝</span> {buttonLabel}
        </button>
      )}

      {showSection && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            marginTop: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#166534', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌾</span> KENAFF Support
            </h3>
            {!defaultOpen && (
              <button
                onClick={() => setShowSection(false)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Hide Support Section
              </button>
            )}
          </div>

          <p style={{ margin: '0 0 15px 0', color: '#166534', fontSize: '0.95rem', lineHeight: '1.5' }}>
            If you want external support about a farmer-related complaint or business dispute, you can choose to contact KENAFF directly.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', color: '#15803d', fontSize: '0.9rem', marginBottom: '15px' }}>
            <div>
              <strong>Phone:</strong><br />
              <a href={`tel:${KENAFF_CONTACTS.primaryPhone}`} style={{ color: '#15803d', textDecoration: 'none', fontWeight: 'bold' }}>
                {KENAFF_CONTACTS.primaryPhoneDisplay}
              </a>
            </div>
            <div>
              <strong>Phone:</strong><br />
              <a href={`tel:${KENAFF_CONTACTS.alternativePhone}`} style={{ color: '#15803d', textDecoration: 'none', fontWeight: 'bold' }}>
                {KENAFF_CONTACTS.alternativePhoneDisplay}
              </a>
            </div>
            <div>
              <strong>Email:</strong><br />
              <a href={`mailto:${KENAFF_CONTACTS.email}`} style={{ color: '#15803d', textDecoration: 'none', fontWeight: 'bold' }}>
                {KENAFF_CONTACTS.email}
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '15px' }}>
            <a
              href={KENAFF_CONTACTS.contactUsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '9px 18px',
                backgroundColor: '#166534',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              KENAFF Contact Us ↗
            </a>
          </div>

          <div style={{ padding: '10px 12px', backgroundColor: '#dcfce7', borderRadius: '6px', border: '1px solid #86efac', color: '#14532d', fontSize: '0.85rem', lineHeight: '1.4' }}>
            ℹ <strong>Notice:</strong> MavunoTrust does not automatically submit your complaint to KENAFF. You choose whether to contact KENAFF for external support.
          </div>
        </div>
      )}
    </div>
  );
};
