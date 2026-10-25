import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Pill, ClipboardList, MessageSquare, Mic, Square, Send, CheckCircle2, Info } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import useSarvamRecording from '../hooks/useSarvamRecording';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { useLanguage } from '../context/LanguageContext';
import './RecordReply.css';

const FIELDS = [
  { key: 'medicine', label: 'Medicines', icon: Pill, placeholder: 'e.g. Paracetamol 500mg, twice a day for 3 days' },
  { key: 'test', label: 'Tests', icon: ClipboardList, placeholder: 'e.g. CBC, chest X-ray — optional' },
  { key: 'advice', label: 'Advice', icon: MessageSquare, placeholder: 'e.g. Rest, stay hydrated, come back if fever crosses 102°F' },
  { key: 'reason', label: 'Reason (voice/text)', icon: MessageSquare, placeholder: 'e.g. This looks like seasonal viral fever with mild dehydration.' },
];

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
  const { bcp47 } = useLanguage();
  const doctor = session.getDoctor();
  const doctorId = doctor?.doctor_id || null;
  const symptomId = state?.symptomId;
  const fromView = state?.fromView === 'urgent' ? 'urgent' : 'waiting';
  const goBack = () => {
    navigate(fromView === 'urgent' ? '/hospital/patients?view=urgent' : '/hospital/patients');
  };

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState({ medicine: '', test: '', advice: '', reason: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [lockedByOther, setLockedByOther] = useState('');

  useEffect(() => {
    if (!doctorId) { navigate('/hospital/doctor', { replace: true }); return; }
    if (!symptomId) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
    api.post(`/symptom-records/${symptomId}/claim`, { doctor_id: doctorId })
      .then(() => api.get(`/symptom-records/${symptomId}`))
      .then((rec) => setRecord(rec || session.getSymptomRecord(symptomId)))
      .catch((claimErr) => {
        const message = String(claimErr?.message || '');
        if (message.includes('being reviewed') || message.includes('already been replied')) {
          setLockedByOther(message);
          setRecord(null);
          return;
        }
        setRecord(session.getSymptomRecord(symptomId));
      })
      .finally(() => setLoading(false));
  }, [doctorId, symptomId, navigate]);

  const set = (key, v) => setReply((r) => ({ ...r, [key]: v }));
  const canSend = reply.medicine.trim() || reply.advice.trim();

  const send = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);
    const parts = FIELDS.filter((f) => reply[f.key].trim()).map((f) => ({ response_type: f.key, response_text: reply[f.key] }));
    try {
      let response = null;
      let lastMessage = '';

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          if (attempt > 0) {
            setError('Connecting to server... retrying once.');
            await wait(2200);
          }
          response = await api.post(`/symptom-records/${symptomId}/reply`, {
            doctor_id: doctor.doctor_id,
            parts,
          }, { timeoutMs: 120000 });
          break;
        } catch (attemptErr) {
          lastMessage = String(attemptErr?.message || '');
          if (!isTransientNetworkError(lastMessage) || attempt === 1) {
            throw attemptErr;
          }
        }
      }

      // Ensure patient gets a reply-ready mail; if initial send failed, retry once via notification endpoint.
      // This retry is best-effort and must not fail the main reply submission.
      if (response?.patient_email && response?.mail_sent === false) {
        const replyToken = response?.reply_access_token;
        if (replyToken) {
          const baseUrl = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://localhost:5173';
          try {
            await api.post('/notifications/reply-ready', {
              email: response.patient_email,
              language: response.language || 'en',
              patientName: response.patient_name || 'Patient',
              replyUrl: `${baseUrl}/reply/${replyToken}`,
            }, { timeoutMs: 30000 });
          } catch {
            // Keep doctor flow successful even when notification retry is temporarily unavailable.
          }
        }
      }

      session.addDoctorReply(symptomId, parts, doctor?.doctor_id, doctor?.name);
      setSent(true);
      setTimeout(() => navigate('/hospital/replied'), 1400);
    } catch (submitErr) {
      const message = String(submitErr?.message || 'Unable to send reply right now.');
      if (isTransientNetworkError(message)) {
        setError('Server is temporarily unreachable. Reply is not sent yet. Please retry.');
      } else {
        setError(message);
      }
      setSending(false);
      return;
    }
  };

  if (loading) return <HospitalShell showDoctorArtwork><p>Loading…</p></HospitalShell>;

  if (!record) {
    return (
      <HospitalShell showDoctorArtwork>
        <p>{lockedByOther || 'No patient selected, or they are being reviewed by another doctor.'}</p>
        <button onClick={goBack} className="record-reply__back"><ChevronLeft size={16} /> Back</button>
      </HospitalShell>
    );
  }

  return (
    <HospitalShell showDoctorArtwork>
      <div className="record-reply">
        <Card>
          <div className="record-reply__patient-header">
            <div className="record-reply__avatar">{record.patient_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
            <div>
              <p className="record-reply__patient-name">{record.patient_name}</p>
              <p className="record-reply__patient-meta">{record.patient_age} · {record.patient_gender} · {record.department}</p>
            </div>
          </div>

          <div className="record-reply__transcript"><p>{record.doctor_summary || record.symptom_text}</p></div>

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
                <ReplyField key={f.key} field={f} value={reply[f.key]} onChange={(v) => set(f.key, v)} lang={bcp47} />
              ))}
              {error && <p className="field-error">{error}</p>}
              <Button className="record-reply__send" onClick={send} disabled={!canSend || sending} icon={Send}>{sending ? 'Sending…' : 'Send reply'}</Button>
              <p className="record-reply__send-hint">Medicines or advice is required — tests and reason are optional but recommended.</p>
            </>
          )}
        </Card>
      </div>
      <button onClick={goBack} className="record-reply__back"><ChevronLeft size={16} /> Back</button>
    </HospitalShell>
  );
}

function normalizeRecordingLang(bcp47) {
  const lower = String(bcp47 || '').toLowerCase();
  if (lower.startsWith('te')) return 'te';
  if (lower.startsWith('hi')) return 'hi';
  if (lower.startsWith('ta')) return 'ta';
  return 'en';
}

function ReplyField({ field, value, onChange, lang }) {
  const browserSpeech = useSpeechRecognition({ lang: lang || 'en-IN', continuous: false, silenceTimeoutMs: 2200 });
  const sarvamSpeech = useSarvamRecording({ lang: normalizeRecordingLang(lang), silenceTimeoutMs: 2500 });
  const useBrowser = browserSpeech.supported;
  const supported = useBrowser ? browserSpeech.supported : sarvamSpeech.supported;
  const listening = useBrowser ? browserSpeech.listening : sarvamSpeech.listening;
  const transcribing = useBrowser ? false : sarvamSpeech.transcribing;
  const Icon = field.icon;

  const toggleMic = () => {
    if (listening) {
      if (useBrowser) browserSpeech.stop();
      else sarvamSpeech.stop();
      return;
    }

    const handleFinal = (finalText) => {
      if (finalText) onChange((value ? `${value} ` : '') + finalText);
    };

    if (useBrowser) browserSpeech.start(handleFinal);
    else sarvamSpeech.start(handleFinal);
  };

  return (
    <div className="reply-field">
      <p className="reply-field__label"><Icon size={14} /> {field.label}</p>
      <div className="reply-field__box">
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={listening ? 'Listening…' : (transcribing ? 'Transcribing…' : field.placeholder)}
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