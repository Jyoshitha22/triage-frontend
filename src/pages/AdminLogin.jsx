import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import DoctorArtwork from '../components/DoctorArtwork';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import { getLocalStaffAccount, saveLocalStaffAccount, verifyLocalStaffPassword } from '../utils/localStaffAccounts';
import { isValidEmail, isValidPassword } from '../utils/validators';
import './HospitalLogin.css';

function normalizeHospitalCode(code, hospitalId) {
  const raw = String(code || '').trim();
  if (raw) {
    // Keep backend-issued Hospital ID as the single source of truth.
    if (/^\d+$/.test(raw)) return raw.padStart(12, '0').slice(-12);
    return raw;
  }
  const fallback = String(hospitalId || '').trim();
  if (!fallback) return '';
  if (/^\d+$/.test(fallback)) return fallback.padStart(12, '0').slice(-12);
  return fallback;
}

function normalizeAdminForSession(admin) {
  if (!admin?.hospital) return admin;
  return {
    ...admin,
    hospital: {
      ...admin.hospital,
      hospital_code: normalizeHospitalCode(admin.hospital.hospital_code, admin.hospital.hospital_id || admin.hospital_id),
    },
  };
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const prefill = session.getAdminLoginPrefill() || {};
  const [email, setEmail] = useState(prefill.email || '');
  const [password, setPassword] = useState(prefill.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = emailValid && passwordValid;

  const submit = async () => {
    if (!formValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      let admin;
      try {
        admin = await api.post('/admins/login', { email, password });
      } catch (err) {
        const isNotFound = String(err?.message || '').toLowerCase().includes('not found');
        if (!isNotFound) throw err;
        admin = await api.post('/api/admin/login', { email, password });
      }
      admin = normalizeAdminForSession(admin);
      session.saveAdminLoginPrefill({ email: email.trim().toLowerCase(), password });
      session.saveAdminRegistrationDraft({
        ...admin.hospital,
        email: email.trim().toLowerCase(),
        password,
        isRegistered: true,
      });
      await saveLocalStaffAccount('admin', email.trim().toLowerCase(), password, admin);
      session.saveAdmin(admin);
      navigate('/hospital/admin/home');
    } catch (e) {
      const message = String(e?.message || '').toLowerCase();
      const isBackendDown =
        message.includes('temporarily unreachable') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('network error');

      const localAccount = getLocalStaffAccount('admin', email);
      if (localAccount) {
        const valid = await verifyLocalStaffPassword('admin', email, password);
        if (valid) {
          const normalizedLocal = normalizeAdminForSession(localAccount.profile);
          session.saveAdmin(normalizedLocal);
          session.saveAdminLoginPrefill({ email: email.trim().toLowerCase(), password });
          session.saveAdminRegistrationDraft({
            ...(normalizedLocal?.hospital || {}),
            email: email.trim().toLowerCase(),
            password,
            isRegistered: true,
          });
          navigate('/hospital/admin/home');
          return;
        }
      }

      if (!isBackendDown) {
        setError(e.message || 'Unable to verify your admin account.');
        setLoading(false);
        return;
      }
      setError('Hospital login is temporarily unavailable. Please try again in a moment.');
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    session.saveAdminLoginPrefill({ email: normalizedEmail, password });
    let registeredHospital = null;

    if (isValidEmail(normalizedEmail) && isValidPassword(password)) {
      try {
        let admin;
        try {
          admin = await api.post('/admins/login', { email: normalizedEmail, password });
        } catch (err) {
          const isNotFound = String(err?.message || '').toLowerCase().includes('not found');
          if (!isNotFound) throw err;
          admin = await api.post('/api/admin/login', { email: normalizedEmail, password });
        }

        admin = normalizeAdminForSession(admin);
        registeredHospital = admin?.hospital || null;
        session.saveAdminRegistrationDraft({
          ...admin.hospital,
          email: normalizedEmail,
          password,
          isRegistered: true,
        });
        session.saveAdmin(admin);
      } catch {
        // First-time setup or backend unavailable: proceed to registration.
      }
    }

    navigate('/hospital/admin/register', {
      state: {
        email: normalizedEmail,
        password,
        registeredHospital,
      },
    });
  };

  return (
    <div className="hospital-login admin-login">
      <DoctorArtwork side="right" />
      <div className="admin-login-layout">
          <div className="hospital-login__form admin-login__form">
            <h2 className="hospital-login__title">Admin login</h2>
            <p className="hospital-login__lede">First time? <button type="button" onClick={goToRegister} className="hospital-login__inline-link">Register your hospital</button></p>

            <label className="hospital-login__label">Email</label>
            <div className="hospital-login__input-wrap">
              <Mail size={16} className="hospital-login__input-icon" />
              <input
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div className="hospital-login__security"><ShieldCheck size={16} /> Secure admin access. Your credentials are protected.</div>
            <button type="button" onClick={() => navigate('/hospital')} className="hospital-login__back-bottom"><ChevronLeft size={16} /> Back</button>
          </div>
      </div>
    </div>
  );
}