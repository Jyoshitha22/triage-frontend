import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Mic, Square, Stethoscope } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PatientSidebar from '../components/PatientSidebar';
import ProgressDots from '../components/ProgressDots';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import api from '../utils/api';
import session from '../utils/session';
import './BasicDetails.css';
import './SymptomRecording.css';

const URGENCY_OPTIONS = [
  { key: 'low', labelKey: 'urgencyLow' },
  { key: 'medium', labelKey: 'urgencyMedium' },
  { key: 'high', labelKey: 'urgencyHigh' },
  { key: 'emergency', labelKey: 'urgencyEmergency' },
];

const spokenNumberMap = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  సున్న: '0', సున్నా: '0', ఒక: '1', ఒకటి: '1', రెండు: '2', మూడు: '3', నాలుగు: '4', ఐదు: '5', ఆరు: '6', ఏడు: '7', ఎనిమిది: '8', తొమ్మిది: '9', పది: '10',
  शून्य: '0', एक: '1', दो: '2', तीन: '3', चार: '4', पाँच: '5', पांच: '5', छह: '6', सात: '7', आठ: '8', नौ: '9', दस: '10',
  பூஜ்ஜியம்: '0', ஒன்று: '1', இரண்டு: '2', மூன்று: '3', நான்கு: '4', ஐந்து: '5', ஆறு: '6', ஏழு: '7', எட்டு: '8', ஒன்பது: '9', பத்து: '10',
};

function parseSpokenDays(rawText) {
  const normalized = String(rawText || '').toLowerCase().replace(/[^a-zA-Z0-9\u00C0-\uFFFF\s]/g, ' ').trim();
  if (!normalized) return '';

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const parts = [];

  for (const token of tokens) {
    if (spokenNumberMap[token]) {
      parts.push(spokenNumberMap[token]);
      continue;
    }
    const directDigits = token.replace(/\D/g, '');
    if (directDigits) {
      parts.push(directDigits);
    }
  }

  const compact = parts.join('');
  return compact.replace(/\D/g, '').slice(0, 3);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientNetworkError(message) {
  const normalized = String(message || '').toLowerCase();
  return (
    normalized.includes('temporarily unreachable') ||
    normalized.includes('network') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('timeout') ||
    normalized.includes('abort')
  );
}

export default function SymptomRecording() {
  const navigate = useNavigate();
  const { bcp47, t, language } = useLanguage();
  const patient = session.getPatient();
  const [symptoms, setSymptoms] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [errorKey, setErrorKey] = useState('');
  const [errorText, setErrorText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearError = () => {
    setErrorKey('');
    setErrorText('');
  };

  const showErrorKey = (key) => {
    setErrorKey(key);
    setErrorText('');
  };

  const errorMessage = errorKey ? t(errorKey) : errorText;

  useEffect(() => {
    if (!patient) {
      navigate('/basic-details', { replace: true });
    }
  }, [patient, navigate]);

  const { supported, listening, interimTranscript, error: voiceError, start, stop } = useSpeechRecognition({
    lang: bcp47 || 'en-IN',
    continuous: true,
    silenceTimeoutMs: null,
  });
  const { supported: durationVoiceSupported, listening: durationListening, start: startDurationVoice, stop: stopDurationVoice } = useSpeechRecognition({
    lang: bcp47 || 'en-IN',
    continuous: false,
    silenceTimeoutMs: 2500,
  });

  const value = listening
    ? [symptoms, interimTranscript].filter(Boolean).join(symptoms && interimTranscript ? ' ' : '')
    : symptoms;

  const handleSubmit = async () => {
    if (submitting) return;
    const trimmed = symptoms.trim();
    if (!trimmed) {
      showErrorKey('errorRequired');
      return;
    }
    if (durationDays === '') {
      showErrorKey('errorRequired');
      return;
    }

    const symptomId = `symptom-${Date.now()}`;
    const record = {
      symptom_id: symptomId,
      patient_name: patient?.name || 'Patient',
      patient_age: patient?.age || '',
      patient_gender: patient?.gender || '',
      patient_contact: patient?.contact || '',
      patient_location: patient?.location || '',
      symptom_text: trimmed,
      duration_days: Number(durationDays),
      urgency,
      department: 'General Physician',
      status: 'waiting',
      replies: [],
      created_at: new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      const payload = {
        symptom_id: record.symptom_id,
        patient_name: record.patient_name,
        patient_age: record.patient_age || null,
        patient_gender: record.patient_gender || null,
        patient_contact: record.patient_contact || null,
        patient_location: record.patient_location || null,
        patient_email: patient?.email || null,
        symptom_text: record.symptom_text,
        duration_days: Number(record.duration_days),
        urgency: record.urgency,
        department: record.department,
        language: patient?.language || 'en',
      };

      let submitted = false;
      let savedRecord = null;
      let lastMessage = '';
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          if (attempt > 0) {
            showErrorKey('symptomServerRetrying');
            await wait(1200 + attempt * 700);
          }
          savedRecord = await api.post('/symptom-records', payload);
          submitted = true;
          break;
        } catch (attemptErr) {
          lastMessage = String(attemptErr?.message || '');
          if (!isTransientNetworkError(lastMessage) || attempt === 3) {
            throw attemptErr;
          }
        }
      }

      if (!submitted || !savedRecord?.symptom_id) {
        showErrorKey('symptomSendFailed');
        return;
      }

      // Persist only the server-accepted record so doctor and patient views stay consistent.
      const acceptedRecord = {
        ...record,
        ...savedRecord,
        symptom_id: savedRecord.symptom_id || record.symptom_id,
      };
      if (!session.getSymptomRecord(acceptedRecord.symptom_id)) {
        session.addSymptomRecord(acceptedRecord);
      }
      clearError();

      session.saveActiveSymptomId(acceptedRecord.symptom_id);
      session.savePending({ endAt: Date.now() + 360000, notified: false, symptomId: acceptedRecord.symptom_id });
      navigate('/waiting', { replace: true });
    } catch (submitErr) {
      const message = String(submitErr?.message || '');
      if (isTransientNetworkError(message)) {
        showErrorKey('symptomServerUnreachable');
      } else {
        showErrorKey('symptomSendFailed');
      }
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      stop();
      return;
    }

    start((finalText) => {
      const spoken = (finalText || '').trim();
      if (!spoken) return;
      setSymptoms((current) => (current ? `${current} ${spoken}` : spoken));
      clearError();
    });
  };

  const toggleDurationMic = () => {
    if (durationListening) {
      stopDurationVoice();
      return;
    }

    startDurationVoice((finalText) => {
      const digits = parseSpokenDays(finalText);
      if (!digits) return;
      setDurationDays(digits);
      clearError();
    });
  };

  if (!patient) return null;

  return (
    <div className="pd">
      <div className="pd-body">
        <PatientSidebar />

        <main className="pd-main">
          <div className="pd-progress"><ProgressDots step={3} t={t} /></div>
          <section className={`pd-card symptom-card symptom-card--${language}`}>
            <div className="pd-card__head">
              <span className="pd-card__avatar"><Stethoscope size={34} strokeWidth={2} /></span>
              <div>
                <h1 className="pd-card__title">{t('symptomTitleIdle')}</h1>
                <p className="pd-card__sub">{t('symptomSubtitle')}</p>
                <svg className="pd-card__wave" viewBox="0 0 150 14" aria-hidden="true">
                  <path d="M2 9 C30 2 60 2 85 8 C105 12 128 8 148 4" fill="none" stroke="#86c9ac" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="pd-row">
              <div className="pd-row__body">
                <label className="pd-row__label" htmlFor="symptom-text">{t('symptomTitleIdle')}</label>
                <div className={`pd-input pd-input--area ${listening ? 'pd-input--live' : ''}`}>
                  <textarea
                    id="symptom-text"
                    rows={4}
                    value={value}
                    onChange={(e) => { setSymptoms(e.target.value); clearError(); }}
                    placeholder={t('symptomSubtitle')}
                  />
                  {supported && (
                    <button type="button" onClick={toggleMic} aria-label="Speak symptoms" className={`pd-input__mic ${listening ? 'pd-input__mic--on' : ''}`}>
                      {listening ? <Square size={15} /> : <Mic size={18} />}
                    </button>
                  )}
                </div>
                <p className={`pd-error symptom-card__status ${errorMessage ? 'is-visible' : ''}`}>
                  <AlertCircle size={13} /> {errorMessage || ' '}
                </p>
                {voiceError && <p className="pd-hint"><AlertCircle size={13} /> {voiceError}</p>}
              </div>
            </div>

            <div className="pd-row">
              <div className="pd-row__body">
                <label className="pd-row__label" htmlFor="symptom-duration">{t('followupQ1')}</label>
                <div className="pd-input">
                  <input
                    id="symptom-duration"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={durationDays}
                    onChange={(e) => { setDurationDays(e.target.value); clearError(); }}
                    placeholder={t('symptomDurationPlaceholder')}
                  />
                  {durationVoiceSupported && (
                    <button type="button" onClick={toggleDurationMic} aria-label="Speak duration" className={`pd-input__mic ${durationListening ? 'pd-input__mic--on' : ''}`}>
                      {durationListening ? <Square size={15} /> : <Mic size={18} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pd-row">
              <div className="pd-row__body">
                <label className="pd-row__label" htmlFor="symptom-urgency">{t('symptomUrgency')}</label>
                <div id="symptom-urgency" className="pd-gender" role="radiogroup" aria-label={t('symptomUrgency')}>
                  {URGENCY_OPTIONS.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={urgency === key}
                      onClick={() => setUrgency(key)}
                      className={`pd-pill ${urgency === key ? 'pd-pill--on' : ''}`}
                    >
                      <span className="pd-pill__radio" />
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" onClick={handleSubmit} className="pd-submit" disabled={submitting}>
              <ArrowRight size={22} strokeWidth={2.2} /> {submitting ? t('sendingToDoctor') : t('sendToDoctor')}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
