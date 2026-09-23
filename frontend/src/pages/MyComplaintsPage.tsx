import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { KENAFF_CONTACTS, generateComplaintSummary, generateMailtoLink } from '../utils/kenaffUtils';
import { KenaffSupportSection } from '../components/KenaffSupportSection';
import type { ComplaintData } from '../utils/kenaffUtils';
import {
  ScrollText, AlertTriangle, Phone, Mail, Copy,
  CheckCircle2, Clock, ArrowRight,
} from 'lucide-react';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/pages.css';

interface Complaint extends ComplaintData { status: string; }

const statusBadge = (status: string) => {
  if (status === 'OPEN') return 'offer-status-badge pending';
  if (status === 'RESOLVED') return 'offer-status-badge accepted';
  return 'offer-status-badge cancelled';
};

export const MyComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiClient.get('/rights/complaints');
      if (res.data?.success) setComplaints(res.data.data);
      else setError('Failed to load complaints.');
    } catch {
      setError('Could not load your reported problems right now. Please try again later.');
    } finally { setLoading(false); }
  };

  const handleCopy = (c: Complaint) => {
    const text = generateComplaintSummary(c);
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-icon red">
          <ScrollText size={22} />
        </div>
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Problems you have reported through MavunoTrust. Track their status and seek further support.</p>
        </div>
      </div>

      {loading && <LoadSpinner fullPage={false} size="md" text="Loading complaints…" />}

      {!loading && error && (
        <div className="state-card state-card--error">
          <AlertTriangle size={20} />
          <span className="state-title">Error loading complaints</span>
          <span className="state-desc">{error}</span>
          <button className="btn btn-outline" onClick={fetchComplaints}>Retry</button>
        </div>
      )}

      {!loading && !error && complaints.length === 0 && (
        <div className="state-card">
          <ScrollText size={28} />
          <span className="state-title">No complaints filed</span>
          <span className="state-desc">You haven't reported any problems yet. If you have a dispute, use the Rights Centre to find remedies.</span>
          <button className="btn btn-primary" onClick={() => navigate('/farmer/rights')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Find Remedy <ArrowRight size={15} />
          </button>
        </div>
      )}

      {!loading && !error && complaints.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {complaints.map(c => (
            <div key={c.caseId} className="complaint-card">
              <div className="complaint-header">
                <div>
                  <p className="complaint-title">Case #{c.caseId}</p>
                  <p className="complaint-meta">
                    <span><Clock size={11} /> Submitted {new Date(c.createdAt).toLocaleDateString()}</span>
                    <span>Category: {c.category.replace(/_/g, ' ')}</span>
                  </p>
                </div>
                <span className={statusBadge(c.status)}>
                  {c.status === 'RESOLVED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {c.status}
                </span>
              </div>

              <p className="complaint-body">{c.description}</p>

              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 14,
              }}>
                <p style={{ fontSize: '0.82rem', color: '#6b9276', marginBottom: 10 }}>
                  Need further help? Contact KENAFF directly. MavunoTrust does not automatically share your complaint — you choose whether to contact them.
                </p>
                <div className="complaint-actions">
                  <a href={`tel:${KENAFF_CONTACTS.primaryPhone}`} className="btn-sm btn-sm-outline" style={{ textDecoration: 'none' }}>
                    <Phone size={13} /> Call KENAFF
                  </a>
                  <a href={generateMailtoLink(c)} className="btn-sm btn-sm-outline" style={{ textDecoration: 'none' }}>
                    <Mail size={13} /> Email KENAFF
                  </a>
                  <button className="btn-sm btn-sm-outline" onClick={() => handleCopy(c)}>
                    <Copy size={13} /> Copy Complaint
                  </button>
                </div>
              </div>
            </div>
          ))}

          <KenaffSupportSection defaultOpen={false} />
        </div>
      )}
    </div>
  );
};

export default MyComplaintsPage;
