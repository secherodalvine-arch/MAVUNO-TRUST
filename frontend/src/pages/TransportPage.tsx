import React from 'react';
import { TransportIntelligenceSection } from '../components/TransportIntelligenceSection';
import { Truck, Shield, HelpCircle, Layers } from 'lucide-react';

export const TransportPage: React.FC = () => {
  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #16a34a, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              Transport-Cost Intelligence
            </h1>
            <p className="page-subtitle">
              Transparent transit benchmarks calculated with OpenStreetMap road networks, OSRM routing, and verified community logs.
            </p>
          </div>
        </div>
      </div>

      {/* Main Intelligence Section */}
      <TransportIntelligenceSection />

      {/* Trust & Methodology Information */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 20,
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#38bdf8' }}>
            <Layers size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>OpenStreetMap &amp; OSRM Road Precision</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Distances are computed using actual drivable road networks via Open Source Routing Machine (OSRM) over OpenStreetMap data,
            never straight-line approximations. This accounts for genuine highway geometry, county roads, and mountain passes across Kenya.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#4ade80' }}>
            <Shield size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Anti-Manipulation &amp; Privacy</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Shared estimates filter out coordinated price tampering, statistical outliers, and unverified spikes.
            Private farm coordinates and contributor receipts are strictly protected and never displayed to other users.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#facc15' }}>
            <HelpCircle size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Negotiation Benchmark</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Estimates provide market transparency to protect you from broker exploitation, but do not bind private hauliers.
            Always confirm vehicle roadworthiness and agree on loading terms before dispatch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransportPage;
