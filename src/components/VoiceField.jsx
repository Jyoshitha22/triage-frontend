import React from "react";
import { Mic, AlertCircle } from "lucide-react";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { useLanguage } from "../context/LanguageContext";
import "./VoiceField.css";

/**
 * "Tap to speak or type" field, backed by the browser's real microphone
 * speech-to-text (see hooks/useSpeechRecognition.js) — no more simulated
 * sample text. Tapping the mic starts listening in the patient's chosen
 * language; whatever they actually say fills the field, then the field
 * auto-advances via onCaptured() after a brief pause so a button tap
 * isn't required. Typing (and pressing Enter) still works exactly the
 * same, for anyone who'd rather not use voice.
 */
export default function VoiceField({
  value,
  onChange,
  onCaptured,
  placeholder,
  type = "text",
  autoAdvanceDelay = 900,
  className = "",
}) {
  const { bcp47, t } = useLanguage();
  const { supported, listening, interimTranscript, error, start, stop } = useSpeechRecognition({
    lang: bcp47,
    continuous: false,
  });

  const handleMicTap = () => {
    if (listening) { stop(); return; }
    start((finalText) => {
      if (!finalText) return;
      onChange(finalText);
      setTimeout(() => onCaptured?.(), autoAdvanceDelay);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && value && String(value).trim() !== "") onCaptured?.();
  };

  return (
    <div className={`voice-field ${listening ? "voice-field--listening" : ""} ${className}`}>
      <input
        type={type}
        value={listening ? interimTranscript || value : value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={listening ? t("listening") : placeholder}
        disabled={listening}
        className="voice-field__input"
      />
      {supported && (
        <button type="button" onClick={handleMicTap} aria-label="Speak your answer" className="voice-field__mic">
          <Mic size={16} />
        </button>
      )}
      {(error === "unsupported" || !supported) && (
        <p className="voice-field__hint">
          <AlertCircle size={12} /> {t("micNotSupported")}
        </p>
      )}
      {error === "not-allowed" && (
        <p className="voice-field__hint">
          <AlertCircle size={12} /> {t("micDenied")}
        </p>
      )}
    </div>
  );
}