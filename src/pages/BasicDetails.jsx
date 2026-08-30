import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Button from '../components/Button';
import VoiceField from '../components/VoiceField';
import { useLanguage } from '../context/LanguageContext';
import useAutoAdvance from '../hooks/useAutoAdvance';
import './BasicDetails.css';

// labelKey looks up the translated question text; genderKeys map each chip
// to its own translated label. conditions is left out of auto-advance
// (see useAutoAdvance below) since it's free-form and optional.
const FIELDS = [
  { key: 'name', labelKey: 'fieldName', type: 'text', placeholder: 'Full name', voice: true },
  { key: 'age', labelKey: 'fieldAge', type: 'number', placeholder: 'Age', voice: true },
  { key: 'gender', labelKey: 'fieldGender', type: 'chips', optionKeys: ['genderFemale', 'genderMale', 'genderOther'] },
  { key: 'location', labelKey: 'fieldLocation', type: 'text', placeholder: 'City', voice: true },
  { key: 'contact', labelKey: 'fieldContact', type: 'tel', placeholder: '98765 43210', voice: true },
  { key: 'conditions', labelKey: 'fieldConditions', type: 'textarea', placeholder: 'Diabetes, asthma…', optional: true },
];

/**
 * One question per screen, answerable by typing or by tapping the mic
 * and speaking. Voice answers auto-advance to the next question; typed
 * answers now auto-advance too, a beat after the patient stops typing.
 */
export default function BasicDetails() {
  const navigate = useNavigate();
  const { t, speakPrompt } = useLanguage();
  const [i, setI] = useState(0);
  const [values, setValues] = useState({});
  const inputRef = useRef(null);
  const field = FIELDS[i];

  useEffect(() => { inputRef.current?.focus(); }, [i]);

  // Ask the question aloud every time it changes, in the patient's
  // chosen language.
  useEffect(() => { speakPrompt(field.labelKey); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (v) => setValues((prev) => ({ ...prev, [field.key]: v }));
  const next = () => (i === FIELDS.length - 1 ? navigate('/symptoms', { state: values }) : setI(i + 1));
  const back = () => (i === 0 ? navigate('/') : setI(i - 1));
  const canContinue = field.optional || (values[field.key] && String(values[field.key]).trim() !== '');

  // Plain typed fields (not the free-text conditions box) auto-advance a
  // beat after the patient stops typing — no button needed.
  const autoAdvanceEnabled = field.type !== 'chips' && field.type !== 'textarea';
  useAutoAdvance(values[field.key], autoAdvanceEnabled && !!canContinue, next, { delay: 1300, enabled: autoAdvanceEnabled });

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
                  onClick={() => { set(optKey); setTimeout(next, 350); }}
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
              value={values[field.key] || ''}
              onChange={(e) => set(e.target.value)}
              placeholder={field.placeholder}
              className="basic-details__textarea"
            />
          ) : field.voice ? (
            <VoiceField value={values[field.key] || ''} onChange={set} onCaptured={next} placeholder={field.placeholder} type={field.type} />
          ) : (
            <input
              ref={inputRef}
              type={field.type}
              value={values[field.key] || ''}
              onChange={(e) => set(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canContinue && next()}
              placeholder={field.placeholder}
              className="basic-details__input"
            />
          )}
        </Card>

        {field.type !== 'chips' && (
          <Button className="basic-details__next" onClick={next} disabled={!canContinue} icon={ArrowRight}>
            {field.optional && !values[field.key] ? t('skip') : i === FIELDS.length - 1 ? t('continueToSymptoms') : t('next')}
          </Button>
        )}
      </div>
    </NavShell>
  );
}