import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight } from 'lucide-react';
import Waveform from '../components/Waveform';
import { useLanguage } from '../context/LanguageContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import heroArt from '../assets/language-hero.png';
import './LanguageWelcome.css';

// What to listen for when the patient speaks a language name instead of
// tapping. Best-effort only — the recognizer runs in English, so it can
// only catch languages spoken as their English name ("Telugu", "Hindi")
// reliably; native-script speech may or may not be picked up depending
// on the device. Tapping a card always works regardless.
const ALIASES = {
  en: ['english'],
  te: ['telugu', 'తెలుగు'],
  hi: ['hindi', 'हिन्दी', 'हिंदी'],
  ta: ['tamil', 'தமிழ்'],
};

// The big letter shown in the round badge of each language card.
const BADGES = { en: 'Aa', te: 'అ', hi: 'अ', ta: 'அ' };

export default function LanguageWelcome() {
  const navigate = useNavigate();
  const { languages, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [heard, setHeard] = useState('');
  const { supported, listening, start, stop } = useSpeechRecognition({ lang: 'en-IN', continuous: false });

  // Navigation to next step
  const goNext = () => { navigate('/patient-login'); };

  // Tapping a card only selects it (and switches the app language right away).
  const pick = (code) => { setSelected(code); setLanguage(code); };

  // Speaking a language name selects it and continues.
  const listenForLanguage = () => {
    if (listening) { stop(); return; }
    setHeard('');

    start((finalText) => {
      // 1. Clean the incoming speech text (lowercase, remove periods/punctuation, and trim)
      const cleanText = finalText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();
      setHeard(finalText); // Show the original text to the user layout

      // 2. Perform a loose containment check against language lists
      const match = Object.entries(ALIASES).find(([, names]) =>
        names.some((name) => cleanText.includes(name.toLowerCase()))
      );

      if (match) {
        pick(match[0]);
        setTimeout(goNext, 700);
      }
    });
  };

  return (
    <div className="language-welcome">
      <main className="language-welcome__main">
        <div className="language-welcome__hero">
          <img src={heroArt} alt="" className="language-welcome__hero-img" />
        </div>

        <section className="language-welcome__panel">
          {/* <span className="language-welcome__step">Step 1 of 1</span> */}
          <h1 className="language-welcome__title">{t('chooseLanguage')}</h1>
          <p className="language-welcome__subtitle">
            {t('chooseLanguageSubtitle')}
          </p>

          <div className="language-welcome__grid" role="radiogroup" aria-label={t('chooseLanguage')}>
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={selected === l.code}
                onClick={() => pick(l.code)}
                className={`language-welcome__option ${selected === l.code ? 'language-welcome__option--selected' : ''}`}
              >
                <span className="language-welcome__badge">{BADGES[l.code] || l.nativeLabel.charAt(0)}</span>
                <span className="language-welcome__names">
                  <span className="language-welcome__native">{l.nativeLabel}</span>
                  <span className="language-welcome__english">({l.label})</span>
                </span>
                <span className="language-welcome__radio" aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="language-welcome__actions">
            <button type="button" onClick={goNext} disabled={!selected} className="language-welcome__continue">
              <ArrowRight size={22} strokeWidth={2.2} /> Continue
            </button>
          </div>

          {supported && (
            <button
              type="button"
              onClick={listenForLanguage}
              className={`language-welcome__mic ${listening ? 'language-welcome__mic--active' : ''}`}
            >
              <Mic size={20} /> {t('chooseLanguageVoiceHint')}
            </button>
          )}
          {listening && <Waveform mode="recording" className="language-welcome__wave" />}
          {heard && !listening && <p className="language-welcome__heard">"{heard}"</p>}
        </section>
      </main>
    </div>
  );
}
