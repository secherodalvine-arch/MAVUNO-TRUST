import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Briefcase, Building2, Search, ArrowRight, Receipt, MessageSquare,
  Sprout, ShieldCheck, MapPin, Handshake, Target,
} from 'lucide-react';
import { getPublicCropListingsApi, type CropListingDTO } from '../services/cropService';
import LoadSpinner from '../components/LoadSpinner';

export const DealerDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<CropListingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getPublicCropListingsApi()
      .then((data) => {
        if (isMounted) {
          setListings(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) setListings([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-wrapper">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong style={{ color: 'var(--color-text-primary)' }}>{user?.fullName}</strong>
          </p>
        </div>
      </div>

      {/* Available Crop Listings Highlight Section */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#f8fafc',
            }}>
              Available Crop Listings
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Fresh harvests directly from farmers ready for purchase & dealer offers.
            </p>
          </div>

          <Link
            to="/dealer/crop-match"
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Browse All Crop Matches <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadSpinner fullPage={false} size="sm" text="Loading crop listings..." />
        ) : listings.length === 0 ? (
          <div className="state-card" style={{ padding: '28px 20px' }}>
            <Sprout size={28} />
            <span className="state-title">No crop listings published yet</span>
            <span className="state-desc">
              When farmers post active harvests in your operating regions, they will appear here.
            </span>
            <Link to="/dealer/crop-match" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
              Check Farmer Crop Match
            </Link>
          </div>
        ) : (
          <div
            className="results-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
            {listings.slice(0, 3).map((item, idx) => {
              const farmerDisplayName = typeof item.farmerId === 'object' && item.farmerId !== null && (item.farmerId as any).fullName
                ? (item.farmerId as any).fullName
                : (item as any).farmerName || 'Verified Producer';

              return (
                <div
                  key={item._id || idx}
                  className="price-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.2rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    background: '#131f16'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e8f5ec' }}>
                        {item.cropName}
                      </h3>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ade80',
                        border: '1px solid rgba(34, 197, 94, 0.25)'
                      }}>
                        <ShieldCheck size={11} /> Verified
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '12px' }}>
                      <MapPin size={13} style={{ color: '#5ec285', flexShrink: 0 }} />
                      <span>
                        {item.generalArea ? `${item.generalArea}, ` : ''}{item.county || 'Kenya'}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Available
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                          {item.estimatedQuantity?.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.unit}</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Price Target
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                          {item.priceExpectationPerUnit != null ? (
                            `KSh ${item.priceExpectationPerUnit.toLocaleString()}`
                          ) : (
                            'Negotiable'
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
                      Producer: <strong style={{ color: '#e2e8f0' }}>{farmerDisplayName}</strong>
                    </div>
                  </div>

                  <Link
                    to="/dealer/crop-match"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Handshake size={14} /> Make Offer &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dashboard cards */}
      <div className="dash-grid">
        <Link to="/dealer/profile" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
            <Briefcase size={20} />
          </div>
          <span className="dash-card-title">Business Profile</span>
          <p className="dash-card-desc">Configure operating regions, crops dealt, purchasing capacity, and licence number.</p>
          <span className="dash-card-link">Edit Profile <ArrowRight size={13} /></span>
        </Link>

        <Link to="/dealer/profile" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc' }}>
            <Building2 size={20} />
          </div>
          <span className="dash-card-title">AFA Verification</span>
          <p className="dash-card-desc">Licence status check powered by the AFA Verification Provider.</p>
          <span className="dash-card-link">View Status <ArrowRight size={13} /></span>
        </Link>

        <Link to="/dealer/crop-match" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(39,137,79,0.1)', color: '#5ec285' }}>
            <Search size={20} />
          </div>
          <span className="dash-card-title">Farmer Crop Match</span>
          <p className="dash-card-desc">Search verified farmer crop listings by county and crop type.</p>
          <span className="dash-card-link">Search Verified Crops <ArrowRight size={13} /></span>
        </Link>

        <Link to="/dealer/demands" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <Target size={20} />
          </div>
          <span className="dash-card-title">Buyer Demands</span>
          <p className="dash-card-desc">Post your specific crop requirements so farmers can match their harvests to you.</p>
          <span className="dash-card-link">Manage Demands <ArrowRight size={13} /></span>
        </Link>

        <Link to="/offers" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(245,166,35,0.1)', color: '#f8c06a' }}>
            <Search size={20} />
          </div>
          <span className="dash-card-title">Trade Offers</span>
          <p className="dash-card-desc">Review incoming offers and manage counteroffers with farmers.</p>
          <span className="dash-card-link">View Offers <ArrowRight size={13} /></span>
        </Link>

        <Link to="/messages" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
            <MessageSquare size={20} />
          </div>
          <span className="dash-card-title">Messages</span>
          <p className="dash-card-desc">Private secure real-time chat with farmers.</p>
          <span className="dash-card-link">Open Messages <ArrowRight size={13} /></span>
        </Link>

        <Link to="/transactions" className="dash-card" style={{ textDecoration: 'none' }}>
          <div className="dash-card-icon" style={{ background: 'rgba(52,168,98,0.1)', color: '#5ec285' }}>
            <Receipt size={20} />
          </div>
          <span className="dash-card-title">Transactions</span>
          <p className="dash-card-desc">Track completed deals, payment status, and delivery records.</p>
          <span className="dash-card-link">View Transactions <ArrowRight size={13} /></span>
        </Link>
      </div>
    </div>
  );
};
