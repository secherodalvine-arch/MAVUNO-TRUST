import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createOffer } from '../services/offerService';
import { getMyCropListingsApi } from '../services/cropService';
import type { CropListingDTO } from '../services/cropService';

export const CreateOfferPage: React.FC = () => {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  
  const [listings, setListings] = useState<CropListingDTO[]>([]);
  const [formData, setFormData] = useState({
    listingId: '',
    quantity: '',
    unit: 'KG',
    proposedPricePerUnit: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyCropListingsApi()
      .then(data => {
        const activeListings = data.filter(l => l.status === 'ACTIVE');
        setListings(activeListings);
        if (activeListings.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            listingId: activeListings[0]._id || '',
            unit: activeListings[0].unit || 'KG'
          }));
        }
      })
      .catch(err => console.error('Failed to load listings', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;
    
    try {
      setLoading(true);
      setError(null);
      await createOffer({
        targetUserId: dealerId,
        listingId: formData.listingId,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        proposedPricePerUnit: Number(formData.proposedPricePerUnit),
        message: formData.message
      });
      alert('Offer submitted successfully.');
      navigate('/offers');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="offer-form-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: 700 }}>Make an Offer</h2>
      <p style={{ marginBottom: '20px', fontSize: '0.95rem' }}>
        Propose terms for a potential transaction. The dealer will be able to review, accept, reject, or counter this offer.
      </p>

      {error && <div style={{ padding: '12px 14px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>Select Crop Listing</label>
          <select 
            value={formData.listingId}
            onChange={e => {
              const selected = listings.find(l => l._id === e.target.value);
              setFormData({...formData, listingId: e.target.value, unit: selected?.unit || 'KG'})
            }}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            <option value="" disabled>-- Select a listing --</option>
            {listings.map(l => (
              <option key={l._id} value={l._id}>
                {l.cropName} ({l.estimatedQuantity} {l.unit})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>Quantity</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="number" 
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              min="1"
              max={listings.find(l => l._id === formData.listingId)?.estimatedQuantity || undefined}
              required
              style={{ flex: 1 }}
              placeholder="e.g. 50"
            />
            <input 
              type="text" 
              value={formData.unit}
              disabled
              style={{ width: '100px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, textAlign: 'center' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>Proposed Price Per Unit (KES)</label>
          <input 
            type="number" 
            value={formData.proposedPricePerUnit}
            onChange={e => setFormData({...formData, proposedPricePerUnit: e.target.value})}
            min="0"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. 3500"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>Message (Optional)</label>
          <textarea 
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="Add any specific conditions, delivery preferences, etc."
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            marginTop: '10px', 
            padding: '12px 20px', 
            backgroundColor: '#16a34a', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 700, 
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Sending Offer...' : 'Send Offer'}
        </button>
      </form>
    </div>
  );
};
