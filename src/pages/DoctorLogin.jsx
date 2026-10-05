import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import HeartbeatLogo from '../components/HeartbeatLogo';
import Waveform from '../components/Waveform';
import Button from '../components/Button';
import useAutoAdvance from '../hooks/useAutoAdvance';
import api from '../utils/api';
import session from '../utils/session';
import { isValidEmail, isValidPassword } from '../utils/validators';
import './HospitalLogin.css';

/**
 * Every doctor has their own account — logging in here goes straight
 * to their own dashboard (their own name, their own specialty-filtered
 * queue), never through hospital setup. That setup screen doesn't
 * exist on this path at all.
 */
export default function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.getDoctor()) navigate('/hospital/dashboard', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = emailValid && passwordValid;

  const submit = async () => {
    if (!formValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const doctor = await api.post('/doctors/login', { email, password });
      session.saveDoctor(doctor);
      navigate('/hospital/dashboard');
    } catch (e) {
      setError(e.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e) => e.key === 'Enter' && submit();

  useAutoAdvance(`${email}:${password}`, formValid, submit, { delay: 1400 });

  return (
    <div className="hospital-login">
      <div className="hospital-login__panel">
        <div className="hospital-login__hero">
          <span className="hospital-login__blob hospital-login__blob--gold" />
          <span className="hospital-login__blob hospital-login__blob--glow" />

          <button onClick={() => navigate('/hospital')} className="hospital-login__back"><ChevronLeft size={14} /> Back</button>

          <div className="hospital-login__hero-copy">
            <span className="hospital-login__eyebrow">Doctor</span>
            <h1 className="hospital-login__headline">Every patient heard.<br />Every patient answered.</h1>
            <p className="hospital-login__subcopy">Log in to see only the patients waiting for you.</p>
          </div>

          <div className="hospital-login__hero-mic">
            <span className="hospital-login__mic-badge"><HeartbeatLogo size={36} /></span>
            <div className="hospital-login__hero-wave"><Waveform mode="idle" /></div>
          </div>
        </div>

        <div className="hospital-login__form">
          <h2 className="hospital-login__title">Doctor login</h2>
          <p className="hospital-login__lede">New here? <button type="button" onClick={() => navigate('/hospital/doctor/register')} className="hospital-login__inline-link">Register your account</button></p>

          <label className="hospital-login__label">Email</label>
          <div className="hospital-login__input-wrap">
            <Mail size={16} className="hospital-login__input-icon" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="doctor@hospital.org"
              className="hospital-login__input"
              autoFocus
            />
          </div>
          {email.length > 0 && !emailValid && (
            <p className="field-error"><AlertCircle size={12} /> Enter a valid email address.</p>
          )}

          <label className="hospital-login__label" style={{ marginTop: 16 }}>Password</label>
          <div className="hospital-login__input-wrap">
            <Lock size={16} className="hospital-login__input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your password"
              className="hospital-login__input"
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="hospital-login__eye-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}

          <Button className="hospital-login__submit" onClick={submit} disabled={!formValid || loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>

          <div className="hospital-login__security"><ShieldCheck size={16} /> Secure staff access. Your credentials are protected.</div>
        </div>
      </div>
    </div>
  );
}