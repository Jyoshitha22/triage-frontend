import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import DoctorArtwork from '../components/DoctorArtwork';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import { getLocalStaffAccount, saveLocalStaffAccount, verifyLocalStaffPassword } from '../utils/localStaffAccounts';
import { isValidEmail, isValidPassword } from '../utils/validators';
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
  const loginPrefill = useMemo(() => session.getDoctorLoginPrefill() || {}, []);
  const doctorDraft = useMemo(() => session.getDoctorRegistrationDraft() || {}, []);
  const [email, setEmail] = useState(loginPrefill.email || doctorDraft.email || '');
  const [password, setPassword] = useState(loginPrefill.password || doctorDraft.password || '');
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
      const doctor = await api.post('/doctors/login', { email, password });
      await saveLocalStaffAccount('doctor', email.trim().toLowerCase(), password, doctor);
      session.saveDoctor(doctor);
      session.saveDoctorLoginPrefill({ email: email.trim().toLowerCase(), password });
      session.saveDoctorRegistrationDraft({
        ...(session.getDoctorRegistrationDraft() || {}),
        doctorId: doctor.doctor_id || session.getDoctorRegistrationDraft()?.doctorId || null,
        name: doctor.name || session.getDoctorRegistrationDraft()?.name || '',
        phone: doctor.phone || session.getDoctorRegistrationDraft()?.phone || '',
        department: doctor.department || session.getDoctorRegistrationDraft()?.department || '',
        experience: String(
          doctor.experience_years ??
            session.getDoctorRegistrationDraft()?.experience ??
            ''
        ),
        hospitalCode: String(
          doctor.hospital_code ??
            doctor.hospital_id ??
            session.getDoctorRegistrationDraft()?.hospitalCode ??
            ''
        ),
        email: email.trim().toLowerCase(),
        password,
        isRegistered: true,
        previousEmail: email.trim().toLowerCase(),
        previousPassword: password,
      });
      navigate('/hospital/dashboard');
    } catch (e) {
      const message = String(e?.message || '').toLowerCase();
      const isBackendDown =
        message.includes('temporarily unreachable') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('network error');

      if (!isBackendDown) {
        setError(e.message || 'Incorrect email or password.');
        setLoading(false);
        return;
      }

      const localAccount = getLocalStaffAccount('doctor', email);
      if (localAccount) {
        const valid = await verifyLocalStaffPassword('doctor', email, password);
        if (!valid) {
          setError('Incorrect email or password.');
          setLoading(false);
          return;
        }
        session.saveDoctor(localAccount.profile);
        session.saveDoctorLoginPrefill({ email: email.trim().toLowerCase(), password });
        session.saveDoctorRegistrationDraft({
          ...(session.getDoctorRegistrationDraft() || {}),
          doctorId: localAccount.profile?.doctor_id || session.getDoctorRegistrationDraft()?.doctorId || null,
          name: localAccount.profile?.name || session.getDoctorRegistrationDraft()?.name || '',
          phone: localAccount.profile?.phone || session.getDoctorRegistrationDraft()?.phone || '',
          department:
            localAccount.profile?.department || session.getDoctorRegistrationDraft()?.department || '',
          experience: String(
            localAccount.profile?.experience_years ??
              session.getDoctorRegistrationDraft()?.experience ??
              ''
          ),
          hospitalCode: String(
            localAccount.profile?.hospital_code ??
              localAccount.profile?.hospital_id ??
              session.getDoctorRegistrationDraft()?.hospitalCode ??
              ''
          ),
          email: email.trim().toLowerCase(),
          password,
          isRegistered: true,
          previousEmail: email.trim().toLowerCase(),
          previousPassword: password,
        });
        navigate('/hospital/dashboard');
        return;
      }
      setError('Doctor login is temporarily unavailable. Please try again in a moment.');
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    session.saveDoctorLoginPrefill({ email: normalizedEmail, password });
    const existingDraft = session.getDoctorRegistrationDraft() || {};

    if (isValidEmail(normalizedEmail) && password.trim().length > 0) {
      try {
        const doctor = await api.post('/doctors/login', { email: normalizedEmail, password });
        await saveLocalStaffAccount('doctor', normalizedEmail, password, doctor);
        session.saveDoctorRegistrationDraft({
          ...existingDraft,
          doctorId: doctor.doctor_id || existingDraft.doctorId || null,
          name: doctor.name || existingDraft.name || '',
          phone: doctor.phone || existingDraft.phone || '',
          department: doctor.department || existingDraft.department || '',
          experience: String(doctor.experience_years ?? existingDraft.experience ?? ''),
          hospitalCode: String(doctor.hospital_code ?? doctor.hospital_id ?? existingDraft.hospitalCode ?? ''),
          email: normalizedEmail,
          password,
          isRegistered: true,
          previousEmail: normalizedEmail,
          previousPassword: password,
        });
      } catch {
        session.saveDoctorRegistrationDraft({
          ...existingDraft,
          doctorId: null,
          name: '',
          phone: '',
          department: '',
          experience: '',
          hospitalCode: '',
          isRegistered: false,
          previousEmail: '',
          previousPassword: '',
          email: normalizedEmail,
          password,
        });

        const localAccount = getLocalStaffAccount('doctor', normalizedEmail);
        if (localAccount?.profile) {
          const localDoctor = localAccount.profile;
          session.saveDoctorRegistrationDraft({
            ...existingDraft,
            doctorId: localDoctor.doctor_id || existingDraft.doctorId || null,
            name: localDoctor.name || existingDraft.name || '',
            phone: localDoctor.phone || existingDraft.phone || '',
            department: localDoctor.department || existingDraft.department || '',
            experience: String(localDoctor.experience_years ?? existingDraft.experience ?? ''),
            hospitalCode: String(localDoctor.hospital_code ?? localDoctor.hospital_id ?? existingDraft.hospitalCode ?? ''),
            email: normalizedEmail,
            password,
            isRegistered: true,
            previousEmail: normalizedEmail,
            previousPassword: password,
          });
        }
      }
    } else {
      session.saveDoctorRegistrationDraft({
        ...existingDraft,
        doctorId: null,
        name: '',
        phone: '',
        department: '',
        experience: '',
        hospitalCode: '',
        isRegistered: false,
        previousEmail: '',
        previousPassword: '',
        email: normalizedEmail,
        password,
      });
    }

    navigate('/hospital/doctor/register');
  };

  return (
    <div className="hospital-login doctor-login">
      <div className="doctor-login-layout">
        <DoctorArtwork />

        <div className="hospital-login__form doctor-login__form">
          <h2 className="hospital-login__title">Doctor login</h2>
          <p className="hospital-login__lede">New here? <button type="button" onClick={goToRegister} className="hospital-login__inline-link">Register your account</button></p>

          <label className="hospital-login__label">Email</label>
          <div className="hospital-login__input-wrap">
            <Mail size={16} className="hospital-login__input-icon" />
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <button type="button" onClick={() => navigate('/hospital')} className="hospital-login__back-bottom"><ChevronLeft size={16} /> Back</button>
        </div>
      </div>
    </div>
  );
}