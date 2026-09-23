import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVerifiedDealersApi } from '../services/dealerService';
import type { DealerProfileDTO } from '../services/dealerService';
import { createOrGetConversation } from '../services/chatService';
import {
  Search, Users, Shield, CheckCircle2, MapPin,
  Sprout, MessageSquare, AlertTriangle, X, RefreshCw, HandshakeIcon,
} from 'lucide-react';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/pages.css';

export const DealerSearchPage: React.FC = () => {
  const [dealers, setDealers] = useState<Partial<DealerProfileDTO>[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const navigate = useNavigate();

  useEffect(() => { fetchDealers(); }, []);

  const handleStartChat = async (dealer: Partial<DealerProfileDTO>) => {
    const targetId = dealer.userId || dealer._id;
    if (!targetId) return;
    try {
      setStartingChatId(targetId);
      const conv = await createOrGetConversation(targetId);
      navigate(`/messages?conversationId=${conv._id}`);
    } catch (err: any) {
      console.error('Failed to open chat from dealer search:', err);
      navigate(`/messages?recipientId=${targetId}&name=${encodeURIComponent(dealer.displayName || dealer.businessName || '')}`);
    } finally {
      setStartingChatId(null);
    }
  };

  const fetchDealers = async () => {
    setLoading(true); setError(null);
    try { setDealers(await getVerifiedDealersApi()); }
    catch (err: any) { setError(err.response?.data?.error?.message || 'Failed to load verified dealers.'); }
    finally { setLoading(false); }
  };

  const popularCrops = ['ALL', 'Maize', 'Beans', 'Potatoes', 'Wheat', 'Coffee'];

  const filteredDealers = dealers.filter(d => {
    const term = searchTerm.toLowerCase().trim();
    const matchesText = !term ||
      (d.businessName && d.businessName.toLowerCase().includes(term)) ||
      (d.displayName && d.displayName.toLowerCase().includes(term)) ||
      (d.licence?.licenceNumber && d.licence.licenceNumber.toLowerCase().includes(term)) ||
      (d.cropsDealt && d.cropsDealt.some(c => c.toLowerCase().includes(term))) ||
      (d.countiesServed && d.countiesServed.some(c => c.toLowerCase().includes(term))) ||
      (d.generalOperatingArea && d.generalOperatingArea.toLowerCase().includes(term));
    const matchesCrop = selectedCrop === 'ALL' ||
      (d.cropsDealt && d.cropsDealt.some(c => c.toLowerCase() === selectedCrop.toLowerCase()));
    return matchesText && matchesCrop;
  });

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon blue">
          <Users size={22} />
        </div>
        <div>
          <h1 className="page-title">Find Verified Dealers</h1>
          <p className="page-subtitle">Browse AFA-verified produce dealers and brokers operating across Kenya's agricultural counties.</p>
        </div>
      </div>

      {/* Verification notice */}
      <div className="info-notice" style={{ marginBottom: 20 }}>
        <Shield size={15} />
        <span>
          <strong>Verification Notice:</strong> All dealers listed here have passed AFA licence compliance checks.
          MavunoTrust does not guarantee transaction outcomes. Review crop interests, capacity, and counties before initiating a deal.
        </span>
      </div>

      {/* Search + Filters */}
      <div className="page-card page-card--spaced">
        <div className="search-row">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              id="dealer-search-input"
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, licence number, crop, or county…"
            />
          </div>
          {searchTerm && (
            <button className="btn-sm btn-sm-outline" onClick={() => setSearchTerm('')}>
              <X size={14} /> Clear
            </button>
          )}
          <button className="btn-sm btn-sm-outline" onClick={fetchDealers} disabled={loading}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Crop pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b9276', fontWeight: 600 }}>Filter by Crop:</span>
          <div className="filter-pills" style={{ marginBottom: 0 }}>
            {popularCrops.map(crop => (
              <button
                key={crop}
                className={`filter-pill ${selectedCrop === crop ? 'active' : ''}`}
                onClick={() => setSelectedCrop(crop)}
              >
                {crop === 'ALL' ? 'All Crops' : crop}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '0.875rem', color: '#6b9276', fontWeight: 600 }}>
            {filteredDealers.length} Verified {filteredDealers.length === 1 ? 'Dealer' : 'Dealers'}
            {(searchTerm || selectedCrop !== 'ALL') && <span style={{ color: '#3d5c45' }}> (filtered)</span>}
          </span>
          {(searchTerm || selectedCrop !== 'ALL') && (
            <button className="btn-sm btn-sm-outline" onClick={() => { setSearchTerm(''); setSelectedCrop('ALL'); }}>
              <X size={13} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* States */}
      {loading && <LoadSpinner fullPage={false} size="md" text="Loading verified dealers…" />}

      {!loading && error && (
        <div className="state-card state-card--error">
          <AlertTriangle size={20} />
          <span className="state-title">Unable to load dealer directory</span>
          <span className="state-desc">{error}</span>
          <button className="btn btn-outline" onClick={fetchDealers}>Retry</button>
        </div>
      )}

      {!loading && !error && dealers.length === 0 && (
        <div className="state-card">
          <Users size={28} />
          <span className="state-title">No verified dealers found</span>
          <span className="state-desc">Registered dealers undergo AFA licence verification before appearing in this directory.</span>
        </div>
      )}

      {!loading && !error && dealers.length > 0 && filteredDealers.length === 0 && (
        <div className="state-card">
          <Search size={28} />
          <span className="state-title">No dealers match your search</span>
          <span className="state-desc">Try a different name, crop type (e.g. Maize), or county (e.g. Nakuru).</span>
          <button className="btn-sm btn-sm-outline" onClick={() => { setSearchTerm(''); setSelectedCrop('ALL'); }}>Clear filters</button>
        </div>
      )}

      {/* Dealer Grid */}
      {!loading && !error && filteredDealers.length > 0 && (
        <div className="results-grid">
          {filteredDealers.map(dealer => {
            const dealerId = dealer.userId || dealer._id;
            const isActive = dealer.licence?.status === 'ACTIVE';
            const initials = (dealer.businessName || dealer.displayName || '?')
              .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div key={dealerId} className="dealer-card">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div className="dealer-avatar">{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="dealer-name">{dealer.businessName || dealer.displayName}</p>
                    <span className={`offer-status-badge ${isActive ? 'accepted' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                      {isActive ? <><CheckCircle2 size={10} /> Verified Active</> : `Status: ${dealer.licence?.status || 'PENDING'}`}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {dealer.bio && (
                  <p style={{ fontSize: '0.8rem', color: '#6b9276', lineHeight: 1.5, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {dealer.bio}
                  </p>
                )}

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dealer.licence?.licenceNumber && (
                    <p className="dealer-meta">
                      <Shield size={12} /> Licence: <code style={{ color: '#5ec285', fontSize: '0.78rem' }}>{dealer.licence.licenceNumber}</code>
                    </p>
                  )}
                  {(dealer.countiesServed?.length || dealer.generalOperatingArea) && (
                    <p className="dealer-meta">
                      <MapPin size={12} />
                      {dealer.countiesServed?.length ? dealer.countiesServed.join(', ') : dealer.generalOperatingArea}
                    </p>
                  )}
                  {dealer.purchasingCapacityKg && (
                    <p className="dealer-meta">
                      <Sprout size={12} /> Capacity: {dealer.purchasingCapacityKg.toLocaleString()} kg/month
                    </p>
                  )}
                  {dealer.cropsDealt && dealer.cropsDealt.length > 0 && (
                    <div className="dealer-tags" style={{ marginTop: 4 }}>
                      {dealer.cropsDealt.slice(0, 5).map(c => (
                        <span key={c} className="dealer-tag">{c}</span>
                      ))}
                      {dealer.cropsDealt.length > 5 && (
                        <span className="dealer-tag">+{dealer.cropsDealt.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-sm btn-sm-primary" style={{ flex: 1 }} onClick={() => navigate(`/dealers/${dealerId}`)}>
                    View Profile
                  </button>
                  {isActive && (
                    <button className="btn-sm btn-sm-outline" style={{ flex: 1 }} onClick={() => navigate(`/farmer/offers/create/${dealerId}`)}>
                      <HandshakeIcon size={13} /> Make Offer
                    </button>
                  )}
                  <button
                    className="btn-sm btn-sm-outline"
                    onClick={() => handleStartChat(dealer)}
                    disabled={startingChatId === dealerId}
                    title={`Message ${dealer.businessName || dealer.displayName || 'dealer'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <MessageSquare size={14} />
                    <span>{startingChatId === dealerId ? 'Connecting…' : 'Chat'}</span>
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
