/**
 * Dynamic ElevenLabs Client Loader
 * Loads the browser-ready IIFE bundle from unpkg on-demand.
 * This completely isolates livekit-client from Vite bundling, preventing startup crashes.
 */

declare global {
  interface Window {
    ElevenLabsClient?: {
      Conversation: any;
      VoiceConversation?: any;
    };
  }
}

let loadPromise: Promise<any> | null = null;

export function loadElevenLabsClient(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not defined'));
  }

  if (window.ElevenLabsClient?.Conversation) {
    return Promise.resolve(window.ElevenLabsClient.Conversation);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('elevenlabs-client-script');
    if (existing) {
      if (window.ElevenLabsClient?.Conversation) {
        resolve(window.ElevenLabsClient.Conversation);
      } else {
        existing.addEventListener('load', () => {
          resolve(window.ElevenLabsClient?.Conversation);
        });
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'elevenlabs-client-script';
    script.src = 'https://unpkg.com/@elevenlabs/client@1.25.0/dist/lib.iife.js';
    script.async = true;

    script.onload = () => {
      if (window.ElevenLabsClient?.Conversation) {
        resolve(window.ElevenLabsClient.Conversation);
      } else {
        reject(new Error('ElevenLabsClient not found on window after script load.'));
      }
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load ElevenLabs client script from CDN.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
