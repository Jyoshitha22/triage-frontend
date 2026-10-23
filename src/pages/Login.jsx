import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Mic, X } from 'lucide-react';
import PatientSidebar from '../components/PatientSidebar';
import { useLanguage } from '../context/LanguageContext';
import { isValidEmail } from '../utils/validators';
import session from '../utils/session';
import api from '../utils/api';
import EMAIL_VERIFY from '../assets/EMAIL_VERIFY.png';
import emailHeart from '../assets/language-heart.png';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const spokenNumberMap = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  సున్న: '0', ఒక: '1', రెండు: '2', మూడు: '3', నాలుగు: '4', ఐదు: '5', ఆరు: '6', ఏడు: '7', ఎనిమిది: '8', తొమ్మిది: '9',
  సున్నా: '0', ఒకటి: '1', రెండు: '2', మూడు: '3', నాలుగు: '4', ఐదు: '5', ఆరు: '6', ఏడు: '7', ఎనిమిది: '8', తొమ్మిది: '9',
  शून्य: '0', एक: '1', दो: '2', तीन: '3', चार: '4', पाँच: '5', छह: '6', सात: '7', आठ: '8', नौ: '9',
  शून्यं: '0', एकं: '1', दो: '2', तीन: '3', चार: '4', पाँच: '5', छह: '6', सात: '7', आठ: '8', नौ: '9',
  பூஜ்ஜியம்: '0', ஒன்று: '1', இரண்டு: '2', மூன்று: '3', நான்கு: '4', ஐந்து: '5', ஆறு: '6', ஏழு: '7', எட்டு: '8', ஒன்பது: '9',
  صفر: '0', واحد: '1', اثنان: '2', ثلاثة: '3', أربعة: '4', خمسة: '5', ستة: '6', سبعة: '7', الثمانية: '8', تسعة: '9',
};

function parseSpokenCode(rawText) {
  if (!rawText) return '';

  const normalized = rawText
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u00C0-\uFFFF\s]/g, ' ')
    .trim();

  if (!normalized) return '';

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const digits = [];

  for (const token of tokens) {
    if (spokenNumberMap[token]) {
      digits.push(spokenNumberMap[token]);
      continue;
    }

    const directDigits = token.replace(/\D/g, '');
    if (directDigits) {
      digits.push(...directDigits.split(''));
    }
  }

  return digits.join('').replace(/\D/g, '').slice(0, 6);
}

export default function Login() {
  const navigate = useNavigate();
  const { t, bcp47 } = useLanguage();
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const emailValid = isValidEmail(email);
  const showEmailError = (emailTouched || attempted) && !emailValid;
  const emailError = email.trim() ? t('errorEmail') : t('errorRequired');
  const { supported, listening, start, stop } = useSpeechRecognition({ lang: bcp47, continuous: false, silenceTimeoutMs: 2200 });
  const { supported: codeSupported, listening: codeListening, start: startCodeVoice, stop: stopCodeVoice } = useSpeechRecognition({ lang: bcp47, continuous: false, silenceTimeoutMs: 2200 });

  const handleEmailVoice = () => {
    if (listening) { stop(); return; }
    start((finalText) => {
      const spokenEmail = finalText.trim();
      if (!spokenEmail) return;
      setEmail(spokenEmail);
      setEmailTouched(true);
      setAttempted(true);
      setEnteredCode('');
      setVerificationCode('');
      setVerificationError('');
    });
  };

  const handleCodeVoice = () => {
    if (codeListening) { stopCodeVoice(); return; }
    startCodeVoice((finalText) => {
      const spokenCode = parseSpokenCode(finalText);
      if (!spokenCode) return;
      setEnteredCode(spokenCode);
      setVerificationError('');
    });
  };

  const sendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setVerificationError(t('errorEmail'));
      return;
    }

    try {
      setIsSendingCode(true);
      setVerificationError('');
      const response = await api.post('/patients/send-code', {
        email: normalizedEmail,
        language: bcp47.startsWith('te') ? 'te' : bcp47.startsWith('hi') ? 'hi' : bcp47.startsWith('ta') ? 'ta' : 'en',
      });
      setVerificationCode(String(response.code ?? '').padStart(6, '0'));
      setEnteredCode('');
      setCodeSent(true);
      setShowCodePopup(false);
    } catch (error) {
      setVerificationError(error.message || t('invalidVerificationCode'));
      setCodeSent(false);
      setShowCodePopup(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  const submitEmail = async (event) => {
    event.preventDefault();
    const emailInput = event.currentTarget.elements.email;
    const submittedEmail = emailInput.value.trim();
    emailInput.value = submittedEmail;
    const isEmailValid = isValidEmail(submittedEmail);
    setEmail(submittedEmail);
    setEmailTouched(true);
    setAttempted(true);
    if (isEmailValid) await sendCode();
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await api.post('/patients/verify-code', {
        email: normalizedEmail,
        code: enteredCode,
      });

      if (!response.verified) {
        setVerificationError(t('invalidVerificationCode'));
        return;
      }

      const registeredPatient = session.getRegisteredPatientByEmail(normalizedEmail);
      if (registeredPatient) {
        session.savePatient(registeredPatient);
        navigate('/symptoms');
        return;
      }

      try {
        const existingPatient = await api.post('/patients/login', { email: normalizedEmail });
        if (existingPatient && existingPatient.patient_id) {
          session.savePatient(existingPatient);
          navigate('/symptoms');
          return;
        }
      } catch {
        // Fall through to the first-time flow if no patient exists yet.
      }

      navigate('/basic-details', { state: { email: normalizedEmail } });
    } catch (error) {
      setVerificationError(error.message || t('invalidVerificationCode'));
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setShowCodePopup(false);
    } catch {
      setVerificationError(t('copyCodeFailed'));
    }
  };

  return (
    <div className="pd">
      <div className="pd-body">
        <PatientSidebar />

        <main className="pd-main">
          <section className={`pd-card patient-email-card ${codeSent ? 'has-code' : ''}`}>
            <div className="pd-card__head">
              <span className="pd-card__avatar"><Mail size={32} strokeWidth={1.8} /></span>
              <div>
                <h1 className="pd-card__title">{t(codeSent ? 'emailCodeTitle' : 'patientEmailTitle')}</h1>
                <p className="pd-card__sub">{t(codeSent ? 'emailCodePrompt' : 'patientEmailSubtitle')}</p>
                <svg className="pd-card__wave" viewBox="0 0 150 14" aria-hidden="true">
                  <path d="M2 9 C30 2 60 2 85 8 C105 12 128 8 148 4" fill="none" stroke="#86c9ac" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {!codeSent ? (
              <form className="patient-email-form" onSubmit={submitEmail} noValidate>
                <div className="patient-email-art">
                  <img src={EMAIL_VERIFY} alt="Patient checking an email verification message" />
                </div>
                <div className="pd-row">
                  <div className="pd-row__body">
                    <label className="pd-row__label" htmlFor="patient-email">{t('emailLabel')}</label>
                    <div className={`pd-input ${showEmailError ? 'pd-input--invalid' : ''}`}>
                      <input
                        id="patient-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={email}
                        onBlur={() => setEmailTouched(true)}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setEmailTouched(true);
                          setEnteredCode('');
                          setVerificationCode('');
                          setVerificationError('');
                        }}
                        aria-invalid={showEmailError}
                        aria-describedby={showEmailError ? 'patient-email-error' : undefined}
                        placeholder={t('emailPlaceholder')}
                        required
                      />
                      {supported && (
                        <button
                          type="button"
                          className={`pd-input__mic ${listening ? 'pd-input__mic--on' : ''}`}
                          onClick={handleEmailVoice}
                          aria-label={listening ? 'Stop listening' : 'Speak email'}
                          title={listening ? 'Stop listening' : 'Speak email'}
                        >
                          <Mic size={16} />
                        </button>
                      )}
                    </div>
                    {showEmailError && <p id="patient-email-error" className="pd-error"><AlertCircle size={13} /> {emailError}</p>}
                  </div>
                </div>

                <button type="submit" className="pd-submit" disabled={isSendingCode}>
                  <ArrowRight size={22} strokeWidth={2.2} /> {isSendingCode ? 'Sending...' : t('sendVerificationCode')}
                </button>
              </form>
            ) : (
              <>
                <div className="patient-email-visual">
                  <div className="patient-email-visual__art">
                    <img src={emailHeart} alt="" />
                    <span className="patient-email-visual__badge"><Mail size={28} /><CheckCircle2 size={17} /></span>
                  </div>
                  <p>{t('emailCodeSentTo')} <strong>{email.trim().toLowerCase()}</strong></p>
                </div>

                <form className="patient-code-form" onSubmit={verifyCode}>
                  <div className="pd-row">
                    <div className="pd-row__body">
                      <label className="pd-row__label" htmlFor="verification-code">{t('emailCodePrompt')}</label>
                      <div className="pd-input">
                        <input
                          id="verification-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          pattern="[0-9]{6}"
                          value={enteredCode}
                          onChange={(event) => {
                            setEnteredCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                            setVerificationError('');
                          }}
                          required
                        />
                        {codeSupported && (
                          <button
                            type="button"
                            className={`pd-input__mic ${codeListening ? 'pd-input__mic--on' : ''}`}
                            onClick={handleCodeVoice}
                            aria-label={codeListening ? 'Stop listening' : 'Speak code'}
                            title={codeListening ? 'Stop listening' : 'Speak code'}
                          >
                            <Mic size={16} />
                          </button>
                        )}
                      </div>
                      {verificationError && <p className="pd-error"><AlertCircle size={13} /> {verificationError}</p>}
                    </div>
                  </div>
                  <button type="submit" className="pd-submit" disabled={enteredCode.length !== 6}>
                    <ArrowRight size={22} strokeWidth={2.2} /> {t('verifyCode')}
                  </button>
                  <button type="button" className="patient-resend-code" onClick={sendCode}>
                    {t('resendCode')}
                  </button>
                  <button type="button" className="patient-change-email" onClick={() => { setCodeSent(false); setEnteredCode(''); setVerificationCode(''); setVerificationError(''); }}>
                    {t('changeEmail')}
                  </button>
                </form>
              </>
            )}
          </section>
        </main>
      </div>

      {showCodePopup && (
        <div className="pd-modal">
          <button type="button" className="pd-modal__backdrop" aria-label={t('changeEmail')} onClick={() => setShowCodePopup(false)} />
          <section className="pd-modal__box" role="dialog" aria-modal="true" aria-labelledby="verification-title">
            <button
              type="button"
              className="pd-modal__close"
              aria-label={t('gotIt')}
              onClick={() => setShowCodePopup(false)}
            >
              <X size={18} />
            </button>
            <h2 id="verification-title" className="pd-modal__title">{t('emailCodeTitle')}</h2>
            <p>{t('emailCodeSentTo')} <strong>{email.trim().toLowerCase()}</strong></p>
            <p className="pd-verification-demo">{t('emailCodeDemoLabel')}</p>
            <div className="pd-verification-code" aria-label={t('emailCodeDemoLabel')}>{verificationCode}</div>

            <div className="pd-verification-popup-actions">
              <button type="button" className="pd-modal__ok pd-modal__ok--secondary" onClick={copyCode}>
                {t('copyCode')}
              </button>
              <button type="button" className="pd-modal__ok" onClick={() => setShowCodePopup(false)}>
                {t('gotIt')}
              </button>
            </div>
            {verificationError && <p className="pd-error"><AlertCircle size={13} /> {verificationError}</p>}
          </section>
        </div>
      )}
    </div>
  );
}