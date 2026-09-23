import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { KenaffSupportSection } from '../components/KenaffSupportSection';
import {
  Scale, ChevronDown, MessageCircle, FileText,
  AlertTriangle, Send, CheckCircle2, ScrollText,
  Bot, Sparkles, User, Loader2,
} from 'lucide-react';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/pages.css';

interface RightsCard {
  id: string; title: string; explanation: string;
  whyItMatters: string; officialSource: string; textId: string;
}

export const RightsCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const [rights, setRights] = useState<RightsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRight, setOpenRight] = useState<string | null>(null);

  // Gemini chat
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'gemini'; text: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Remedy form
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [remedySubmitted, setRemedySubmitted] = useState('');
  const [remedyError, setRemedyError] = useState('');

  useEffect(() => {
    apiClient.get('/rights')
      .then(res => { if (res.data?.success) setRights(res.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, asking]);

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question.trim();
    setChatLog(prev => [...prev, { role: 'user', text: q }]);
    setQuestion(''); setAsking(true); setGeminiError('');
    try {
      const res = await apiClient.post('/rights/ask', { question: q });
      if (res.data?.success && res.data.data?.answer) {
        setChatLog(prev => [...prev, { role: 'gemini', text: res.data.data.answer }]);
      } else {
        throw new Error('Invalid response from AI assistant');
      }
    } catch (err: any) {
      setGeminiError(err.response?.status === 503
        ? 'The AI assistant is currently unavailable.'
        : "We couldn't process your question right now. Please try again later.");
    } finally { setAsking(false); }
  };

  const handleRemedySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description.trim()) { setRemedyError('Please select a category and describe the problem.'); return; }
    setRemedyError('');
    try {
      const res = await apiClient.post('/rights/remedy', { category, description });
      if (res.data?.success) { setRemedySubmitted(res.data.message); setCategory(''); setDescription(''); }
    } catch { setRemedyError('Failed to submit report. Please try again later.'); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-icon purple">
          <Scale size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Farmer Rights Centre</h1>
          <p className="page-subtitle">Understand your rights, ask the AI assistant, and report problems through official channels.</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/farmer/complaints')} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ScrollText size={15} /> My Complaints
        </button>
      </div>

      {/* ── Know Your Rights ── */}
      <div className="page-card page-card--spaced" style={{ marginBottom: 24 }}>
        <h2 className="section-heading">Know Your Rights</h2>
        {loading && <LoadSpinner fullPage={false} size="sm" text="Loading rights information…" />}
        {!loading && rights.length === 0 && (
          <p style={{ color: '#6b9276', fontSize: '0.875rem' }}>No rights information is available right now. Please check back later.</p>
        )}
        {!loading && rights.length > 0 && (
          <div className="rights-accordion">
            {rights.map(r => (
              <div key={r.id} className="rights-item">
                <div className="rights-item-header" onClick={() => setOpenRight(openRight === r.id ? null : r.id)}>
                  <div className="rights-item-icon" aria-hidden="true"><Scale size={14} /></div>
                  <span className="rights-item-title">{r.title}</span>
                  <ChevronDown size={16} className={`rights-item-chevron ${openRight === r.id ? 'open' : ''}`} />
                </div>
                {openRight === r.id && (
                  <div className="rights-item-body">
                    <p style={{ margin: '0 0 10px 0' }}>{r.explanation}</p>
                    <div style={{ background: 'rgba(39,137,79,0.07)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                      <strong style={{ color: '#5ec285', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Why this matters</strong>
                      <span style={{ fontSize: '0.85rem' }}>{r.whyItMatters}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b9276' }}>
                      Official source: {r.officialSource}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Chat ── */}
      <div className="page-card page-card--spaced" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <h2 className="section-heading" style={{ marginBottom: 0 }}>Ask about your rights</h2>
          <span className="offer-status-badge pending" style={{ fontSize: '0.65rem' }}>AI</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#6b9276', marginBottom: 16, lineHeight: 1.6 }}>
          This AI assistant explains the approved rights information on this page. It is not a lawyer and cannot give personalized legal advice.
        </p>

        {/* Chat log */}
        <div className="rights-chat-box">
          {chatLog.length === 0 && (
            <div className="rights-chat-empty">
              <Sparkles size={18} style={{ display: 'inline-block', marginBottom: 6, color: '#5ec285' }} />
              <div>Ask a question below about your rights, disputes, or contracts to get started…</div>
            </div>
          )}
          {chatLog.map((log, i) => (
            <div key={i} className={`rights-chat-msg ${log.role === 'user' ? 'rights-chat-msg--user' : 'rights-chat-msg--gemini'}`}>
              <div className="rights-chat-sender">
                {log.role === 'user' ? (
                  <>
                    <User size={12} /> You
                  </>
                ) : (
                  <>
                    <Bot size={13} /> Mavuno AI Assistant
                  </>
                )}
              </div>
              <div className={`rights-chat-bubble ${log.role === 'user' ? 'rights-chat-bubble--user' : 'rights-chat-bubble--gemini'}`}>
                {renderFormattedText(log.text)}
              </div>
            </div>
          ))}
          {asking && (
            <div className="rights-chat-msg rights-chat-msg--gemini">
              <div className="rights-chat-sender">
                <Bot size={13} /> Mavuno AI Assistant
              </div>
              <div className="rights-chat-thinking">
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Thinking and reviewing approved rights…</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {geminiError && (
          <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} /> {geminiError}
          </div>
        )}

        <form onSubmit={handleAskGemini} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" className="form-input"
            value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. How does MavunoTrust handle my privacy?"
          />
          <button type="submit" disabled={asking || !question.trim()} className="btn btn-primary" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Send size={15} /> Ask
          </button>
        </form>
      </div>

      {/* ── Report a Problem ── */}
      <div className="page-card page-card--spaced" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <FileText size={18} style={{ color: '#5ec285' }} />
          <h2 className="section-heading" style={{ marginBottom: 0 }}>Need Help With a Problem?</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#6b9276', marginBottom: 20, lineHeight: 1.6 }}>
          Report a problem through MavunoTrust. Depending on the issue, you may also need to contact the appropriate official institution or seek legal assistance.
        </p>

        {remedySubmitted ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <CheckCircle2 size={36} style={{ color: '#5ec285', marginBottom: 12 }} />
            <p style={{ color: '#5ec285', fontWeight: 600, marginBottom: 16 }}>{remedySubmitted}</p>
            <button className="btn btn-primary" onClick={() => navigate('/farmer/complaints')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MessageCircle size={15} /> View My Complaints
            </button>
          </div>
        ) : (
          <form onSubmit={handleRemedySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {remedyError && (
              <div style={{ color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} /> {remedyError}
              </div>
            )}
            <div className="form-field">
              <label className="form-label">Problem Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select a category…</option>
                <option value="payment">Payment problem</option>
                <option value="price">Price disagreement</option>
                <option value="quantity">Quantity disagreement</option>
                <option value="quality">Quality disagreement</option>
                <option value="dealer">Dealer / licence concern</option>
                <option value="privacy">Privacy concern</option>
                <option value="misrepresentation">Misrepresentation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Brief Description</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what happened…"
                rows={4}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Send size={15} /> Submit Report
            </button>
          </form>
        )}

        <div style={{ marginTop: 24 }}>
          <KenaffSupportSection defaultOpen={false} />
        </div>
      </div>
    </div>
  );
};

export default RightsCentrePage;
