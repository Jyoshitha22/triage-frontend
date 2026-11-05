import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, AlertCircle, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import { saveLocalStaffAccount, updateLocalStaffProfile } from '../utils/localStaffAccounts';
import { isRequired, isValidLandlineOrPhone, isValidEmail, isValidPassword } from '../utils/validators';
import './HospitalRegistration.css';

const HOSPITAL_TYPES = ['Government', 'Private', 'Clinic'];

export default function EditHospital() {
  const navigate = useNavigate();
  const admin = session.getAdmin();
  const prefill = session.getAdminLoginPrefill() || {};
  const registrationDraft = session.getAdminRegistrationDraft() || {};
  const initialValues = { ...(registrationDraft || {}), ...(admin?.hospital || {}) };
  const initialEmail = prefill.email || admin?.email || '';
  const initialPassword = registrationDraft.password || prefill.password || '';

  const [values, setValues] = useState(initialValues);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [emailTouched, setEmailTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [backValidation, setBackValidation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialSnapshot] = useState(() => ({
    hospital_name: String(initialValues.hospital_name || '').trim(),
    registration_id: String(initialValues.registration_id || '').trim(),
    phone: String(initialValues.phone || '').trim(),
    city: String(initialValues.city || '').trim(),
    state: String(initialValues.state || '').trim(),
    address: String(initialValues.address || '').trim(),
    hospital_type: String(initialValues.hospital_type || HOSPITAL_TYPES[1]).trim(),
    email: String(initialEmail || '').trim().toLowerCase(),
    password: String(initialPassword || ''),
  }));

  useEffect(() => {
    if (!admin) navigate('/hospital/admin', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, v) => {
    if (backValidation) setBackValidation('');
    setValues((prev) => ({ ...prev, [key]: v }));
  };
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = isRequired(values.hospital_name) && isRequired(values.address)
    && isRequired(values.city) && isRequired(values.state) && isValidLandlineOrPhone(values.phone || '')
    && emailValid && passwordValid;
  const currentSnapshot = {
    hospital_name: String(values.hospital_name || '').trim(),
    registration_id: String(values.registration_id || '').trim(),
    phone: String(values.phone || '').trim(),
    city: String(values.city || '').trim(),
    state: String(values.state || '').trim(),
    address: String(values.address || '').trim(),
    hospital_type: String(values.hospital_type || HOSPITAL_TYPES[1]).trim(),
    email: String(email || '').trim().toLowerCase(),
    password: String(password || ''),
  };
  const hasChanges = JSON.stringify(currentSnapshot) !== JSON.stringify(initialSnapshot);

  const onBack = () => {
    if (hasChanges) {
      setBackValidation('Please save the details.');
      return;
    }
    navigate('/hospital/admin/home');
  };

  const submit = async () => {
    setAttempted(true);
    if (!formValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const hospital = await api.put(`/hospitals/${admin.hospital_id}`, {
        hospital_name: values.hospital_name,
        registration_id: values.registration_id,
        phone: values.phone,
        city: values.city,
        state: values.state,
        address: values.address,
        hospital_type: values.hospital_type,
      });
      let updatedEmail = email.trim().toLowerCase();
      try {
        const adminUpdated = await api.put(`/admins/${admin.admin_id}`, {
          email: updatedEmail,
          password,
        });
        updatedEmail = adminUpdated.email || updatedEmail;
      } catch {
        // Keep local credential update even if backend admin update is unavailable.
      }

      const updatedAdmin = { ...admin, email: updatedEmail, hospital, hospital_id: hospital.hospital_id || admin.hospital_id };
      session.saveAdmin(updatedAdmin);
      session.saveAdminLoginPrefill({ email: updatedEmail, password });
      session.saveAdminRegistrationDraft({
        ...hospital,
        email: updatedEmail,
        password,
      });
      await saveLocalStaffAccount('admin', updatedEmail, password, updatedAdmin);
      setSaved(true);
      setTimeout(() => navigate('/hospital/admin/home'), 700);
    } catch (e) {
      const fallbackHospital = {
        ...admin.hospital,
        ...values,
        hospital_id: admin.hospital_id,
      };
      const updatedAdmin = {
        ...admin,
        email: email.trim().toLowerCase(),
        hospital: fallbackHospital,
        hospital_id: fallbackHospital.hospital_id,
      };
      session.saveAdmin(updatedAdmin);
      updateLocalStaffProfile('admin', admin.email, updatedAdmin);
      session.saveAdminLoginPrefill({ email: email.trim().toLowerCase(), password });
      session.saveAdminRegistrationDraft({
        ...fallbackHospital,
        email: email.trim().toLowerCase(),
        password,
      });
      await saveLocalStaffAccount('admin', email.trim().toLowerCase(), password, updatedAdmin);
      setSaved(true);
      setTimeout(() => navigate('/hospital/admin/home'), 700);
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  return (
    <HospitalShell compact wide showDoctorArtwork doctorArtworkSide="right">
      <div className="hospital-registration">
        <div className="hospital-registration__header">
          <span className="hospital-registration__icon-badge"><Building2 size={20} /></span>
          <div>
            <h1 className="hospital-registration__title">Edit hospital details</h1>
            <p className="hospital-registration__lede">You can update your hospital details whenever your hospital location or contact information changes, ensuring patients can always reach you.</p>
          </div>
        </div>

        <Card className="hospital-registration__card">
          <div className="hospital-registration__grid">
            <div className="hospital-registration__span2">
              <label className="hospital-registration__field-label">Hospital name</label>
              <input value={values.hospital_name || ''} onChange={(e) => set('hospital_name', e.target.value)} className="hospital-registration__input" />
              {attempted && !isRequired(values.hospital_name) && <p className="field-error"><AlertCircle size={12} /> Enter your hospital's name.</p>}
            </div>
            <div>
              <label className="hospital-registration__field-label">Registration ID</label>
              <input value={values.registration_id || ''} onChange={(e) => set('registration_id', e.target.value)} className="hospital-registration__input" />
            </div>
            <div>
              <label className="hospital-registration__field-label">Contact number</label>
              <input value={values.phone || ''} onChange={(e) => set('phone', e.target.value)} className="hospital-registration__input" />
              {attempted && !isValidLandlineOrPhone(values.phone || '') && <p className="field-error"><AlertCircle size={12} /> Enter a valid contact number (8–12 digits).</p>}
            </div>
            <div>
              <label className="hospital-registration__field-label">City</label>
              <input value={values.city || ''} onChange={(e) => set('city', e.target.value)} className="hospital-registration__input" />
              {attempted && !isRequired(values.city) && <p className="field-error"><AlertCircle size={12} /> Enter a city.</p>}
            </div>
            <div>
              <label className="hospital-registration__field-label">State</label>
              <input value={values.state || ''} onChange={(e) => set('state', e.target.value)} className="hospital-registration__input" />
              {attempted && !isRequired(values.state) && <p className="field-error"><AlertCircle size={12} /> Enter a state.</p>}
            </div>
            <div>
              <label className="hospital-registration__field-label">Hospital type</label>
              <select value={values.hospital_type || HOSPITAL_TYPES[1]} onChange={(e) => set('hospital_type', e.target.value)} className="hospital-registration__input">
                {HOSPITAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="hospital-registration__span2">
              <label className="hospital-registration__field-label">Address</label>
              <textarea rows={3} value={values.address || ''} onChange={(e) => set('address', e.target.value)} className="hospital-registration__textarea" />
              {attempted && !isRequired(values.address) && <p className="field-error"><AlertCircle size={12} /> Enter the hospital's address.</p>}
            </div>

            <div>
              <label className="hospital-registration__field-label">Admin Email</label>
              <input
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onBlur={() => setEmailTouched(true)}
                onChange={(e) => {
                  if (backValidation) setBackValidation('');
                  setEmail(e.target.value);
                  setEmailTouched(true);
                }}
                className="hospital-registration__input"
              />
              {(attempted || emailTouched) && !emailValid && <p className="field-error"><AlertCircle size={12} /> Enter a valid email address.</p>}
            </div>
            <div>
              <label className="hospital-registration__field-label">Admin Password</label>
              <div className="hospital-registration__password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    if (backValidation) setBackValidation('');
                    setPassword(e.target.value);
                  }}
                  className="hospital-registration__input hospital-registration__input--password"
                />
                <button
                  type="button"
                  className="hospital-registration__password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {attempted && !passwordValid && <p className="field-error"><AlertCircle size={12} /> 8+ characters, with an uppercase letter, a number, and a symbol.</p>}
            </div>
          </div>

          {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}

          <div className="hospital-registration__actions">
            <div className="hospital-registration__footer">
              <Button onClick={submit} disabled={loading} icon={Check}>{loading ? 'Saving…' : saved ? 'Saved' : 'Save changes'}</Button>
            </div>
            {backValidation && (
              <p className="hospital-registration__back-validation"><AlertCircle size={12} /> {backValidation}</p>
            )}
          </div>
        </Card>
        <button type="button" onClick={onBack} className="hospital-registration__back hospital-registration__back--bottom"><ChevronLeft size={16} /> Back</button>
      </div>
    </HospitalShell>
  );
}