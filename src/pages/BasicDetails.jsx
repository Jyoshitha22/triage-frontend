import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, AlertCircle, Heart, Mail,
  User, Calendar, Phone, MapPin, Users, Venus, Mars, Mic, Square, PlusCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PatientSidebar from '../components/PatientSidebar';
import ProgressDots from '../components/ProgressDots';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import session from '../utils/session';
import { isValidName, isValidAge, isValidPhone, isValidEmail, isRequired } from '../utils/validators';
import girlImg from '../assets/details-girl.png';
import './BasicDetails.css';

// Required fields: validator + the translated error message key.
const RULES = {
  name: [isValidName, 'errorName'],
  age: [isValidAge, 'errorAge'],
  contact: [isValidPhone, 'errorPhone'],
  email: [isValidEmail, 'errorEmail'],
  gender: [isRequired, 'errorRequired'],
  location: [isRequired, 'errorRequired'],
};

// Short labels above each input (translated for the four app languages).
const LABELS = {
  name: { en: 'Name', te: 'పేరు', hi: 'नाम', ta: 'பெயர்' },
  age: { en: 'Age', te: 'వయస్సు', hi: 'उम्र', ta: 'வயது' },
  contact: { en: 'Phone number', te: 'ఫోన్ నంబర్', hi: 'फ़ोन नंबर', ta: 'தொலைபேசி எண்' },
  location: { en: 'City', te: 'నగరం', hi: 'शहर', ta: 'நகரம்' },
};

const GENDERS = [
  { key: 'genderFemale', Icon: Venus },
  { key: 'genderMale', Icon: Mars },
  { key: 'genderOther', Icon: Users },
];
const ids = { name: 'pd-name', age: 'pd-age', contact: 'pd-phone', email: 'pd-email', gender: 'pd-gender', location: 'pd-city' };

// What to tell the patient when the microphone can't be used.
const MIC_BLOCKED = 'The microphone is blocked. Click the lock icon next to the web address, allow Microphone, then tap the mic again.';
const MIC_ERRORS = {
  'not-allowed': MIC_BLOCKED,
  'service-not-allowed': MIC_BLOCKED,
  'audio-capture': 'No microphone was found. Plug one in or check your sound settings.',
  network: 'Voice typing needs an internet connection. Please check it and try again.',
  'language-not-supported': 'This browser cannot listen in the chosen language. Try English, or type instead.',
  'start-failed': 'Could not start the microphone. Please try again.',
};

// Digits spoken in Hindi / Telugu / Tamil script -> 0-9, so age and phone still work.
const DIGIT_STARTS = [0x0966, 0x0C66, 0x0BE6]; // Devanagari, Telugu, Tamil zero
const toAsciiDigits = (s) =>
  s.replace(/[\u0966-\u096F\u0C66-\u0C6F\u0BE6-\u0BEF]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const zero = DIGIT_STARTS.find((z) => code >= z && code <= z + 9);
    return String(code - zero);
  });

/* One labelled row: round icon on the left, label + input on the right. */
function Row({ icon: Icon, label, htmlFor, error, className = '', children }) {
  return (
    <div className={`pd-row ${className}`}>
      <span className="pd-row__icon"><Icon size={26} strokeWidth={1.8} /></span>
      <div className="pd-row__body">
        <label className="pd-row__label" htmlFor={htmlFor}>{label}</label>
        {children}
        {error && <p className="pd-error"><AlertCircle size={13} /> {error}</p>}
      </div>
    </div>
  );
}

/* Text box with a mic button, so the patient can speak instead of typing. */
function VoiceInput({ id, value, onChange, onBlur, placeholder, type = 'text', inputMode, lang, sanitize, multiline, invalid, readOnly = false }) {
  const { supported, listening, interimTranscript, error, start, stop } = useSpeechRecognition({ lang, continuous: !!multiline, silenceTimeoutMs: 6000 });
  const [hint, setHint] = useState('');
  const clean = (s) => (sanitize ? sanitize(toAsciiDigits(s)) : s);

  const toggleMic = async () => {
    if (listening) { stop(); return; }
    setHint('');
    // Ask for the microphone first, so the browser shows its permission
    // prompt (or tells us it is blocked) before we start listening.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((tr) => tr.stop());
      }
    } catch {
      setHint(MIC_BLOCKED);
      return;
    }
    start((finalText) => {
      const spoken = clean(finalText || '');
      if (!spoken) { setHint("I didn't catch anything. Tap the mic and speak clearly."); return; }
      onChange(multiline && value ? `${value} ${spoken}` : spoken);
    });
  };

  const errorText = error && error !== 'aborted' ? (MIC_ERRORS[error] || `Voice input stopped (${error}).`) : '';
  const message = errorText || hint;
  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div>
      <div className={`pd-input ${multiline ? 'pd-input--area' : ''} ${listening ? 'pd-input--live' : ''} ${invalid ? 'pd-input--invalid' : ''}`}>
        <Tag
          id={id}
          type={multiline ? undefined : type}
          rows={multiline ? 1 : undefined}
          inputMode={inputMode}
          value={listening ? (interimTranscript || value) : value}
          onChange={(e) => onChange(sanitize ? sanitize(e.target.value) : e.target.value)}
          onBlur={onBlur}
          readOnly={readOnly}
          placeholder={listening ? 'Listening… speak now' : placeholder}
          disabled={listening}
        />
        {supported && (
          <button type="button" onClick={toggleMic} aria-label="Speak your answer" className={`pd-input__mic ${listening ? 'pd-input__mic--on' : ''}`}>
            {listening ? <Square size={15} /> : <Mic size={18} />}
          </button>
        )}
      </div>
      {message && <p className="pd-hint"><AlertCircle size={13} /> {message}</p>}
    </div>
  );
}

/**
 * Patient details on one page, with the shared left panel (Home, Language
 * dropdown, Help). Every field can be typed or spoken. Submit checks the
 * required fields, shows what needs fixing, then saves the details and moves on.
 */
export default function BasicDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t, language, bcp47 } = useLanguage();
  const [values, setValues] = useState(() => ({ email: state?.email || '' }));
  const [touched, setTouched] = useState({});
  const [showMore, setShowMore] = useState(false);

  const voiceOk = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const val = (k) => values[k] || '';
  const set = (k) => (v) => setValues((p) => ({ ...p, [k]: v }));
  const blur = (k) => () => setTouched((p) => ({ ...p, [k]: true }));
  const ok = (k) => RULES[k][0](val(k));
  const err = (k) => (touched[k] && !ok(k) ? t(RULES[k][1]) : '');
  const label = (k) => LABELS[k][language] || LABELS[k].en;
  const digits = (n) => (s) => s.replace(/\D/g, '').slice(0, n);
  const phone = (s) => s.replace(/[^\d ]/g, '').slice(0, 12);

    const submit = () => {
    const firstBad = Object.keys(RULES).find((k) => !ok(k));
    if (firstBad) {
      setTouched(Object.fromEntries(Object.keys(RULES).map((k) => [k, true])));
      document.getElementById(ids[firstBad])?.focus();
      return;
    }
    const registeredPatient = session.registerPatient({ ...values, language });
    session.savePatient(registeredPatient);
    navigate('/symptoms', { state: registeredPatient });
  };

  return (
    <div className="pd">
      <div className="pd-bg" aria-hidden="true">
        <img src={girlImg} alt="" className="pd-bg__girl" />
      </div>

      <div className="pd-body">
        <PatientSidebar />

        <main className="pd-main">
          <div className="pd-progress"><ProgressDots step={2} t={t} /></div>
          <section className="pd-card">
            <div className="pd-card__head">
              <span className="pd-card__avatar"><User size={38} strokeWidth={1.7} /></span>
              <div>
                <h1 className="pd-card__title">{t('basicDetailsTitle')}</h1>
                <p className="pd-card__sub">{t('basicDetailsSubtitle')}</p>
                <svg className="pd-card__wave" viewBox="0 0 150 14" aria-hidden="true">
                  <path d="M2 9 C30 2 60 2 85 8 C105 12 128 8 148 4" fill="none" stroke="#86c9ac" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {!voiceOk && (
              <p className="pd-voice-note"><AlertCircle size={16} /> Voice input works in Google Chrome or Microsoft Edge. In this browser, please type your answers.</p>
            )}

            <Row icon={User} label={label('name')} htmlFor={ids.name} error={err('name')}>
              <VoiceInput id={ids.name} value={val('name')} onChange={set('name')} onBlur={blur('name')}
                placeholder={t('namePlaceholder')} lang={bcp47} invalid={!!err('name')} />
            </Row>

            <div className="pd-two">
              <Row icon={Calendar} label={label('age')} htmlFor={ids.age} error={err('age')}>
                <VoiceInput id={ids.age} value={val('age')} onChange={set('age')} onBlur={blur('age')}
                  placeholder={t('agePlaceholder')} inputMode="numeric" sanitize={digits(3)} lang={bcp47} invalid={!!err('age')} />
              </Row>
              <Row icon={Phone} label={label('contact')} htmlFor={ids.contact} error={err('contact')}>
                <VoiceInput id={ids.contact} value={val('contact')} onChange={set('contact')} onBlur={blur('contact')}
                  placeholder={t('phonePlaceholder')} type="tel" inputMode="tel" sanitize={phone} lang={bcp47} invalid={!!err('contact')} />
              </Row>
            </div>

            <div className="pd-two pd-two--gender-city">
              <Row icon={Users} label={t('fieldGender')} error={err('gender')}>
                <div id={ids.gender} className="pd-gender" role="radiogroup" aria-label={t('fieldGender')}>
                  {GENDERS.map(({ key, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={val('gender') === key}
                      onClick={() => { set('gender')(key); blur('gender')(); }}
                      className={`pd-pill ${val('gender') === key ? 'pd-pill--on' : ''}`}
                    >
                      <span className="pd-pill__radio" /> <Icon size={20} /> {t(key)}
                    </button>
                  ))}
                </div>
              </Row>

              <Row icon={MapPin} label={label('location')} htmlFor={ids.location} error={err('location')}>
                <VoiceInput id={ids.location} value={val('location')} onChange={set('location')} onBlur={blur('location')}
                  placeholder={t('cityPlaceholder')} lang={bcp47} invalid={!!err('location')} />
              </Row>
            </div>

            <button type="button" className="pd-more" onClick={() => setShowMore((s) => !s)} aria-expanded={showMore}>
              <span>{t('optionalConditions')}</span>
              <PlusCircle size={22} className={showMore ? 'is-open' : ''} />
            </button>
            {showMore && (
              <div className="pd-more__fields pd-two">
                <Row icon={Heart} label={t('fieldAllergies')} htmlFor="pd-allergies">
                  <VoiceInput id="pd-allergies" multiline value={val('allergies')} onChange={set('allergies')} placeholder="Penicillin, peanuts…" lang={bcp47} />
                </Row>
                <Row icon={Heart} label={t('fieldConditions')} htmlFor="pd-conditions">
                  <VoiceInput id="pd-conditions" multiline value={val('conditions')} onChange={set('conditions')} placeholder="Diabetes, asthma…" lang={bcp47} />
                </Row>
              </div>
            )}

            <button type="button" onClick={submit} className="pd-submit">
              <ArrowRight size={22} strokeWidth={2.2} /> {t('submitDetails')}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}