import { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Mail } from 'lucide-react';
import { isValidEmail, isValidPassword } from '../utils/validators';
import { updateLocalStaffPassword } from '../utils/localStaffAccounts';

const RECOVERY_LIFETIME_MS = 10 * 60 * 1000;

export default function LocalPasswordRecovery({ role, onCancel }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();

  const sendCode = (event) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    const codeBytes = new Uint32Array(1);
    window.crypto.getRandomValues(codeBytes);
    const nextCode = String(codeBytes[0] % 1000000).padStart(6, '0');
    const recovery = {
      email: normalizedEmail,
      code: nextCode,
      expiresAt: Date.now() + RECOVERY_LIFETIME_MS,
    };
    try {
      window.localStorage.setItem(`triage.passwordRecovery.${role}`, JSON.stringify(recovery));
    } catch {
      setError('Could not store the verification code in this browser. Check local storage and try again.');
      return;
    }
    setCode(nextCode);
    setEnteredCode('');
    setError('');
    setShowCode(true);
  };

  const verifyCode = (event) => {
    event.preventDefault();
    let stored;
    try {
      stored = JSON.parse(window.localStorage.getItem(`triage.passwordRecovery.${role}`) || 'null');
    } catch {
      setError('The stored code could not be read. Request a new code and try again.');
      return;
    }
    if (!stored || stored.email !== normalizedEmail || stored.expiresAt < Date.now() || stored.code !== enteredCode) {
      setError('The code is incorrect or expired. Request a new code and try again.');
      return;
    }
    setError('');
    setStep('password');
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (!isValidPassword(password)) {
      setError('Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    try {
      const saved = await updateLocalStaffPassword(role, normalizedEmail, password);
      if (!saved) {
        setError('No locally registered account was found for this email. Register this demo account on this device first.');
        return;
      }
      window.localStorage.removeItem(`triage.passwordRecovery.${role}`);
      onCancel('Password updated. Log in with your new password.');
    } catch {
      setError('Could not save the password in this browser. Check local storage and try again.');
    }
  };

  return (
    <section className="staff-recovery" aria-labelledby="staff-recovery-title">
      <h2 id="staff-recovery-title" className="hospital-login__title">Reset your password</h2>
      {step === 'email' && (
        <form onSubmit={sendCode}>
          <p className="hospital-login__lede">Enter the email address for your {role} account.</p>
          <label className="hospital-login__label" htmlFor={`${role}-recovery-email`}>Email</label>
          <div className="hospital-login__input-wrap">
            <Mail size={16} className="hospital-login__input-icon" />
            <input
              id={`${role}-recovery-email`}
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError(''); }}
              className="hospital-login__input"
              required
            />
          </div>
          <button className="btn btn--primary staff-recovery__submit" type="submit">
            Send verification code <ArrowRight size={16} />
          </button>
        </form>
      )}
      {step === 'code' && (
        <form onSubmit={verifyCode}>
          <p className="hospital-login__lede">Enter the six-digit code for <strong>{normalizedEmail}</strong>.</p>
          <label className="hospital-login__label" htmlFor={`${role}-recovery-code`}>Verification code</label>
          <div className="hospital-login__input-wrap">
            <input
              id={`${role}-recovery-code`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={enteredCode}
              onChange={(event) => { setEnteredCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              className="hospital-login__input"
              required
            />
          </div>
          <button className="btn btn--primary staff-recovery__submit" type="submit">
            Verify code <ArrowRight size={16} />
          </button>
          <button className="staff-recovery__resend" type="button" onClick={() => { setStep('email'); setEnteredCode(''); setError(''); }}>
            Use another email or request a new code
          </button>
        </form>
      )}
      {step === 'password' && (
        <form onSubmit={savePassword}>
          <label className="hospital-login__label" htmlFor={`${role}-new-password`}>New password</label>
          <div className="hospital-login__input-wrap">
            <input id={`${role}-new-password`} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password}
              onChange={(event) => { setPassword(event.target.value); setError(''); }} className="hospital-login__input" required />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="hospital-login__eye-toggle" aria-label={showPassword ? 'Hide new password' : 'Show new password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <label className="hospital-login__label" htmlFor={`${role}-confirm-password`}>Confirm new password</label>
          <div className="hospital-login__input-wrap">
            <input id={`${role}-confirm-password`} type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword}
              onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }} className="hospital-login__input" required />
            <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="hospital-login__eye-toggle" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="hospital-login__password-hint">At least 8 characters with uppercase, lowercase, a number, and a symbol.</p>
          <button className="btn btn--primary staff-recovery__submit" type="submit">
            Save new password <CheckCircle2 size={16} />
          </button>
        </form>
      )}
      {error && <p className="field-error" role="alert"><AlertCircle size={13} /> {error}</p>}
      <button type="button" className="staff-recovery__back" onClick={() => onCancel()}>
        <ArrowLeft size={15} /> Back to login
      </button>
      {showCode && (
        <div className="staff-recovery__overlay">
          <button type="button" className="staff-recovery__scrim" onClick={() => { setShowCode(false); setStep('code'); }} aria-label="Close code" />
          <section className="staff-recovery__dialog" role="dialog" aria-modal="true" aria-labelledby="staff-recovery-code-title">
            <span className="staff-recovery__icon"><Mail size={22} /></span>
            <h3 id="staff-recovery-code-title">Verification code</h3>
            <p>Demo code for {normalizedEmail}. It is stored in this browser, not sent by email.</p>
            <strong className="staff-recovery__code">{code}</strong>
            <button type="button" className="btn btn--primary" onClick={() => { setShowCode(false); setStep('code'); }}>
              Enter code <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
