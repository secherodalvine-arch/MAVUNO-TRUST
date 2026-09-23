import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { counterOffer, getOfferHistory } from '../services/offerService';
import { createOrGetConversation } from '../services/chatService';
import { useAuthContext } from '../context/AuthContext';
import type { OfferDTO } from '../services/offerService';

export const CounterOfferPage: React.FC = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [history, setHistory] = useState<OfferDTO[]>([]);
  const [formData, setFormData] = useState({
    quantity: '',
    proposedPricePerUnit: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (offerId) {
      getOfferHistory(offerId).then(data => {
        setHistory(data);
        const latest = data[data.length - 1];
        if (latest) {
          setFormData({
            quantity: latest.quantity.toString(),
            proposedPricePerUnit: latest.proposedPricePerUnit.toString(),
            message: ''
          });
        }
      }).catch(() => setError('Failed to load offer history.'));
    }
  }, [offerId]);

  const offer = history[history.length - 1];
  const isFarmer = user?.role === 'FARMER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerId) return;
    
    try {
      setLoading(true);
      setError(null);
      await counterOffer(offerId, {
        quantity: Number(formData.quantity),
        proposedPricePerUnit: Number(formData.proposedPricePerUnit),
        message: formData.message
      });
      alert('Counteroffer submitted successfully.');
      navigate('/offers');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create counteroffer.');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUser = async () => {
    if (!offer) return;
    try {
      const targetUserId = isFarmer ? offer.dealerId?._id : offer.farmerId?._id;
      if (!targetUserId) return;
      
      const conversation = await createOrGetConversation(targetUserId, offer._id);
      navigate(`/messages?conversationId=${conversation._id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to open conversation.');
    }
  };

  return (
    <div className="offer-form-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: 700 }}>Counteroffer</h2>
      
      {error && <div style={{ padding: '12px 14px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

      {history.length > 0 && (
        <div className="offer-history-box" style={{ marginBottom: '25px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontWeight: 700 }}>Negotiation History</h4>
          {history.map((h) => (
            <div key={h._id} style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#334155', paddingLeft: '10px', borderLeft: '3px solid #cbd5e1' }}>
              <strong style={{ color: '#0f172a' }}>{h.initiatedBy}</strong> offered {h.quantity} {h.unit} at {h.currency} {h.proposedPricePerUnit} / {h.unit}
              {h.message && <div style={{ marginTop: '2px' }}><em style={{ color: '#64748b' }}>"{h.message}"</em></div>}
            </div>
          ))}
        </div>
      )}

      {offer && offer.status !== 'PENDING' ? (
        <div style={{ padding: '15px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', border: '1px solid #fde68a' }}>
          This offer is no longer pending ({offer.status}). You cannot counteroffer.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>New Quantity ({offer?.unit})</label>
            <input 
              type="number" 
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              min="1"
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>New Price Per Unit ({offer?.currency})</label>
            <input 
              type="number" 
              value={formData.proposedPricePerUnit}
              onChange={e => setFormData({...formData, proposedPricePerUnit: e.target.value})}
              min="0"
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>Message (Optional)</label>
            <textarea 
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="Explain your counteroffer..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                flex: 1,
                padding: '12px 18px', 
                backgroundColor: loading ? '#9ca3af' : '#4f46e5', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              {loading ? 'Sending Counteroffer...' : 'Send Counteroffer'}
            </button>
            
            <button 
              type="button"
              onClick={handleMessageUser}
              style={{ 
                flex: 1,
                padding: '12px 18px', 
                backgroundColor: '#0284c7', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              Message {isFarmer ? 'Dealer' : 'Farmer'}
            </button>
          </div>

          <button 
            type="button"
            onClick={() => navigate('/offers')}
            style={{ 
              width: '100%',
              marginTop: '5px',
              padding: '12px 18px', 
              backgroundColor: '#f1f5f9', 
              color: '#1e293b', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
