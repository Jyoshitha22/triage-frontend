// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Stethoscope, CheckCircle2, Circle, ArrowRight, Bell, BellRing } from 'lucide-react';
// import NavShell from '../components/NavShell';
// import Card from '../components/Card';
// import Waveform from '../components/Waveform';
// import { useLanguage } from '../context/LanguageContext';
// import api from '../utils/api';
// import session from '../utils/session';
// import heartIcon from '../assets/brand-heart.png';
// import './WaitingForDoctor.css';

// const STEPS = [
//   { labelKey: 'stepSymptomsReceived', descKey: 'stepSymptomsReceivedDesc' },
//   { labelKey: 'stepDoctorReviewing', descKey: 'stepDoctorReviewingDesc' },
//   { labelKey: 'stepDoctorReply', descKey: 'stepDoctorReplyDesc' },
// ];

// const WAIT_SECONDS = 360;
// const POLL_MS = 5000;
// const canNotify = typeof window !== 'undefined' && 'Notification' in window;

// function progressFromRecord(rec) {
//   if (!rec) return 1;
//   const status = String(rec.status || '').toLowerCase();
//   if (status === 'replied' || (rec.replies && rec.replies.length > 0)) return 3;
//   if (['reviewed', 'in_review_done', 'replying', 'writing'].includes(status)) return 2;
//   return 1;
// }

// function loadEndTime() {
//   const pending = session.getPending() || {};
//   if (pending.endAt) return pending.endAt;
//   const endAt = Date.now() + WAIT_SECONDS * 1000;
//   session.savePending({ ...pending, endAt });
//   return endAt;
// }

// function simulatedProgress(endAt) {
//   const left = endAt - Date.now();
//   return left <= 0 ? 3 : left <= (WAIT_SECONDS * 1000) / 2 ? 2 : 1;
// }

// export default function WaitingForDoctor() {
//   const navigate = useNavigate();
//   const { language, t } = useLanguage();
//   const isTe = language === 'te';
//   const isHi = language === 'hi';

//   const endAt = useRef(null);
//   if (endAt.current === null) endAt.current = loadEndTime();
//   const [eta, setEta] = useState(() => Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
//   const [progress, setProgress] = useState(() => (session.getActiveSymptomId() ? 1 : simulatedProgress(endAt.current)));

//   // Track system notification permission
//   const [permission, setPermission] = useState(canNotify ? Notification.permission : 'unsupported');
//   const notified = useRef(Boolean(session.getPending()?.notified));
//   const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');

//   const replied = progress >= 3;
//   const goToReply = useCallback(() => navigate('/reply'), [navigate]);

//   const getBannerText = () => {
//     if (isTe) return 'డాక్టర్ సమాధానం ఇచ్చారు. ఇప్పుడే చూడండి.';
//     if (isHi) return 'डॉक्टर ने जवाब दे दिया है। अभी देखें।';
//     return 'Doctor has replied. Check now.';
//   };

//   const getButtonText = () => {
//     if (isTe) return 'సమాధానం చూడండి';
//     if (isHi) return 'जवाब देखें';
//     return 'View reply';
//   };

//   const getEtaLabel = () => {
//     if (replied) {
//       if (isTe) return 'డాక్టర్ సమాధానం ఇచ్చారు';
//       if (isHi) return 'डॉक्टर ने जवाब दिया है';
//       return 'doctor has replied';
//     }
//     if (isTe) return 'అంచనా వేసిన సమయం';
//     if (isHi) return 'अनुमानित प्रतीक्षा समय';
//     return 'estimated wait';
//   };

//   const getBrowserTitle = () => {
//     if (isTe) return '✅ డాక్టర్ సమాధానం ఇచ్చారు – Triage';
//     if (isHi) return '✅ डॉक्टर ने जवाब दिया है – Triage';
//     return '✅ Doctor has replied – Triage';
//   };

//   /* ---- 1. Countdown ---- */
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setEta(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   /* ---- 2. Status Poll ---- */
//   useEffect(() => {
//     const symptomId = session.getActiveSymptomId();
//     let stop = false;

//     if (symptomId) {
//       const check = async () => {
//         try {
//           const rec = await api.get(`/symptom-records/${symptomId}`);
//           if (!stop) setProgress((p) => Math.max(p, progressFromRecord(rec)));
//         } catch {
//           // offline backup path
//         }
//       };
//       check();
//       const poll = setInterval(check, POLL_MS);
//       return () => { stop = true; clearInterval(poll); };
//     }

//     const sim = setInterval(() => {
//       setProgress((p) => Math.max(p, simulatedProgress(endAt.current)));
//     }, 500);
//     return () => { stop = true; clearInterval(sim); };
//   }, []);

//   /* ---- 3. Native Notifications ---- */
//   useEffect(() => {
//     if (!replied) return;
//     document.title = getBrowserTitle();
//     if (notified.current) return;
//     notified.current = true;
//     session.savePending({ ...(session.getPending() || {}), notified: true });
//     if (canNotify && Notification.permission === 'granted') {
//       try {
//         new Notification(isTe ? 'డాక్టర్ సమాధానం ఇచ్చారు' : isHi ? 'डॉक्टर ने जवाब दिया है' : 'Doctor has replied', {
//           body: getBannerText(),
//           icon: heartIcon,
//           tag: 'triage-doctor-replied',
//           requireInteraction: true,
//         }).onclick = () => { window.focus(); goToReply(); };
//       } catch {
//         // sandbox edge cases handling
//       }
//     }
//   }, [replied, goToReply, language]);

//   useEffect(() => {
//     const title = originalTitle.current;
//     return () => { document.title = title; };
//   }, []);

//   // Request browser prompt permissions manually
//   const askPermission = async () => {
//     if (!canNotify) return;
//     const res = await Notification.requestPermission();
//     setPermission(res);
//   };

//   const mm = String(Math.floor(eta / 60)).padStart(2, '0');
//   const ss = String(eta % 60).padStart(2, '0');

//   return (
//     <NavShell step={4}>
//       <div className="waiting-box">
//         {/* Headings center aligned via waiting-box context wrapper */}
//         <h1 className="waiting__title" style={{ textAlign: 'center', margin: '0 0 4px' }}>
//           {t('waitingTitle')}
//         </h1>
//         <p className="waiting__subtitle" style={{ textAlign: 'center', margin: '0 auto 20px', color: '#6f9a8b' }}>
//           {t('waitingSubtitle')}
//         </p>

//         <Card className="waiting-timer-card">
//           <div className="waiting-pulse-area">
//             <Waveform mode={replied ? 'idle' : 'pulse'} className="waiting-wave-graphic" />
//           </div>

//           <div className="waiting-countdown">
//             <Stethoscope className="waiting-clock-icon" size={24} />
//             <p className="waiting-time">{replied ? '00:00' : `${mm}:${ss}`}</p>
//           </div>
//           <p className="waiting-time-label">{getEtaLabel()}</p>

//           {/* Interactive Request Action Button Row */}
//           {canNotify && permission === 'default' && (
//             <button type="button" onClick={askPermission} className="waiting-dev-btn" style={{ borderStyle: 'solid', marginTop: '12px' }}>
//               <Bell size={14} /> {isTe ? 'నోటిఫికేషన్లను అనుమతించండి' : isHi ? 'सूचनाएं सक्षम करें' : 'Notify Me When Ready'}
//             </button>
//           )}

//           {canNotify && permission === 'granted' && (
//             <div className="waiting-safe-note" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e785e', fontWeight: 600 }}>
//               <BellRing size={14} /> {isTe ? 'నోటిఫికేషన్లు సక్రియం చేయబడ్డాయి' : isHi ? 'सूचनाएं सक्रिय हैं' : 'Alerts Active! You can safely leave this tab.'}
//             </div>
//           )}

//           <ul className="waiting-steps-list" style={{ width: '100%', marginTop: '20px' }}>
//             {STEPS.map((s, i) => {
//               const done = i < progress;
//               const active = !done && i === progress;
//               return (
//                 <li key={s.labelKey} className={`waiting-step-row ${done ? 'is-done' : active ? 'is-active' : ''}`}>
//                   {done ? (
//                     <CheckCircle2 size={18} className="waiting-step-bullet step-icon-done" />
//                   ) : (
//                     <Circle size={18} className={`waiting-step-bullet ${active ? 'step-icon-active' : 'step-icon-pending'}`} />
//                   )}
//                   <div className="waiting-step-content">
//                     <p className="waiting-step-title" style={{ fontWeight: active || done ? 700 : 500 }}>
//                       {t(s.labelKey)}
//                     </p>
//                     <p className="waiting-step-desc">{t(s.descKey)}</p>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//         </Card>

//         {replied && (
//           <div
//             role="alert"
//             style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
//               marginTop: 16, padding: '12px 16px', borderRadius: 14,
//               background: '#dff1e6', border: '1.5px solid #2f9e78', color: '#0f4a3a', fontWeight: 600,
//             }}
//           >
//             <span>{getBannerText()}</span>
//             <button
//               type="button"
//               onClick={goToReply}
//               style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', borderRadius: 999, cursor: 'pointer', background: '#1e785e', color: '#fff', font: 'inherit', fontWeight: 600 }}
//             >
//               {getButtonText()} <ArrowRight size={16} />
//             </button>
//           </div>
//         )}
//       </div>
//     </NavShell>
//   );
// }
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, CheckCircle2, Circle, ArrowRight, Bell } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import session from '../utils/session';
import heartIcon from '../assets/brand-heart.png';
import './WaitingForDoctor.css';

const STEPS = [
  { labelKey: 'stepSymptomsReceived', descKey: 'stepSymptomsReceivedDesc' },
  { labelKey: 'stepDoctorReviewing', descKey: 'stepDoctorReviewingDesc' },
  { labelKey: 'stepDoctorReply', descKey: 'stepDoctorReplyDesc' },
];

const WAIT_SECONDS = 360;
const POLL_MS = 5000;
const canNotify = typeof window !== 'undefined' && 'Notification' in window;

function progressFromRecord(rec) {
  if (!rec) return 1;
  const status = String(rec.status || '').toLowerCase();
  if (status === 'replied' || (rec.replies && rec.replies.length > 0)) return 3;
  if (['reviewed', 'in_review_done', 'replying', 'writing'].includes(status)) return 2;
  return 1;
}

function loadEndTime() {
  const pending = session.getPending() || {};
  if (pending.endAt) return pending.endAt;
  const endAt = Date.now() + WAIT_SECONDS * 1000;
  session.savePending({ ...pending, endAt });
  return endAt;
}

export default function WaitingForDoctor() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isTe = language === 'te';
  const isHi = language === 'hi';

  const symptomId = session.getActiveSymptomId();
  const patientEmail = session.getPatient()?.email || '';

  // --- SECURITY SHIELD ROUTING REDIRECT ---
  // If there is no active submission found, kick user back to home/recording screen instantly
  useEffect(() => {
    if (!symptomId) {
      navigate('/', { replace: true });
    }
  }, [symptomId, navigate]);

  const endAt = useRef(null);
  if (endAt.current === null && symptomId) endAt.current = loadEndTime();

  const [eta, setEta] = useState(() => {
    if (!endAt.current) return WAIT_SECONDS;
    return Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
  });

  const [progress, setProgress] = useState(() => progressFromRecord(session.getSymptomRecord(symptomId)));
  const [notifyOpen, setNotifyOpen] = useState(false);
  const notified = useRef(Boolean(session.getPending()?.notified));
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');

  const replied = progress >= 3;
  const goToReply = useCallback(() => navigate('/reply'), [navigate]);

  const getBannerText = () => {
    if (isTe) return 'డాక్టర్ సమాధానం ఇచ్చారు. ఇప్పుడే చూడండి.';
    if (isHi) return 'डॉक्टर ने जवाब दे दिया है। अभी देखें।';
    return 'Doctor has replied. Check now.';
  };

  const getButtonText = () => {
    if (isTe) return 'సమాధానం చూడండి';
    if (isHi) return 'जवाब देखें';
    return 'View reply';
  };

  const getEtaLabel = () => {
    if (replied) {
      if (isTe) return 'డాక్టర్ సమాధానం ఇచ్చారు';
      if (isHi) return 'डॉक्टर ने जवाब दिया है';
      return 'doctor has replied';
    }
    if (isTe) return 'అంచనా వేసిన సమయం';
    if (isHi) return 'अनुमानित प्रतीक्षा समय';
    return 'estimated wait';
  };

  const getBrowserTitle = () => {
    if (isTe) return '✅ డాక్టర్ సమాధానం ఇచ్చారు – Triage';
    if (isHi) return '✅ डॉक्टर ने जवाब दिया है – Triage';
    return '✅ Doctor has replied – Triage';
  };

  /* ---- 1. Countdown ---- */
  useEffect(() => {
    if (!symptomId) return;
    const timer = setInterval(() => {
      setEta(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [symptomId]);

  /* ---- 2. Dynamic Real Status Poll ONLY ---- */
  useEffect(() => {
    if (!symptomId) return;

    let stop = false;
    const check = async () => {
      try {
        const rec = await api.get(`/symptom-records/${symptomId}`);
        if (!stop) {
          const nextProgress = progressFromRecord(rec);
          setProgress((p) => Math.max(p, nextProgress));
        }
      } catch {
        const localRecord = session.getSymptomRecord(symptomId);
        if (!stop && localRecord) {
          setProgress((p) => Math.max(p, progressFromRecord(localRecord)));
        }
      }
    };

    check();
    const poll = setInterval(check, POLL_MS);
    return () => { stop = true; clearInterval(poll); };
  }, [symptomId]);

  /* ---- 3. Native Notifications ---- */
  useEffect(() => {
    if (!replied || !symptomId) return;
    document.title = getBrowserTitle();
    if (notified.current) return;
    notified.current = true;
    session.savePending({ ...(session.getPending() || {}), notified: true });
    if (canNotify && Notification.permission === 'granted') {
      try {
        new Notification(isTe ? 'డాక్టర్ సమాధానం ఇచ్చారు' : isHi ? 'डॉक्टर ने जवाब दिया है' : 'Doctor has replied', {
          body: getBannerText(),
          icon: heartIcon,
          tag: 'triage-doctor-replied',
          requireInteraction: true,
        }).onclick = () => { window.focus(); goToReply(); };
      } catch {
        // Safe background context wrap exception handling
      }
    }
  }, [replied, goToReply, language, symptomId]);

  useEffect(() => {
    const title = originalTitle.current;
    return () => { document.title = title; };
  }, []);

  const addSampleReply = () => {
    const reply = session.addDoctorReply(symptomId, [{
      response_type: 'medicine',
      response_text: t('sampleReplyMedicine'),
    }, {
      response_type: 'advice',
      response_text: t('sampleReplyAdvice'),
    }], 'demo-doctor');
    if (!reply) return;
    navigate('/reply');
  };

  // Safe escape shell render to avoid blank calculations on immediate redirect
  if (!symptomId) return null;

  const mm = String(Math.floor(eta / 60)).padStart(2, '0');
  const ss = String(eta % 60).padStart(2, '0');

  return (
    <NavShell step={4}>
      <div className="waiting-box">
        <h1 className="waiting__title" style={{ textAlign: 'center', margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: '#0f4a3a' }}>
          {t('waitingTitle')}
        </h1>
        <p className="waiting__subtitle" style={{ textAlign: 'center', margin: '0 auto 24px', color: '#6f9a8b', fontSize: '15px' }}>
          {t('waitingSubtitle')}
        </p>

        <Card className="waiting-timer-card">
          <div className="waiting-pulse-area">
            <Waveform mode={replied ? 'idle' : 'pulse'} className="waiting-wave-graphic" />
          </div>

          <div className="waiting-countdown">
            <Stethoscope className="waiting-clock-icon" size={24} />
            <p className="waiting-time">{replied ? '00:00' : `${mm}:${ss}`}</p>
          </div>
          <p className="waiting-time-label">{getEtaLabel()}</p>

          <ul className="waiting-steps-list" style={{ width: '100%', marginTop: '24px' }}>
            {STEPS.map((s, i) => {
              const done = i < progress;
              const active = !done && i === progress;
              return (
                <li key={s.labelKey} className={`waiting-step-row ${done ? 'is-done' : active ? 'is-active' : ''}`}>
                  {done ? (
                    <CheckCircle2 size={18} className="waiting-step-bullet step-icon-done" />
                  ) : (
                    <Circle size={18} className={`waiting-step-bullet ${active ? 'step-icon-active' : 'step-icon-pending'}`} />
                  )}
                  <div className="waiting-step-content">
                    <p className="waiting-step-title" style={{ fontWeight: active || done ? 700 : 500 }}>
                      {t(s.labelKey)}
                    </p>
                    <p className="waiting-step-desc">{t(s.descKey)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="waiting-actions">
          <button type="button" onClick={() => setNotifyOpen(true)} className="waiting-dev-btn">
            <Bell size={16} /> {t('notifyPatient')}
          </button>
          {!replied && (
            <button type="button" onClick={addSampleReply} className="waiting-dev-btn waiting-dev-btn--secondary">
              {t('doctorHasReplied')}
            </button>
          )}
        </div>

        {replied && (
          <div className="waiting-reply-notification" role="alert">
            <div>
              <span style={{ fontSize: '14px' }}>{getBannerText()}</span>
            </div>
            <button
              type="button"
              onClick={goToReply}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: 'none', borderRadius: 999, cursor: 'pointer', background: '#1e785e', color: '#fff', font: 'inherit', fontWeight: 700, transition: 'all 0.2s' }}
            >
              {getButtonText()} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {notifyOpen && createPortal((
          <div className="waiting-dialog-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setNotifyOpen(false);
          }}>
            <section className="waiting-dialog" role="dialog" aria-modal="true" aria-labelledby="notification-title">
              <h2 id="notification-title">{t('notificationPreviewTitle')}</h2>
              <p>{t('notificationPreviewSent')}</p>
              <strong>{patientEmail || t('emailNotAvailable')}</strong>
              <button type="button" className="waiting-dev-btn" onClick={() => setNotifyOpen(false)}>
                {t('close')}
              </button>
            </section>
          </div>
        ), document.body)}
      </div>
    </NavShell>
  );
}
