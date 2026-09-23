import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, WifiOff } from 'lucide-react';
import apiClient from '../services/apiClient';
import './VoiceWidget.css';

/**
 * MavunoTrust AI Voice Assistant Widget
 *
 * Custom-branded FAB toggler + slide-up panel.
 * The widget FAB always renders; if the backend is unreachable the panel
 * shows a friendly "unavailable" state instead of disappearing entirely.
 */
export const VoiceWidget: React.FC = () => {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [backendError, setBackendError] = useState(false);
  const [open, setOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Fetch agent ID from backend */
  useEffect(() => {
    apiClient
      .get('/voice/config')
      .then((res) => {
        const id = res.data?.data?.agentId;
        if (id) {
          setAgentId(id);
          setBackendError(false);
        } else {
          setBackendError(true);
        }
      })
      .catch(() => {
        // Backend not running or agent not configured — show unavailable state
        setBackendError(true);
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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
                {backendError
                  ? <><span className="vw-dot vw-dot--offline" aria-hidden="true" />Unavailable</>
                  : <><span className="vw-dot" aria-hidden="true" />Voice Assistant</>
                }
              </span>
            </div>
          </div>
          <button
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
        className={`vw-fab ${open ? 'vw-fab--active' : ''} ${backendError ? 'vw-fab--offline' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close voice assistant' : 'Open MavunoTrust AI voice assistant'}
        aria-expanded={open}
      >
        <span className="vw-fab-inner">
          {open ? <MicOff size={22} /> : <Mic size={22} />}
        </span>
        {!open && !backendError && <span className="vw-fab-ring" aria-hidden="true" />}
        {!open && (
          <span className="vw-fab-badge" aria-hidden="true">AI</span>
        )}
      </button>
    </>
  );
};

export default VoiceWidget;
