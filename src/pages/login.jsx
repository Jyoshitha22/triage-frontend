import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ChevronLeft, Mic, Square } from 'lucide-react';
import HeartbeatLogo from '../components/HeartbeatLogo';
import Waveform from '../components/Waveform';
import VoiceField from '../components/VoiceField';
import LanguagePicker from '../components/LanguagePicker';
import OtpInput from '../components/OtpInput';
import { useLanguage } from '../context/LanguageContext';
import useAutoAdvance from '../hooks/useAutoAdvance';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { isValidPhone, isValidOtp } from '../utils/validators';
import './login.css';

const RESEND_SECONDS = 30;

/**
 * Type or speak — both are always available at once, no mode switch
 * to find first. Three steps: phone, retype phone (people mistype
 * numbers more than they mistype names), then the OTP.
 *
 * If this device already has a saved patient session, this page is
 * skipped entirely (see RoleSelect.jsx) — it only ever runs once per
 * device.
 */
export default function Login() {
  const navigate = useNavigate();
  const { t, bcp47, speakPrompt } = useLanguage();
  const [stage, setStage] = useState('phone'); // phone | confirmPhone | otp
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  const phoneValid = isValidPhone(phone);
  const confirmValid = confirmPhone.length === 10 && confirmPhone === phone;
  const confirmMismatch = confirmPhone.length === 10 && confirmPhone !== phone;
  const otpValid = isValidOtp(otp);
  const showPhoneError = phone.length > 0 && !phoneValid;
  const showOtpError = otp.length === 4 && !otpValid;

  const submitPhone = () => phoneValid && setStage('confirmPhone');
  const submitConfirm = () => confirmValid && setStage('otp');
  const submitOtp = () => {
    if (!otpValid) return;
    navigate('/basic-details', { state: { phone, otp } });
  };
  const changeNumber = () => { setStage('phone'); setConfirmPhone(''); setOtp(''); };

  useEffect(() => {
    if (stage !== 'otp' || resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [stage, resendIn]);
  const resend = () => setResendIn(RESEND_SECONDS); // dev stand-in for a real resend API call

  const promptKey = stage === 'phone' ? 'loginPromptPhone' : stage === 'confirmPhone' ? 'loginPromptConfirmPhone' : 'loginPromptOtp';
  useEffect(() => { speakPrompt(promptKey); }, [stage, bcp47]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hands-free: once what's typed actually validates, move on a beat
  // after the patient stops touching it — no button needed.
  useAutoAdvance(phone, stage === 'phone' && phoneValid, submitPhone, { delay: 1300 });
  useAutoAdvance(confirmPhone, stage === 'confirmPhone' && confirmValid, submitConfirm, { delay: 900 });

  const { supported: micSupported, listening: otpListening, start: startOtp, stop: stopOtp } = useSpeechRecognition({ lang: bcp47, continuous: true, silenceTimeoutMs: 2200 });
  const toggleOtpMic = () => {
    if (otpListening) { stopOtp(); return; }
    startOtp((finalText) => {
      const digits = finalText.replace(/\D/g, '').slice(0, 4);
      if (digits.length === 4) { setOtp(digits); submitOtp(); } else if (digits) setOtp(digits);
    });
  };

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__hero">
          <span className="login__blob login__blob--gold" />
          <span className="login__blob login__blob--glow" />

          <div className="login__hero-top">
            <span className="login__brand"><HeartbeatLogo size={20} /> {t('appName')}</span>
            <LanguagePicker className="login__language-picker" />
          </div>

          <div className="login__hero-copy">
            <span className="login__eyebrow">{t('loginEyebrow')}</span>
            <h1 className="login__headline">{t('loginHeadline')}</h1>
            <p className="login__subcopy">{t('loginSubcopy')}</p>
          </div>

          <div className="login__hero-mic">
            <span className="login__mic-badge"><HeartbeatLogo size={36} /></span>
            <div className="login__hero-wave"><Waveform mode="idle" /></div>
          </div>
        </div>

        <div className="login__form">
          <h2 className="login__title">
            {stage === 'phone' ? t('loginTitle') : stage === 'confirmPhone' ? t('confirmPhoneTitle') : t('verifyMobileTitle')}
          </h2>
          <p className="login__spoken-prompt">{t(promptKey)}</p>

          {stage === 'phone' && (
            <>
              <label className="login__label">{t('phoneLabel')}</label>
              <div className="login__phone-row">
                <span className="login__country-code">+91</span>
                <VoiceField value={phone} onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))} onCaptured={submitPhone} placeholder="98765 43210" type="tel" />
              </div>
              {showPhoneError && <p className="field-error"><AlertCircle size={12} /> {t('errorPhone')}</p>}
            </>
          )}

          {stage === 'confirmPhone' && (
            <>
              <label className="login__label">{t('confirmPhoneLabel')}</label>
              <div className="login__phone-row">
                <span className="login__country-code">+91</span>
                <VoiceField value={confirmPhone} onChange={(v) => setConfirmPhone(v.replace(/\D/g, '').slice(0, 10))} onCaptured={submitConfirm} placeholder="98765 43210" type="tel" />
              </div>
              {confirmMismatch && <p className="field-error"><AlertCircle size={12} /> {t('errorPhoneMismatch')}</p>}
              <button onClick={() => setStage('phone')} className="login__change-number"><ChevronLeft size={14} /> {t('changePhoneNumber')}</button>
            </>
          )}

          {stage === 'otp' && (
            <>
              <p className="login__otp-subtitle">{t('otpSubtitle')}</p>
              <OtpInput length={4} value={otp} onChange={setOtp} onComplete={submitOtp} />
              {showOtpError && <p className="field-error"><AlertCircle size={12} /> {t('errorOtp')}</p>}

              {micSupported && (
                <button onClick={toggleOtpMic} className={`login__otp-mic ${otpListening ? 'login__otp-mic--active' : ''}`}>
                  {otpListening ? <Square size={16} /> : <Mic size={16} />} {otpListening ? t('listening') : t('useVoiceInstead')}
                </button>
              )}

              <div className="login__otp-footer">
                <span className="login__resend-hint">{t('didntReceiveCode')}</span>
                {resendIn > 0 ? (
                  <span className="login__resend-countdown">{t('resendOtpIn')} 00:{String(resendIn).padStart(2, '0')}</span>
                ) : (
                  <button onClick={resend} className="login__resend-btn">{t('resendOtp')}</button>
                )}
              </div>

              <button onClick={changeNumber} className="login__change-number"><ChevronLeft size={14} /> {t('changePhoneNumber')}</button>
            </>
          )}

          <div className="login__security"><ShieldCheck size={16} /> {t('security')}</div>
        </div>
      </div>
    </div>
  );
}
