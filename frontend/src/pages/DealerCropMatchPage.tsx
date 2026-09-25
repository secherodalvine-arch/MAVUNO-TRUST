import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Search,
  MapPin,
  Calendar,
  Handshake,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Tag,
  X
} from 'lucide-react';
import { getPublicCropListingsApi, type CropListingDTO } from '../services/cropService';
import { createOffer } from '../services/offerService';
import { createOrGetConversation } from '../services/chatService';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/pages.css';

const KENYAN_COUNTIES = [
  'All Counties',
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
  'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a',
  'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const POPULAR_CROPS = [
  'All Crops',
  'Beans',
  'Maize',
  'Potatoes',
  'Tomatoes',
  'Kales',
  'Cabbage',
  'Onions',
  'Avocado'
];

export const DealerCropMatchPage: React.FC = () => {
  const navigate = useNavigate();

  const [listings, setListings] = useState<CropListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('All Counties');
  const [selectedChip, setSelectedChip] = useState('All Crops');

  // Offer modal state
  const [activeOfferListing, setActiveOfferListing] = useState<CropListingDTO | null>(null);
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Chat starting state
  const [startingChatListingId, setStartingChatListingId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const countyParam = countyFilter === 'All Counties' ? undefined : countyFilter;
      const cropParam = cropFilter.trim() || undefined;

      const liveListings = await getPublicCropListingsApi({
        county: countyParam,
        cropName: cropParam
      });

      setListings(Array.isArray(liveListings) ? liveListings : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [countyFilter, cropFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle chip selection with toggle support
  const handleChipClick = (crop: string) => {
    if (crop === 'All Crops' || crop === selectedChip) {
      setSelectedChip('All Crops');
      setCropFilter('');
    } else {
      setSelectedChip(crop);
      setCropFilter(crop);
    }
  };

  const handleCropInputChange = (val: string) => {
    setCropFilter(val);
    const matchedChip = POPULAR_CROPS.find(c => c !== 'All Crops' && c.toLowerCase() === val.trim().toLowerCase());
    setSelectedChip(matchedChip || (val.trim() === '' ? 'All Crops' : ''));
  };

  const handleResetFilters = () => {
    setCropFilter('');
    setCountyFilter('All Counties');
    setSelectedChip('All Crops');
  };

  // Close offer modal handler
  const handleCloseOfferModal = () => {
    setActiveOfferListing(null);
    setOfferQuantity('');
    setOfferPrice('');
    setOfferMessage('');
    setOfferError(null);
    setOfferSuccess(false);
  };

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeOfferListing) {
        handleCloseOfferModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOfferListing]);

  // Open offer modal
  const handleOpenOfferModal = (listing: CropListingDTO) => {
    setActiveOfferListing(listing);
    setOfferQuantity(listing.estimatedQuantity ? String(listing.estimatedQuantity) : '');
    setOfferPrice(listing.priceExpectationPerUnit ? String(listing.priceExpectationPerUnit) : '');
    setOfferMessage(`Hello, I am interested in purchasing your ${listing.cropName}. Let's agree on delivery and pricing.`);
    setOfferError(null);
    setOfferSuccess(false);
  };

  // Submit offer
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOfferListing) return;

    const farmerTargetId = typeof activeOfferListing.farmerId === 'object' && activeOfferListing.farmerId !== null
      ? (activeOfferListing.farmerId as any)._id
      : activeOfferListing.farmerId;

    if (!activeOfferListing._id) {
      setOfferError('Listing identifier is missing.');
      return;
    }

    if (!farmerTargetId) {
      setOfferError('Farmer identifier is not available.');
      return;
    }

    try {
      setSubmittingOffer(true);
      setOfferError(null);

      await createOffer({
        targetUserId: farmerTargetId,
        listingId: activeOfferListing._id,
        quantity: Number(offerQuantity),
        unit: activeOfferListing.unit || 'KG',
        proposedPricePerUnit: Number(offerPrice),
        message: offerMessage.trim() || undefined
      });

      setOfferSuccess(true);
      setTimeout(() => {
        handleCloseOfferModal();
        navigate('/offers');
      }, 1400);
    } catch (err: any) {
      setOfferError(err.response?.data?.error?.message || 'Failed to submit offer. Please check details and try again.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Start chat with farmer
  const handleStartChat = async (listing: CropListingDTO) => {
    const farmerTargetId = typeof listing.farmerId === 'object' && listing.farmerId !== null
      ? (listing.farmerId as any)._id
      : listing.farmerId;

    if (!farmerTargetId) {
      navigate('/messages');
      return;
    }

    setStartingChatListingId(listing._id || 'active');
    try {
      await createOrGetConversation(String(farmerTargetId));
      navigate('/messages');
    } catch {
      // Graceful fallback to messages page
      navigate('/messages');
    } finally {
      setStartingChatListingId(null);
    }
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon green">
          <Sprout size={24} />
        </div>
        <div>
          <h1 className="page-title">Farmer Crop Match</h1>
          <p className="page-subtitle">
            Search verified farmer crop listings by county and crop type. Source directly from producers with transparent pricing.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="page-card page-card--spaced">
        <h2 className="section-heading">Search Crop Listings</h2>
        <div className="page-form-grid">
          {/* Crop Search */}
          <div className="form-field">
            <label className="form-label" htmlFor="crop-name-input">
              <Search size={14} /> Crop Type or Name
            </label>
            <input
              id="crop-name-input"
              type="text"
              className="form-input"
              value={cropFilter}
              onChange={(e) => handleCropInputChange(e.target.value)}
              placeholder="e.g. Maize, Beans, Potatoes, Tomatoes"
            />
          </div>

          {/* County Dropdown */}
          <div className="form-field">
            <label className="form-label" htmlFor="county-select">
              <MapPin size={14} /> County
            </label>
            <select
              id="county-select"
              className="form-select"
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
            >
              {KENYAN_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="form-field form-field--actions">
            <button
              type="button"
              onClick={fetchListings}
              disabled={loading}
              className="btn btn-primary"
            >
              <Search size={16} /> Search Listings
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loading}
              className="btn btn-outline"
            >
              <RefreshCw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Quick Filter Crop Pills */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>
            <Tag size={13} /> Quick Crop Filter:
          </div>
          <div className="price-type-selector-pills">
            {POPULAR_CROPS.map(c => (
              <button
                key={c}
                type="button"
                className={`price-pill-btn ${(selectedChip === c || (c === 'All Crops' && !cropFilter && !selectedChip)) ? 'active' : ''}`}
                onClick={() => handleChipClick(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Meta Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 4px' }}>
        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>
          {loading ? 'Searching listings...' : `Found ${listings.length} verified farmer crop ${listings.length === 1 ? 'listing' : 'listings'}`}
        </span>
        {countyFilter !== 'All Counties' && (
          <span className="kamis-source-badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.25)' }}>
            Filtered by: {countyFilter}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && <LoadSpinner fullPage={false} size="md" text="Finding matching farmer crops..." />}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <div className="state-card">
          <Sprout size={32} />
          <span className="state-title">No matching crop listings found</span>
          <span className="state-desc">
            No active farmer listings matched "{cropFilter || 'all'}" in {countyFilter}. Try adjusting your search query or selecting All Counties.
          </span>
          <button className="btn btn-outline" onClick={handleResetFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && listings.length > 0 && (
        <div className="results-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {listings.map((item, idx) => {
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
                  padding: '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  background: '#131f16'
                }}
              >
                <div>
                  {/* Top: Crop name and verified badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#e8f5ec' }}>
                      {item.cropName}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.25)'
                    }}>
                      <ShieldCheck size={12} /> Verified
                    </span>
                  </div>

                  {/* Location info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
                    <MapPin size={14} style={{ color: '#5ec285', flexShrink: 0 }} />
                    <span>
                      {item.generalArea ? `${item.generalArea}, ` : ''}{item.county || 'Kenya'}
                    </span>
                  </div>

                  {/* Quantity & Price Highlight Box */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '14px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                        Available Quantity
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {item.estimatedQuantity?.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.unit}</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                        Price Target
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                        {item.priceExpectationPerUnit != null ? (
                          `KSh ${item.priceExpectationPerUnit.toLocaleString()}`
                        ) : (
                          'Negotiable'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Description */}
                  {item.additionalNotes && (
                    <p style={{
                      fontSize: '0.84rem',
                      color: '#cbd5e1',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      background: 'rgba(0,0,0,0.15)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      borderLeft: '2px solid #22c55e'
                    }}>
                      {item.additionalNotes}
                    </p>
                  )}

                  {/* Availability Window */}
                  {(item.expectedSellingPeriodStart || item.expectedSellingPeriodEnd) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#6b9276', marginBottom: '14px' }}>
                      <Calendar size={13} />
                      <span>
                        Availability: {formatDate(item.expectedSellingPeriodStart)} – {formatDate(item.expectedSellingPeriodEnd) || 'Open'}
                      </span>
                    </div>
                  )}

                  {/* Farmer Name */}
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '14px' }}>
                    Producer: <strong style={{ color: '#e2e8f0' }}>{farmerDisplayName}</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenOfferModal(item)}
                    style={{ flex: 1, padding: '9px 12px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Handshake size={15} /> Make Offer
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleStartChat(item)}
                    disabled={startingChatListingId === item._id}
                    style={{ padding: '9px 12px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Message producer directly"
                  >
                    <MessageSquare size={15} /> Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-Page "Make an Offer" Modal with Easy Exit */}
      {activeOfferListing && (
        <div
          className="app-modal-overlay"
          onClick={handleCloseOfferModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
        >
          <div
            className="app-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Close X */}
            <div className="app-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Handshake size={20} />
                </div>
                <div>
                  <h3 id="offer-modal-title" className="app-modal-title">Make an Offer</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {activeOfferListing.cropName} • {activeOfferListing.county || 'Producer'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="app-modal-close"
                onClick={handleCloseOfferModal}
                aria-label="Close modal (Esc)"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error & Success States */}
            {offerError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.88rem'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{offerError}</span>
              </div>
            )}

            {offerSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.88rem'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>Offer proposed successfully! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmitOffer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-field">
                <label className="form-label" htmlFor="modal-quantity">
                  Quantity ({activeOfferListing.unit})
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="modal-quantity"
                    type="number"
                    className="form-input"
                    value={offerQuantity}
                    onChange={(e) => setOfferQuantity(e.target.value)}
                    min="0.1"
                    step="any"
                    required
                    placeholder="Enter quantity"
                  />
                  <input
                    type="text"
                    value={activeOfferListing.unit}
                    disabled
                    className="form-input"
                    style={{ width: '90px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="modal-price">
                  Proposed Price Per Unit (KES)
                </label>
                <input
                  id="modal-price"
                  type="number"
                  className="form-input"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 3400"
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="modal-message">
                  Terms or Message (Optional)
                </label>
                <textarea
                  id="modal-message"
                  className="form-textarea"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={2}
                  placeholder="Specify packaging, collection dates, quality specs..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseOfferModal}
                  className="btn btn-outline"
                  disabled={submittingOffer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer || offerSuccess}
                  className="btn btn-primary"
                >
                  {submittingOffer ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerCropMatchPage;
