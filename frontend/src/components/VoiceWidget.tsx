import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, WifiOff } from 'lucide-react';
import apiClient from '../services/apiClient';
import './VoiceWidget.css';

const DEFAULT_HOMEPAGE_AGENT_ID = 'agent_6201m324f8y1fz8bx69fbxxr75dy';

/**
 * MavunoTrust AI Voice Assistant Widget
 *
 * Custom-branded FAB toggler + slide-up panel.
 * Always renders; reliably opens and closes on FAB click, close button,
 * backdrop click, or Escape key.
 */
export const VoiceWidget: React.FC = () => {
  const [agentId, setAgentId] = useState<string>(
    () => import.meta.env.VITE_ELEVENLABS_AGENT_ID || DEFAULT_HOMEPAGE_AGENT_ID
  );
  const [backendError, setBackendError] = useState(false);
  const [open, setOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Fetch agent ID from backend if available */
  useEffect(() => {
    apiClient
      .get('/voice/config')
      .then((res) => {
        const id = res.data?.data?.agentId;
        if (id) {
          setAgentId(id);
          setBackendError(false);
        }
      })
      .catch(() => {
        // Fallback agent ID is already pre-set so voice assistant remains functional
      });
  }, []);

  /* Load ElevenLabs script once agent ID is known */
  useEffect(() => {
    if (!agentId) return;
    const scriptId = 'elevenlabs-convai-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://elevenlabs.io/convai-widget/index.js';
      script.async = true;
      script.type = 'text/javascript';
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, [agentId]);

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Listen for external trigger from LandingPage */
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-voice-widget', handleOpen);
    return () => window.removeEventListener('open-voice-widget', handleOpen);
  }, []);

  return (
    <>
      {/* ── Backdrop ── */}
      {open && (
        <div
          className="vw-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Panel ── */}
      <div
        className={`vw-panel ${open ? 'vw-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="MavunoTrust AI Voice Assistant"
      >
        {/* Panel header */}
        <div className="vw-panel-header">
          <div className="vw-panel-title">
            <div className="vw-panel-icon" aria-hidden="true">
              <Mic size={16} />
            </div>
            <div>
              <span className="vw-panel-name">MavunoTrust AI</span>
              <span className="vw-panel-status">
                {backendError ? (
                  <>
                    <span className="vw-dot vw-dot--offline" aria-hidden="true" />
                    Unavailable
                  </>
                ) : (
                  <>
                    <span className="vw-dot" aria-hidden="true" />
                    Voice Assistant
                  </>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="vw-close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close voice assistant"
          >
            <X size={16} />
          </button>
        </div>

        {/* Panel body */}
        <div className="vw-panel-body" ref={containerRef}>
          {backendError && (
            <div className="vw-unavailable">
              <WifiOff size={28} />
              <span className="vw-unavailable-title">Voice assistant unavailable</span>
              <span className="vw-unavailable-desc">
                The AI voice service requires the backend server to be running.
                Please ensure the MavunoTrust backend is started.
              </span>
            </div>
          )}
          {!backendError && scriptLoaded && agentId && (
            <elevenlabs-convai agent-id={agentId} />
          )}
          {!backendError && !scriptLoaded && (
            <div className="vw-loading">
              <div className="vw-spinner" aria-hidden="true" />
              <span>Connecting voice assistant…</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Trigger FAB — always visible ── */}
      <button
        type="button"
        id="voice-assistant-fab"
        className={`vw-fab ${open ? 'vw-fab--active' : ''} ${
          backendError ? 'vw-fab--offline' : ''
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close voice assistant' : 'Open MavunoTrust AI voice assistant'}
        aria-expanded={open}
      >
        <span className="vw-fab-inner">
          {open ? <MicOff size={22} /> : <Mic size={22} />}
        </span>
        {!open && !backendError && <span className="vw-fab-ring" aria-hidden="true" />}
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
