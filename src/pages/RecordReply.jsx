import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Mic, Square, Play, Pause, Pill, ScanLine, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import Waveform from '../components/Waveform';
import './RecordReply.css';

const TAGS = [
  { key: 'medication', label: 'Medication', icon: Pill },
  { key: 'tests', label: 'Tests / scans', icon: ScanLine },
  { key: 'advice', label: 'General advice', icon: MessageCircle },
];
const SAMPLE_REPLY = 'This sounds like a mild viral fever. Rest, stay hydrated, and take paracetamol if needed. Come back if it crosses 102°F or lasts more than 3 days.';

/**
 * Doctor listens to the patient's recording, then records a reply the
 * same way the patient recorded their symptoms. Sending removes the
 * patient from the queue.
 */
export default function RecordReply() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const patient = state?.patient;
  const patients = state?.patients || [];

  const [playing, setPlaying] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const listenDuration = 24;

  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [sent, setSent] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setListenProgress((p) => (p >= listenDuration ? (setPlaying(false), 0) : p + 1)), 1000);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => {
    if (status === 'recording') timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [status]);

  useEffect(() => {
    if (status !== 'done' || replyText) return;
    let i = 0;
    const t = setInterval(() => {
      setReplyText(SAMPLE_REPLY.slice(0, i));
      i++;
      if (i > SAMPLE_REPLY.length) clearInterval(t);
    }, 12);
    return () => clearInterval(t);
  }, [status]); // eslint-disable-line

  const toggleTag = (key) => setTags((t) => (t.includes(key) ? t.filter((k) => k !== key) : [...t, key]));
  const toggleRecording = () => {
    if (status === 'recording') setStatus('done');
    else { setSeconds(0); setReplyText(''); setStatus('recording'); }
  };
  const send = () => {
    setSent(true);
    setTimeout(() => {
      const updated = patients.filter((p) => p.id !== patient?.id);
      navigate('/hospital/patients', { state: { patients: updated } });
    }, 1400);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <HospitalShell title="Reply to patient">
      <button onClick={() => navigate('/hospital/patients', { state: { patients } })} className="record-reply__back"><ChevronLeft size={16} /> Back to queue</button>

      <div className="record-reply">
        <Card>
          <div className="record-reply__patient-header">
            <div className="record-reply__avatar">{(patient?.name || 'Rahul Verma').split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
            <div>
              <p className="record-reply__patient-name">{patient?.name || 'Rahul Verma'}</p>
              <p className="record-reply__patient-meta">{patient?.age || 29} · {patient?.gender || 'Male'} · {patient?.specialty || 'General Physician'}</p>
            </div>
          </div>

          <button onClick={() => setPlaying((p) => !p)} className="record-reply__player">
            <span className="record-reply__play-btn">{playing ? <Pause size={16} /> : <Play size={16} className="record-reply__play-icon" />}</span>
            <span className="record-reply__player-wave"><Waveform mode="playback" bars={20} /></span>
            <span className="record-reply__player-time">{fmt(listenProgress)} / {fmt(listenDuration)}</span>
          </button>
          <div className="record-reply__transcript">
            <p>{patient?.snippet || "I've had a headache and mild fever since yesterday evening. Since yesterday evening, so about a day. I took a paracetamol this morning, but it hasn't helped much."}</p>
          </div>
        </Card>

        <Card className="record-reply__reply-card">
          <p className="record-reply__reply-label">Your reply</p>

          {sent ? (
            <div className="record-reply__sent">
              <CheckCircle2 size={40} className="record-reply__sent-icon" />
              <p className="record-reply__sent-title">Reply sent</p>
              <p className="record-reply__sent-sub">Removing this patient from your queue…</p>
            </div>
          ) : (
            <>
              <button onClick={toggleRecording} className={`record-reply__mic ${status === 'recording' ? 'record-reply__mic--active' : ''}`}>
                {status === 'recording' ? <Square size={28} className="record-reply__mic-icon-stop" /> : <Mic size={32} className="record-reply__mic-icon" />}
              </button>
              <p className="record-reply__timer">{status === 'recording' ? `${mm}:${ss} · recording` : status === 'done' ? `${mm}:${ss} recorded` : 'Tap to speak your reply'}</p>
              <Waveform mode={status === 'recording' ? 'recording' : status === 'done' ? 'playback' : 'idle'} className="record-reply__wave" />

              {status === 'done' && <div className="record-reply__reply-text"><p>{replyText}</p></div>}

              <div className="record-reply__tags">
                {TAGS.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => toggleTag(key)} className={`record-reply__tag ${tags.includes(key) ? 'record-reply__tag--active' : ''}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              <Button className="record-reply__send" onClick={send} disabled={status !== 'done'} icon={Send}>Send reply</Button>
            </>
          )}
        </Card>
      </div>
    </HospitalShell>
  );
}