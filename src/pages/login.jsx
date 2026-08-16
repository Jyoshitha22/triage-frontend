import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck, Volume2, Keyboard, Mic } from 'lucide-react';
import Waveform from '../components/Waveform';
import VoiceField from '../components/VoiceField';
import './login.css';

/**
 * Two small steps — phone, then the OTP that arrives by SMS — each
 * answerable by typing or by voice. First-time only: once a patient is
 * recognized, this screen is skipped on their next visit.
 */
export default function Login() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('phone'); // phone | otp
  const [inputMode, setInputMode] = useState('type'); // type | voice
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const prompt = stage === 'phone' ? 'Please tell us your mobile number.' : 'Please tell us the OTP you received.';

  const submitPhone = () => phone && setStage('otp');
  const submitOtp = () => otp && navigate('/basic-details', { state: { phone, otp } });

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__hero">
          <span className="login__blob login__blob--gold" />
          <span className="login__blob login__blob--glow" />

          <div className="login__hero-copy">
            <span className="login__eyebrow">Voice-first triage</span>
            <h1 className="login__headline">Tell us what's wrong.<br />We'll listen.</h1>
            <p className="login__subcopy">Speak in your own words. A doctor reviews what you share and replies with guidance.</p>
          </div>

          <div className="login__hero-mic">
            <span className="login__mic-badge"><Mic size={32} /></span>
            <div className="login__hero-wave"><Waveform mode="idle" /></div>
          </div>
        </div>

        <div className="login__form">
          <div className="login__form-header">
            <h2 className="login__title">Welcome</h2>
            <button onClick={() => setInputMode((m) => (m === 'type' ? 'voice' : 'type'))} className="login__mode-toggle">
              {inputMode === 'type' ? (<><Mic size={14} /> Use voice instead</>) : (<><Keyboard size={14} /> Type instead</>)}
            </button>
          </div>

          {inputMode === 'voice' && (
            <div className="login__prompt">
              <Volume2 size={16} className="login__prompt-icon" />
              <p>{prompt}</p>
            </div>
          )}

          <label className="login__label">{stage === 'phone' ? 'Phone number' : `OTP sent to ${phone}`}</label>

          {inputMode === 'voice' ? (
            stage === 'phone' ? (
              <VoiceField value={phone} onChange={setPhone} onCaptured={submitPhone} placeholder="98765 43210" type="tel" simulatedValue="98765 43210" />
            ) : (
              <VoiceField value={otp} onChange={setOtp} onCaptured={submitOtp} placeholder="4-digit code" type="tel" simulatedValue="4821" />
            )
          ) : (
            <div className="login__input-wrap">
              <Phone size={16} className="login__input-icon" />
              <input
                type="tel"
                value={stage === 'phone' ? phone : otp}
                onChange={(e) => (stage === 'phone' ? setPhone(e.target.value) : setOtp(e.target.value))}
                placeholder={stage === 'phone' ? '98765 43210' : '4-digit code'}
                className="login__input"
              />
            </div>
          )}

          {inputMode === 'type' && (
            <button onClick={stage === 'phone' ? submitPhone : submitOtp} disabled={stage === 'phone' ? !phone : !otp} className="login__submit">
              {stage === 'phone' ? 'Send OTP' : 'Verify & continue'}
            </button>
          )}

          <div className="login__security"><ShieldCheck size={16} /> Your details are stored securely and shared only with your doctor.</div>
        </div>
      </div>
    </div>
  );
}