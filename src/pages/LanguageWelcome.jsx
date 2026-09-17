import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';
import HeartbeatLogo from '../components/HeartbeatLogo';
import Waveform from '../components/Waveform';
import { useLanguage } from '../context/LanguageContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import './LanguageWelcome.css';

// What to listen for when the patient speaks a language name instead of
// tapping. Best-effort only — the recognizer runs in English, so it can
// only catch languages spoken as their English name ("Telugu", "Hindi")
// reliably; native-script speech may or may not be picked up depending
// on the device. Tapping a chip always works regardless.
const ALIASES = {
  en: ['english'],
  te: ['telugu', 'తెలుగు'],
  hi: ['hindi', 'हिन्दी', 'हिंदी'],
  ta: ['tamil', 'தமிழ்'],
};

export default function LanguageWelcome() {
  const navigate = useNavigate();
  const { languages, setLanguage, t, speakPrompt } = useLanguage();
  const [heard, setHeard] = useState('');
  const { supported, listening, start, stop } = useSpeechRecognition({ lang: 'en-IN', continuous: false });

  const choose = (code) => {
    setLanguage(code);
    setTimeout(() => { speakPrompt('chooseLanguage'); navigate('/login'); }, 700);
  };

  const listenForLanguage = () => {
    if (listening) { stop(); return; }
    setHeard('');
    start((finalText) => {
      setHeard(finalText);
      const lower = finalText.toLowerCase();
      const match = Object.entries(ALIASES).find(([, names]) => names.some((n) => lower.includes(n)));
      if (match) choose(match[0]);
    });
  };

  return (
    <div className="language-welcome">
      <div className="language-welcome__panel">
        <span className="language-welcome__brand-icon"><HeartbeatLogo size={28} /></span>
        <h1 className="language-welcome__title">{t('welcomeToApp')}</h1>
        <p className="language-welcome__subtitle">{t('chooseLanguage')}</p>

        <div className="language-welcome__grid">
          {languages.map((l) => (
            <button key={l.code} onClick={() => choose(l.code)} className="language-welcome__option">
              {l.nativeLabel}
            </button>
          ))}
        </div>

        {supported && (
          <button onClick={listenForLanguage} className={`language-welcome__mic ${listening ? 'language-welcome__mic--active' : ''}`}>
            <Mic size={18} /> {t('chooseLanguageVoiceHint')}
          </button>
        )}
        {listening && <Waveform mode="recording" className="language-welcome__wave" />}
        {heard && !listening && <p className="language-welcome__heard">"{heard}"</p>}
      </div>
    </div>
  );
}
