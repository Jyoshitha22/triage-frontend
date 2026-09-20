import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, AlertCircle, Mic, Square } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Button from '../components/Button';
import VoiceField from '../components/VoiceField';
import Waveform from '../components/Waveform';
import { useLanguage } from '../context/LanguageContext';
import useAutoAdvance from '../hooks/useAutoAdvance';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import session from '../utils/session';
import { isValidName, isValidAge, isValidPhone, isRequired } from '../utils/validators';
import './BasicDetails.css';

// labelKey looks up the translated question text; hintKey is the small
// supporting line shown under it. genderKeys map each chip to its own
// translated label. validate/errorKey drive the inline error message and
// gate auto-advance/Enter/the Next button — none of those fire until the
// value actually passes. skipAfterMs auto-advances an untouched optional
// field once the patient's had a few seconds and said/typed nothing.
const FIELDS = [
  { key: 'name', labelKey: 'fieldName', hintKey: 'typeOrSpeakHint', type: 'text', placeholder: 'Full name', voice: true, validate: isValidName, errorKey: 'errorName' },
  { key: 'age', labelKey: 'fieldAge', hintKey: 'typeOrSpeakHint', type: 'age-stepper', placeholder: 'Age', validate: isValidAge, errorKey: 'errorAge' },
  { key: 'gender', labelKey: 'fieldGender', type: 'chips', optionKeys: ['genderFemale', 'genderMale', 'genderOther'] },
  { key: 'location', labelKey: 'fieldLocation', hintKey: 'typeOrSpeakHint', type: 'text', placeholder: 'City', voice: true, validate: isRequired, errorKey: 'errorRequired' },
  { key: 'contact', labelKey: 'fieldContact', hintKey: 'typeOrSpeakHint', type: 'tel', placeholder: '98765 43210', voice: true, validate: isValidPhone, errorKey: 'errorPhone' },
  { key: 'allergies', labelKey: 'fieldAllergies', hintKey: 'typeOrSpeakOrSkipHint', type: 'voice-textarea', placeholder: 'Penicillin, peanuts…', optional: true, skipAfterMs: 7000 },
  { key: 'conditions', labelKey: 'fieldConditions', hintKey: 'typeOrSpeakOrSkipHint', type: 'voice-textarea', placeholder: 'Diabetes, asthma…', optional: true, skipAfterMs: 7000 },
];

/**
 * One question per screen, answerable by typing or by tapping the mic
 * and speaking. Voice and typed answers both auto-advance a beat after
 * the patient finishes — no button needed either way. The two optional
 * free-text fields (allergies, conditions) auto-skip on their own after
 * a few quiet seconds, since silence there means "nothing to report,"
 * not "still thinking."
 */
export default function BasicDetails() {
  const navigate = useNavigate();
  const { state: routerState } = useLocation();
  const { t, bcp47, speakPrompt } = useLanguage();
  const [i, setI] = useState(0);
  const [values, setValues] = useState({});
  const inputRef = useRef(null);
  const field = FIELDS[i];
  const rawValue = values[field.key] || '';

  useEffect(() => { inputRef.current?.focus(); }, [i]);

  // Ask the question aloud every time it changes, in the patient's
  // chosen language.
  useEffect(() => { speakPrompt(field.labelKey); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (v) => setValues((prev) => ({ ...prev, [field.key]: v }));
  const goNext = () => {
    if (i < FIELDS.length - 1) { setI(i + 1); return; }
    // First-time setup is genuinely complete now — save it so the next
    // visit from this device skips login and goes straight to Symptoms.
    session.savePatient({ phone: routerState?.phone, ...values });
    navigate('/symptoms', { state: values });
  };
  const back = () => (i === 0 ? navigate('/login') : setI(i - 1));

  const isValid = field.optional || (field.validate ? field.validate(rawValue) : isRequired(rawValue));
  const showError = !field.optional && rawValue.length > 0 && !isValid;
  // Everything that could advance the screen — the button, Enter, voice
  // capture, and auto-advance — all funnel through this one guard.
  const attemptNext = () => isValid && goNext();

  // Plain typed/voice fields (not chips, not the free-text boxes, which
  // have their own auto-skip timer below) auto-advance a beat after the
  // patient stops typing or speaking.
  const autoAdvanceEnabled = field.type !== 'chips' && field.type !== 'voice-textarea' && field.type !== 'age-stepper';
  useAutoAdvance(rawValue, autoAdvanceEnabled && isValid, goNext, { delay: 1300, enabled: autoAdvanceEnabled });

  return (
    <NavShell step={2} onBack={back}>
      <div className="basic-details">
        <span className="basic-details__count">{i + 1} of {FIELDS.length}</span>
        <h1 className="basic-details__question">{t(field.labelKey)}</h1>
        {field.hintKey && <p className="basic-details__hint">{t(field.hintKey)}</p>}

        <Card className="basic-details__card">
          {field.type === 'chips' ? (
            <div className="basic-details__chips">
              {field.optionKeys.map((optKey) => (
                <button
                  key={optKey}
                  onClick={() => { set(optKey); setTimeout(goNext, 350); }}
                  className={`basic-details__chip ${values.gender === optKey ? 'basic-details__chip--active' : ''}`}
                >
                  {t(optKey)}
                </button>
              ))}
            </div>
          ) : field.type === 'voice-textarea' ? (
            <VoiceTextarea
              key={field.key}
              value={rawValue}
              onChange={set}
              onDone={goNext}
              placeholder={field.placeholder}
              skipAfterMs={field.skipAfterMs}
              lang={bcp47}
            />
          ) : field.type === 'age-stepper' ? (
            <AgeStepper
              value={rawValue}
              onChange={set}
              onDone={goNext}
              isValid={isValid}
              lang={bcp47}
            />
          ) : field.voice ? (
            <VoiceField value={rawValue} onChange={set} onCaptured={attemptNext} placeholder={field.placeholder} type={field.type} />
          ) : (
            <input
              ref={inputRef}
              type={field.type}
              value={rawValue}
              onChange={(e) => set(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && attemptNext()}
              placeholder={field.placeholder}
              className="basic-details__input"
            />
          )}

          {showError && (
            <p className="field-error"><AlertCircle size={12} /> {t(field.errorKey)}</p>
          )}
        </Card>

        {field.type !== 'chips' && field.type !== 'voice-textarea' && (
          <Button className="basic-details__next" onClick={attemptNext} disabled={!isValid} icon={ArrowRight}>
            {i === FIELDS.length - 1 ? t('continueToSymptoms') : t('next')}
          </Button>
        )}
      </div>
    </NavShell>
  );
}

/**
 * Age gets three ways in at once: type a number directly, tap the mic
 * and say it, or click the up/down triangles to step it by one. All
 * three write to the same value, so whichever the patient reaches for
 * first just works.
 */
function AgeStepper({ value, onChange, onDone, isValid, lang }) {
  const { supported, listening, start, stop } = useSpeechRecognition({ lang, continuous: true, silenceTimeoutMs: 2200 });
  const [typed, setTyped] = useState(false);
  const num = Number(value) || 0;

  useAutoAdvance(value, typed && isValid, onDone, { delay: 1300, enabled: typed });

  const step = (delta) => {
    setTyped(true);
    const next = Math.min(120, Math.max(0, num + delta));
    onChange(String(next));
  };

  const toggleMic = () => {
    if (listening) { stop(); return; }
    start((finalText) => {
      const digits = finalText.replace(/\D/g, '');
      if (digits) { onChange(digits); setTimeout(onDone, 900); }
    });
  };

  const handleKeyDown = (e) => e.key === 'Enter' && isValid && onDone();

  return (
    <div className="age-stepper">
      <div className="age-stepper__row">
        <button type="button" onClick={() => step(-1)} className="age-stepper__btn" aria-label="Decrease age">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => { setTyped(true); onChange(e.target.value.replace(/\D/g, '').slice(0, 3)); }}
          onKeyDown={handleKeyDown}
          placeholder="Age"
          className="age-stepper__input"
        />

        <button type="button" onClick={() => step(1)} className="age-stepper__btn age-stepper__btn--up" aria-label="Increase age">
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M1 7L7 1L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {supported && (
        <button type="button" onClick={toggleMic} className={`age-stepper__mic ${listening ? 'age-stepper__mic--active' : ''}`}>
          {listening ? <Square size={14} /> : <Mic size={14} />}
        </button>
      )}
    </div>
  );
}

/**
 * The two optional free-text fields (allergies, conditions) — type it,
 * speak it, or say nothing at all. If nothing arrives within
 * `skipAfterMs`, it moves on by itself; typing or recording cancels
 * that timer. `key={field.key}` on the parent remounts this fresh for
 * each field, so the timer always starts clean.
 */
function VoiceTextarea({ value, onChange, onDone, placeholder, skipAfterMs, lang }) {
  const { supported, listening, interimTranscript, start, stop } = useSpeechRecognition({ lang, continuous: true, silenceTimeoutMs: 2500 });
  const skipTimerRef = useRef(null);
  const [typed, setTyped] = useState(false);

  useEffect(() => {
    if (!skipAfterMs) return undefined;
    skipTimerRef.current = setTimeout(onDone, skipAfterMs);
    return () => clearTimeout(skipTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelSkipTimer = () => { if (skipTimerRef.current) clearTimeout(skipTimerRef.current); };

  // Once they've typed anything, switch to the same "pause = done" timing
  // every other typed field uses, instead of the long total-silence timer.
  useAutoAdvance(value, typed && isRequired(value), onDone, { delay: 1500, enabled: typed });

  const toggleMic = () => {
    cancelSkipTimer();
    if (listening) { stop(); return; }
    start((finalText) => {
      if (finalText) onChange((value ? value + ' ' : '') + finalText);
      setTimeout(onDone, 900);
    });
  };

  const handleType = (e) => { cancelSkipTimer(); setTyped(true); onChange(e.target.value); };
  const handleKeyDown = (e) => e.key === 'Enter' && !e.shiftKey && onDone();

  return (
    <div className="voice-textarea">
      <textarea
        rows={3}
        value={listening ? [value, interimTranscript].filter(Boolean).join(' ') : value}
        onChange={handleType}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={listening}
        className="basic-details__textarea"
      />
      {supported && (
        <button onClick={toggleMic} className={`voice-textarea__mic ${listening ? 'voice-textarea__mic--active' : ''}`}>
          {listening ? <Square size={14} /> : <Mic size={14} />}
        </button>
      )}
      {listening && <Waveform mode="recording" className="voice-textarea__wave" />}
    </div>
  );
}
