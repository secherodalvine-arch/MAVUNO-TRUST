import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, Calendar, MapPin, Search } from 'lucide-react';
import apiClient from '../services/apiClient';
import './DealerDemandsPage.css';

interface Demand {
  _id: string;
  cropName: string;
  quantity: number;
  unit: string;
  targetPricePerUnit?: number;
  currency?: string;
  desiredDeliveryDate?: string;
  countiesServed?: string[];
  status: 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  buyerReference?: string;
}

export const DealerDemandsPage: React.FC = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [targetPricePerUnit, setTargetPricePerUnit] = useState('');
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState('');

  const fetchDemands = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<{ data: Demand[] }>('/demands/me');
      setDemands(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load demands.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError(null);
      await apiClient.post('/demands', {
        cropName: cropName.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        targetPricePerUnit: targetPricePerUnit ? Number(targetPricePerUnit) : undefined,
        desiredDeliveryDate: desiredDeliveryDate || undefined
      });
      setShowModal(false);
      // Reset form
      setCropName('');
      setQuantity('');
      setUnit('kg');
      setTargetPricePerUnit('');
      setDesiredDeliveryDate('');
      
      await fetchDemands();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create demand.';
      setModalError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/demands/${id}`, { status: newStatus });
      fetchDemands();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update status.';
      alert(errorMsg);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Buyer Demands</h1>
          <p className="page-subtitle">Post explicit crop requirements so farmers can match their harvests to you.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} /> Create Demand
        </button>
      </div>

      <div className="page-content">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="state-card" style={{ padding: '30px 20px', textAlign: 'center' }}>
            <p style={{ color: '#dc2626', marginBottom: '12px', fontWeight: 500 }}>{error}</p>
            <button className="btn btn-outline" onClick={fetchDemands}>Retry</button>
          </div>
        ) : demands.length === 0 ? (
          <div className="state-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Search size={32} color="#94a3b8" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>No Active Demands</h3>
            <p style={{ margin: 0, color: '#64748b' }}>You haven't posted any crop requirements yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {demands.map(d => (
              <div key={d._id} className="dd-card" style={{ padding: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 className="dd-card-title">{d.cropName}</h3>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    backgroundColor: d.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                    color: d.status === 'ACTIVE' ? '#166534' : '#475569'
                  }}>
                    {d.status}
                  </span>
                </div>
                
                <div className="dd-card-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={14} /> <strong>Quantity:</strong> {d.quantity} {d.unit}
                  </div>
                  {d.targetPricePerUnit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={14} /> <strong>Target Price:</strong> {d.currency} {d.targetPricePerUnit} / {d.unit}
                    </div>
                  )}
                  {d.desiredDeliveryDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} /> <strong>Needed By:</strong> {new Date(d.desiredDeliveryDate).toLocaleDateString()}
                    </div>
                  )}
                  {d.countiesServed && d.countiesServed.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} /> <strong>Locations:</strong> {d.countiesServed.join(', ')}
                    </div>
                  )}
                </div>

                {d.status === 'ACTIVE' && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
                      onClick={() => handleUpdateStatus(d._id, 'FULFILLED')}
                    >
                      Mark Fulfilled
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, borderColor: '#ef4444', color: '#ef4444' }}
                      onClick={() => handleUpdateStatus(d._id, 'CANCELLED')}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="dd-overlay" onClick={() => { setShowModal(false); setModalError(null); }}>
          <div className="dd-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <button 
              className="dd-close"
              aria-label="Close"
              onClick={() => { setShowModal(false); setModalError(null); }}
            >
              <X size={20} />
            </button>
            <h2 className="dd-modal-title">Create Buyer Demand</h2>
            {modalError && (
              <div className="dd-error">
                {modalError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="dd-form">
              <div className="form-group">
                <label className="form-label">Crop Name</label>
                <input type="text" className="form-control" required value={cropName} onChange={e => setCropName(e.target.value)} placeholder="e.g. Maize, Potatoes" />
              </div>
              <div className="dd-row">
                <div className="form-group">
                  <label className="form-label">Quantity required</label>
                  <input type="number" step="0.01" min="0.01" className="form-control" required value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-control" value={unit} onChange={e => setUnit(e.target.value)}>
                    <option value="kg">KGs</option>
                    <option value="tonne">Tonnes</option>
                    <option value="90kg bag">90kg Bags</option>
                    <option value="50kg bag">50kg Bags</option>
                    <option value="crates">Crates</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Price (Optional)</label>
                <input type="number" step="0.01" min="0" className="form-control" value={targetPricePerUnit} onChange={e => setTargetPricePerUnit(e.target.value)} placeholder="KSh per unit" />
              </div>
              <div className="form-group">
                <label className="form-label">Desired Delivery Date (Optional)</label>
                <input type="date" className="form-control" value={desiredDeliveryDate} onChange={e => setDesiredDeliveryDate(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Demand'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
