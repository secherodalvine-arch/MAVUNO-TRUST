import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { getMyOffers, respondToOffer } from '../services/offerService';
import type { OfferDTO } from '../services/offerService';
import { createOrGetConversation } from '../services/chatService';
import {
  HandshakeIcon, CheckCircle2, XCircle, ArrowLeftRight,
  MessageSquare, AlertTriangle, RefreshCw, Calendar, Package,
} from 'lucide-react';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/pages.css';

const statusLabel: Record<string, string> = {
  PENDING: 'Pending', ACCEPTED: 'Accepted', REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn', CANCELLED: 'Cancelled', COMPLETED: 'Completed',
};
const statusClass: Record<string, string> = {
  PENDING: 'pending', ACCEPTED: 'accepted', REJECTED: 'rejected',
  WITHDRAWN: 'cancelled', CANCELLED: 'cancelled', COMPLETED: 'accepted',
};

export const OffersPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<OfferDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true); setError(null);
      setOffers(await getMyOffers());
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch offers.');
    } finally { setLoading(false); }
  };

  const handleAction = async (id: string, action: 'ACCEPT' | 'REJECT' | 'CANCEL') => {
    try {
      await respondToOffer(id, action);
      fetchOffers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to perform action.');
    }
  };

  const handleMessage = async (offer: OfferDTO) => {
    try {
      const isFarmer = user?.role === 'FARMER';
      const targetId = isFarmer ? offer.dealerId?._id : offer.farmerId?._id;
      if (!targetId) return;
      const conv = await createOrGetConversation(targetId, offer._id);
      navigate(`/messages?conversationId=${conv._id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to open conversation.');
    }
  };

  const isFarmer = user?.role === 'FARMER';

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-icon green">
          <HandshakeIcon size={22} />
        </div>
        <div>
          <h1 className="page-title">Negotiation Centre</h1>
          <p className="page-subtitle">Manage trade offers, counteroffers, and agreements with your trading partners.</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-outline" onClick={fetchOffers} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading && <LoadSpinner fullPage={false} size="md" text="Loading offers…" />}

      {!loading && error && (
        <div className="state-card state-card--error">
          <AlertTriangle size={20} />
          <span className="state-title">Could not load offers</span>
          <span className="state-desc">{error}</span>
          <button className="btn btn-outline" onClick={fetchOffers}>Retry</button>
        </div>
      )}

      {!loading && !error && offers.length === 0 && (
        <div className="state-card">
          <HandshakeIcon size={28} />
          <span className="state-title">No offers yet</span>
          <span className="state-desc">You have no active or past trade offers. Find a dealer to start negotiating.</span>
        </div>
      )}

      {!loading && !error && offers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {offers.map(offer => {
            const counterparty = isFarmer ? offer.dealerId?.fullName : offer.farmerId?.fullName;
            const canRespond = offer.status === 'PENDING' &&
              ((offer.initiatedBy === 'FARMER' && user?.role === 'DEALER') ||
               (offer.initiatedBy === 'DEALER' && user?.role === 'FARMER'));

            return (
              <div key={offer._id} className="offer-card">
                <div className="offer-header">
                  <div>
                    <p className="offer-title">
                      {offer.quantity} {offer.unit} — {offer.currency} {offer.proposedPricePerUnit}/{offer.unit}
                    </p>
                    <p className="offer-sub">
                      {counterparty ? `With ${counterparty}` : 'Unknown party'} ·{' '}
                      <Calendar size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`offer-status-badge ${statusClass[offer.status] || 'pending'}`}>
                    {statusLabel[offer.status] || offer.status}
                  </span>
                </div>

                <div className="offer-details">
                  <div className="offer-detail">
                    <span className="offer-detail-label">Total Value</span>
                    <span className="offer-detail-value">{offer.currency} {offer.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="offer-detail">
                    <span className="offer-detail-label">Initiated By</span>
                    <span className="offer-detail-value">{offer.initiatedBy}</span>
                  </div>
                  {offer.cropName && (
                    <div className="offer-detail">
                      <span className="offer-detail-label"><Package size={11} /> Crop</span>
                      <span className="offer-detail-value">{offer.cropName}</span>
                    </div>
                  )}
                </div>

                {offer.message && (
                  <div className="offer-message-box">
                    "{offer.message}"
                  </div>
                )}

                {offer.status === 'ACCEPTED' && (
                  <div className="info-notice">
                    <CheckCircle2 size={15} />
                    <span>Offer accepted. A transaction record has been created for this agreement.</span>
                  </div>
                )}

                <div className="offer-actions">
                  {canRespond && (
                    <>
                      <button className="btn-sm btn-sm-primary" onClick={() => handleAction(offer._id, 'ACCEPT')}>
                        <CheckCircle2 size={14} /> Accept
                      </button>
                      <button className="btn-sm btn-sm-danger" onClick={() => handleAction(offer._id, 'REJECT')}>
                        <XCircle size={14} /> Reject
                      </button>
                      <button className="btn-sm btn-sm-outline" onClick={() => navigate(`/offers/${offer._id}/counter`)}>
                        <ArrowLeftRight size={14} /> Counteroffer
                      </button>
                    </>
                  )}
                  {offer.status === 'PENDING' && !canRespond && (
                    <button className="btn-sm btn-sm-outline" onClick={() => handleAction(offer._id, 'CANCEL')}>
                      <XCircle size={14} /> Cancel Offer
                    </button>
                  )}
                  {offer.status === 'PENDING' && (
                    <button className="btn-sm btn-sm-outline" onClick={() => handleMessage(offer)}>
                      <MessageSquare size={14} /> Message {isFarmer ? 'Dealer' : 'Farmer'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OffersPage;
