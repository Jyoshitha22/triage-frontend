import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck, Volume2, Keyboard, Mic, AlertCircle } from 'lucide-react';
import Waveform from '../components/Waveform';
import VoiceField from '../components/VoiceField';
import LanguagePicker from '../components/LanguagePicker';
import { useLanguage } from '../context/LanguageContext';
import useAutoAdvance from '../hooks/useAutoAdvance';
import { isValidPhone, isValidOtp } from '../utils/validators';
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
  const phoneValid = isValidPhone(phone);
  const otpValid = isValidOtp(otp);
  // Only show an error once there's something typed that's actually wrong —
  // never on an empty, untouched field.
  const showPhoneError = phone.length > 0 && !phoneValid;
  const showOtpError = otp.length > 0 && !otpValid;

  const submitPhone = () => phoneValid && setStage('otp');
  const submitOtp = () => otpValid && navigate('/basic-details', { state: { phone, otp } });

  // Speak the current question aloud whenever it changes (or voice mode
  // is switched on) — this is the "ask him" part: the patient hears the
  // question in their chosen language, not just reads it.
  useEffect(() => {
    if (inputMode === 'voice') speakPrompt(promptKey);
  }, [inputMode, promptKey, bcp47]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typed answers auto-advance a beat after the patient stops typing —
  // but only once what they've typed actually passes validation, so a
  // half-typed or wrong-length number never silently jumps forward.
  useAutoAdvance(phone, inputMode === 'type' && stage === 'phone' && phoneValid, submitPhone, { delay: 1300 });
  useAutoAdvance(otp, inputMode === 'type' && stage === 'otp' && otpValid, submitOtp, { delay: 900 });

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (stage === 'phone' && phoneValid) submitPhone();
    if (stage === 'otp' && otpValid) submitOtp();
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

          {((stage === 'phone' && showPhoneError) || (stage === 'otp' && showOtpError)) && (
            <p className="field-error"><AlertCircle size={12} /> {t(stage === 'phone' ? 'errorPhone' : 'errorOtp')}</p>
          )}

          {inputMode === 'type' && (
            <button
              onClick={stage === 'phone' ? submitPhone : submitOtp}
              disabled={stage === 'phone' ? !phoneValid : !otpValid}
              className="login__submit"
            >
              {stage === 'phone' ? t('sendOtp') : t('verifyContinue')}
            </button>
          )}

          <div className="login__security"><ShieldCheck size={16} /> {t('security')}</div>
        </div>
      </div>
    </div>
  );
}