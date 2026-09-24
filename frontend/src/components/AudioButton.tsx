import React, { useState, useRef } from 'react';
import { Volume2, Pause } from 'lucide-react';
import apiClient from '../services/apiClient';

interface AudioButtonProps {
  textId: string;
  lang: 'en' | 'sw';
  label?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ textId, lang, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const defaultLabel = lang === 'en' ? 'Listen in English' : 'Sikiliza kwa Kiswahili';
  const displayLabel = label || defaultLabel;

  const playAudio = async () => {
    // If it's already playing, we can stop it or pause it.
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setLoading(true);
    setError(false);
    
    try {
      // Fetch audio as a blob so we can attach auth headers automatically via apiClient
      const response = await apiClient.get('/voice/play', {
        params: { textId, lang },
        responseType: 'blob'
      });

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setError(true);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio:', err);
      setError(true);
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={playAudio} 
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: isPlaying ? '#e0f2fe' : '#f8fafc',
        border: `1px solid ${isPlaying ? '#0ea5e9' : '#cbd5e1'}`,
        borderRadius: '20px',
        color: isPlaying ? '#0284c7' : '#475569',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        marginTop: '8px'
      }}
      aria-label={displayLabel}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {isPlaying ? <Pause size={15} /> : <Volume2 size={15} />}
      </span>
      <span>{loading ? '...' : (error ? 'Error' : displayLabel)}</span>
    </button>
  );
};
