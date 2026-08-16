import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle2, Bookmark } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Button from '../components/Button';
import Waveform from '../components/Waveform';
import './DoctorReply.css';

export default function DoctorReply() {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const duration = 42; // seconds — replace with real audio duration

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= duration) { setPlaying(false); return 0; }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <NavShell step={5}>
      <div className="doctor-reply">
        <h1 className="doctor-reply__title">Your doctor has replied</h1>

        <Card className="doctor-reply__card">
          <div className="doctor-reply__header">
            <div className="doctor-reply__avatar">AR</div>
            <div>
              <p className="doctor-reply__name">Dr. Ananya Rao</p>
              <p className="doctor-reply__specialty">General Physician · 8 years experience</p>
            </div>
            <CheckCircle2 size={20} className="doctor-reply__check" />
          </div>

          <button onClick={() => setPlaying((p) => !p)} className="doctor-reply__player">
            <span className="doctor-reply__play-btn">{playing ? <Pause size={20} /> : <Play size={20} className="doctor-reply__play-icon" />}</span>
            <span className="doctor-reply__player-wave">
              <Waveform mode="playback" />
              <span className="doctor-reply__player-time">{fmt(progress)} / {fmt(duration)}</span>
            </span>
          </button>
          <div className="doctor-reply__progress-track"><div className="doctor-reply__progress-fill" style={{ width: `${(progress / duration) * 100}%` }} /></div>

          <div className="doctor-reply__note">
            <p className="doctor-reply__note-label">Doctor's note</p>
            <p className="doctor-reply__note-text">
              This sounds like a mild viral fever. Rest, stay hydrated, and take paracetamol if needed.
              Come back if the fever crosses 102°F or lasts more than 3 days.
            </p>
          </div>

          <div className="doctor-reply__actions">
            <Button variant="ghost" icon={Bookmark}>Save note</Button>
            <Button onClick={() => navigate('/')}>Done</Button>
          </div>
        </Card>
      </div>
    </NavShell>
  );
}