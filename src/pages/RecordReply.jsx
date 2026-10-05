import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Volume2, Pill, ClipboardList, MessageSquare, Mic, Square, Send, CheckCircle2, Info } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import useSarvamRecording from '../hooks/useSarvamRecording';
import useSarvamSpeech from '../hooks/useSarvamSpeech';
import './RecordReply.css';

const FIELDS = [
  { key: 'medicine', label: 'Medicines', icon: Pill, placeholder: 'e.g. Paracetamol 500mg, twice a day for 3 days' },
  { key: 'test', label: 'Tests', icon: ClipboardList, placeholder: 'e.g. CBC, chest X-ray — optional' },
  { key: 'advice', label: 'Advice', icon: MessageSquare, placeholder: 'e.g. Rest, stay hydrated, come back if fever crosses 102°F' },
];

/**
 * Doctor listens to the patient's symptoms, then fills in three real
 * fields — medicine, test, advice — each typed or spoken (via Sarvam).
 * Sending is a single backend call: the server translates each part
 * into the patient's own language automatically before storing it, so
 * there's nothing extra to configure here regardless of which language
 * the doctor types or speaks in.
 */
export default function RecordReply() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const doctor = session.getDoctor();
  const symptomId = state?.symptomId;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const { speak } = useSarvamSpeech();
  const [playing, setPlaying] = useState(false);
  const [reply, setReply] = useState({ medicine: '', test: '', advice: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doctor) { navigate('/hospital/doctor', { replace: true }); return; }
    if (!symptomId) { setLoading(false); return; }
    api.get(`/symptom-records?status=waiting&doctor_id=${doctor.doctor_id}`)
      .then((list) => setRecord(list.find((r) => r.symptom_id === symptomId) || null))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playPatientSymptoms = () => {
    if (playing || !record) return;
    setPlaying(true);
    speak(record.symptom_text, 'en').finally(() => setTimeout(() => setPlaying(false), 300));
  };

  const set = (key, v) => setReply((r) => ({ ...r, [key]: v }));
  const canSend = reply.medicine.trim() || reply.advice.trim();

  const send = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/symptom-records/${symptomId}/reply`, {
        doctor_id: doctor.doctor_id,
        parts: FIELDS.filter((f) => reply[f.key].trim()).map((f) => ({ response_type: f.key, response_text: reply[f.key] })),
      });
      setSent(true);
      setTimeout(() => navigate('/hospital/dashboard'), 1400);
    } catch (e) {
      setError(e.message || 'Could not send reply — try again.');
      setSending(false);
    }
  };

  if (loading) return <HospitalShell title="Hospital Portal" doctorName={doctor?.name}><p>Loading…</p></HospitalShell>;

  if (!record) {
    return (
      <HospitalShell title="Hospital Portal" doctorName={doctor?.name}>
        <p>No patient selected, or they've already been replied to.</p>
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
            <div className="record-reply__avatar">{record.patient_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
            <div>
              <p className="record-reply__patient-name">{record.patient_name}</p>
              <p className="record-reply__patient-meta">{record.patient_age} · {record.patient_gender} · {record.department}</p>
            </div>
          </div>

          <button onClick={playPatientSymptoms} className="record-reply__player">
            <span className="record-reply__play-btn"><Volume2 size={16} /></span>
            <span className="record-reply__player-label">{playing ? 'Playing…' : "Play patient's symptoms"}</span>
          </button>
          <div className="record-reply__transcript"><p>{record.symptom_text}</p></div>

          <p className="record-reply__lang-notice">
            <Info size={12} /> Write or speak your reply in whichever language is easiest for you — it's translated into this patient's language automatically before it reaches them.
          </p>
        </Card>

        <Card className="record-reply__reply-card">
          <p className="record-reply__reply-label">Your reply</p>

          {sent ? (
            <div className="record-reply__sent">
              <CheckCircle2 size={40} className="record-reply__sent-icon" />
              <p className="record-reply__sent-title">Reply sent</p>
              <p className="record-reply__sent-sub">Moving this patient to your Replied list…</p>
            </div>
          ) : (
            <>
              {FIELDS.map((f) => (
                <ReplyField key={f.key} field={f} value={reply[f.key]} onChange={(v) => set(f.key, v)} />
              ))}
              {error && <p className="field-error">{error}</p>}
              <Button className="record-reply__send" onClick={send} disabled={!canSend || sending} icon={Send}>{sending ? 'Sending…' : 'Send reply'}</Button>
              <p className="record-reply__send-hint">Medicines or advice is required — tests are optional.</p>
            </>
          )}
        </Card>
      </div>
    </HospitalShell>
  );
}

function ReplyField({ field, value, onChange }) {
  const { supported, listening, transcribing, start, stop } = useSarvamRecording({ lang: 'en', silenceTimeoutMs: 2500 });
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={transcribing ? 'Transcribing…' : field.placeholder}
          disabled={listening || transcribing}
          className="reply-field__textarea"
        />
        {supported && (
          <button onClick={toggleMic} disabled={transcribing} className={`reply-field__mic ${listening ? 'reply-field__mic--active' : ''}`}>
            {listening ? <Square size={13} /> : <Mic size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}