import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, X, Handshake, AlertTriangle, CheckCircle, Sprout } from 'lucide-react';
import { createOffer } from '../services/offerService';
import { getMyCropListingsApi } from '../services/cropService';
import type { CropListingDTO } from '../services/cropService';
import '../styles/pages.css';

export const CreateOfferPage: React.FC = () => {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const urlCrop = searchParams.get('crop') || '';
  const urlQty = searchParams.get('qty') || '';
  const urlUnit = searchParams.get('unit') || '';

  const [listings, setListings] = useState<CropListingDTO[]>([]);
  const [formData, setFormData] = useState({
    listingId: '',
    quantity: '',
    unit: 'KG',
    proposedPricePerUnit: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetchingListings, setFetchingListings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchWarning, setMatchWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Safe exit handler
  const handleExit = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dealers');
    }
  }, [navigate]);

  // Escape key listener to close/exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExit]);

  useEffect(() => {
    setFetchingListings(true);
    getMyCropListingsApi()
      .then(data => {
        const activeListings = data.filter(l => l.status === 'ACTIVE');
        setListings(activeListings);
        if (activeListings.length > 0) {
          let exactMatch;
          if (urlCrop) {
            exactMatch = activeListings.find(l =>
              l.cropName.toLowerCase() === urlCrop.toLowerCase() &&
              (!urlUnit || l.unit.toLowerCase() === urlUnit.toLowerCase()) &&
              (!urlQty || l.estimatedQuantity >= Number(urlQty))
            );
          }

          if (exactMatch) {
            setFormData(prev => ({
              ...prev,
              listingId: exactMatch._id || '',
              unit: exactMatch.unit || 'KG',
              quantity: urlQty || prev.quantity
            }));
          } else {
            if (urlCrop) {
              setMatchWarning(`No exact listing found for ${urlCrop} with sufficient capacity (${urlQty || 'any'} ${urlUnit || ''}). Please select an alternative listing or create a new one.`);
            }
            setFormData(prev => ({
              ...prev,
              listingId: '',
              unit: urlUnit || prev.unit,
              quantity: urlQty || prev.quantity
            }));
          }
        }
      })
      .catch(err => {
        console.error('Failed to load listings', err);
        setError('Could not retrieve your crop listings. Please try again.');
      })
      .finally(() => {
        setFetchingListings(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) {
      setError('Dealer identifier is missing.');
      return;
    }

    if (!formData.listingId) {
      setError('Please select an active crop listing.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createOffer({
        targetUserId: dealerId,
        listingId: formData.listingId,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        proposedPricePerUnit: Number(formData.proposedPricePerUnit),
        message: formData.message.trim() || undefined
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/offers');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit offer. Please verify fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedListing = listings.find(l => l._id === formData.listingId);
  const maxQty = selectedListing?.estimatedQuantity;
  const currentQty = Number(formData.quantity);

  let quantityError: string | null = null;
  if (formData.listingId && formData.quantity !== '') {
    if (isNaN(currentQty) || currentQty <= 0) {
      quantityError = 'Quantity must be a valid positive number.';
    } else if (maxQty !== undefined && currentQty > maxQty) {
      quantityError = `Requested quantity exceeds available listing stock (${maxQty} ${selectedListing?.unit || ''}). Please adjust it.`;
    }
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top action bar with back button & close X */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={handleExit}
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
          title="Return to previous screen (Esc)"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          type="button"
          onClick={handleExit}
          className="btn btn-icon"
          aria-label="Close and return (Esc)"
          title="Close (Esc)"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#cbd5e1'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Form Card */}
      <div className="page-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Handshake size={22} />
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.45rem', margin: 0 }}>Make an Offer</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Propose terms for a direct agricultural transaction with the dealer.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Warning notification */}
        {matchWarning && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{matchWarning}</span>
          </div>
        )}

        {/* Success notification */}
        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>Offer sent successfully! Redirecting to trade offers...</span>
          </div>
        )}

        {!fetchingListings && listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Sprout size={36} style={{ color: '#10b981', marginBottom: '10px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              No Active Crop Listings Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              You need an active crop listing on your profile before you can propose an offer to this dealer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleExit}
              >
                Close & Return
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const qParams = new URLSearchParams();
                  if (dealerId) qParams.set('dealerId', dealerId);
                  if (urlCrop) qParams.set('crop', urlCrop);
                  if (urlQty) qParams.set('qty', urlQty);
                  if (urlUnit) qParams.set('unit', urlUnit);
                  qParams.set('modal', 'true');
                  navigate(`/farmer/crops?${qParams.toString()}`);
                }}
              >
                Create Crop Listing
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="listing-select">Select Crop Listing</label>
              <select
                id="listing-select"
                className="form-select"
                value={formData.listingId}
                onChange={e => {
                  const selected = listings.find(l => l._id === e.target.value);
                  setFormData({
                    ...formData,
                    listingId: e.target.value,
                    unit: selected?.unit || 'KG'
                  });
                }}
                required
              >
                <option value="" disabled>-- Select one of your active crop listings --</option>
                {listings.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.cropName} ({l.estimatedQuantity} {l.unit}) {l.county ? `• ${l.county}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="quantity-input">Quantity to Offer</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="quantity-input"
                  className="form-input"
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  min="0.01"
                  step="any"
                  max={maxQty || undefined}
                  required
                  style={{ flex: 1, borderColor: quantityError ? '#ef4444' : undefined }}
                  placeholder="e.g. 50"
                />
                <input
                  type="text"
                  value={formData.unit}
                  disabled
                  className="form-input"
                  style={{
                    width: '100px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>
              {quantityError && (
                <div style={{ fontSize: '0.82rem', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <AlertTriangle size={14} />
                  {quantityError}
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="price-input">Proposed Price Per Unit (KES)</label>
              <input
                id="price-input"
                className="form-input"
                type="number"
                value={formData.proposedPricePerUnit}
                onChange={e => setFormData({ ...formData, proposedPricePerUnit: e.target.value })}
                min="1"
                step="any"
                required
                placeholder="e.g. 3500"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="message-input">Message / Terms (Optional)</label>
              <textarea
                id="message-input"
                className="form-textarea"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                placeholder="Specify delivery timeline, quality grade, pickup point, or other terms..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleExit}
                className="btn btn-outline"
                style={{ padding: '10px 22px' }}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || success || !!quantityError}
                className="btn btn-primary"
                style={{ padding: '10px 24px' }}
              >
                {loading ? 'Submitting Offer...' : 'Send Offer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateOfferPage;
