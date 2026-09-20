import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import HeartbeatLogo from '../components/HeartbeatLogo';
import Waveform from '../components/Waveform';
import Button from '../components/Button';
import useAutoAdvance from '../hooks/useAutoAdvance';
import session from '../utils/session';
import { isValidEmailOrPhone, isValidPassword } from '../utils/validators';
import './HospitalLogin.css';

/**
 * Same brand language as the patient login. Only asked once per
 * device — see the redirect below — after which the hospital admin or
 * a doctor just picks their own name on the next screen.
 */
export default function HospitalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session.getHospital()) navigate('/hospital/who-are-you', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const identifierValid = isValidEmailOrPhone(email);
  const passwordValid = isValidPassword(password);
  const formValid = identifierValid && passwordValid;

  const submit = () => {
    if (!formValid) return;
    session.saveHospital({ email });
    navigate(session.getRoster([]).length ? '/hospital/who-are-you' : '/hospital/registration');
  };
  const handleKeyDown = (e) => e.key === 'Enter' && submit();

  // Same hands-free pattern as the patient side: once both fields are
  // actually valid, move on after a short pause — no button tap needed.
  useAutoAdvance(`${email}:${password}`, formValid, submit, { delay: 1200 });

  return (
    <div className="hospital-login">
      <div className="hospital-login__panel">
        <div className="hospital-login__hero">
          <span className="hospital-login__blob hospital-login__blob--gold" />
          <span className="hospital-login__blob hospital-login__blob--glow" />

          <div className="hospital-login__hero-copy">
            <span className="hospital-login__eyebrow">Hospital portal</span>
            <h1 className="hospital-login__headline">Every patient heard.<br />Every patient answered.</h1>
            <p className="hospital-login__subcopy">Review incoming symptom recordings and reply with your voice.</p>
          </div>

          <div className="hospital-login__hero-mic">
            <span className="hospital-login__mic-badge"><HeartbeatLogo size={36} /></span>
            <div className="hospital-login__hero-wave"><Waveform mode="idle" /></div>
          </div>
        </div>

        <div className="hospital-login__form">
          <h2 className="hospital-login__title">Staff login</h2>
          <p className="hospital-login__lede">Sign in on behalf of your hospital.</p>

          <label className="hospital-login__label">Work email or mobile number</label>
          <div className="hospital-login__input-wrap">
            <Mail size={16} className="hospital-login__input-icon" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@hospital.org"
              className="hospital-login__input"
              autoFocus
            />
          </div>
          {email.length > 0 && !identifierValid && (
            <p className="field-error"><AlertCircle size={12} /> Enter a valid work email or 10-digit mobile number.</p>
          )}

          <label className="hospital-login__label" style={{ marginTop: 16 }}>Password</label>
          <div className="hospital-login__input-wrap">
            <Lock size={16} className="hospital-login__input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="At least 8 characters"
              className="hospital-login__input"
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="hospital-login__eye-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password.length > 0 && !passwordValid && (
            <p className="field-error"><AlertCircle size={12} /> 8+ characters, with an uppercase letter, a number, and a symbol.</p>
          )}
          {password.length === 0 && (
            <p className="hospital-login__password-hint">Must include an uppercase letter, a number, and a symbol.</p>
          )}

          <Button className="hospital-login__submit" onClick={submit} disabled={!formValid}>
            Log in
          </Button>

          <div className="hospital-login__security"><ShieldCheck size={16} /> Secure staff access. Your credentials are protected.</div>
        </div>
      </div>
    </div>
  );
}
