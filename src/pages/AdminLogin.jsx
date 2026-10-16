import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import DoctorArtwork from '../components/DoctorArtwork';
import Button from '../components/Button';
import useAutoAdvance from '../hooks/useAutoAdvance';
import session from '../utils/session';
import { isValidEmail, isValidPassword } from '../utils/validators';
import { getLocalStaffAccount, verifyLocalStaffPassword } from '../utils/localStaffAccounts';
import LocalPasswordRecovery from '../components/LocalPasswordRecovery';
import './HospitalLogin.css';

/**
 * Real per-account admin login. First-time-only — see the redirect
 * below — after which logging in goes straight to Admin Home (Option
 * B: setup screens are never repeated, only reached again via an
 * explicit "Edit" button there).
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (session.getAdmin()) navigate('/hospital/admin/home', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = emailValid && passwordValid;

  const submit = async () => {
    if (!formValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const localAccount = getLocalStaffAccount('admin', email);
      if (localAccount) {
        if (!await verifyLocalStaffPassword('admin', email, password)) {
          setError('Incorrect email or password.');
          return;
        }
        session.saveAdmin(localAccount.profile);
        navigate('/hospital/admin/home');
        return;
      }
      setError('No admin account found on this browser. Register your hospital first.');
    } catch (e) {
      setError(e.message || 'Unable to verify your admin account.');
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e) => e.key === 'Enter' && submit();

  useAutoAdvance(`${email}:${password}`, formValid && !recovering, submit, { delay: 1400 });

  return (
    <div className="hospital-login admin-login">
      <DoctorArtwork side="right" />
      <div className="admin-login-layout">
        {recovering ? (
          <div className="hospital-login__form admin-login__form">
            <LocalPasswordRecovery role="admin" onCancel={(message) => { setRecovering(false); setInfo(message || ''); setError(null); }} />
            <button type="button" onClick={() => navigate('/hospital')} className="hospital-login__back-bottom"><ChevronLeft size={16} /> Back</button>
          </div>
        ) : (
          <div className="hospital-login__form admin-login__form">
            <h2 className="hospital-login__title">Admin login</h2>
            <p className="hospital-login__lede">First time? <button type="button" onClick={() => navigate('/hospital/admin/register')} className="hospital-login__inline-link">Register your hospital</button></p>

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
                placeholder="admin@hospital.org"
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

            <div className="hospital-login__security"><ShieldCheck size={16} /> Secure admin access. Your credentials are protected.</div>
            <button type="button" onClick={() => navigate('/hospital')} className="hospital-login__back-bottom"><ChevronLeft size={16} /> Back</button>
          </div>
        )}
      </div>
    </div>
  );
}