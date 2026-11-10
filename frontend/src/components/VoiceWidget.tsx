import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  PhoneOff,
  AlertCircle,
  Volume2,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Scale,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { loadElevenLabsClient } from '../lib/elevenLabsClient';
import VoiceWaveform from './VoiceWaveform';
import './VoiceWidget.css';

const DEFAULT_HOMEPAGE_AGENT_ID = 'agent_6201m324f8y1fz8bx69fbxxr75dy';

interface SamplePrompt {
  icon: React.ReactNode;
  en: string;
  sw: string;
}

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    icon: <TrendingUp size={14} color="#f59e0b" />,
    en: "What are today's commodity market prices?",
    sw: "Bei za mazao sokoni leo ni ngapi?",
  },
  {
    icon: <ShieldCheck size={14} color="#10b981" />,
    en: "How do I verify a licensed agricultural dealer?",
    sw: "Ninawezaje kuthibitisha leseni ya dalali?",
  },
  {
    icon: <Scale size={14} color="#38bdf8" />,
    en: "What are my rights under Kenya agricultural law?",
    sw: "Haki zangu za kisheria ni zipi kama mkulima?",
  },
];

/**
 * MavunoTrust AI Voice Assistant Widget
 *
 * Fully responsive modal dialog designed for all screen sizes (mobile, tablet, desktop).
 * Supports ElevenLabs Conversational AI with graceful fallback guidance.
 */
export const VoiceWidget: React.FC = () => {
  const [agentId, setAgentId] = useState<string>(
    () => import.meta.env.VITE_ELEVENLABS_AGENT_ID || DEFAULT_HOMEPAGE_AGENT_ID
  );
  const [open, setOpen] = useState(false);

  // Call states
  const [isCalling, setIsCalling] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const conversationRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fetch agent ID from backend configuration if available
  useEffect(() => {
    apiClient
      .get('/voice/config')
      .then((res) => {
        const id = res.data?.data?.agentId;
        if (id && id.trim()) {
          setAgentId(id.trim());
        }
      })
      .catch(() => {
        // Fallback default agent ID is already set
      });
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, callState]);

  // Start ElevenLabs Conversational AI session
  const startCall = useCallback(async () => {
    try {
      setCallError(null);
      setCallState('connecting');
      setIsCalling(true);

      const Conversation = await loadElevenLabsClient();

      const conversation = await Conversation.startSession({
        agentId,
        onConnect: () => {
          setCallState('listening');
        },
        onDisconnect: () => {
          setCallState('idle');
          setIsCalling(false);
          conversationRef.current = null;
        },
        onError: (err: any) => {
          console.error('[VoiceWidget] Conversation error:', err);
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
      console.error('[VoiceWidget] Failed to start voice session:', err);
      let friendlyMsg = 'Failed to connect to voice assistant. Please check your microphone permissions.';
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('mic') || msg.includes('permission') || msg.includes('notallowed')) {
        friendlyMsg = 'Microphone permission was denied. Please allow mic access in your browser to talk with the assistant.';
      } else if (msg.includes('cdn') || msg.includes('script') || msg.includes('network')) {
        friendlyMsg = 'Unable to reach the voice service. Please check your internet connection.';
      }
      setCallError(friendlyMsg);
      setCallState('idle');
      setIsCalling(false);
      conversationRef.current = null;
    }
  }, [agentId]);

  // End voice session
  const endCall = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession?.();
      } catch (e) {
        console.warn('[VoiceWidget] Error ending session:', e);
      }
    }
    conversationRef.current = null;
    setIsCalling(false);
    setCallState('idle');
    setIsMuted(false);
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(async () => {
    if (conversationRef.current) {
      const nextMute = !isMuted;
      try {
        await conversationRef.current.setMuted?.(nextMute);
        setIsMuted(nextMute);
      } catch (e) {
        console.warn('[VoiceWidget] Error setting mute:', e);
      }
    }
  }, [isMuted]);

  // Handle panel close
  const handleClose = useCallback(() => {
    endCall();
    setOpen(false);
  }, [endCall]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  // Listen for custom launch event from Landing Page card or buttons
  useEffect(() => {
    const handleLaunch = () => {
      setOpen(true);
    };
    window.addEventListener('open-voice-widget', handleLaunch);
    return () => window.removeEventListener('open-voice-widget', handleLaunch);
  }, []);

  // Cleanup on unmount or when closed
  useEffect(() => {
    if (!open && isCalling) {
      endCall();
    }
  }, [open, isCalling, endCall]);

  const statusText =
    callState === 'connecting'
      ? 'Connecting to voice assistant… • Inaunganisha…'
      : callState === 'listening'
      ? 'Listening to you… • Ninasikiliza…'
      : callState === 'speaking'
      ? 'Speaking… • Inaongea…'
      : null;

  return (
    <>
      {/* ── Modal Overlay & Dialog Container ── */}
      {open && (
        <div className="vw-overlay" role="presentation" onClick={handleClose}>
          <div
            className="vw-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vw-title"
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside dialog
          >
            {/* ── Header ── */}
            <div className="vw-header">
              <div className="vw-header-left">
                <div className="vw-header-avatar" aria-hidden="true">
                  <Mic size={20} />
                </div>
                <div className="vw-header-titles">
                  <div className="vw-title-row">
                    <h2 id="vw-title" className="vw-title">
                      AI Voice Assistant
                    </h2>
                    <span className="vw-badge-live">Bilingual · Kiswahili &amp; English</span>
                  </div>
                  <div className="vw-subtitle">
                    {statusText ? (
                      <span className="vw-status-active">
                        <span
                          className={`vw-pulse-dot ${
                            callState === 'connecting' ? 'vw-pulse-dot--amber' : 'vw-pulse-dot--green'
                          }`}
                        />
                        {statusText}
                      </span>
                    ) : (
                      'Ask questions about trades, prices & legal rights'
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="vw-close-btn"
                onClick={handleClose}
                aria-label="Close voice assistant"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="vw-body">
              {/* Waveform Stage Card */}
              <div className="vw-stage">
                <VoiceWaveform state={callState} />

                <div className="vw-stage-meta">
                  <span className="vw-stage-pill">
                    <Sparkles size={13} className="vw-sparkle" />
                    <span>{statusText || 'Interactive Voice • Maongezi ya Sauti'}</span>
                  </span>
                </div>

                {/* Main Action Buttons */}
                <div className="vw-actions">
                  {!isCalling ? (
                    <button
                      type="button"
                      className="vw-btn-start"
                      onClick={() => startCall()}
                    >
                      <Mic size={20} />
                      <span>Start Voice Call • Anza Maongezi</span>
                    </button>
                  ) : (
                    <div className="vw-btn-active-group">
                      <button
                        type="button"
                        className={`vw-btn-mute ${isMuted ? 'vw-btn-mute--active' : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                      >
                        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                        <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                      </button>

                      <button
                        type="button"
                        className="vw-btn-end"
                        onClick={endCall}
                        title="End voice conversation"
                      >
                        <PhoneOff size={18} />
                        <span>End Call • Maliza</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Notice with Retry */}
              {callError && (
                <div className="vw-error" role="alert">
                  <AlertCircle size={16} className="vw-error-icon" />
                  <div className="vw-error-text">
                    <p>{callError}</p>
                    <button
                      type="button"
                      className="vw-error-retry"
                      onClick={() => startCall()}
                    >
                      <RefreshCw size={12} />
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Questions when Idle */}
              {!isCalling && transcript.length === 0 && (
                <div className="vw-prompts">
                  <div className="vw-prompts-title">
                    <HelpCircle size={13} />
                    <span>Things you can ask • Maswali unayoweza kuuliza:</span>
                  </div>
                  <div className="vw-prompts-grid">
                    {SAMPLE_PROMPTS.map((p, idx) => (
                      <div key={idx} className="vw-prompt-card">
                        <div className="vw-prompt-icon">{p.icon}</div>
                        <div className="vw-prompt-content">
                          <div className="vw-prompt-en">{p.en}</div>
                          <div className="vw-prompt-sw">🇰🇪 {p.sw}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Transcript Box */}
              {transcript.length > 0 && (
                <div className="vw-transcript">
                  <div className="vw-transcript-head">
                    <Volume2 size={13} />
                    <span>Live Conversation Transcript</span>
                  </div>
                  <div className="vw-transcript-scroll">
                    {transcript.map((msg, i) => (
                      <div
                        key={i}
                        className={`vw-bubble ${
                          msg.role === 'user' ? 'vw-bubble--user' : 'vw-bubble--agent'
                        }`}
                      >
                        <span className="vw-bubble-name">
                          {msg.role === 'user' ? 'You' : 'MavunoTrust Voice AI'}
                        </span>
                        <p className="vw-bubble-text">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="vw-footer">
              <span>MavunoTrust Conversational AI · Powered by ElevenLabs</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Trigger FAB Button (Bottom Right) ── */}
      <button
        type="button"
        id="voice-assistant-fab"
        className={`vw-fab ${open ? 'vw-fab--hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open MavunoTrust AI voice assistant"
        aria-expanded={open}
        title="Open AI voice assistant"
      >
        <span className="vw-fab-inner">
          <Mic size={24} />
        </span>
        <span className="vw-fab-ring" aria-hidden="true" />
        <span className="vw-fab-badge" aria-hidden="true">
          AI
        </span>
      </button>
    </>
  );
};

export default VoiceWidget;
