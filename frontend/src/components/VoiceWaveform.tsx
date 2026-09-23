import { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  state: 'idle' | 'connecting' | 'listening' | 'speaking';
}

export function VoiceWaveform({ state }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // MavunoTrust brand emerald & spring green palette
      let primaryColor = '#22c55e'; // Emerald / green-500
      let secondaryColor = '#86efac'; // Light green
      let amplitude = 12;
      let frequency = 0.018;
      let speed = 0.025;
      let lines = 4;
      let complexity = 2;

      switch (state) {
        case 'connecting':
          primaryColor = '#eab308'; // Amber / connecting
          secondaryColor = '#fde047';
          amplitude = 22;
          speed = 0.05;
          lines = 5;
          break;
        case 'listening':
          primaryColor = '#22c55e'; // Bright green when listening to user
          secondaryColor = '#4ade80';
          amplitude = 48;
          frequency = 0.06;
          speed = 0.12;
          lines = 7;
          complexity = 3;
          break;
        case 'speaking':
          primaryColor = '#10b981'; // Rich emerald when agent speaks
          secondaryColor = '#6ee7b7';
          amplitude = 36;
          frequency = 0.035;
          speed = 0.08;
          lines = 6;
          complexity = 3;
          break;
        default:
          primaryColor = '#15803d';
          secondaryColor = '#4ade80';
          amplitude = 8;
          speed = 0.015;
          lines = 3;
      }

      ctx.lineCap = 'round';

      for (let l = 0; l < lines; l++) {
        const offsetPhase = phase + (l * Math.PI) / lines;
        const opacity = (1 - l / lines) * 0.85;

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, `${primaryColor}00`);
        gradient.addColorStop(
          0.3,
          `${primaryColor}${Math.floor(opacity * 255)
            .toString(16)
            .padStart(2, '0')}`
        );
        gradient.addColorStop(
          0.7,
          `${secondaryColor}${Math.floor(opacity * 255)
            .toString(16)
            .padStart(2, '0')}`
        );
        gradient.addColorStop(1, `${primaryColor}00`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + (lines - l) * 0.5;
        ctx.shadowBlur = state !== 'idle' ? 14 : 4;
        ctx.shadowColor = `${primaryColor}40`;

        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const xNorm = x / width;
          const mask = Math.pow(Math.sin(xNorm * Math.PI), 1.5);

          let y = height / 2;

          for (let c = 1; c <= complexity; c++) {
            const harmonicFreq = frequency * c;
            const harmonicAmp = amplitude / (c * 0.8);
            y +=
              Math.sin(x * harmonicFreq + offsetPhase * (1 + c * 0.1)) *
              harmonicAmp *
              mask;
          }

          if (state === 'listening' || state === 'speaking') {
            y += (Math.random() - 0.5) * (state === 'listening' ? 4 : 2);
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += speed;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [state]);

  return (
    <div className="vw-waveform-wrap">
      <div className="vw-waveform-glow" />
      <canvas
        ref={canvasRef}
        width={700}
        height={130}
        className="vw-waveform-canvas"
      />
    </div>
  );
}

export default VoiceWaveform;
