import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  PhoneOff,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { loadElevenLabsClient } from '../lib/elevenLabsClient';
import VoiceWaveform from './VoiceWaveform';
import './VoiceWidget.css';

const DEFAULT_HOMEPAGE_AGENT_ID = 'agent_6201m324f8y1fz8bx69fbxxr75dy';

/**
 * MavunoTrust AI Voice Assistant Widget
 *
 * Top-centered modal overlay with single-click FAB launcher.
 * Uses ElevenLabs Conversational AI SDK with responsive canvas waveform.
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
        if (id) {
          setAgentId(id);
        }
      })
      .catch(() => {
        // Fallback agent ID is already pre-set
      });
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, callState]);

  // Start ElevenLabs Conversational AI session
  const startCall = useCallback(
    async () => {
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
        let friendlyMsg = 'Failed to connect to voice assistant. Please check microphone access.';
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('mic') || msg.includes('permission') || msg.includes('notallowed')) {
          friendlyMsg = 'Microphone permission was denied. Please allow mic access in your browser.';
        }
        setCallError(friendlyMsg);
        setCallState('idle');
        setIsCalling(false);
        conversationRef.current = null;
      }
    },
    [agentId]
  );

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

  // Listen for custom launch event from Landing Page card or header buttons
  useEffect(() => {
    const handleLaunch = () => {
      setOpen(true);
      if (!isCalling) {
        startCall();
      }
    };
    window.addEventListener('open-voice-widget', handleLaunch);
    return () => window.removeEventListener('open-voice-widget', handleLaunch);
  }, [isCalling, startCall]);

  // Cleanup on unmount or when closed
  useEffect(() => {
    if (!open && isCalling) {
      endCall();
    }
  }, [open, isCalling, endCall]);

  const statusText =
    callState === 'connecting'
      ? 'Connecting to AI voice…'
      : callState === 'listening'
      ? 'Listening to you…'
      : callState === 'speaking'
      ? 'Speaking…'
      : null;

  return (
    <>
      {/* ── Backdrop Overlay ── */}
      {open && (
        <div
          className="vw-backdrop"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* ── Top-Centered Modal Dialog ── */}
      {open && (
        <div
          className="vw-top-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vw-title"
        >
          {/* Header */}
          <div className="vw-modal-header">
            <div className="vw-header-title">
              <div className="vw-header-icon" aria-hidden="true">
                <Mic size={20} />
              </div>
              <div>
                <h2 id="vw-title" className="vw-title-text">
                  Voice Assistant
                </h2>
                {statusText && (
                  <div className="vw-status-line">
                    <span
                      className={`vw-dot ${
                        isCalling ? 'vw-dot--active' : callState === 'connecting' ? 'vw-dot--connecting' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span className="vw-status-label">{statusText}</span>
                  </div>
                )}
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

          {/* Modal Body */}
          <div className="vw-modal-body">
            {/* Waveform Visualizer Stage */}
            <div className="vw-stage-card">
              <VoiceWaveform state={callState} />

              <div className="vw-stage-badge">
                <Sparkles size={14} className="vw-sparkle-icon" />
                <span>{statusText || 'Interactive Voice Session'}</span>
              </div>

              {/* Action Controls */}
              <div className="vw-stage-controls">
                {!isCalling ? (
                  <button
                    type="button"
                    className="vw-btn-start"
                    onClick={() => startCall()}
                  >
                    <Mic size={20} />
                    <span>Start Voice Session</span>
                  </button>
                ) : (
                  <div className="vw-btn-group">
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
                      title="End voice call"
                    >
                      <PhoneOff size={18} />
                      <span>End Call</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Notice */}
            {callError && (
              <div className="vw-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{callError}</span>
              </div>
            )}

            {/* Live Conversation Transcript */}
            {transcript.length > 0 && (
              <div className="vw-transcript-box">
                <div className="vw-transcript-header">
                  <Volume2 size={14} />
                  <span>Live Conversation</span>
                </div>
                <div className="vw-transcript-list">
                  {transcript.map((msg, i) => (
                    <div
                      key={i}
                      className={`vw-chat-bubble ${
                        msg.role === 'user' ? 'vw-chat-bubble--user' : 'vw-chat-bubble--assistant'
                      }`}
                    >
                      <span className="vw-chat-sender">
                        {msg.role === 'user' ? 'You' : 'MavunoTrust AI'}
                      </span>
                      <p className="vw-chat-text">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Trigger FAB Button (Bottom Right) ── */}
      <button
        type="button"
        id="voice-assistant-fab"
        className={`vw-fab ${open ? 'vw-fab--active' : ''}`}
        onClick={() => {
          if (open) {
            handleClose();
          } else {
            setOpen(true);
            if (!isCalling) {
              startCall();
            }
          }
        }}
        aria-label={open ? 'Close AI voice assistant' : 'Open MavunoTrust AI voice assistant'}
        aria-expanded={open}
        title={open ? 'Close AI voice assistant' : 'Open AI voice assistant'}
      >
        <span className="vw-fab-inner">
          {open ? <X size={24} /> : <Mic size={24} />}
        </span>
        {!open && <span className="vw-fab-ring" aria-hidden="true" />}
        {!open && (
          <span className="vw-fab-badge" aria-hidden="true">
            AI
          </span>
        )}
      </button>
    </>
  );
};

export default VoiceWidget;
