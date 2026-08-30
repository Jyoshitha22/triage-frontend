import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Button from '../components/Button';
import VoiceField from '../components/VoiceField';
import { useLanguage } from '../context/LanguageContext';
import useAutoAdvance from '../hooks/useAutoAdvance';
import { isValidName, isValidAge, isValidPhone, isRequired } from '../utils/validators';
import './BasicDetails.css';

// labelKey looks up the translated question text; genderKeys map each chip
// to its own translated label. validate/errorKey drive the inline error
// message and gate auto-advance/Enter/the Next button — none of those
// fire until the typed value actually passes. conditions has no
// validator since it's free-form and optional.
const FIELDS = [
  { key: 'name', labelKey: 'fieldName', type: 'text', placeholder: 'Full name', voice: true, validate: isValidName, errorKey: 'errorName' },
  { key: 'age', labelKey: 'fieldAge', type: 'number', placeholder: 'Age', voice: true, validate: isValidAge, errorKey: 'errorAge' },
  { key: 'gender', labelKey: 'fieldGender', type: 'chips', optionKeys: ['genderFemale', 'genderMale', 'genderOther'] },
  { key: 'location', labelKey: 'fieldLocation', type: 'text', placeholder: 'City', voice: true, validate: isRequired, errorKey: 'errorRequired' },
  { key: 'contact', labelKey: 'fieldContact', type: 'tel', placeholder: '98765 43210', voice: true, validate: isValidPhone, errorKey: 'errorPhone' },
  { key: 'conditions', labelKey: 'fieldConditions', type: 'textarea', placeholder: 'Diabetes, asthma…', optional: true },
];

/**
 * One question per screen, answerable by typing or by tapping the mic
 * and speaking. Voice answers auto-advance to the next question; typed
 * answers auto-advance too, a beat after the patient stops typing — but
 * only once the value passes validation (see FIELDS above).
 */
export default function BasicDetails() {
  const navigate = useNavigate();
  const { t, speakPrompt } = useLanguage();
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
  const goNext = () => (i === FIELDS.length - 1 ? navigate('/symptoms', { state: values }) : setI(i + 1));
  const back = () => (i === 0 ? navigate('/') : setI(i - 1));

  const isValid = field.optional || (field.validate ? field.validate(rawValue) : isRequired(rawValue));
  const showError = !field.optional && rawValue.length > 0 && !isValid;
  // Everything that could advance the screen — the button, Enter, voice
  // capture, and auto-advance — all funnel through this one guard.
  const attemptNext = () => isValid && goNext();

  // Plain typed fields (not the free-text conditions box) auto-advance a
  // beat after the patient stops typing — no button needed.
  const autoAdvanceEnabled = field.type !== 'chips' && field.type !== 'textarea';
  useAutoAdvance(rawValue, autoAdvanceEnabled && isValid, goNext, { delay: 1300, enabled: autoAdvanceEnabled });

  return (
    <NavShell step={2} onBack={back}>
      <div className="basic-details">
        <span className="basic-details__count">{i + 1} of {FIELDS.length}</span>
        <h1 className="basic-details__question">{t(field.labelKey)}</h1>

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
          ) : field.type === 'textarea' ? (
            <textarea
              ref={inputRef}
              rows={4}
              value={rawValue}
              onChange={(e) => set(e.target.value)}
              placeholder={field.placeholder}
              className="basic-details__textarea"
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

        {field.type !== 'chips' && (
          <Button className="basic-details__next" onClick={attemptNext} disabled={!isValid} icon={ArrowRight}>
            {field.optional && !rawValue ? t('skip') : i === FIELDS.length - 1 ? t('continueToSymptoms') : t('next')}
          </Button>
        )}
      </div>
    </NavShell>
  );
}