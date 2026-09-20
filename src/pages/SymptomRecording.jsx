import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Volume2, AlertCircle, Keyboard } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import { useLanguage } from '../context/LanguageContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useAutoAdvance from '../hooks/useAutoAdvance';
import { isRequired } from '../utils/validators';
import './SymptomRecording.css';

const FOLLOWUP_KEYS = ['followupQ1', 'followupQ2'];
const SEND_DELAY_MS = 2200;
// How long to wait after the patient goes quiet before treating the
// description as finished — long enough for a natural mid-sentence
// pause, short enough that it doesn't feel like it's hanging.
const SILENCE_TIMEOUT_MS = 2800;

/**
 * The mic is ~90% of this screen on purpose, but typing is always one
 * tap away for anyone who'd rather not talk. What the patient says is
 * captured live by the browser's speech recognition (real ASR, not
 * sample text) — the transcript fills in as they talk, and recording
 * stops on its own once they've gone quiet for a couple of seconds, no
 * "stop" tap required (tapping still works for anyone who wants to end
 * early). Once the main symptom is captured, follow-up questions are
 * asked aloud one at a time and each answer — spoken or typed — auto-
 * advances to the next.
 */
export default function SymptomRecording() {
  const navigate = useNavigate();
  const { t, bcp47, speakPrompt } = useLanguage();
  const [inputMode, setInputMode] = useState('voice'); // voice | type
  const [mainStatus, setMainStatus] = useState('idle'); // idle | recording | done
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [followupIndex, setFollowupIndex] = useState(-1);
  const [answeredLog, setAnsweredLog] = useState([]);
  const [sending, setSending] = useState(false);
  const timerRef = useRef(null);

  const { supported, listening, interimTranscript, error, start, stop } = useSpeechRecognition({
    lang: bcp47,
    continuous: true,
    silenceTimeoutMs: SILENCE_TIMEOUT_MS,
  });

  useEffect(() => {
    if (mainStatus === 'recording') timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [mainStatus]);

  // Ask the patient to begin, aloud, once the screen loads.
  useEffect(() => { speakPrompt('symptomSubtitle'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Typed description auto-advances a beat after the patient stops
  // typing — same hands-free pattern as voice.
  useAutoAdvance(transcript, inputMode === 'type' && mainStatus === 'idle' && isRequired(transcript), () => {
    setMainStatus('done');
    setFollowupIndex(0);
  }, { delay: 1500 });

  useEffect(() => {
    if (followupIndex !== FOLLOWUP_KEYS.length || mainStatus !== 'done') return;
    setSending(true);
    const t2 = setTimeout(() => navigate('/waiting', { state: { transcript, followUps: answeredLog } }), SEND_DELAY_MS);
    return () => clearTimeout(t2);
  }, [followupIndex, mainStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMain = () => {
    if (listening) {
      stop();
      return;
    }
    setSeconds(0);
    setTranscript('');
    setMainStatus('recording');
    start((finalText) => {
      if (!finalText) { setMainStatus('idle'); return; }
      setTranscript(finalText);
      setMainStatus('done');
      setFollowupIndex(0);
    });
  };

  const restart = () => {
    setMainStatus('idle');
    setTranscript('');
    setFollowupIndex(-1);
    setAnsweredLog([]);
    setSending(false);
  };

  const handleTypedKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && isRequired(transcript)) {
      e.preventDefault();
      setMainStatus('done');
      setFollowupIndex(0);
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const inFollowups = mainStatus === 'done' && followupIndex >= 0 && followupIndex < FOLLOWUP_KEYS.length;
  const showingCapture = mainStatus === 'idle' || mainStatus === 'recording';

  return (
    <NavShell step={3} onBack={() => navigate('/basic-details')}>
      <div className="symptom-recording">
        <div className="symptom-recording__header-row">
          <h1 className="symptom-recording__title">
            {showingCapture ? t('symptomTitleIdle') : inFollowups ? t('symptomTitleFollowup') : t('symptomTitleSending')}
          </h1>
          {showingCapture && (
            <button onClick={() => setInputMode((m) => (m === 'voice' ? 'type' : 'voice'))} className="symptom-recording__mode-toggle">
              {inputMode === 'voice' ? (<><Keyboard size={13} /> {t('typeInstead')}</>) : (<><Mic size={13} /> {t('useVoiceInstead')}</>)}
            </button>
          )}
        </div>
        {showingCapture && <p className="symptom-recording__subtitle">{t('symptomSubtitle')}</p>}

        <Card className="symptom-recording__card">
          {showingCapture && inputMode === 'type' && (
            <textarea
              autoFocus
              rows={5}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={handleTypedKeyDown}
              placeholder="I have a headache and mild fever since yesterday…"
              className="symptom-recording__textarea"
            />
          )}

          {showingCapture && inputMode === 'voice' && (
            <>
              <button onClick={toggleMain} className={`symptom-recording__mic ${listening ? 'symptom-recording__mic--active' : ''}`}>
                {listening ? <Square size={32} className="symptom-recording__mic-icon-stop" /> : <Mic size={36} className="symptom-recording__mic-icon" />}
              </button>
              <p className="symptom-recording__timer">{listening ? `${mm}:${ss} · ${t('recording')}` : t('tapToSpeak')}</p>
              <Waveform mode={listening ? 'recording' : 'idle'} className="symptom-recording__wave" />

              {listening && interimTranscript && (
                <p className="symptom-recording__live-caption">{interimTranscript}</p>
              )}

              {!supported && (
                <p className="symptom-recording__hint"><AlertCircle size={14} /> {t('micNotSupported')}</p>
              )}
              {error === 'not-allowed' && (
                <p className="symptom-recording__hint"><AlertCircle size={14} /> {t('micDenied')}</p>
              )}
            </>
          )}

          {mainStatus !== 'idle' && mainStatus !== 'recording' && (
            <div className="symptom-recording__transcript-area">
              <div className="symptom-recording__transcript"><p>{transcript}</p></div>

              {answeredLog.map((item, idx) => <QABubble key={idx} q={item.q} a={item.a} />)}

              {inFollowups && (
                <FollowUpQA
                  key={followupIndex}
                  questionKey={FOLLOWUP_KEYS[followupIndex]}
                  onDone={(answer) => {
                    setAnsweredLog((log) => [...log, { q: t(FOLLOWUP_KEYS[followupIndex]), a: answer }]);
                    setFollowupIndex((idx) => idx + 1);
                  }}
                />
              )}

              {sending && (
                <div className="symptom-recording__sending">
                  <div className="symptom-recording__progress-track"><div className="symptom-recording__progress-fill" /></div>
                  <button onClick={restart} className="symptom-recording__add-more">{t('addMore')}</button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </NavShell>
  );
}

function QABubble({ q, a }) {
  return (
    <div className="qa-bubble">
      <p className="qa-bubble__q"><Volume2 size={14} /> {q}</p>
      <p className="qa-bubble__a">{a}</p>
    </div>
  );
}

function FollowUpQA({ questionKey, onDone }) {
  const { t, bcp47, speakPrompt } = useLanguage();
  const [inputMode, setInputMode] = useState('voice'); // voice | type
  const [stage, setStage] = useState('idle'); // idle | recording | done
  const [answer, setAnswer] = useState('');
  const { supported, listening, interimTranscript, start, stop } = useSpeechRecognition({
    lang: bcp47,
    continuous: false,
  });

  // Ask this follow-up question aloud as soon as it appears.
  useEffect(() => { speakPrompt(questionKey); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Typed answers auto-advance a beat after the patient stops typing.
  useAutoAdvance(answer, inputMode === 'type' && stage === 'idle' && isRequired(answer), () => onDone(answer), { delay: 1300 });

  const toggleMic = () => {
    if (listening) { stop(); return; }
    setStage('recording');
    start((finalText) => {
      if (!finalText) { setStage('idle'); return; }
      setAnswer(finalText);
      setStage('done');
      setTimeout(() => onDone(finalText), 700);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isRequired(answer)) onDone(answer);
  };

  return (
    <div className="followup">
      <div className="followup__header-row">
        <p className="followup__q"><Volume2 size={16} className="followup__q-icon" /> {t(questionKey)}</p>
        {stage === 'idle' && (
          <button onClick={() => setInputMode((m) => (m === 'voice' ? 'type' : 'voice'))} className="followup__mode-toggle">
            {inputMode === 'voice' ? <Keyboard size={13} /> : <Mic size={13} />}
          </button>
        )}
      </div>

      {inputMode === 'type' && stage !== 'done' ? (
        <input
          autoFocus
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer…"
          className="followup__input"
        />
      ) : (
        <>
          {stage === 'idle' && supported && (
            <button onClick={toggleMic} className="followup__mic"><Mic size={16} /></button>
          )}
          {stage === 'recording' && (
            <button onClick={toggleMic} className="followup__mic followup__mic--active"><Square size={16} /></button>
          )}
          {stage === 'recording' && interimTranscript && <p className="followup__answer followup__answer--live">{interimTranscript}</p>}
          {stage === 'done' && <p className="followup__answer">{answer}</p>}
          {!supported && stage === 'idle' && (
            <p className="symptom-recording__hint"><AlertCircle size={14} /> {t('micNotSupported')}</p>
          )}
        </>
      )}
    </div>
  );
}
