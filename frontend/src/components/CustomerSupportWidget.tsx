import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Headphones,
  X,
  Sparkles,
  PhoneOff,
  Mic,
  MicOff,
  Languages,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import VoiceWaveform from './VoiceWaveform';
import { loadElevenLabsClient } from '../lib/elevenLabsClient';
import './CustomerSupportWidget.css';

interface CustomerSupportWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SuggestedQuery {
  lang: 'en' | 'sw';
  text: string;
  category: string;
}

const SUGGESTED_QUERIES: SuggestedQuery[] = [
  // English questions
  {
    lang: 'en',
    category: 'Calculator',
    text: 'How do I calculate my crop break-even cost?',
  },
  {
    lang: 'en',
    category: 'Dealers',
    text: 'Where can I find verified agricultural dealers with AFA badges?',
  },
  {
    lang: 'en',
    category: 'Offers',
    text: 'How do trade offers and counter-offers work?',
  },
  {
    lang: 'en',
    category: 'Market Prices',
    text: 'Where do I find live wholesale market commodity prices?',
  },
  {
    lang: 'en',
    category: 'Rights',
    text: 'What is the Rights Centre and how can KENAFF help me?',
  },
  {
    lang: 'en',
    category: 'Transactions',
    text: 'How do I track completed transactions and leave ratings?',
  },
  // Kiswahili questions
  {
    lang: 'sw',
    category: 'Kikokotoo',
    text: 'Ninawezaje kukokotoa gharama za uzalishaji wa mazao yangu?',
  },
  {
    lang: 'sw',
    category: 'Madalali Walioidhinishwa',
    text: 'Nitawapata wapi madalali na wanunuzi walioidhinishwa na AFA?',
  },
  {
    lang: 'sw',
    category: 'Bei za Masoko',
    text: 'Bei za soko la jumla kama vile Nairobi na Eldoret zinapatikana wapi?',
  },
  {
    lang: 'sw',
    category: 'Biashara na Matoleo',
    text: 'Namna gani ya kutuma ofa au kukubali bei ya mnunuzi wa mazao?',
  },
  {
    lang: 'sw',
    category: 'Haki za Mkulima',
    text: 'Kituo cha Haki ni nini na KENAFF husaidia aje iwapo kuna mgogoro?',
  },
  {
    lang: 'sw',
    category: 'Ulinzi wa Biashara',
    text: 'MavunoTrust inalinda aje wakulima dhidi ya ulaghai wa madalali?',
  },
];

export const CustomerSupportWidget: React.FC<CustomerSupportWidgetProps> = ({
  isOpen,
  onClose,
}) => {
  const [agentId, setAgentId] = useState<string>('');

  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'sw'>('all');

  // Voice call states
  const [isCalling, setIsCalling] = useState(false);
  const [callState, setCallState] = useState<
    'idle' | 'connecting' | 'listening' | 'speaking'
  >('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([]);

  const conversationRef = useRef<any>(null);

  // Fetch Agent ID from backend config
  useEffect(() => {
    apiClient
      .get('/voice/customer-support/config')
      .then((res) => {
        const id = res.data?.data?.agentId;
        if (id) {
          setAgentId(id);
        }
      })
      .catch((err) => {
        console.warn('[Mavuno Support] Failed to fetch voice config:', err);
      });
  }, []);

  // Start voice conversation
  const startCall = useCallback(async () => {
    try {
      setCallError(null);
      setCallState('connecting');
      setIsCalling(true);

      let activeAgentId = agentId;
      if (!activeAgentId) {
        try {
          const res = await apiClient.get('/voice/customer-support/config');
          activeAgentId = res.data?.data?.agentId;
          if (activeAgentId) {
            setAgentId(activeAgentId);
          }
        } catch (e) {
          // backend fetch failed
        }
      }

      if (!activeAgentId) {
        throw new Error('Customer support voice agent is not configured on the backend.');
      }

      const Conversation = await loadElevenLabsClient();

      const conversation = await Conversation.startSession({
        agentId: activeAgentId,
        onConnect: () => {
          setCallState('listening');
        },
        onDisconnect: (details: any) => {
          console.warn('[Mavuno Support] Disconnected:', details);
          if (details?.reason === 'error' && details?.message) {
            setCallError(`Call ended: ${details.message}`);
          }
          setCallState('idle');
          setIsCalling(false);
          conversationRef.current = null;
        },
        onError: (err: any) => {
          console.error('[Mavuno Support] Conversation error:', err);
          const msg =
            typeof err === 'string'
              ? err
              : err?.message || 'Voice connection interrupted.';
          setCallError(msg);
          setCallState('idle');
          setIsCalling(false);
          conversationRef.current = null;
        },
        onModeChange: ({ mode }: { mode: 'speaking' | 'listening' }) => {
          setCallState(mode === 'speaking' ? 'speaking' : 'listening');
        },
        onMessage: (message: any) => {
          const source = message?.source || message?.role;
          const text = message?.message || message?.text || '';
          if (!text) return;
          const role: 'assistant' | 'user' =
            source === 'ai' || source === 'assistant' || source === 'agent'
              ? 'assistant'
              : 'user';
          setTranscript((prev) => [...prev, { role, text }]);
        },
      });

      conversationRef.current = conversation;
    } catch (err: any) {
      console.error('[Mavuno Support] Failed to start voice session:', err);
      let friendlyMsg = err?.message || 'Failed to connect voice agent. Please try again.';
      const msg = err?.message?.toLowerCase() || '';
      if (
        msg.includes('mic') ||
        msg.includes('permission') ||
        msg.includes('notallowed')
      ) {
        friendlyMsg =
          'Microphone permission was denied. Please allow microphone access in your browser.';
      }
      setCallError(friendlyMsg);
      setCallState('idle');
      setIsCalling(false);
      conversationRef.current = null;
    }
  }, [agentId]);

  // End voice conversation
  const endCall = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession?.();
      } catch (e) {
        console.warn('Error closing session:', e);
      }
    }
    conversationRef.current = null;
    setIsCalling(false);
    setCallState('idle');
    setIsMuted(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (conversationRef.current) {
      const nextMute = !isMuted;
      try {
        await conversationRef.current.setMuted?.(nextMute);
        setIsMuted(nextMute);
      } catch (e) {
        console.warn('Error setting mute:', e);
      }
    }
  }, [isMuted]);

  // Clean up when modal closes or unmounts
  useEffect(() => {
    if (!isOpen && isCalling) {
      endCall();
    }
  }, [isOpen, isCalling, endCall]);

  // Keyboard shortcut: close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endCall();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, endCall]);

  const filteredQueries = SUGGESTED_QUERIES.filter((q) => {
    if (selectedLang === 'all') return true;
    return q.lang === selectedLang;
  });

  if (!isOpen) return null;

  const statusLabel =
    callState === 'connecting'
      ? 'Inaunganisha sauti… • Connecting voice…'
      : callState === 'listening'
      ? 'Ninakusikiliza… • Listening to you'
      : callState === 'speaking'
      ? 'Mavuno Support inazungumza… • Speaking'
      : 'Tayari kusaidia • Ready to help (EN / SW)';

  return (
    <>
      {/* Backdrop */}
      <div
        className="csw-backdrop"
        onClick={() => {
          endCall();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="csw-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csw-title"
      >
        {/* Header with Title + Toggle Button + Close */}
        <div className="csw-header">
          <div className="csw-title-wrap">
            <div className="csw-avatar" aria-hidden="true">
              <Headphones size={22} />
              <span className={`csw-pulse-dot ${isCalling ? 'csw-pulse-dot--active' : ''}`} />
            </div>
            <div className="csw-title-text">
              <span id="csw-title" className="csw-title">
                Customer Support AI
              </span>
              <div className="csw-badge-row">
                <span className="csw-badge">MavunoTrust Voice Guide</span>
                <span className="csw-badge-pill">
                  <Languages size={10} /> EN • KISWAHILI
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Live Voice Toggle Switch & Close */}
          <div className="csw-header-right">
            {/* Live Voice Toggle Switch (Voice only ON / OFF) */}
            <button
              type="button"
              onClick={() => {
                if (isCalling) {
                  endCall();
                } else {
                  startCall();
                }
              }}
              className={`csw-voice-toggle-btn ${isCalling ? 'csw-voice-toggle-btn--active' : ''}`}
              title={isCalling ? 'Turn off Live Voice' : 'Turn on Live Voice'}
              aria-pressed={isCalling}
            >
              <span className={`csw-toggle-led ${isCalling ? 'csw-toggle-led--active' : ''}`} />
              <span className="csw-toggle-text">
                {isCalling ? 'Live Voice: ON' : 'Live Voice: OFF'}
              </span>
              <span className={`csw-toggle-switch ${isCalling ? 'csw-toggle-switch--on' : ''}`}>
                <span className="csw-toggle-knob" />
              </span>
            </button>

            <button
              type="button"
              className="csw-close-btn"
              onClick={() => {
                endCall();
                onClose();
              }}
              aria-label="Close customer support"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="csw-body">
          {/* Custom Voice Stage Card */}
          <div className="csw-stage-card">
            {/* Canvas Sound Wave Visualizer */}
            <VoiceWaveform state={callState} />

            {/* Status Pill */}
            <div className={`csw-status-pill csw-status-pill--${callState}`}>
              <span
                className={`csw-status-indicator csw-status-indicator--${callState}`}
              />
              <span>{statusLabel}</span>
            </div>

            {/* Controls */}
            <div className="csw-controls-row">
              {!isCalling ? (
                <button
                  type="button"
                  className="csw-start-btn"
                  onClick={startCall}
                >
                  <Mic size={18} />
                  <span>Start Voice Call • Anza Maongezi</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={`csw-tool-btn ${
                      isMuted ? 'csw-tool-btn--active' : ''
                    }`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    type="button"
                    className="csw-end-btn"
                    onClick={endCall}
                    title="End voice call"
                  >
                    <PhoneOff size={16} />
                    <span>End Call • Sitisha</span>
                  </button>
                </>
              )}
            </div>

            {/* Call Error Notice */}
            {callError && (
              <div className="csw-error-notice">
                {callError}
              </div>
            )}

            {/* Live Conversation Transcript */}
            <div className="csw-transcript-box">
              {transcript.length === 0 ? (
                <div className="csw-transcript-empty">
                  {isCalling
                    ? 'Start speaking in English or Kiswahili… / Unaweza kuanza kuongea kwa Kiswahili au Kiingereza…'
                    : 'Toggle Live Voice ON or click "Start Voice Call" to talk with the MavunoTrust support assistant.'}
                </div>
              ) : (
                transcript.map((item, idx) => (
                  <div key={idx} className={`csw-msg csw-msg--${item.role}`}>
                    <span className="csw-msg-author">
                      {item.role === 'user' ? 'You / Wewe' : 'Mavuno Support'}
                    </span>
                    <span className="csw-msg-bubble">{item.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dual-Language Suggested Queries Section */}
          <div className="csw-suggestions-section">
            <div className="csw-suggestions-header">
              <span className="csw-suggestions-title">
                <Sparkles size={14} /> Questions You Can Ask • Maswali Unayoweza Kuuliza
              </span>

              {/* Language Switcher Tabs */}
              <div className="csw-lang-tabs" role="tablist">
                <button
                  type="button"
                  className={`csw-lang-tab ${
                    selectedLang === 'all' ? 'csw-lang-tab--active' : ''
                  }`}
                  onClick={() => setSelectedLang('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`csw-lang-tab ${
                    selectedLang === 'en' ? 'csw-lang-tab--active' : ''
                  }`}
                  onClick={() => setSelectedLang('en')}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`csw-lang-tab ${
                    selectedLang === 'sw' ? 'csw-lang-tab--active' : ''
                  }`}
                  onClick={() => setSelectedLang('sw')}
                >
                  Kiswahili
                </button>
              </div>
            </div>

            <div className="csw-chips-grid">
              {filteredQueries.map((q, idx) => (
                <div
                  key={idx}
                  className="csw-chip-card"
                  onClick={() => {
                    if (!isCalling) startCall();
                  }}
                  title="Ask this question out loud"
                >
                  <span>{q.text}</span>
                  <span
                    className={`csw-chip-lang-badge csw-chip-lang-badge--${q.lang}`}
                  >
                    {q.lang === 'sw' ? 'SW' : 'EN'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="csw-footer-note">
            MavunoTrust Voice Assistant • Huduma kwa Wateja kwa Sauti
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerSupportWidget;
