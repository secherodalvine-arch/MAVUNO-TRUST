import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions, updateFulfilment, completeTransaction, cancelTransaction } from '../services/transactionService';
import type { TransactionDTO } from '../services/transactionService';
import { useAuthContext } from '../context/AuthContext';
import { createOrGetConversation } from '../services/chatService';
import { ratingService } from '../services/ratingService';
import type { RatingData } from '../services/ratingService';
import { createDispute, getDisputes, closeDispute } from '../services/disputeService';
import type { DisputeDTO, DisputeCategory } from '../services/disputeService';
import { KenaffSupportSection } from '../components/KenaffSupportSection';
import '../styles/TransactionsPage.css';

const TransactionCompletionSection: React.FC<{
  transaction: TransactionDTO;
  onUpdate: () => void;
}> = ({ transaction, onUpdate }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCompleted = transaction.status === 'COMPLETED';
  const isFulfilled = transaction.fulfilment?.status === 'FULFILLED';
  const isEligible = (transaction.status === 'IN_PROGRESS' || transaction.status === 'AGREED') && isFulfilled && !isCompleted;

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      await completeTransaction(transaction._id);
      setShowConfirmModal(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to complete transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tx-white-panel" style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderLeft: '4px solid #16a34a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#14532d', fontSize: '0.95rem', fontWeight: 700 }}>Transaction Completion</h4>
          {isCompleted ? (
            <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
              ✓ Transaction marked as Completed
              {transaction.completedAt && ` on ${new Date(transaction.completedAt).toLocaleString()}`}.
            </div>
          ) : isEligible ? (
            <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
              Goods/produce fulfilment is complete. You can now explicitly confirm transaction completion.
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Delivery/Fulfilment must be marked as FULFILLED before transaction completion can be confirmed.
            </div>
          )}
        </div>

        {isEligible && !isCompleted && (
          <button
            onClick={() => setShowConfirmModal(true)}
            style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Confirm Transaction Completed
          </button>
        )}
      </div>

      {showConfirmModal && (
        <div className="tx-modal-overlay">
          <div className="tx-white-modal" style={{ maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontWeight: 700 }}>Confirm Explicit Completion</h3>
            <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to mark this transaction as <strong style={{ color: '#0f172a' }}>COMPLETED</strong>?
            </p>
            <p className="tx-modal-note" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
              This confirms that the agreed agricultural transaction terms and fulfilment have been satisfied. 
              <em style={{ color: '#64748b' }}> Note: Completion records the transaction status and does not represent a payment transaction or digital payment transfer.</em>
            </p>

            {error && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '15px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="tx-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Submitting...' : 'Yes, Confirm Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionCancellationSection: React.FC<{
  transaction: TransactionDTO;
  onUpdate: () => void;
}> = ({ transaction, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState<string>('MUTUAL_AGREEMENT');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCancelled = transaction.status === 'CANCELLED';
  const isCompleted = transaction.status === 'COMPLETED';
  const isFulfilled = transaction.fulfilment?.status === 'FULFILLED';
  const isEligible = (transaction.status === 'AGREED' || transaction.status === 'IN_PROGRESS') && !isFulfilled && !isCompleted && !isCancelled;

  const handleCancel = async () => {
    if (!reason) {
      setError('Please select a cancellation reason.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await cancelTransaction(transaction._id, {
        cancellationReason: reason,
        cancellationNote: note
      });
      setShowModal(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to cancel transaction.');
    } finally {
      setLoading(false);
    }
  };

  const formatReason = (r?: string) => {
    switch (r) {
      case 'MUTUAL_AGREEMENT': return 'Mutual Agreement';
      case 'DELIVERY_ISSUE': return 'Delivery / Logistics Issue';
      case 'CHANGE_OF_CIRCUMSTANCES': return 'Change of Circumstances';
      case 'OTHER': return 'Other';
      default: return r || 'Unspecified';
    }
  };

  if (isCompleted) {
    return null;
  }

  return (
    <div className="tx-white-panel" style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderLeft: isCancelled ? '4px solid #dc2626' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: isCancelled ? '#991b1b' : '#b45309', fontSize: '0.95rem', fontWeight: 700 }}>Transaction Cancellation</h4>
          {isCancelled ? (
            <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
              ✕ Transaction Cancelled {transaction.cancelledAt && ` on ${new Date(transaction.cancelledAt).toLocaleString()}`}.
              <div style={{ marginTop: '2px' }}>Reason: <strong style={{ color: '#7f1d1d' }}>{formatReason(transaction.cancellationReason)}</strong></div>
              {transaction.cancellationNote && <div style={{ fontStyle: 'italic', marginTop: '2px', color: '#991b1b' }}>"{transaction.cancellationNote}"</div>}
            </div>
          ) : isFulfilled ? (
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Delivery/Fulfilment has been marked as FULFILLED. Fulfilled transactions cannot be directly cancelled. If an issue occurred, please use the dispute/remedy process.
            </div>
          ) : isEligible ? (
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              This transaction is active. You may explicitly cancel if terms cannot be met.
            </div>
          ) : null}
        </div>

        {isEligible && (
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Cancel Transaction
          </button>
        )}
      </div>

      {showModal && (
        <div className="tx-modal-overlay">
          <div className="tx-white-modal" style={{ maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#991b1b', fontWeight: 700 }}>Cancel Transaction</h3>
            <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to <strong style={{ color: '#991b1b' }}>CANCEL</strong> this transaction? This action will permanently update the status to CANCELLED.
            </p>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Reason for Cancellation *</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="MUTUAL_AGREEMENT">Mutual Agreement</option>
                <option value="DELIVERY_ISSUE">Delivery / Logistics Issue</option>
                <option value="CHANGE_OF_CIRCUMSTANCES">Change of Circumstances</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Additional Note (Optional)</label>
              <textarea
                rows={2}
                placeholder="Provide a brief explanation if needed..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <p className="tx-modal-note" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              <em style={{ color: '#64748b' }}>Note: Cancellation updates the agreement record state and does not process financial refunds or payment settlements.</em>
            </p>

            {error && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '15px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="tx-btn-secondary"
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionDisputeSection: React.FC<{
  transaction: TransactionDTO;
  onUpdate: () => void;
}> = ({ transaction, onUpdate }) => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<DisputeDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<DisputeCategory>('DELIVERY_ISSUE');
  const [description, setDescription] = useState('');
  const [evidenceInfo, setEvidenceInfo] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, [transaction._id]);

  const fetchDisputes = async () => {
    try {
      const allDisputes = await getDisputes();
      const txDisputes = allDisputes.filter(d => {
        const txId = typeof d.transactionId === 'string' ? d.transactionId : d.transactionId?._id;
        return txId === transaction._id;
      });
      setDisputes(txDisputes);
    } catch (err: any) {
      console.error('Failed to fetch disputes:', err);
    }
  };

  const handleOpenDispute = async () => {
    if (!description || description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }
    setSubmitLoading(true);
    setError('');
    try {
      await createDispute({
        transactionId: transaction._id,
        category,
        description,
        evidenceInfo: evidenceInfo ? evidenceInfo : undefined
      });
      setShowModal(false);
      setDescription('');
      setEvidenceInfo('');
      await fetchDisputes();
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to open dispute case.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseCase = async (disputeId: string) => {
    try {
      await closeDispute(disputeId);
      await fetchDisputes();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to close dispute case.');
    }
  };

  const formatCategory = (cat: string) => {
    switch (cat) {
      case 'DELIVERY_ISSUE': return 'Delivery / Logistics Issue';
      case 'QUANTITY_ISSUE': return 'Quantity Dispute';
      case 'QUALITY_ISSUE': return 'Quality / Condition Issue';
      case 'AGREEMENT_ISSUE': return 'Agreement / Terms Dispute';
      case 'PAYMENT_ISSUE': return 'Payment Disagreement';
      case 'OTHER': return 'Other Issue';
      default: return cat;
    }
  };

  const activeDispute = disputes.find(d => d.status === 'OPEN');
  const closedDispute = disputes.find(d => d.status === 'CLOSED');
  const isCancelled = transaction.status === 'CANCELLED';

  if (isCancelled) {
    return null;
  }

  return (
    <div className="tx-white-panel" style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderLeft: activeDispute ? '4px solid #d97706' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: activeDispute ? '#b45309' : '#0f172a', fontSize: '0.95rem', fontWeight: 700 }}>
            Dispute & Remedy Pathway
          </h4>
          {activeDispute ? (
            <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>
              <strong style={{ color: '#78350f' }}>Case ID:</strong> {activeDispute.caseId} &bull; <strong style={{ color: '#78350f' }}>Status:</strong> OPEN (Opened {new Date(activeDispute.createdAt).toLocaleDateString()})
              <div style={{ marginTop: '2px' }}>Category: <strong style={{ color: '#78350f' }}>{formatCategory(activeDispute.category)}</strong></div>
            </div>
          ) : closedDispute ? (
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              ✓ Case <strong style={{ color: '#0f172a' }}>{closedDispute.caseId}</strong> was closed on {closedDispute.closedAt ? new Date(closedDispute.closedAt).toLocaleDateString() : 'earlier date'}.
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              If an issue occurred regarding terms, delivery, quality, or quantity, you can record a private dispute case.
            </div>
          )}
        </div>

        {!activeDispute && (
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Report a Problem / Seek Remedy
          </button>
        )}
      </div>

      {activeDispute && (
        <div style={{ marginTop: '12px', padding: '14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #fcd34d' }}>
          <div style={{ fontSize: '0.85rem', color: '#1e293b', marginBottom: '8px' }}>
            <strong style={{ color: '#0f172a' }}>Description:</strong> "{activeDispute.description}"
          </div>
          {activeDispute.evidenceInfo && (
            <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
              <strong style={{ color: '#0f172a' }}>Reference / Evidence:</strong> {activeDispute.evidenceInfo}
            </div>
          )}
          <div style={{ fontSize: '0.8rem', color: '#92400e', backgroundColor: '#fffbeb', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fef3c7', marginBottom: '12px', lineHeight: '1.4' }}>
            ℹ <strong>Notice:</strong> Your dispute is recorded privately in MavunoTrust. MavunoTrust does not automatically determine who is right, award compensation, or submit your case to an external authority.
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/farmer/rights')}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              View Farmer Rights & Remedy Guidance
            </button>
            <button
              onClick={() => handleCloseCase(activeDispute._id)}
              style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Close Dispute Case
            </button>
          </div>
          <KenaffSupportSection buttonLabel="Get Support / Seek Remedy" defaultOpen={true} style={{ marginTop: '15px' }} />
        </div>
      )}

      {!activeDispute && (
        <KenaffSupportSection buttonLabel="Get Support / Seek Remedy" defaultOpen={false} style={{ marginTop: '10px' }} />
      )}

      {showModal && (
        <div className="tx-modal-overlay">
          <div className="tx-white-modal" style={{ maxWidth: '520px', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#b45309', fontWeight: 700 }}>Report a Problem / Seek Remedy</h3>
            <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.4' }}>
              Record a factual dispute regarding this transaction. This case will be stored securely in your private account records.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Problem Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="DELIVERY_ISSUE">Delivery / Logistics Issue</option>
                <option value="QUANTITY_ISSUE">Quantity Dispute</option>
                <option value="QUALITY_ISSUE">Quality / Produce Condition Issue</option>
                <option value="AGREEMENT_ISSUE">Agreed Terms Disagreement</option>
                <option value="PAYMENT_ISSUE">Payment Disagreement</option>
                <option value="OTHER">Other Issue</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Detailed Description *</label>
              <textarea
                rows={3}
                placeholder="Explain what went wrong in detail..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Optional Evidence / Reference Info</label>
              <input
                type="text"
                placeholder="e.g. Chat message reference, delivery note number, photo reference..."
                value={evidenceInfo}
                onChange={e => setEvidenceInfo(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <p className="tx-modal-note" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              <em style={{ color: '#64748b' }}>MavunoTrust records dispute cases for participant reference and guidance. Opening a dispute does not legally alter transaction ownership or automatically submit complaints to government agencies or courts.</em>
            </p>

            {error && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={submitLoading}
                className="tx-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenDispute}
                disabled={submitLoading}
                style={{ padding: '8px 16px', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: submitLoading ? 'not-allowed' : 'pointer' }}
              >
                {submitLoading ? 'Submitting...' : 'Submit Dispute Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const TransactionFulfilmentSection: React.FC<{
  transaction: TransactionDTO;
  onUpdate: () => void;
}> = ({ transaction, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'FULFILLED'>(
    transaction.fulfilment?.status || 'PENDING'
  );
  const [method, setMethod] = useState(transaction.fulfilment?.method || '');
  const [expectedDate, setExpectedDate] = useState(
    transaction.fulfilment?.expectedDate ? transaction.fulfilment.expectedDate.split('T')[0] : ''
  );
  const [notes, setNotes] = useState(transaction.fulfilment?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateFulfilment(transaction._id, {
        status,
        method: method.trim() || undefined,
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
      });
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update fulfilment details.');
    } finally {
      setLoading(false);
    }
  };

  const fulfilment = transaction.fulfilment;
  const statusColorMap = {
    PENDING: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    IN_PROGRESS: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
    FULFILLED: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  };
  const currentStatus = fulfilment?.status || 'PENDING';
  const badgeStyle = statusColorMap[currentStatus];

  return (
    <div className="tx-white-panel" style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 700 }}>Delivery / Fulfilment</h4>
        <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}`, padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}>
          {currentStatus}
        </span>
      </div>

      <p className="tx-helper-text" style={{ margin: '6px 0 15px 0', fontSize: '0.85rem', color: '#475569' }}>
        Track agreed transport, collection dates, and delivery status. <em style={{ color: '#64748b' }}>Note: Fulfilment status does not confirm that payment has occurred.</em>
      </p>

      {!editing ? (
        <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ color: '#1e293b' }}><strong style={{ color: '#0f172a' }}>Delivery / Collection Method:</strong> {fulfilment?.method || 'Not specified'}</div>
          <div style={{ color: '#1e293b' }}><strong style={{ color: '#0f172a' }}>Expected Date:</strong> {fulfilment?.expectedDate ? new Date(fulfilment.expectedDate).toLocaleDateString() : 'Not specified'}</div>
          {fulfilment?.notes && <div style={{ color: '#1e293b' }}><strong style={{ color: '#0f172a' }}>Fulfilment Notes:</strong> {fulfilment.notes}</div>}
          {fulfilment?.actualFulfilmentDate && (
            <div style={{ color: '#15803d', fontWeight: 'bold' }}>
              Fulfilled on: {new Date(fulfilment.actualFulfilmentDate).toLocaleString()}
            </div>
          )}
          <button
            onClick={() => setEditing(true)}
            className="tx-btn-secondary"
            style={{ marginTop: '8px', alignSelf: 'flex-start' }}
          >
            Update Fulfilment Details
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Fulfilment Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="FULFILLED">FULFILLED</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Delivery / Collection Method</label>
            <input
              type="text"
              placeholder="e.g. Farmer Delivery to Depot, Dealer Farm Pickup"
              value={method}
              onChange={e => setMethod(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Expected Delivery/Collection Date</label>
            <input
              type="date"
              value={expectedDate}
              onChange={e => setExpectedDate(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Fulfilment Notes</label>
            <textarea
              rows={2}
              placeholder="Add notes about location, contact person, or transport details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save Fulfilment Details'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="tx-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const TransactionRatingSection: React.FC<{ transactionId: string, currentUserId: string, counterpartyLabel: string }> = ({ transactionId, currentUserId, counterpartyLabel }) => {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRatings();
  }, [transactionId]);

  const fetchRatings = async () => {
    try {
      const data = await ratingService.getTransactionRatings(transactionId);
      setRatings(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedRating < 1 || selectedRating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }
    setSubmitLoading(true);
    setError('');
    try {
      await ratingService.submitRating(transactionId, selectedRating, comment);
      await fetchRatings();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit rating.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '10px 20px', color: '#6b7280', fontSize: '0.85rem' }}>Loading ratings...</div>;

  const myRating = ratings.find((r: any) => r.reviewerId._id === currentUserId);
  const theirRating = ratings.find((r: any) => r.reviewerId._id !== currentUserId);

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="tx-white-panel" style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
      <h4 style={{ margin: '15px 0 12px 0', color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>Ratings & Reviews</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {/* MY RATING SECTION */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {myRating ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Your rating</div>
              <div style={{ color: '#f59e0b', fontSize: '1.25rem', marginBottom: '6px' }}>{renderStars(myRating.rating)}</div>
              {myRating.comment && <div style={{ fontSize: '0.9rem', color: '#334155', fontStyle: 'italic' }}>"{myRating.comment}"</div>}
            </>
          ) : (
            <div>
              <div style={{ fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>Rate your experience with this {counterpartyLabel}</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star} 
                    onClick={() => setSelectedRating(star)}
                    style={{ cursor: 'pointer', color: selectedRating >= star ? '#f59e0b' : '#cbd5e1', fontSize: '1.5rem', userSelect: 'none' }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea 
                className="tx-rating-textarea"
                placeholder="Write a short review (optional)" 
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: '10px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                rows={3}
              />
              {error && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}
              <button 
                onClick={handleSubmit}
                disabled={submitLoading || selectedRating === 0}
                style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '7px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: (submitLoading || selectedRating === 0) ? 'not-allowed' : 'pointer', opacity: (submitLoading || selectedRating === 0) ? 0.7 : 1 }}
              >
                {submitLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          )}
        </div>

        {/* THEIR RATING SECTION */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Their rating</div>
          {theirRating ? (
            <>
              <div style={{ color: '#f59e0b', fontSize: '1.25rem', marginBottom: '6px' }}>{renderStars(theirRating.rating)}</div>
              {theirRating.comment && <div style={{ fontSize: '0.9rem', color: '#334155', fontStyle: 'italic' }}>"{theirRating.comment}"</div>}
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>They haven't rated you yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TransactionsPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUser = async (tx: TransactionDTO) => {
    try {
      const targetUserId = user?.role === 'FARMER' ? tx.dealerId._id : tx.farmerId._id;
      const conversation = await createOrGetConversation(targetUserId, tx.acceptedOfferId);
      navigate(`/messages?conversationId=${conversation._id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to open conversation.');
    }
  };

  if (loading) return <div className="tx-page-wrapper"><p style={{ color: '#a0c4ac', padding: 20 }}>Loading transactions…</p></div>;
  if (error) return <div className="tx-page-wrapper"><p style={{ color: '#f87171', padding: 20 }}>{error}</p></div>;

  return (
    <div className="tx-page-wrapper">
      <h1>Transaction Records</h1>
      
      <div className="tx-notice">
        <strong>Information:</strong> This record shows the terms agreed through MavunoTrust. It does not by itself confirm that payment or delivery has occurred.
      </div>

      {transactions.length === 0 ? (
        <div className="tx-empty">
          No transaction records found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {transactions.map((tx: TransactionDTO) => {
            const isFarmer = user?.role === 'FARMER';
            const counterpartyName = isFarmer ? tx.dealerId.fullName : tx.farmerId.fullName;
            const counterpartyLabel = isFarmer ? 'Dealer' : 'Farmer';
            const statusKey = (tx.status || '').toLowerCase().replace('_', '_');
            
            return (
              <div key={tx._id} className="tx-card-container">
                {/* Header */}
                <div className="tx-card-header">
                  <div>
                    <h3>{tx.cropName}</h3>
                    <div className="tx-date">Agreement: {new Date(tx.agreementDate).toLocaleDateString()}</div>
                  </div>
                  <span className={`tx-status ${statusKey}`}>{tx.status}</span>
                </div>

                {/* Body */}
                <div className="tx-card-body">
                  <div>
                    <div className="tx-field-label">Quantity</div>
                    <div className="tx-field-value">{tx.quantity} {tx.unit}</div>
                  </div>
                  <div>
                    <div className="tx-field-label">Agreed Price / Unit</div>
                    <div className="tx-field-value">{tx.currency} {tx.agreedPricePerUnit.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="tx-field-label">Total Value</div>
                    <div className="tx-field-value" style={{ color: '#5ec285' }}>{tx.currency} {tx.totalAgreedValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="tx-field-label">{counterpartyLabel}</div>
                    <div className="tx-field-value">{counterpartyName}</div>
                  </div>
                </div>

                {/* Delivery / Fulfilment Section */}
                <TransactionFulfilmentSection transaction={tx} onUpdate={fetchTransactions} />

                {/* Explicit Completion Section */}
                <TransactionCompletionSection transaction={tx} onUpdate={fetchTransactions} />

                {/* Explicit Cancellation Section */}
                <TransactionCancellationSection transaction={tx} onUpdate={fetchTransactions} />

                {/* Dispute & Remedy Section */}
                <TransactionDisputeSection transaction={tx} onUpdate={fetchTransactions} />

                {/* Footer Actions */}
                <div className="tx-card-footer">
                  <button
                    onClick={() => handleMessageUser(tx)}
                    className="btn-sm btn-sm-primary"
                  >
                    Message {counterpartyLabel}
                  </button>
                </div>
                
                {/* Rating Section */}
                {user && (
                  <TransactionRatingSection 
                    transactionId={tx._id} 
                    currentUserId={user.id || (user as any)._id || (user as any).userId} 
                    counterpartyLabel={counterpartyLabel} 
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

