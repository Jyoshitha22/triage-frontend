import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Volume2 } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import './SymptomRecording.css';

const MAIN_TRANSCRIPT = "I've had a headache and mild fever since yesterday evening. It gets worse in the afternoon.";
const FOLLOWUPS = [
  { q: 'Since how many days has this been going on?', sample: 'Since yesterday evening, so about a day.' },
  { q: 'Have you taken any medicine for it?', sample: "I took a paracetamol this morning, but it hasn't helped much." },
];
const SEND_DELAY_MS = 2200;

/**
 * The mic is ~90% of this screen on purpose. Once the main symptom is
 * captured, follow-up questions appear one at a time and each answer
 * auto-advances to the next — no button to find and tap in between.
 */
export default function SymptomRecording() {
  const navigate = useNavigate();
  const [mainStatus, setMainStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [followupIndex, setFollowupIndex] = useState(-1);
  const [answeredLog, setAnsweredLog] = useState([]);
  const [sending, setSending] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (mainStatus === 'recording') timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [mainStatus]);

  useEffect(() => {
    if (mainStatus !== 'typing') return;
    let i = 0;
    const t = setInterval(() => {
      setTranscript(MAIN_TRANSCRIPT.slice(0, i));
      i++;
      if (i > MAIN_TRANSCRIPT.length) { clearInterval(t); setMainStatus('done'); setFollowupIndex(0); }
    }, 18);
    return () => clearInterval(t);
  }, [mainStatus]);

  useEffect(() => {
    if (followupIndex !== FOLLOWUPS.length || mainStatus !== 'done') return;
    setSending(true);
    const t = setTimeout(() => navigate('/waiting', { state: { transcript, followUps: answeredLog } }), SEND_DELAY_MS);
    return () => clearTimeout(t);
  }, [followupIndex, mainStatus]); // eslint-disable-line

  const toggleMain = () => {
    if (mainStatus === 'recording') setMainStatus('typing');
    else { setSeconds(0); setTranscript(''); setMainStatus('recording'); }
  };

  const restart = () => { setMainStatus('idle'); setTranscript(''); setFollowupIndex(-1); setAnsweredLog([]); setSending(false); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const inFollowups = mainStatus === 'done' && followupIndex >= 0 && followupIndex < FOLLOWUPS.length;

  return (
    <NavShell step={3} onBack={() => navigate('/basic-details')}>
      <div className="symptom-recording">
        <h1 className="symptom-recording__title">
          {mainStatus === 'idle' || mainStatus === 'recording' ? "Describe what you're feeling" : inFollowups ? 'Just a couple more things' : 'Got it — sending to your doctor'}
        </h1>
        {(mainStatus === 'idle' || mainStatus === 'recording') && (
          <p className="symptom-recording__subtitle">Speak naturally, in your own words.</p>
        )}

        <Card className="symptom-recording__card">
          {(mainStatus === 'idle' || mainStatus === 'recording') && (
            <>
              <button onClick={toggleMain} className={`symptom-recording__mic ${mainStatus === 'recording' ? 'symptom-recording__mic--active' : ''}`}>
                {mainStatus === 'recording' ? <Square size={32} className="symptom-recording__mic-icon-stop" /> : <Mic size={36} className="symptom-recording__mic-icon" />}
              </button>
              <p className="symptom-recording__timer">{mainStatus === 'recording' ? `${mm}:${ss} · recording` : 'Tap to speak'}</p>
              <Waveform mode={mainStatus === 'recording' ? 'recording' : 'idle'} className="symptom-recording__wave" />
            </>
          )}

          {mainStatus !== 'idle' && mainStatus !== 'recording' && (
            <div className="symptom-recording__transcript-area">
              <div className="symptom-recording__transcript"><p>{transcript}</p></div>

              {answeredLog.map((item, idx) => <QABubble key={idx} q={item.q} a={item.a} />)}

              {inFollowups && (
                <FollowUpQA
                  key={followupIndex}
                  question={FOLLOWUPS[followupIndex].q}
                  sample={FOLLOWUPS[followupIndex].sample}
                  onDone={(answer) => {
                    setAnsweredLog((log) => [...log, { q: FOLLOWUPS[followupIndex].q, a: answer }]);
                    setFollowupIndex((idx) => idx + 1);
                  }}
                />
              )}

              {sending && (
                <div className="symptom-recording__sending">
                  <div className="symptom-recording__progress-track"><div className="symptom-recording__progress-fill" /></div>
                  <button onClick={restart} className="symptom-recording__add-more">Wait, let me add more</button>
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

function FollowUpQA({ question, sample, onDone }) {
  const [stage, setStage] = useState('idle');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (stage !== 'typing') return;
    let i = 0;
    const t = setInterval(() => {
      setAnswer(sample.slice(0, i));
      i++;
      if (i > sample.length) { clearInterval(t); setTimeout(() => onDone(sample), 700); }
    }, 16);
    return () => clearInterval(t);
  }, [stage]); // eslint-disable-line

  return (
    <div className="followup">
      <p className="followup__q"><Volume2 size={16} className="followup__q-icon" /> {question}</p>
      {stage === 'idle' && <button onClick={() => setStage('recording')} className="followup__mic"><Mic size={16} /></button>}
      {stage === 'recording' && <button onClick={() => setStage('typing')} className="followup__mic followup__mic--active"><Square size={16} /></button>}
      {stage === 'typing' && <p className="followup__answer">{answer}</p>}
    </div>
  );
}