import React, { useMemo } from 'react';
import './Waveform.css';

/**
 * The app's signature motif — the patient's voice moving through the
 * triage journey: idle (calm) -> recording (live) -> pulse (doctor
 * reviewing) -> playback (resolved reply).
 */
export default function Waveform({ mode = 'idle', bars = 28, className = '' }) {
  const heights = useMemo(
    () => Array.from({ length: bars }, () => 20 + Math.round(Math.random() * 80)),
    [bars]
  );

  if (mode === 'pulse') {
    return (
      <div className={`waveform waveform--pulse ${className}`}>
        <span className="waveform__pulse-track" />
        <span className="waveform__pulse-dot" />
      </div>
    );
  }

  return (
    <div className={`waveform ${className}`}>
      {heights.map((h, i) => (
        <span
          key={i}
          className={`waveform__bar waveform__bar--${mode}`}
          style={{
            height: mode === 'idle' ? '6px' : `${h}%`,
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
}