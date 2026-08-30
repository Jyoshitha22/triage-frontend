import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Stethoscope, AlertCircle } from 'lucide-react';
import Waveform from '../components/Waveform';
import Button from '../components/Button';
import { isValidEmailOrPhone, isValidPassword } from '../utils/validators';
import './HospitalLogin.css';

/**
 * Same brand language as the patient login. First-time setup only —
 * credentials are saved for future visits.
 */
export default function HospitalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const identifierValid = isValidEmailOrPhone(email);
  const passwordValid = isValidPassword(password);
  const formValid = identifierValid && passwordValid;

  const submit = () => formValid && navigate('/hospital/registration');
  const handleKeyDown = (e) => e.key === 'Enter' && submit();

  return (
    <div className="hospital-login">
      <div className="hospital-login__panel">
        <div className="hospital-login__hero">
          <span className="hospital-login__blob hospital-login__blob--gold" />
          <span className="hospital-login__blob hospital-login__blob--glow" />

          <div className="hospital-login__hero-copy">
            <span className="hospital-login__eyebrow">Hospital portal</span>
            <h1 className="hospital-login__headline">Every patient,<br />heard and answered.</h1>
            <p className="hospital-login__subcopy">Review incoming symptom recordings and reply with your voice.</p>
          </div>

          <div className="hospital-login__hero-mic">
            <span className="hospital-login__mic-badge"><Stethoscope size={32} /></span>
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
              placeholder="doctor@hospital.org or 98765 43210"
              className="hospital-login__input"
            />
          </div>
          {email.length > 0 && !identifierValid && (
            <p className="field-error"><AlertCircle size={12} /> Enter a valid email or 10-digit mobile number.</p>
          )}

          <label className="hospital-login__label" style={{ marginTop: 16 }}>Password</label>
          <div className="hospital-login__input-wrap">
            <Lock size={16} className="hospital-login__input-icon" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="hospital-login__input"
            />
          </div>
          {password.length > 0 && !passwordValid && (
            <p className="field-error"><AlertCircle size={12} /> Password must be at least 6 characters.</p>
          )}

          <Button className="hospital-login__submit" onClick={submit} disabled={!formValid}>
            Log in
          </Button>

          <div className="hospital-login__security"><ShieldCheck size={16} /> First-time setup only — your details are saved for next time.</div>
        </div>
      </div>
    </div>
  );
}