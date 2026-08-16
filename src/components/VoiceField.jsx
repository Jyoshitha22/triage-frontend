import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import './VoiceField.css';

/**
 * "Tap to speak or type" field. Tapping the mic simulates capturing a
 * short voice answer, fills the field, then auto-advances via
 * onCaptured() after a brief pause. Typing still works normally.
 * Wire simulateCapture() up to real ASR (Whisper) — everything else
 * (auto-advance, styling) stays the same.
 */
export default function VoiceField({
  value,
  onChange,
  onCaptured,
  placeholder,
  type = 'text',
  simulatedValue = '',
  autoAdvanceDelay = 900,
  className = '',
}) {
  const [listening, setListening] = useState(false);

  const simulateCapture = () => {
    setListening(true);
    setTimeout(() => {
      onChange(simulatedValue || value);
      setListening(false);
      setTimeout(() => onCaptured?.(), autoAdvanceDelay);
    }, 1400);
  };

  return (
    <div className={`voice-field ${listening ? 'voice-field--listening' : ''} ${className}`}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={listening ? 'Listening…' : placeholder}
        disabled={listening}
        className="voice-field__input"
      />
      <button type="button" onClick={simulateCapture} aria-label="Speak your answer" className="voice-field__mic">
        <Mic size={16} />
      </button>
    </div>
  );
}