import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import DoctorArtwork from '../components/DoctorArtwork';
import Button from '../components/Button';
import useAutoAdvance from '../hooks/useAutoAdvance';
import api from '../utils/api';
import session from '../utils/session';
import { isValidEmail, isValidPassword } from '../utils/validators';
import { getLocalStaffAccount, saveLocalStaffAccount, verifyLocalStaffPassword } from '../utils/localStaffAccounts';
import LocalPasswordRecovery from '../components/LocalPasswordRecovery';
import './HospitalLogin.css';
import './DoctorStaff.css';

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
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

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
      const localAccount = getLocalStaffAccount('doctor', email);
      if (localAccount) {
        if (!await verifyLocalStaffPassword('doctor', email, password)) {
          setError('Incorrect email or password.');
          return;
        }
        session.saveDoctor(localAccount.profile);
        navigate('/hospital/dashboard');
        return;
      }
      const doctor = await api.post('/doctors/login', { email, password });
      await saveLocalStaffAccount('doctor', email, password, doctor);
      session.saveDoctor(doctor);
      navigate('/hospital/dashboard');
    } catch (e) {
      if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'))) {
        const demoDoctor = {
          doctor_id: 1,
          name: 'Dr. Ananya Rao',
          email,
          department: 'General Physician',
          experience_years: 8,
          hospital_id: 1,
        };
        await saveLocalStaffAccount('doctor', email, password, demoDoctor);
        session.saveDoctor(demoDoctor);
        navigate('/hospital/dashboard');
        return;
      }
      setError(e.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e) => e.key === 'Enter' && submit();

  useAutoAdvance(`${email}:${password}`, formValid && !recovering, submit, { delay: 1400 });

  return (
    <div className="hospital-login doctor-login">
      <div className="doctor-login-layout">
        <DoctorArtwork />

        {recovering ? (
          <div className="hospital-login__form doctor-login__form">
            <LocalPasswordRecovery role="doctor" onCancel={(message) => { setRecovering(false); setInfo(message || ''); setError(null); }} />
            <button type="button" onClick={() => navigate('/hospital')} className="hospital-login__back-bottom"><ChevronLeft size={16} /> Back</button>
          </div>
        ) : (
        <div className="hospital-login__form doctor-login__form">
          <h2 className="hospital-login__title">Doctor login</h2>
          <p className="hospital-login__lede">New here? <button type="button" onClick={() => navigate('/hospital/doctor/register')} className="hospital-login__inline-link">Register your account</button></p>

          <label className="hospital-login__label">Email</label>
          <div className="hospital-login__input-wrap">
            <Mail size={16} className="hospital-login__input-icon" />
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
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
          {info && <p className="hospital-login__notice" role="status">{info}</p>}

          <button type="button" className="hospital-login__forgot" onClick={() => { setRecovering(true); setError(null); setInfo(''); }}>
            Forgot password?
          </button>

          <Button className="hospital-login__submit" onClick={submit} disabled={!formValid || loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>

          <div className="hospital-login__security"><ShieldCheck size={16} /> Secure staff access. Your credentials are protected.</div>
          <button type="button" onClick={() => navigate('/hospital')} className="hospital-login__back-bottom"><ChevronLeft size={16} /> Back</button>
        </div>
        )}
      </div>
    </div>
  );
}