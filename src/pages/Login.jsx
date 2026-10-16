import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import PatientSidebar from '../components/PatientSidebar';
import { useLanguage } from '../context/LanguageContext';
import { isValidEmail } from '../utils/validators';
import session from '../utils/session';
import EMAIL_VERIFY from '../assets/EMAIL_VERIFY.png';
import emailHeart from '../assets/language-heart.png';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const emailValid = isValidEmail(email);
  const showEmailError = (emailTouched || attempted) && !emailValid;
  const emailError = email.trim() ? t('errorEmail') : t('errorRequired');

  const sendCode = () => {
    const codeBytes = new Uint32Array(1);
    window.crypto.getRandomValues(codeBytes);
    setVerificationCode(String(codeBytes[0] % 1000000).padStart(6, '0'));
    setEnteredCode('');
    setVerificationError('');
    setCodeSent(true);
    setShowCodePopup(true);
  };

  const submitEmail = (event) => {
    event.preventDefault();
    const emailInput = event.currentTarget.elements.email;
    const submittedEmail = emailInput.value.trim();
    emailInput.value = submittedEmail;
    const isEmailValid = isValidEmail(submittedEmail);
    setEmail(submittedEmail);
    setEmailTouched(true);
    setAttempted(true);
    if (isEmailValid) sendCode();
  };

  const verifyCode = (event) => {
    event.preventDefault();
    if (enteredCode !== verificationCode) {
      setVerificationError(t('invalidVerificationCode'));
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const registeredPatient = session.getRegisteredPatientByEmail(normalizedEmail);
    if (registeredPatient) {
      session.savePatient(registeredPatient);
      navigate('/symptoms');
      return;
    }

    navigate('/basic-details', { state: { email: normalizedEmail } });
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
                    </div>
                    {showEmailError && <p id="patient-email-error" className="pd-error"><AlertCircle size={13} /> {emailError}</p>}
                  </div>
                </div>

                <button type="submit" className="pd-submit">
                  <ArrowRight size={22} strokeWidth={2.2} /> {t('sendVerificationCode')}
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
            <h2 id="verification-title" className="pd-modal__title">{t('emailCodeTitle')}</h2>
            <p>{t('emailCodeSentTo')} <strong>{email.trim().toLowerCase()}</strong></p>
            <p className="pd-verification-demo">{t('emailCodeDemoLabel')}</p>
            <div className="pd-verification-code" aria-label={t('emailCodeDemoLabel')}>{verificationCode}</div>

            <div className="pd-verification-popup-actions">
              <button type="button" className="pd-modal__ok pd-modal__ok--secondary" onClick={copyCode}>
                {t('copyCode')}
              </button>
              <button type="button" className="pd-modal__ok" onClick={() => setShowCodePopup(false)}>
                {t('okay')}
              </button>
            </div>
            {verificationError && <p className="pd-error"><AlertCircle size={13} /> {verificationError}</p>}
          </section>
        </div>
      )}
    </div>
  );
}