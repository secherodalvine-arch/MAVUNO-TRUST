import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { KENAFF_CONTACTS, generateComplaintSummary, generateMailtoLink } from '../utils/kenaffUtils';
import { KenaffSupportSection } from '../components/KenaffSupportSection';
import type { ComplaintData } from '../utils/kenaffUtils';

interface Complaint extends ComplaintData {
  status: string;
}

export const MyComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/rights/complaints');
      if (res.data && res.data.success) {
        setComplaints(res.data.data);
      } else {
        setError('Failed to load complaints.');
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError('We could not load your reported problems right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (complaint: Complaint) => {
    const text = generateComplaintSummary(complaint);
    navigator.clipboard.writeText(text).then(() => {
      alert('Complaint copied.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#1f2937' }}>My Complaints</h1>
        <p style={{ fontSize: '1.1rem', color: '#4b5563', margin: 0 }}>
          Here you can see problems you have reported through MavunoTrust.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center', color: '#4b5563' }}>
          Loading your reported problems...
        </div>
      ) : error ? (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <p style={{ color: '#b91c1c', margin: '0 0 10px 0', fontWeight: 'bold' }}>Error</p>
          <p style={{ color: '#991b1b', margin: '0 0 15px 0' }}>{error}</p>
          <button 
            onClick={fetchComplaints}
            style={{ padding: '8px 16px', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <div style={{ padding: '30px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '20px' }}>You haven't reported any problems yet.</p>
          <button 
            onClick={() => navigate('/farmer/rights')}
            style={{ padding: '10px 20px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1.1rem', cursor: 'pointer' }}
          >
            Find Remedy
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {complaints.map(complaint => (
            <div key={complaint.caseId} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#111827', fontSize: '1.2rem' }}>Case ID: {complaint.caseId}</h3>
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Date submitted: {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ 
                  backgroundColor: complaint.status === 'OPEN' ? '#fef3c7' : complaint.status === 'RESOLVED' ? '#dcfce7' : '#f3f4f6', 
                  color: complaint.status === 'OPEN' ? '#92400e' : complaint.status === 'RESOLVED' ? '#166534' : '#374151',
                  padding: '4px 12px', 
                  borderRadius: '9999px', 
                  fontSize: '0.85rem', 
                  fontWeight: 'bold' 
                }}>
                  Status: {complaint.status}
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#374151' }}>Problem: </strong>
                <span style={{ color: '#4b5563' }}>{complaint.category.replace('_', ' ')}</span>
              </div>
              
              <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>Description:</strong>
                <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {complaint.description}
                </p>
              </div>

              {/* KENAFF Support Section per Complaint */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '1rem' }}>Need further help?</h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#4b5563' }}>
                  If you want to seek additional support, you can contact KENAFF using their official contact details. 
                  MavunoTrust does not automatically submit your complaint to KENAFF. You choose whether to contact them.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a 
                    href={`tel:${KENAFF_CONTACTS.primaryPhone}`} 
                    aria-label="Call KENAFF Primary Phone"
                    style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#1f2937', textDecoration: 'none', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}
                  >
                    Call KENAFF
                  </a>
                  <a 
                    href={generateMailtoLink(complaint)}
                    aria-label="Email KENAFF"
                    title="Opens your email application"
                    style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#1f2937', textDecoration: 'none', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}
                  >
                    Email KENAFF
                  </a>
                  <button 
                    onClick={() => handleCopy(complaint)}
                    style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Copy Complaint
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* KENAFF Official Info Section */}
          <KenaffSupportSection defaultOpen={true} />
        </div>
      )}
    </div>
  );
};

export default MyComplaintsPage;
