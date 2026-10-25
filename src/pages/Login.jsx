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
  సున్న: '0', సున్నా: '0', ఒక: '1', ఒకటి: '1', రెండు: '2', మూడు: '3', నాలుగు: '4', ఐదు: '5', ఆరు: '6', ఏడు: '7', ఎనిమిది: '8', తొమ్మిది: '9',
  शून्य: '0', एक: '1', दो: '2', तीन: '3', चार: '4', पाँच: '5', छह: '6', सात: '7', आठ: '8', नौ: '9',
  பூஜ்ஜியம்: '0', ஒன்று: '1', இரண்டு: '2', மூன்று: '3', நான்கு: '4', ஐந்து: '5', ஆறு: '6', ஏழு: '7', எட்டு: '8', ஒன்பது: '9',
};

function parseSpokenCode(rawText) {
  const normalized = (rawText || '').toLowerCase().replace(/[^a-zA-Z0-9\u00C0-\uFFFF\s]/g, ' ').trim();
  if (!normalized) return '';
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const digits = [];

  for (const token of tokens) {
    if (spokenNumberMap[token]) {
      digits.push(spokenNumberMap[token]);
      continue;
    }
    const directDigits = token.replace(/\D/g, '');
    if (directDigits) digits.push(...directDigits.split(''));
  }

  return digits.join('').replace(/\D/g, '').slice(0, 6);
}

function langCodeFromBcp47(bcp47) {
  if ((bcp47 || '').startsWith('te')) return 'te';
  if ((bcp47 || '').startsWith('hi')) return 'hi';
  if ((bcp47 || '').startsWith('ta')) return 'ta';
  return 'en';
}

export default function Login() {
  const navigate = useNavigate();
  const { t, bcp47 } = useLanguage();
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const emailValid = isValidEmail(email);
  const showEmailError = (emailTouched || attempted) && !emailValid;
  const emailError = email.trim() ? t('errorEmail') : t('errorRequired');

  const { supported, listening, start, stop } = useSpeechRecognition({ lang: bcp47, continuous: false, silenceTimeoutMs: 2200 });
  const { supported: codeSupported, listening: codeListening, start: startCodeVoice, stop: stopCodeVoice } = useSpeechRecognition({ lang: bcp47, continuous: false, silenceTimeoutMs: 2200 });

  const handleEmailVoice = () => {
    if (listening) {
      stop();
      return;
    }
    start((finalText) => {
      const spokenEmail = (finalText || '').trim().replace(/\s+/g, '').toLowerCase();
      if (!spokenEmail) return;
      setEmail(spokenEmail);
      setEmailTouched(true);
      setAttempted(true);
      setEnteredCode('');
      setVerificationError('');
    });
  };

  const handleCodeVoice = () => {
    if (codeListening) {
      stopCodeVoice();
      return;
    }
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
      await api.post('/patients/send-code', {
        email: normalizedEmail,
        language: langCodeFromBcp47(bcp47),
      });
      setEnteredCode('');
      setCodeSent(true);
      setShowCodePopup(true);
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
      setIsVerifyingCode(true);
      setVerificationError('');
      const response = await api.post('/patients/verify-code', {
        email: normalizedEmail,
        code: enteredCode,
      });

      if (!response.verified) {
        setVerificationError(t('invalidVerificationCode'));
        return;
      }

      const cachedPatient = session.getRegisteredPatientByEmail(normalizedEmail);
      if (cachedPatient) {
        session.savePatient(cachedPatient);
        navigate('/symptoms');
        return;
      }

      try {
        const existingPatient = await api.post('/patients/login', { email: normalizedEmail });
        if (existingPatient && existingPatient.patient_id) {
          session.savePatient(existingPatient);
          session.registerPatient(existingPatient);
          navigate('/symptoms');
          return;
        }
      } catch {
        // New patient path.
      }

      navigate('/basic-details', { state: { email: normalizedEmail } });
    } catch (error) {
      setVerificationError(error.message || t('invalidVerificationCode'));
    } finally {
      setIsVerifyingCode(false);
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
                  <ArrowRight size={22} strokeWidth={2.2} /> {isSendingCode ? t('sendingVerificationCode') : t('sendVerificationCode')}
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
                  <button type="submit" className="pd-submit" disabled={enteredCode.length !== 6 || isVerifyingCode}>
                    <ArrowRight size={22} strokeWidth={2.2} /> {isVerifyingCode ? 'Verifying...' : t('verifyCode')}
                  </button>
                  <button type="button" className="patient-resend-code" onClick={sendCode} disabled={isSendingCode}>
                    {t('resendCode')}
                  </button>
                  <button type="button" className="patient-change-email" onClick={() => {
                    setCodeSent(false);
                    setEnteredCode('');
                    setVerificationError('');
                  }}>
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
            <button type="button" className="pd-modal__close" onClick={() => setShowCodePopup(false)} aria-label={t('close')}>
              <X size={18} />
            </button>
            <h2 id="verification-title" className="pd-modal__title">{t('emailCodeTitle')}</h2>
            <p>{t('emailCodeSentTo')} <strong>{email.trim().toLowerCase()}</strong></p>
            <div className="pd-verification-popup-actions">
              <button type="button" className="pd-modal__ok" onClick={() => setShowCodePopup(false)}>
                {t('gotIt')}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
