import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, CheckCircle2, Circle } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import { useLanguage } from '../context/LanguageContext';
import './WaitingForDoctor.css';

const STEPS = [
  { labelKey: 'stepSymptomsReceived', descKey: 'stepSymptomsReceivedDesc', done: true },
  { labelKey: 'stepDoctorReviewing', descKey: 'stepDoctorReviewingDesc', active: true },
  { labelKey: 'stepDoctorReply', descKey: 'stepDoctorReplyDesc' },
];

/**
 * Nothing to do here but wait, so nothing is tappable. The pulse and
 * countdown carry the reassurance instead of more text.
 */
export default function WaitingForDoctor() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [eta, setEta] = useState(360); // seconds — replace with real ETA from backend

  useEffect(() => {
    const t = setInterval(() => setEta((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(eta / 60)).padStart(2, '0');
  const ss = String(eta % 60).padStart(2, '0');

  return (
    <NavShell step={4}>
      <div className="waiting">
        <h1 className="waiting__title">{t('waitingTitle')}</h1>
        <p className="waiting__subtitle">{t('waitingSubtitle')}</p>

        <Card className="waiting__card">
          <div className="waiting__icon-badge"><Stethoscope size={28} /></div>
          <Waveform mode="pulse" className="waiting__wave" />
          <p className="waiting__eta">{mm}:{ss}</p>
          <p className="waiting__eta-label">estimated wait</p>

          <ul className="waiting__steps">
            {STEPS.map((s) => (
              <li key={s.labelKey} className="waiting__step">
                {s.done ? <CheckCircle2 size={18} className="waiting__step-icon waiting__step-icon--done" /> : <Circle size={18} className={`waiting__step-icon ${s.active ? 'waiting__step-icon--active' : ''}`} />}
                <div>
                  <p className={s.done ? 'waiting__step-label--done' : s.active ? 'waiting__step-label--active' : 'waiting__step-label'}>{t(s.labelKey)}</p>
                  <p className="waiting__step-desc">{t(s.descKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <p className="waiting__note">{t('waitingNote')}</p>

        {/* DEV ONLY — stand-in for the real backend event that fires when
            the doctor's reply is saved (poll or subscribe, then navigate
            here automatically). Delete this button once that's wired up. */}
        <button onClick={() => navigate('/reply')} className="waiting__dev-skip">
          (dev) doctor has replied →
        </button>
      </div>
    </NavShell>
  );
}
