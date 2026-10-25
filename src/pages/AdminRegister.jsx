import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import { saveLocalStaffAccount } from '../utils/localStaffAccounts';
import { isRequired, isValidLandlineOrPhone, isValidEmail, isValidPassword } from '../utils/validators';
import './HospitalRegistration.css';

const HOSPITAL_TYPES = ['Government', 'Private', 'Clinic'];

const FIELDS = [
  { key: 'hospital_name', label: 'Hospital name', placeholder: 'Sunrise Multi-Specialty Hospital', span2: true, validate: isRequired, error: "Enter your hospital's name." },
  { key: 'registration_id', label: 'Registration ID', placeholder: 'HOSP-2024-00458', validate: isRequired, error: 'Enter your registration ID.' },
  { key: 'phone', label: 'Contact number', placeholder: '080 4567 8900', validate: isValidLandlineOrPhone, error: 'Enter a valid contact number (8–12 digits).' },
  { key: 'city', label: 'City', placeholder: 'Hyderabad', validate: isRequired, error: 'Enter a city.' },
  { key: 'state', label: 'State', placeholder: 'Telangana', validate: isRequired, error: 'Enter a state.' },
];

export default function AdminRegister() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const savedDraft = session.getAdminRegistrationDraft();
  const savedAdmin = session.getAdmin();
  const loginPrefill = session.getAdminLoginPrefill() || {};
  const draft = {
    ...(savedAdmin?.hospital || {}),
    ...(state?.registeredHospital || {}),
    ...(savedDraft || {}),
  };
  const hasRegisteredData = Boolean(
    state?.registeredHospital ||
    savedDraft?.isRegistered ||
    savedAdmin?.hospital?.hospital_id ||
    savedAdmin?.hospital_id
  );
  const [values, setValues] = useState({
    hospital_name: draft.hospital_name || '',
    registration_id: draft.registration_id || '',
    phone: draft.phone || '',
    city: draft.city || '',
    state: draft.state || '',
  });
  const [address, setAddress] = useState(draft.address || '');
  const [hospitalType, setHospitalType] = useState(draft.hospital_type || HOSPITAL_TYPES[1]);
  const [email, setEmail] = useState(draft.email || loginPrefill.email || state?.email || '');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState(draft.password || loginPrefill.password || state?.password || '');
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));
  const fieldsValid = FIELDS.every((f) => f.validate(values[f.key] || ''));
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = fieldsValid && isRequired(address) && emailValid && passwordValid;

  const submit = async () => {
    if (hasRegisteredData) {
      navigate('/hospital/admin');
      return;
    }
    setAttempted(true);
    if (!formValid || loading) return;
    setLoading(true);
    setServerError(null);
    try {
      const payload = {
        ...values,
        email: email.trim().toLowerCase(),
        password,
        address,
        hospital_type: hospitalType,
      };

      let createdAdmin;
      try {
        createdAdmin = await api.post('/hospitals/register', payload);
      } catch (err) {
        const isNotFound = String(err?.message || '').toLowerCase().includes('not found');
        if (!isNotFound) throw err;
        createdAdmin = await api.post('/api/admin/register', {
          email: payload.email,
          password: payload.password,
          hospital: {
            hospital_name: payload.hospital_name,
            registration_id: payload.registration_id,
            phone: payload.phone,
            city: payload.city,
            state: payload.state,
            address: payload.address,
            hospital_type: payload.hospital_type,
          },
        });
      }

      session.saveAdminLoginPrefill({ email: payload.email, password: payload.password });
      session.saveAdminRegistrationDraft({
        ...createdAdmin.hospital,
        email: payload.email,
        password: payload.password,
        isRegistered: true,
      });
      await saveLocalStaffAccount('admin', payload.email, payload.password, createdAdmin);
      session.saveAdmin(createdAdmin);
      navigate('/hospital/admin');
    } catch (e) {
      setServerError(e.message || 'Could not register — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HospitalShell compact wide showDoctorArtwork doctorArtworkSide="right">
      <div className="hospital-registration">
        <div className="hospital-registration__header">
          <span className="hospital-registration__icon-badge"><Building2 size={20} /></span>
          <div>
            <h1 className="hospital-registration__title">Hospital details</h1>
          </div>
        </div>

        <Card className="hospital-registration__card">
          <div className="hospital-registration__grid">
            {FIELDS.map((f) => {
              const value = values[f.key] || '';
              const showError = attempted && !f.validate(value);
              return (
                <div key={f.key} className={f.span2 ? 'hospital-registration__span2' : ''}>
                  <FieldLabel>{f.label}</FieldLabel>
                  <input
                    value={value}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={`hospital-registration__input ${hasRegisteredData ? 'hospital-registration__input--locked' : ''}`}
                    readOnly={hasRegisteredData}
                  />
                  {showError && <p className="field-error"><AlertCircle size={12} /> {f.error}</p>}
                </div>
              );
            })}

            <div>
              <FieldLabel>Hospital type</FieldLabel>
              <select value={hospitalType} onChange={(e) => setHospitalType(e.target.value)} className={`hospital-registration__input ${hasRegisteredData ? 'hospital-registration__input--locked' : ''}`} disabled={hasRegisteredData}>
                {HOSPITAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="hospital-registration__span2">
              <FieldLabel>Address</FieldLabel>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, area, PIN code"
                className={`hospital-registration__textarea ${hasRegisteredData ? 'hospital-registration__input--locked' : ''}`}
                readOnly={hasRegisteredData}
              />
              {attempted && !isRequired(address) && <p className="field-error"><AlertCircle size={12} /> Enter the hospital's address.</p>}
            </div>
          </div>

          <p className="hospital-registration__section-label">Your admin account</p>
          <div className="hospital-registration__grid">
            <div>
              <FieldLabel>Email</FieldLabel>
              <input type="email" autoComplete="email" maxLength={254} value={email} onBlur={() => setEmailTouched(true)} onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }} placeholder="admin@hospital.org" className={`hospital-registration__input ${hasRegisteredData ? 'hospital-registration__input--locked' : ''}`} readOnly={hasRegisteredData} />
              {(attempted || emailTouched) && !emailValid && <p className="field-error"><AlertCircle size={12} /> Enter a valid email address.</p>}
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={`hospital-registration__input ${hasRegisteredData ? 'hospital-registration__input--locked' : ''}`} readOnly={hasRegisteredData} />
              {attempted && !passwordValid && <p className="field-error"><AlertCircle size={12} /> 8+ characters, with an uppercase letter, a number, and a symbol.</p>}
            </div>
          </div>

          {serverError && <p className="field-error"><AlertCircle size={12} /> {serverError}</p>}

          <div className="hospital-registration__footer">
            <Button onClick={submit} disabled={loading} icon={ArrowRight}>{loading ? 'Setting up…' : hasRegisteredData ? 'Done' : 'Complete setup'}</Button>
          </div>
        </Card>
        <button type="button" onClick={() => navigate('/hospital/admin')} className="hospital-registration__back hospital-registration__back--bottom"><ChevronLeft size={16} /> Back</button>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="hospital-registration__field-label">{children}</label>;
}