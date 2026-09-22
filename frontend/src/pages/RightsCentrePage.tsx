import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { KenaffSupportSection } from '../components/KenaffSupportSection';

interface RightsCard {

  id: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  officialSource: string;
  textId: string;
}

export const RightsCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const [rights, setRights] = useState<RightsCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Gemini Chat State
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'gemini', text: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const [geminiError, setGeminiError] = useState('');

  // Remedy Form State
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [remedySubmitted, setRemedySubmitted] = useState('');
  const [remedyError, setRemedyError] = useState('');

  useEffect(() => {
    const fetchRights = async () => {
      try {
        const res = await apiClient.get('/rights');
        if (res.data && res.data.success) {
          setRights(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load rights content', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRights();
  }, []);

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question.trim();
    setChatLog(prev => [...prev, { role: 'user', text: currentQuestion }]);
    setQuestion('');
    setAsking(true);
    setGeminiError('');

    try {
      const res = await apiClient.post('/rights/ask', { question: currentQuestion });
      if (res.data && res.data.success) {
        setChatLog(prev => [...prev, { role: 'gemini', text: res.data.data.answer }]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err: any) {
      console.error('Gemini error:', err);
      if (err.response?.status === 503) {
        setGeminiError("The AI assistant is currently unavailable.");
      } else {
        setGeminiError("We couldn't process your question right now. Please try again later.");
      }
    } finally {
      setAsking(false);
    }
  };

  const handleRemedySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description.trim()) {
      setRemedyError('Please select a category and provide a description.');
      return;
    }

    setRemedyError('');
    try {
      const res = await apiClient.post('/rights/remedy', { category, description });
      if (res.data && res.data.success) {
        setRemedySubmitted(res.data.message);
        setCategory('');
        setDescription('');
      }
    } catch (err) {
      console.error('Remedy error:', err);
      setRemedyError('Failed to submit report. Please try again later.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#1f2937' }}>Farmer Rights Centre</h1>
          <p style={{ fontSize: '1.1rem', color: '#4b5563', margin: 0 }}>
            Understand your basic rights, ask questions about platform rules, and find out where to seek help for problems.
          </p>
        </div>
        <button 
          onClick={() => navigate('/farmer/complaints')}
          style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
        >
          My Complaints
        </button>
      </div>

      {/* 1. KNOW YOUR RIGHTS */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>
          Know Your Rights
        </h2>
        
        {loading ? (
          <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>Loading approved rights information...</div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {rights.map(right => (
              <div key={right.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', marginTop: 0, color: '#111827' }}>{right.title}</h3>
                
                <p style={{ fontSize: '1rem', color: '#374151', lineHeight: '1.5' }}>
                  {right.explanation}
                </p>

                <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>

                  <strong style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>Why does this matter?</strong>
                  <span style={{ fontSize: '0.95rem', color: '#4b5563' }}>{right.whyItMatters}</span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                  <strong>Official Source:</strong> {right.officialSource}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ASK GEMINI */}
      <div style={{ marginBottom: '40px', backgroundColor: '#fdf4ff', padding: '20px', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
        <h2 style={{ fontSize: '1.5rem', marginTop: 0, color: '#831843' }}>Ask about your rights</h2>
        <p style={{ fontSize: '0.95rem', color: '#9d174d', marginBottom: '15px' }}>
          <strong>Note:</strong> This AI assistant explains the approved rights information on this page. It is not a lawyer and cannot give personalized legal advice.
        </p>

        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #fce7f3', minHeight: '100px', maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
          {chatLog.length === 0 ? (
            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Ask a question below to start...</span>
          ) : (
            chatLog.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '10px', textAlign: log.role === 'user' ? 'right' : 'left' }}>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '8px 12px', 
                  borderRadius: '12px', 
                  backgroundColor: log.role === 'user' ? '#fbcfe8' : '#f3f4f6',
                  color: log.role === 'user' ? '#831843' : '#1f2937',
                  maxWidth: '80%'
                }}>
                  {log.text}
                </span>
              </div>
            ))
          )}
          {asking && <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '10px' }}>Thinking...</div>}
        </div>

        {geminiError && <div style={{ color: '#be123c', fontSize: '0.9rem', marginBottom: '10px' }}>{geminiError}</div>}

        <form onSubmit={handleAskGemini} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={question} 
            onChange={e => setQuestion(e.target.value)} 
            placeholder="e.g. How does MavunoTrust handle my privacy?"
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #f9a8d4' }}
          />
          <button 
            type="submit" 
            disabled={asking || !question.trim()}
            style={{ padding: '10px 20px', backgroundColor: '#db2777', color: '#fff', border: 'none', borderRadius: '4px', cursor: (asking || !question.trim()) ? 'not-allowed' : 'pointer' }}
          >
            Ask
          </button>
        </form>
      </div>

      {/* 3. FIND REMEDY */}
      <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
        <h2 style={{ fontSize: '1.5rem', marginTop: 0, color: '#166534' }}>Need Help With a Problem?</h2>
        <p style={{ fontSize: '0.95rem', color: '#166534', marginBottom: '20px' }}>
          You can report a problem through MavunoTrust. Depending on the issue, you may also need to contact the appropriate official institution or seek professional legal assistance.
        </p>

        {remedySubmitted ? (
          <div style={{ backgroundColor: '#dcfce7', padding: '20px', borderRadius: '6px', color: '#166534', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: '0 0 15px 0' }}>{remedySubmitted}</p>
            <button 
              onClick={() => navigate('/farmer/complaints')}
              style={{ padding: '10px 20px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              View My Complaints
            </button>
          </div>
        ) : (
          <form onSubmit={handleRemedySubmit}>
            {remedyError && <div style={{ color: '#b91c1c', marginBottom: '10px', fontSize: '0.9rem' }}>{remedyError}</div>}
            
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#14532d' }}>Problem Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #86efac' }}
            >
              <option value="">Select a category...</option>
              <option value="payment">Payment problem</option>
              <option value="price">Price disagreement</option>
              <option value="quantity">Quantity disagreement</option>
              <option value="quality">Quality disagreement</option>
              <option value="dealer">Dealer/licence concern</option>
              <option value="privacy">Privacy concern</option>
              <option value="misrepresentation">Misrepresentation</option>
              <option value="other">Other</option>
            </select>

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#14532d' }}>Brief Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              rows={4}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #86efac', resize: 'vertical' }}
            />

            <button 
              type="submit"
              style={{ width: '100%', padding: '12px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Submit Report
            </button>
          </form>
        )}

        <KenaffSupportSection defaultOpen={true} style={{ marginTop: '25px' }} />
      </div>

    </div>
  );
};

export default RightsCentrePage;
