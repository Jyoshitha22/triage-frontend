import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Stethoscope } from 'lucide-react';
import Waveform from '../components/Waveform';
import Button from '../components/Button';
import './HospitalLogin.css';

/**
 * Same brand language as the patient login. First-time setup only —
 * credentials are saved for future visits.
 */
export default function HospitalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@hospital.org or 98765 43210" className="hospital-login__input" />
          </div>

          <label className="hospital-login__label" style={{ marginTop: 16 }}>Password</label>
          <div className="hospital-login__input-wrap">
            <Lock size={16} className="hospital-login__input-icon" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="hospital-login__input" />
          </div>

          <Button className="hospital-login__submit" onClick={() => navigate('/hospital/registration')} disabled={!email || !password}>Log in</Button>

          <div className="hospital-login__security"><ShieldCheck size={16} /> First-time setup only — your details are saved for next time.</div>
        </div>
      </div>
    </div>
  );
}