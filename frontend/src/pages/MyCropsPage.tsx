import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getMyCropListingsApi,
  createCropListingApi,
  updateCropListingApi,
  deleteCropListingApi
} from '../services/cropService';
import { Sprout } from 'lucide-react';
import type { CropListingDTO } from '../services/cropService';
import apiClient from '../services/apiClient';

export const MyCropsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const urlModal = searchParams.get('modal') === 'true';
  const urlCrop = searchParams.get('crop') || '';
  const urlQty = searchParams.get('qty') || '';
  const urlUnit = searchParams.get('unit') || '';
  const urlDealerId = searchParams.get('dealerId') || '';

  const [listings, setListings] = useState<CropListingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<CropListingDTO | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [cropName, setCropName] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('bags (90kg)');
  const [priceExpectation, setPriceExpectation] = useState<number | ''>('');
  const [county, setCounty] = useState('');
  const [generalArea, setGeneralArea] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'PAUSED' | 'SOLD'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const data = await getMyCropListingsApi();
      setListings(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load crop listings.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();

    if (urlModal) {
      setEditingListing(null);
      setCropName(urlCrop);
      setEstimatedQuantity(urlQty ? Number(urlQty) : '');
      setUnit(urlUnit || 'bags (90kg)');
      setPriceExpectation('');
      setCounty('');
      setGeneralArea('');
      setAdditionalNotes('');
      setStatus('ACTIVE');
      setIsModalOpen(true);
    }
  }, [urlModal, urlCrop, urlQty, urlUnit]);

  const openCreateModal = () => {
    setEditingListing(null);
    setCropName('');
    setEstimatedQuantity('');
    setUnit('bags (90kg)');
    setPriceExpectation('');
    setCounty('');
    setGeneralArea('');
    setAdditionalNotes('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (listing: CropListingDTO) => {
    setEditingListing(listing);
    setCropName(listing.cropName);
    setEstimatedQuantity(listing.estimatedQuantity);
    setUnit(listing.unit);
    setPriceExpectation(listing.priceExpectationPerUnit !== undefined ? listing.priceExpectationPerUnit : '');
    setCounty(listing.county || '');
    setGeneralArea(listing.generalArea || '');
    setAdditionalNotes(listing.additionalNotes || '');
    setStatus(listing.status as any);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!cropName.trim() || !estimatedQuantity || Number(estimatedQuantity) <= 0) {
      alert('Please enter a valid crop name and quantity greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingListing && editingListing._id) {
        await updateCropListingApi(editingListing._id, {
          cropName: cropName.trim(),
          estimatedQuantity: Number(estimatedQuantity),
          unit: unit.trim(),
          priceExpectationPerUnit: priceExpectation === '' ? undefined : Number(priceExpectation),
          county: county.trim(),
          generalArea: generalArea.trim(),
          additionalNotes: additionalNotes.trim(),
          status,
        });
        setMessage({ type: 'success', text: 'Crop listing updated successfully!' });
      } else {
        await createCropListingApi({
          cropName: cropName.trim(),
          estimatedQuantity: Number(estimatedQuantity),
          unit: unit.trim(),
          priceExpectationPerUnit: priceExpectation === '' ? undefined : Number(priceExpectation),
          county: county.trim(),
          generalArea: generalArea.trim(),
          additionalNotes: additionalNotes.trim(),
          status,
        });
        setMessage({ type: 'success', text: 'New crop listing created successfully!' });
      }

      setIsModalOpen(false);
      fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save crop listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this crop listing?')) return;
    try {
      await deleteCropListingApi(id);
      setMessage({ type: 'success', text: 'Crop listing deleted.' });
      fetchListings();
    } catch {
      alert('Failed to delete listing.');
    }
  };

  const [matchModalListing, setMatchModalListing] = useState<CropListingDTO | null>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const fetchDemandsMatch = async (listing: CropListingDTO) => {
    setMatchModalListing(listing);
    setLoadingMatches(true);
    try {
      const res = await apiClient.get<{ data: { matches: any[] } }>(`/demands/match/${listing._id}`);
      setMatchResults(res.data.data.matches || []);
    } catch (err) {
      console.error(err);
      setMatchResults([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>My Crop Listings</h1>
          <p style={styles.subtitle}>
            Publish available crop yields for verified dealer matching.
          </p>
        </div>
        <button onClick={openCreateModal} style={styles.addBtn}>
          + Post New Crop Listing
        </button>
      </div>

      {/* Non-prescriptive notice */}
      <div style={styles.infoBanner}>
        <strong>Platform Notice:</strong> Crop listings provide transparent product information to help potential matching. MavunoTrust does not calculate market prices or tell you when to sell.
      </div>

      {message && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: message.type === 'success' ? '#86efac' : '#fca5a5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{message.text}</span>
          {message.type === 'success' && urlDealerId && (
            <button
              onClick={() => navigate(`/farmer/offers/create/${urlDealerId}?crop=${encodeURIComponent(cropName)}&qty=${encodeURIComponent(estimatedQuantity)}&unit=${encodeURIComponent(unit)}`)}
              style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Continue to Make Offer →
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading listings...
        </div>
      ) : listings.length === 0 ? (
        <div style={styles.emptyState}>
          <Sprout size={36} style={{ color: '#475569', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', color: '#f8fafc' }}>No crop listings yet</h3>
          <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            You haven't posted any crop offerings. Create your first listing to connect with dealers.
          </p>
          <button onClick={openCreateModal} style={styles.addBtn}>
            + Post First Crop Listing
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {listings.map((item) => (
            <div key={item._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cropTitle}>{item.cropName}</h3>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      item.status === 'ACTIVE'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(234, 179, 8, 0.15)',
                    color: item.status === 'ACTIVE' ? '#4ade80' : '#fde047',
                  }}
                >
                  {item.status}
                </span>
              </div>

              <div style={styles.detailsGrid}>
                <div>
                  <span style={styles.detailLabel}>Estimated Quantity:</span>
                  <div style={styles.detailVal}>
                    {item.estimatedQuantity} {item.unit}
                  </div>
                </div>

                {item.priceExpectationPerUnit && (
                  <div>
                    <span style={styles.detailLabel}>Target Asking Price:</span>
                    <div style={styles.detailVal}>
                      {item.currency || 'KES'} {item.priceExpectationPerUnit} / {item.unit}
                    </div>
                  </div>
                )}

                <div>
                  <span style={styles.detailLabel}>Location / County:</span>
                  <div style={styles.detailVal}>
                    {item.county || 'Not set'} ({item.generalArea || 'General area'})
                  </div>
                </div>

                {item.additionalNotes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={styles.detailLabel}>Notes:</span>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
                      {item.additionalNotes}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.cardFooter}>
                <button onClick={() => fetchDemandsMatch(item)} style={{ ...styles.editBtn, backgroundColor: '#0284c7', color: '#fff' }}>
                  Check Demand
                </button>
                <button onClick={() => openEditModal(item)} style={styles.editBtn}>
                  Edit Listing
                </button>
                <button onClick={() => handleDelete(item._id!)} style={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>
              {editingListing ? 'Edit Crop Listing' : 'Post New Crop Listing'}
            </h2>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Crop / Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yellow Maize, Rosecoco Beans, Irish Potatoes"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="e.g. 50"
                    value={estimatedQuantity}
                    onChange={(e) => setEstimatedQuantity(e.target.value ? Number(e.target.value) : '')}
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bags (90kg), kg, crates"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Asking Price Per Unit (Optional, KES)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3500"
                    value={priceExpectation}
                    onChange={(e) => setPriceExpectation(e.target.value ? Number(e.target.value) : '')}
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Listing Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={styles.input}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                </div>
              </div>

              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>County</label>
                  <input
                    type="text"
                    placeholder="e.g. Nakuru"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>General Area / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Rongai Sub-county"
                    value={generalArea}
                    onChange={(e) => setGeneralArea(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Additional Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Quality details, harvest date notes, packaging..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                  {isSubmitting ? 'Saving...' : editingListing ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demand Match Modal */}
      {matchModalListing && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: '600px' }}>
            <h2 style={styles.modalTitle}>Buyer Demands for {matchModalListing.cropName}</h2>
            {loadingMatches ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Checking active demands...</div>
            ) : matchResults.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                No active buyer demands match this crop at the moment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                {matchResults.map((m, idx) => (
                  <div key={idx} style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f8fafc' }}>{m.demand.dealerId?.fullName || 'Verified Dealer'}</h3>
                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '8px' }}>
                      <strong>Wants:</strong> {m.demand.quantity} {m.demand.unit}
                    </div>
                    {m.demand.targetPricePerUnit && (
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '8px' }}>
                        <strong>Target Price:</strong> {m.demand.currency} {m.demand.targetPricePerUnit} / {m.demand.unit}
                      </div>
                    )}
                    
                    <div style={{ marginTop: '12px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#4ade80' }}>Match Reasons:</strong>
                      <ul style={{ margin: '4px 0 8px 0', paddingLeft: '20px', fontSize: '0.85rem', color: '#94a3b8' }}>
                        {m.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>

                    {m.limitations.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#fca5a5' }}>Mismatches / Limitations:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: '#94a3b8' }}>
                          {m.limitations.map((l: string, i: number) => <li key={i}>{l}</li>)}
                        </ul>
                      </div>
                    )}

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setMatchModalListing(null);
                          navigate(`/farmer/offers/create/${m.demand.dealerId?._id}?crop=${encodeURIComponent(m.demand.cropName)}&qty=${encodeURIComponent(m.demand.quantity)}&unit=${encodeURIComponent(m.demand.unit)}`);
                        }}
                        style={{ ...styles.submitBtn, width: 'auto', padding: '6px 16px', fontSize: '0.85rem' }}
                      >
                        Initiate Offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ ...styles.formActions, marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setMatchModalListing(null)}
                style={styles.cancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
  },
  addBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  infoBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#93c5fd',
    padding: '14px 18px',
    borderRadius: '10px',
    fontSize: '0.875rem',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: '0.9rem',
    marginBottom: '20px',
  },
  emptyState: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '48px 24px',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cropTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#f8fafc',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '12px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
    marginBottom: '20px',
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailVal: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginTop: '2px',
  },
  cardFooter: {
    display: 'flex',
    gap: '10px',
    paddingTop: '14px',
    borderTop: '1px solid #334155',
  },
  editBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    border: '1px solid #475569',
    color: '#cbd5e1',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--mt-overlay, rgba(0,0,0,0.7))',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '540px',
    backgroundColor: 'var(--mt-modal-bg, #1e293b)',
    border: '1px solid var(--mt-modal-border, #334155)',
    borderRadius: '16px',
    padding: '28px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--mt-modal-title, #f8fafc)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--mt-modal-label, #cbd5e1)',
  },
  input: {
    backgroundColor: 'var(--mt-input-bg, #0f172a)',
    border: '1px solid var(--mt-input-border, #475569)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.9rem',
    color: 'var(--mt-modal-title, #f8fafc)',
    outline: 'none',
  },
  textarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.9rem',
    color: '#f8fafc',
    outline: 'none',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #475569',
    color: '#94a3b8',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
