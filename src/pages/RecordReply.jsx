import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Volume2, Pill, ClipboardList, MessageSquare, Mic, Square, Send, CheckCircle2, Info } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import session from '../utils/session';
import { INITIAL_PATIENTS } from '../utils/sampleData';
import { LANGUAGES } from '../context/strings';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import './RecordReply.css';

const FIELDS = [
  { key: 'medicines', label: 'Medicines', icon: Pill, placeholder: 'e.g. Paracetamol 500mg, twice a day for 3 days' },
  { key: 'tests', label: 'Tests', icon: ClipboardList, placeholder: 'e.g. CBC, chest X-ray — optional' },
  { key: 'advice', label: 'Advice', icon: MessageSquare, placeholder: 'e.g. Rest, stay hydrated, come back if fever crosses 102°F' },
];

/**
 * Doctor listens to the patient's symptom transcript, then fills in
 * three separate fields — medicines, tests, advice — each answerable
 * by typing or by voice. Sending moves the patient from "waiting" into
 * "replied today" (both lists live in session.js).
 */
export default function RecordReply() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const doctor = session.getCurrentDoctor();
  const patient = state?.patient;

  const { speak } = useSpeechSynthesis();
  const [playing, setPlaying] = useState(false);
  const [reply, setReply] = useState({ medicines: '', tests: '', advice: '' });
  const [sent, setSent] = useState(false);

  const patientLangCode = patient?.preferredLanguage || 'en';
  const patientLang = LANGUAGES.find((l) => l.code === patientLangCode) || LANGUAGES[0];
  const needsTranslationNotice = patientLangCode !== 'en';

  const playPatientRecording = () => {
    if (playing) return;
    setPlaying(true);
    speak(patient?.snippet || '', 'en-IN');
    const estimatedMs = ((patient?.snippet || '').split(' ').length / 2.5) * 1000 + 400;
    setTimeout(() => setPlaying(false), estimatedMs);
  };

  const set = (key, v) => setReply((r) => ({ ...r, [key]: v }));
  const canSend = reply.medicines.trim() || reply.advice.trim();

  const send = () => {
    if (!canSend) return;
    setSent(true);
    setTimeout(() => {
      const allPatients = session.getPatients(INITIAL_PATIENTS);
      const updatedWaiting = allPatients.filter((p) => p.id !== patient?.id);
      const repliedPatient = { ...patient, reply, repliedBy: doctor?.name };
      const updatedReplied = [repliedPatient, ...session.getRepliedToday([])];
      session.savePatients(updatedWaiting);
      session.saveRepliedToday(updatedReplied);
      navigate('/hospital/dashboard');
    }, 1200);
  };

  if (!patient) {
    return (
      <HospitalShell title="Hospital Portal" doctorName={doctor?.name}>
        <p>No patient selected.</p>
        <button onClick={() => navigate('/hospital/patients')} className="record-reply__back"><ChevronLeft size={16} /> Back to queue</button>
      </HospitalShell>
    );
  }

  return (
    <HospitalShell title="Reply to patient" doctorName={doctor?.name}>
      <button onClick={() => navigate('/hospital/patients')} className="record-reply__back"><ChevronLeft size={16} /> Back to queue</button>

      <div className="record-reply">
        <Card>
          <div className="record-reply__patient-header">
            <div className="record-reply__avatar">{patient.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
            <div>
              <p className="record-reply__patient-name">{patient.name}</p>
              <p className="record-reply__patient-meta">{patient.age} · {patient.gender} · {patient.specialty}</p>
            </div>
          </div>

          <button onClick={playPatientRecording} className="record-reply__player">
            <span className="record-reply__play-btn"><Volume2 size={16} /></span>
            <span className="record-reply__player-label">{playing ? 'Playing…' : "Play patient's symptoms"}</span>
          </button>
          <div className="record-reply__transcript">
            <p>{patient.snippet}</p>
          </div>

          {needsTranslationNotice && (
            <p className="record-reply__lang-notice">
              <Info size={12} /> This patient's preferred language is {patientLang.nativeLabel}. If you reply in English, they'll hear it read in English — automatic translation isn't available yet. Replying in {patientLang.nativeLabel} needs no translation.
            </p>
          )}
        </Card>

        <Card className="record-reply__reply-card">
          <p className="record-reply__reply-label">Your reply</p>

          {sent ? (
            <div className="record-reply__sent">
              <CheckCircle2 size={40} className="record-reply__sent-icon" />
              <p className="record-reply__sent-title">Reply sent</p>
              <p className="record-reply__sent-sub">Moving this patient to Replied Today…</p>
            </div>
          ) : (
            <>
              {FIELDS.map((f) => (
                <ReplyField key={f.key} field={f} value={reply[f.key]} onChange={(v) => set(f.key, v)} />
              ))}

              <Button className="record-reply__send" onClick={send} disabled={!canSend} icon={Send}>Send reply</Button>
              <p className="record-reply__send-hint">Medicines or advice is required — tests are optional.</p>
            </>
          )}
        </Card>
      </div>
    </HospitalShell>
  );
}

function ReplyField({ field, value, onChange }) {
  const { supported, listening, interimTranscript, start, stop } = useSpeechRecognition({ lang: 'en-IN', continuous: true, silenceTimeoutMs: 2500 });
  const Icon = field.icon;

  const toggleMic = () => {
    if (listening) { stop(); return; }
    start((finalText) => { if (finalText) onChange((value ? value + ' ' : '') + finalText); });
  };

  return (
    <div className="reply-field">
      <p className="reply-field__label"><Icon size={14} /> {field.label}</p>
      <div className="reply-field__box">
        <textarea
          rows={2}
          value={listening ? [value, interimTranscript].filter(Boolean).join(' ') : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={listening}
          className="reply-field__textarea"
        />
        {supported && (
          <button onClick={toggleMic} className={`reply-field__mic ${listening ? 'reply-field__mic--active' : ''}`}>
            {listening ? <Square size={13} /> : <Mic size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}