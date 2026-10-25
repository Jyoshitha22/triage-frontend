import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Play, Pause, CheckCircle2, Bookmark, ArrowRight,
  Pill, ClipboardList, MessageSquare, Stethoscope,
} from 'lucide-react';
import PatientSidebar from '../components/PatientSidebar';
import ProgressDots from '../components/ProgressDots';
import { useLanguage } from '../context/LanguageContext';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import api from '../utils/api';
import session from '../utils/session';
import './DoctorReply.css';

async function createReplyAudio(text, languageCode) {
  const result = await api.post('/api/tts', { text, languageCode }, { timeoutMs: 45000 });
  if (!result?.audio) throw new Error('Empty reply audio');
  const mimeMatch = result.audio.match(/^data:(audio\/[^;]+);base64,/);
  const mimeType = result.mimeType || (mimeMatch ? mimeMatch[1] : 'audio/wav');
  const base64 = result.audio.replace(/^data:audio\/[^;]+;base64,/, '');
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

async function translateReplyText(text, sourceLanguageCode, targetLanguageCode) {
  const result = await api.post('/api/translate', {
    text,
    sourceLanguageCode,
    targetLanguageCode,
  }, { timeoutMs: 30000 });
  if (!result || !result.translatedText) throw new Error('Empty translation');
  return result.translatedText;
}

const SECTION_LABELS = {
  medicines: { en: 'Medicines', te: 'మందులు', hi: 'दवाएं', ta: 'மருந்துகள்' },
  tests: { en: 'Scans / Tests', te: 'స్కాన్లు / పరీక్షలు', hi: 'स्कैन / जांचें', ta: 'ஸ்கேன் / பரிசோதனைகள்' },
  advice: { en: 'Doctor Advice', te: 'వైద్యుల సలహా', hi: 'सलाह', ta: 'அறிவுரை' },
  reason: { en: 'Doctor Reason', te: 'వైద్యుల కారణం', hi: 'डॉक्टर का कारण', ta: 'மருத்துவர் காரணம்' },
};

const SECTIONS = [
  { key: 'medicines', icon: Pill },
  { key: 'tests', icon: ClipboardList },
  { key: 'advice', icon: MessageSquare },
  { key: 'reason', icon: MessageSquare },
];

const PART_TO_SECTION = { medicine: 'medicines', test: 'tests', advice: 'advice', reason: 'reason' };
const EMPTY_NOTE = { medicines: '', tests: '', advice: '', reason: '' };

function noteFromRecord(rec) {
  const note = { medicines: '', tests: '', advice: '', reason: '' };
  (rec?.replies || []).forEach((part) => {
    const key = PART_TO_SECTION[part.response_type];
    if (!key) return;
    note[key] = [note[key], part.response_text || part.original_text].filter(Boolean).join(' ');
  });
  return note;
}

function detectReplyLanguage(note) {
  const text = Object.values(note || {}).join(' ');
  const counts = {
    te: (text.match(/[\u0C00-\u0C7F]/g) || []).length,
    hi: (text.match(/[\u0900-\u097F]/g) || []).length,
    ta: (text.match(/[\u0B80-\u0BFF]/g) || []).length,
  };
  const detected = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return detected && detected[1] > 0 ? { te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN' }[detected[0]] : 'en-IN';
}

export default function DoctorReply() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { language, bcp47, t, languages } = useLanguage();
  const { speak: speakWithBrowser, cancel: cancelBrowserSpeech } = useSpeechSynthesis();
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState(EMPTY_NOTE);
  const [sourceNote, setSourceNote] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState('en-IN');
  const [voiceLanguage, setVoiceLanguage] = useState(bcp47);
  const [translatedLanguage, setTranslatedLanguage] = useState(null);
  const [failedLanguage, setFailedLanguage] = useState(null);
  const [fromDoctor, setFromDoctor] = useState(false);
  const [replyMissing, setReplyMissing] = useState(false);
  const [doctorMeta, setDoctorMeta] = useState({ name: '', specialty: '' });
  const [voiceError, setVoiceError] = useState(false);
  const doctorInfo = fromDoctor
    ? {
      name: doctorMeta.name || '',
      specialty: doctorMeta.specialty || '',
    }
    : { name: '', specialty: '' };
  const playTimerRef = useRef(null);
  const replyAudioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const speechRequestRef = useRef(0);

  const cancelReply = useCallback(() => {
    speechRequestRef.current += 1;
    cancelBrowserSpeech();
    replyAudioRef.current?.pause();
    replyAudioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }, [cancelBrowserSpeech]);

  useEffect(() => {
    if (!fromDoctor || !sourceNote) return undefined;
    let active = true;
    const originalLanguage = sourceLanguage || detectReplyLanguage(sourceNote);
    if (originalLanguage === bcp47) {
      Promise.resolve().then(() => {
        if (!active) return;
        setNote(sourceNote);
        setTranslatedLanguage(bcp47);
        setFailedLanguage(null);
        setVoiceLanguage(bcp47);
      });
      return () => { active = false; };
    }

    Promise.all(Object.entries(sourceNote).map(async ([key, value]) => {
      if (!value) return [key, ''];
      const translatedText = await translateReplyText(value, originalLanguage, bcp47);
      return [key, translatedText];
    })).then((entries) => {
      if (!active) return;
      setNote(Object.fromEntries(entries));
      setTranslatedLanguage(bcp47);
      setFailedLanguage(null);
      setVoiceLanguage(bcp47);
    }).catch(() => {
      if (!active) return;
      setNote(sourceNote);
      setTranslatedLanguage(null);
      setFailedLanguage(bcp47);
      setVoiceLanguage(originalLanguage);
    });
    return () => { active = false; };
  }, [bcp47, fromDoctor, sourceLanguage, sourceNote]);

  useEffect(() => {
    const symptomId = token ? null : session.getActiveSymptomId();
    if (!token && !symptomId) return undefined;
    let active = true;
    const applyRecord = (record) => {
      const real = noteFromRecord(record);
      if (!real.medicines && !real.tests && !real.advice && !real.reason) return false;
      if (active) {
        const replyDoctorName = record?.doctor_name || record?.doctorName || record?.doctor?.name || '';
        const replyDoctorSpecialty =
          record?.doctor_specialty ||
          record?.doctorSpecialty ||
          record?.doctor?.specialty ||
          record?.doctor?.department ||
          '';
        setSourceNote(real);
        setSourceLanguage(detectReplyLanguage(real));
        setDoctorMeta({ name: replyDoctorName, specialty: replyDoctorSpecialty });
        setFromDoctor(true);
      }
      return true;
    };
    if (token) {
      api.get('/symptom-records/reply-access/' + token)
        .then((record) => {
          const hasRealReply = applyRecord(record);
          if (!hasRealReply) throw new Error('Reply is not ready yet.');
        })
        .catch(() => setReplyMissing(true));
    } else {
      const hasLocal = applyRecord(session.getSymptomRecord(symptomId));
      if (!hasLocal) setReplyMissing(true);
      api.get('/symptom-records/' + symptomId)
        .then((record) => {
          const hasRemote = applyRecord(record);
          setReplyMissing(!hasRemote);
        })
        .catch(() => { /* Keep current reply state when server is unavailable. */ });
    }
    return () => { active = false; };
  }, [navigate, token]);

  const label = useCallback((key) => SECTION_LABELS[key][language] || SECTION_LABELS[key].en, [language]);
  const replyReady = !fromDoctor || !sourceNote || translatedLanguage === bcp47 || failedLanguage === bcp47;
  const translationFailed = fromDoctor && !!sourceNote && failedLanguage === bcp47;
  const isTranslating = fromDoctor && !!sourceNote && !replyReady;
  const displayedNote = isTranslating
    ? EMPTY_NOTE
    : (fromDoctor && sourceNote ? note : EMPTY_NOTE);
  const sections = useMemo(() => SECTIONS.filter((section) => displayedNote[section.key]), [displayedNote]);
  const activeVoiceLanguage = fromDoctor ? voiceLanguage : bcp47;
  const voiceLanguageName = (languages.find((item) => item.bcp47 === activeVoiceLanguage) || languages.find((item) => item.code === activeVoiceLanguage.split('-')[0]))?.nativeLabel || activeVoiceLanguage;

  const playReply = useCallback(() => {
    if (!replyReady) return;
    cancelReply();
    const requestId = speechRequestRef.current;
    setVoiceError(false);
    setPlaying(true);
    const speechLabel = (key) => translationFailed
      ? (SECTION_LABELS[key][activeVoiceLanguage.split('-')[0]] || SECTION_LABELS[key].en)
      : label(key);
    const fullText = sections.map((section) => speechLabel(section.key) + ': ' + displayedNote[section.key]).join('. ');
    createReplyAudio(fullText, activeVoiceLanguage).then(async (blob) => {
      if (requestId !== speechRequestRef.current) return;
      const audioUrl = URL.createObjectURL(blob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      replyAudioRef.current = audio;
      audio.onended = () => {
        if (requestId !== speechRequestRef.current) return;
        setPlaying(false);
        if (playTimerRef.current) clearTimeout(playTimerRef.current);
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        replyAudioRef.current = null;
      };
      await audio.play();
    }).catch(() => {
      if (requestId !== speechRequestRef.current) return;
      replyAudioRef.current?.pause();
      replyAudioRef.current = null;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setVoiceError(true);
      speakWithBrowser(fullText, activeVoiceLanguage);
    });
    const estimatedMs = (fullText.split(/\s+/).length / 2.0) * 1000 + 1000;
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => setPlaying(false), Math.max(3000, estimatedMs));
  }, [sections, label, displayedNote, speakWithBrowser, activeVoiceLanguage, cancelReply, replyReady, translationFailed]);

  const togglePlay = () => {
    if (playing) {
      cancelReply();
      setPlaying(false);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    } else {
      playReply();
    }
  };

  useEffect(() => {
    if (!replyReady) return undefined;
    const allowed = typeof navigator === 'undefined' || navigator.userActivation?.hasBeenActive !== false;
    const autoPlayTimer = allowed ? setTimeout(() => playReply(), 900) : null;
    return () => {
      if (autoPlayTimer) clearTimeout(autoPlayTimer);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      cancelReply();
    };
  }, [language, displayedNote, replyReady, playReply, cancelReply]);

  const saveNote = async () => {
    const symptomId = session.getActiveSymptomId();
    try {
      await api.post('/prescriptions', {
        symptom_id: symptomId,
        patient_email: session.getPatient()?.email || '',
        medicines: displayedNote.medicines || '',
        tests: displayedNote.tests || '',
        advice: displayedNote.advice || '',
        language: language,
      });
    } catch {
      // Keep local save confirmation even when backend is temporarily unavailable.
    }
    setSaved(true);
  };
  const goHome = () => { session.clearPending(); session.clearActiveSymptomId(); navigate('/'); };

  return (
    <div className="pd pd--reply-page-scroll">
      <div className="pd-body">
        <PatientSidebar />
        <main className="pd-main">
          <div className="pd-progress"><ProgressDots step={5} t={t} /></div>
          <section className="pd-card reply-box">
            <div className="reply-head">
              <span className="pd-card__avatar"><Stethoscope size={34} strokeWidth={2} /></span>
              <div>
                <h1 className="pd-card__title">{t('doctorRepliedTitle')}</h1>
                <p className="pd-card__sub">{t('doctorsNote')}</p>
                {doctorInfo.name && <p className="reply-head__doctor">{doctorInfo.name}</p>}
                <svg className="pd-card__wave" viewBox="0 0 150 14" aria-hidden="true">
                  <path d="M2 9 C30 2 60 2 85 8 C105 12 128 8 148 4" fill="none" stroke="#86c9ac" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="reply-doctor-banner">
              <div className="reply-doctor-avatar" aria-hidden="true"><Stethoscope size={20} /></div>
              <div className="reply-doctor-details">
                {doctorInfo.name && <p className="reply-doctor-name">{doctorInfo.name}</p>}
                {doctorInfo.specialty && <p className="reply-doctor-spec">{doctorInfo.specialty}</p>}
              </div>
            </div>
            <div className="reply-audio-hub">
              <button type="button" onClick={togglePlay} disabled={!replyReady}
                className={'reply-play-btn ' + (playing ? 'is-playing' : '')}
                aria-label={playing ? t('playingReply') : t('playReply')}>
                {playing ? <Pause size={22} /> : <Play size={22} className="play-icon-offset" />}
                <span>{playing ? t('playingReply') : t('playReply')}</span>
              </button>
              {replyReady && <span className="reply-lang-tag">{t('voiceInLanguage').replace('{language}', voiceLanguageName)}</span>}
            </div>
            {voiceError && <p role="status" className="reply-translation-status">{t('voiceServiceFallback').replace('{language}', voiceLanguageName)}</p>}
            {isTranslating && <p role="status" className="reply-translation-status">{t('replyTranslationLoading')}</p>}
            {translationFailed && <p role="alert" className="reply-translation-status">{t('replyTranslationFallback').replace('{language}', voiceLanguageName)}</p>}
            <div className="reply-sections-list">
              {!fromDoctor && replyMissing && (
                <div className="reply-section-card">
                  <p className="reply-section-text">Doctor reply is not ready yet. Please check again from the link in your email.</p>
                </div>
              )}
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.key} className="reply-section-card">
                    <div className="reply-section-header">
                      <Icon size={16} className="reply-section-icon" />
                      <span className="reply-section-title">{label(section.key)}</span>
                    </div>
                    <p className="reply-section-text">{displayedNote[section.key]}</p>
                  </div>
                );
              })}
            </div>
            <div className="reply-actions" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', width: '100%' }}>
              <button type="button" onClick={saveNote} disabled={saved} className={'reply-save-btn ' + (saved ? 'is-saved' : '')} style={{ flex: 1 }}>
                {saved ? <><CheckCircle2 size={16} /> {t('prescriptionSaved')}</> : <><Bookmark size={16} /> {t('savePrescription')}</>}
              </button>
              <button type="button" onClick={goHome} className="pd-btn pd-btn--primary reply-home-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
                {t('backToHome')} <ArrowRight size={18} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
