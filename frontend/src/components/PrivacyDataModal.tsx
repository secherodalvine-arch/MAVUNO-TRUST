import React from 'react';

interface PrivacyDataModalProps {
  onClose: () => void;
}

export const PrivacyDataModal: React.FC<PrivacyDataModalProps> = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Privacy & Data Use</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <section style={{ marginBottom: '20px' }}>
          <h4>What information is collected & Why it is collected</h4>
          <p style={{ fontSize: '0.9rem', color: '#444' }}>
            We collect your production cost estimates and expected yield. This information helps you calculate your total production cost, cost per unit, break-even price and estimated profit or loss.
          </p>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h4>How it is used & Who can access it</h4>
          <p style={{ fontSize: '0.9rem', color: '#444' }}>
            We process information for specified purposes and apply appropriate privacy and security safeguards. Your sensitive financial information is protected. Only you can access your saved calculations.
          </p>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h4>Data Separation</h4>
          <p style={{ fontSize: '0.9rem', color: '#444' }}>
            Public profile information is completely separate from private financial information.
          </p>
        </section>

        <section>
          <h4>Privacy Distinctions</h4>
          <ul style={{ fontSize: '0.9rem', color: '#444' }}>
            <li><strong>PRIVATE:</strong> Production expenses, cost calculations, production cost breakdown, break-even calculation, estimated profit/loss, and what-if scenarios.</li>
            <li><strong>SHARED:</strong> Information you deliberately choose to provide to another user during a future transaction or negotiation.</li>
            <li><strong>PUBLIC:</strong> Only information you deliberately make public (like your basic farmer profile).</li>
          </ul>
        </section>

        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
};
