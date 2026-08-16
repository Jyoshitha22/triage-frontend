import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, CheckCircle2, Circle } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import './WaitingForDoctor.css';

const STEPS = [
  { label: 'Symptoms received', done: true },
  { label: 'Doctor reviewing', active: true },
  { label: "You'll be notified" },
];

/**
 * Nothing to do here but wait, so nothing is tappable. The pulse and
 * countdown carry the reassurance instead of more text.
 */
export default function WaitingForDoctor() {
  const navigate = useNavigate();
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
        <h1 className="waiting__title">A doctor is reviewing what you shared</h1>

        <Card className="waiting__card">
          <div className="waiting__icon-badge"><Stethoscope size={28} /></div>
          <Waveform mode="pulse" className="waiting__wave" />
          <p className="waiting__eta">{mm}:{ss}</p>
          <p className="waiting__eta-label">estimated wait</p>

          <ul className="waiting__steps">
            {STEPS.map((s) => (
              <li key={s.label} className="waiting__step">
                {s.done ? <CheckCircle2 size={16} className="waiting__step-icon waiting__step-icon--done" /> : <Circle size={16} className={`waiting__step-icon ${s.active ? 'waiting__step-icon--active' : ''}`} />}
                <span className={s.done ? 'waiting__step-label--done' : s.active ? 'waiting__step-label--active' : 'waiting__step-label'}>{s.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <p className="waiting__note">You can close this and come back anytime — we'll notify you the moment your doctor replies.</p>

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