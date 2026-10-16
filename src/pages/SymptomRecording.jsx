import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Mic, Square, Stethoscope } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PatientSidebar from '../components/PatientSidebar';
import ProgressDots from '../components/ProgressDots';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import session from '../utils/session';
import './BasicDetails.css';

const URGENCY_OPTIONS = [
  { key: 'low', labelKey: 'urgencyLow' },
  { key: 'medium', labelKey: 'urgencyMedium' },
  { key: 'high', labelKey: 'urgencyHigh' },
  { key: 'emergency', labelKey: 'urgencyEmergency' },
];

export default function SymptomRecording() {
  const navigate = useNavigate();
  const { bcp47, t } = useLanguage();
  const patient = session.getPatient();
  const [symptoms, setSymptoms] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patient) {
      navigate('/basic-details', { replace: true });
    }
  }, [patient, navigate]);

  const { supported, listening, interimTranscript, error: voiceError, start, stop } = useSpeechRecognition({
    lang: bcp47 || 'en-IN',
    continuous: false,
    silenceTimeoutMs: 6000,
  });

  const value = listening ? (interimTranscript || symptoms) : symptoms;

  const handleSubmit = () => {
    const trimmed = symptoms.trim();
    if (!trimmed) {
      setError(t('errorRequired') || 'Please describe your symptoms before continuing.');
      return;
    }
    if (durationDays === '') {
      setError(t('errorRequired') || 'Please enter how many days you have had these symptoms.');
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

    session.saveActiveSymptomId(symptomId);
    session.savePending({ endAt: Date.now() + 360000, notified: false, symptomId });
    session.addSymptomRecord(record);
    navigate('/waiting', { replace: true });
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
    });
  };

  if (!patient) return null;

  return (
    <div className="pd">
      <div className="pd-body">
        <PatientSidebar />

        <main className="pd-main">
          <div className="pd-progress"><ProgressDots step={3} /></div>
          <section className="pd-card">
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
                    rows={6}
                    value={value}
                    onChange={(e) => { setSymptoms(e.target.value); setError(''); }}
                    placeholder={t('symptomSubtitle')}
                    disabled={listening}
                  />
                  {supported && (
                    <button type="button" onClick={toggleMic} aria-label="Speak symptoms" className={`pd-input__mic ${listening ? 'pd-input__mic--on' : ''}`}>
                      {listening ? <Square size={15} /> : <Mic size={18} />}
                    </button>
                  )}
                </div>
                {error && <p className="pd-error"><AlertCircle size={13} /> {error}</p>}
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
                    onChange={(e) => { setDurationDays(e.target.value); setError(''); }}
                    placeholder={t('symptomDurationPlaceholder')}
                  />
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

            <button type="button" onClick={handleSubmit} className="pd-submit">
              <ArrowRight size={22} strokeWidth={2.2} /> {t('sendToDoctor')}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
