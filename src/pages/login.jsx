import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck, Volume2, Keyboard, Mic } from 'lucide-react';
import Waveform from '../components/Waveform';
import VoiceField from '../components/VoiceField';
import LanguagePicker from '../components/LanguagePicker';
import { useLanguage } from '../context/LanguageContext';
import useAutoAdvance from '../hooks/useAutoAdvance';
import './login.css';

/**
 * Two small steps — phone, then the OTP that arrives by SMS — each
 * answerable by typing or by real voice, in whichever language the
 * patient picks. First-time only: once a patient is recognized, this
 * screen is skipped on their next visit.
 */
export default function Login() {
  const navigate = useNavigate();
  const { t, bcp47, speakPrompt } = useLanguage();
  const [stage, setStage] = useState('phone'); // phone | otp
  const [inputMode, setInputMode] = useState('type'); // type | voice
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const promptKey = stage === 'phone' ? 'loginPromptPhone' : 'loginPromptOtp';

  const submitPhone = () => phone && setStage('otp');
  const submitOtp = () => otp && navigate('/basic-details', { state: { phone, otp } });

  // Speak the current question aloud whenever it changes (or voice mode
  // is switched on) — this is the "ask him" part: the patient hears the
  // question in their chosen language, not just reads it.
  useEffect(() => {
    if (inputMode === 'voice') speakPrompt(promptKey);
  }, [inputMode, promptKey, bcp47]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typed answers auto-advance a beat after the patient stops typing, so
  // nobody has to hunt for a button — same as voice already does.
  useAutoAdvance(phone, inputMode === 'type' && stage === 'phone' && !!phone, submitPhone, { delay: 1300 });
  useAutoAdvance(otp, inputMode === 'type' && stage === 'otp' && otp.length >= 4, submitOtp, { delay: 900 });

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (stage === 'phone' && phone) submitPhone();
    if (stage === 'otp' && otp) submitOtp();
  };

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__hero">
          <span className="login__blob login__blob--gold" />
          <span className="login__blob login__blob--glow" />

          <LanguagePicker className="login__language-picker" />

          <div className="login__hero-copy">
            <span className="login__eyebrow">{t('loginEyebrow')}</span>
            <h1 className="login__headline">{t('loginHeadline')}</h1>
            <p className="login__subcopy">{t('loginSubcopy')}</p>
          </div>

          <div className="login__hero-mic">
            <span className="login__mic-badge"><Mic size={32} /></span>
            <div className="login__hero-wave"><Waveform mode="idle" /></div>
          </div>
        </div>

        <div className="login__form">
          <div className="login__form-header">
            <h2 className="login__title">{t('loginTitle')}</h2>
            <button onClick={() => setInputMode((m) => (m === 'type' ? 'voice' : 'type'))} className="login__mode-toggle">
              {inputMode === 'type' ? (<><Mic size={14} /> {t('useVoiceInstead')}</>) : (<><Keyboard size={14} /> {t('typeInstead')}</>)}
            </button>
          </div>

          {inputMode === 'voice' && (
            <div className="login__prompt">
              <Volume2 size={16} className="login__prompt-icon" />
              <p>{t(promptKey)}</p>
            </div>
          )}

          <label className="login__label">{stage === 'phone' ? t('phoneLabel') : `${t('otpLabelPrefix')} ${phone}`}</label>

          {inputMode === 'voice' ? (
            stage === 'phone' ? (
              <VoiceField value={phone} onChange={setPhone} onCaptured={submitPhone} placeholder="98765 43210" type="tel" />
            ) : (
              <VoiceField value={otp} onChange={setOtp} onCaptured={submitOtp} placeholder="4-digit code" type="tel" />
            )
          ) : (
            <div className="login__input-wrap">
              <Phone size={16} className="login__input-icon" />
              <input
                type="tel"
                value={stage === 'phone' ? phone : otp}
                onChange={(e) => (stage === 'phone' ? setPhone(e.target.value) : setOtp(e.target.value))}
                onKeyDown={handleKeyDown}
                placeholder={stage === 'phone' ? '98765 43210' : '4-digit code'}
                className="login__input"
                autoFocus
              />
            </div>
          )}

          {inputMode === 'type' && (
            <button onClick={stage === 'phone' ? submitPhone : submitOtp} disabled={stage === 'phone' ? !phone : !otp} className="login__submit">
              {stage === 'phone' ? t('sendOtp') : t('verifyContinue')}
            </button>
          )}

          <div className="login__security"><ShieldCheck size={16} /> {t('security')}</div>
        </div>
      </div>
    </div>
  );
}