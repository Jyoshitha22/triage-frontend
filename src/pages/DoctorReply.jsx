import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle2, Bookmark, ArrowRight, Info, Pill, ClipboardList, MessageSquare } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Button from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import './DoctorReply.css';

// Standing in for the real reply, which — once a backend exists — would
// be fetched using this patient's own session/request ID. Structured to
// match exactly what RecordReply.jsx now actually produces: medicines,
// tests, advice, each optionally filled in.
const SAMPLE_REPLY = {
  medicines: 'Paracetamol 500mg, twice a day for 3 days.',
  tests: '',
  advice: "This sounds like a mild viral fever. Rest, stay hydrated, and come back if the fever crosses 102°F or lasts more than 3 days.",
};

export default function DoctorReply() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { speak, cancel } = useSpeechSynthesis();
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);

  const sections = [
    { key: 'medicines', label: 'Medicines', icon: Pill },
    { key: 'tests', label: 'Tests', icon: ClipboardList },
    { key: 'advice', label: 'Advice', icon: MessageSquare },
  ].filter((s) => SAMPLE_REPLY[s.key]);

  // The doctor's note is written in English — reading it aloud with an
  // English voice keeps it understandable. Real translation into the
  // patient's language would need a backend translation service; that's
  // not wired up yet, so the notice below is shown instead of silently
  // guessing. UI chrome around it (labels, buttons) still follows the
  // patient's chosen language.
  const playReply = () => {
    if (playing) { cancel(); setPlaying(false); return; }
    setPlaying(true);
    const fullText = sections.map((s) => `${s.label}. ${SAMPLE_REPLY[s.key]}`).join(' ');
    speak(fullText, 'en-IN');
    const estimatedMs = (fullText.split(' ').length / 2.5) * 1000 + 500;
    setTimeout(() => setPlaying(false), estimatedMs);
  };

  const saveNote = () => setSaved(true);

  return (
    <NavShell step={5}>
      <div className="doctor-reply">
        <h1 className="doctor-reply__title">{t('doctorRepliedTitle')}</h1>

        <Card className="doctor-reply__card">
          <div className="doctor-reply__header">
            <div className="doctor-reply__avatar">AR</div>
            <div>
              <p className="doctor-reply__name">Dr. Ananya Rao</p>
              <p className="doctor-reply__specialty">General Physician · 8 years experience</p>
            </div>
            <CheckCircle2 size={20} className="doctor-reply__check" />
          </div>

          <button onClick={playReply} className="doctor-reply__player">
            <span className="doctor-reply__play-btn">{playing ? <Pause size={20} /> : <Play size={20} className="doctor-reply__play-icon" />}</span>
            <span className="doctor-reply__player-label">{playing ? t('playingReply') : t('playReply')}</span>
          </button>

          {language !== 'en' && (
            <p className="doctor-reply__translation-notice"><Info size={12} /> {t('translationNotice')}</p>
          )}

          <div className="doctor-reply__note">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="doctor-reply__note-section">
                  <p className="doctor-reply__note-label"><Icon size={12} /> {s.label}</p>
                  <p className="doctor-reply__note-text">{SAMPLE_REPLY[s.key]}</p>
                </div>
              );
            })}
          </div>

          <div className="doctor-reply__actions">
            <button onClick={saveNote} disabled={saved} className={`doctor-reply__save ${saved ? 'doctor-reply__save--saved' : ''}`}>
              {saved ? <><CheckCircle2 size={16} /> {t('savedNote')}</> : <><Bookmark size={16} /> {t('saveNote')}</>}
            </button>
            <Button onClick={() => navigate('/')} icon={ArrowRight}>{t('backToHome')}</Button>
          </div>
        </Card>
      </div>
    </NavShell>
  );
}