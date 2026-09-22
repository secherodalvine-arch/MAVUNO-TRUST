import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVerifiedDealersApi } from '../services/dealerService';
import type { DealerProfileDTO } from '../services/dealerService';

export const DealerSearchPage: React.FC = () => {
  const [dealers, setDealers] = useState<Partial<DealerProfileDTO>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVerifiedDealersApi();
      setDealers(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load verified dealers. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Common crop filter shortcuts
  const popularCrops = ['ALL', 'Maize', 'Beans', 'Potatoes', 'Wheat', 'Coffee'];

  // Client-side filtering across public verified dealers
  const filteredDealers = dealers.filter(dealer => {
    const term = searchTerm.toLowerCase().trim();
    
    // Check text search matching name, licence, crops, or counties
    const matchesName = 
      (dealer.businessName && dealer.businessName.toLowerCase().includes(term)) ||
      (dealer.displayName && dealer.displayName.toLowerCase().includes(term));

    const matchesLicence = 
      dealer.licence?.licenceNumber && dealer.licence.licenceNumber.toLowerCase().includes(term);

    const matchesCrops = 
      dealer.cropsDealt && dealer.cropsDealt.some(c => c.toLowerCase().includes(term));

    const matchesCounties = 
      (dealer.countiesServed && dealer.countiesServed.some(c => c.toLowerCase().includes(term))) ||
      (dealer.generalOperatingArea && dealer.generalOperatingArea.toLowerCase().includes(term));

    const matchesSearchTerm = !term || matchesName || matchesLicence || matchesCrops || matchesCounties;

    // Check crop filter pill
    const matchesCropPill = 
      selectedCrop === 'ALL' || 
      (dealer.cropsDealt && dealer.cropsDealt.some(c => c.toLowerCase() === selectedCrop.toLowerCase()));

    return matchesSearchTerm && matchesCropPill;
  });

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.8rem', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', marginBottom: '8px' }}>
          🔍 Farmer Rights & Trade Hub
        </div>
        <h1 style={{ fontSize: '2rem', color: '#111827', margin: '0 0 8px 0', fontWeight: 'bold' }}>
          Search Verified Dealers & Brokers
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem', margin: 0, lineHeight: '1.5' }}>
          Find active verified produce dealers and brokers operating across Kenya's agricultural counties.
        </p>
      </div>

      {/* Regulatory Verification Notice & Disclaimer */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.2rem' }}>🛡️</span>
          <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>Verification Notice & Responsible Engagement</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.875rem', lineHeight: '1.5' }}>
          <li><strong>Factual Verification:</strong> Verification status is derived directly from regulatory compliance checks against recorded licence data.</li>
          <li><strong>No Outcome Guarantee:</strong> MavunoTrust does not guarantee transaction outcomes or private financial agreements.</li>
          <li><strong>Farmer Guidance:</strong> Review dealer crop interests, purchasing capacity, and operating counties before initiating transactions or submitting formal offers.</li>
        </ul>
      </div>

      {/* Search Bar & Filter Controls */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <label htmlFor="dealer-search-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              Search Dealers / Brokers
            </label>
            <input
              id="dealer-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by business name, licence number, crop, or county..."
              style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {searchTerm && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => setSearchTerm('')}
                style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Quick Crop Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Filter by Crop:</span>
          {popularCrops.map(crop => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: selectedCrop === crop ? '1px solid #15803d' : '1px solid #cbd5e1',
                backgroundColor: selectedCrop === crop ? '#dcfce7' : '#f8fafc',
                color: selectedCrop === crop ? '#15803d' : '#475569',
              }}
            >
              {crop === 'ALL' ? 'All Crops' : crop}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {!loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0, fontWeight: 'bold' }}>
            Verified Active Dealers ({filteredDealers.length})
          </h2>
          {(searchTerm || selectedCrop !== 'ALL') && (
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Filtered by: {searchTerm ? `"${searchTerm}" ` : ''}{selectedCrop !== 'ALL' ? `[Crop: ${selectedCrop}]` : ''}
            </span>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔄</div>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Loading verified dealers...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{ padding: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '1.1rem', margin: '0 0 8px 0' }}>Unable to load dealer directory</p>
          <p style={{ color: '#991b1b', margin: '0 0 16px 0', fontSize: '0.95rem' }}>{error}</p>
          <button
            onClick={fetchDealers}
            style={{ padding: '10px 20px', backgroundColor: '#b91c1c', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Retry Loading Dealers
          </button>
        </div>
      )}

      {/* Empty Search Filter State */}
      {!loading && !error && dealers.length > 0 && filteredDealers.length === 0 && (
        <div style={{ padding: '40px', backgroundColor: '#f9fafb', border: '1px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: '#374151', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            No verified dealers match your current search criteria.
          </p>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '0.95rem' }}>
            Try searching for a different business name, crop (e.g., Maize), or county (e.g., Nakuru).
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCrop('ALL'); }}
            style={{ padding: '10px 20px', backgroundColor: '#15803d', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* No Verified Dealers Registered State */}
      {!loading && !error && dealers.length === 0 && (
        <div style={{ padding: '40px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: '#374151', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            No active verified dealers currently found.
          </p>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
            Registered dealers undergo AFA licence compliance verification before appearing in this directory.
          </p>
        </div>
      )}

      {/* Dealer Results Grid */}
      {!loading && !error && filteredDealers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredDealers.map(dealer => {
            const dealerId = dealer.userId || dealer._id;
            const isVerifiedActive = dealer.licence?.status === 'ACTIVE';

            return (
              <div
                key={dealerId}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px'
                }}
              >
                <div>
                  {/* Header & Verification Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 'bold', lineHeight: '1.3' }}>
                      {dealer.businessName || dealer.displayName}
                    </h3>
                  </div>

                  {/* Verification Status Pill */}
                  <div style={{ marginBottom: '14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: isVerifiedActive ? '#dcfce7' : '#f3f4f6',
                        color: isVerifiedActive ? '#15803d' : '#4b5563',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        border: isVerifiedActive ? '1px solid #86efac' : '1px solid #e5e7eb'
                      }}
                    >
                      {isVerifiedActive ? '✅ Verified (Active)' : `Verification Status: ${dealer.licence?.status || 'PENDING'}`}
                    </span>
                  </div>

                  {/* Bio / Summary if available */}
                  {dealer.bio && (
                    <p style={{ margin: '0 0 14px 0', color: '#475569', fontSize: '0.875rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {dealer.bio}
                    </p>
                  )}

                  {/* Public Business Details */}
                  <div style={{ display: 'grid', gap: '8px', fontSize: '0.875rem', color: '#334155', marginBottom: '16px' }}>
                    {dealer.licence?.licenceNumber && (
                      <div>
                        <strong>Licence ID:</strong> <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{dealer.licence.licenceNumber}</span>
                      </div>
                    )}
                    {dealer.countiesServed && dealer.countiesServed.length > 0 && (
                      <div>
                        <strong>Counties Served:</strong> {dealer.countiesServed.join(', ')}
                      </div>
                    )}
                    {dealer.generalOperatingArea && !dealer.countiesServed?.length && (
                      <div>
                        <strong>Operating Region:</strong> {dealer.generalOperatingArea}
                      </div>
                    )}
                    {dealer.cropsDealt && dealer.cropsDealt.length > 0 && (
                      <div>
                        <strong>Crops Dealt:</strong>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {dealer.cropsDealt.map(crop => (
                            <span key={crop} style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {crop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {dealer.purchasingCapacityKg ? (
                      <div style={{ marginTop: '2px' }}>
                        <strong>Est. Capacity:</strong> {dealer.purchasingCapacityKg.toLocaleString()} Kg / month
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate(`/dealers/${dealerId}`)}
                    style={{ flex: 1, minWidth: '100px', padding: '9px 12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    View Profile
                  </button>

                  {isVerifiedActive && (
                    <button
                      onClick={() => navigate(`/farmer/offers/create/${dealerId}`)}
                      style={{ flex: 1, minWidth: '100px', padding: '9px 12px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Make Offer
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/messages')}
                    style={{ padding: '9px 12px', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                    title="Start Private Conversation"
                  >
                    💬 Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DealerSearchPage;
