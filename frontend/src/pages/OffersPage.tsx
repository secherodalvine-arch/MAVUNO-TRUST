import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getMyOffers, respondToOffer } from '../services/offerService';
import type { OfferDTO } from '../services/offerService';
import { useNavigate } from 'react-router-dom';
import { createOrGetConversation } from '../services/chatService';

export const OffersPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<OfferDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await getMyOffers();
      setOffers(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch offers.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'ACCEPT' | 'REJECT' | 'CANCEL') => {
    try {
      await respondToOffer(id, action);
      alert(`Offer ${action.toLowerCase()}ed successfully.`);
      fetchOffers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to perform action.');
    }
  };

  const handleMessageUser = async (offer: OfferDTO) => {
    try {
      const isFarmer = user?.role === 'FARMER';
      const targetUserId = isFarmer ? offer.dealerId?._id : offer.farmerId?._id;
      if (!targetUserId) return;
      
      const conversation = await createOrGetConversation(targetUserId, offer._id);
      navigate(`/messages?conversationId=${conversation._id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to open conversation.');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading offers...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#111827', marginBottom: '20px' }}>Negotiation Centre</h2>
      
      {offers.length === 0 ? (
        <p>You have no active or past offers.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {offers.map(offer => {
            const isFarmer = user?.role === 'FARMER';
            const counterpartyName = isFarmer ? offer.dealerId?.fullName : offer.farmerId?.fullName;
            
            return (
              <div key={offer._id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </span>
                    <h3 style={{ margin: '5px 0 0 0', color: '#111827' }}>
                      {offer.quantity} {offer.unit} at {offer.currency} {offer.proposedPricePerUnit} / {offer.unit}
                    </h3>
                  </div>
                  <div style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    backgroundColor: offer.status === 'ACCEPTED' ? '#dcfce7' : offer.status === 'REJECTED' || offer.status === 'WITHDRAWN' ? '#fee2e2' : '#e0e7ff',
                    color: offer.status === 'ACCEPTED' ? '#166534' : offer.status === 'REJECTED' || offer.status === 'WITHDRAWN' ? '#991b1b' : '#3730a3'
                  }}>
                    {offer.status}
                  </div>
                </div>

                <div style={{ marginBottom: '15px', color: '#4b5563', fontSize: '0.95rem' }}>
                  <strong>Counterparty:</strong> {counterpartyName || 'Unknown'}<br />
                  <strong>Total Value:</strong> {offer.currency} {offer.totalAmount}
                </div>

                {offer.message && (
                  <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontStyle: 'italic', color: '#374151', fontSize: '0.9rem' }}>
                    "{offer.message}"
                  </div>
                )}

                {offer.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    {((offer.initiatedBy === 'FARMER' && user?.role === 'DEALER') || 
                      (offer.initiatedBy === 'DEALER' && user?.role === 'FARMER')) ? (
                      <>
                        <button 
                          onClick={() => handleAction(offer._id, 'ACCEPT')}
                          style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleAction(offer._id, 'REJECT')}
                          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => navigate(`/offers/${offer._id}/counter`)}
                          style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Counteroffer
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleAction(offer._id, 'CANCEL')}
                        style={{ padding: '8px 16px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Cancel Offer
                      </button>
                    )}
                    <button 
                      onClick={() => handleMessageUser(offer)}
                      style={{ padding: '8px 16px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Message {isFarmer ? 'Dealer' : 'Farmer'}
                    </button>
                  </div>
                )}
                
                {offer.status === 'ACCEPTED' && (
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#dcfce7', borderRadius: '6px', color: '#166534', fontSize: '0.9rem' }}>
                    <strong>Offer Accepted.</strong> A separate transaction record will be created for this agreement.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
