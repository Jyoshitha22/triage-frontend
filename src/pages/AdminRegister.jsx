import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
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

/**
 * This whole form is done exactly ONCE per hospital — every future
 * admin login goes straight to Admin Home, never back through this.
 * Creates the hospital AND the first admin account together in one
 * call, since neither is useful without the other.
 */
export default function AdminRegister() {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [address, setAddress] = useState('');
  const [hospitalType, setHospitalType] = useState(HOSPITAL_TYPES[1]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));
  const fieldsValid = FIELDS.every((f) => f.validate(values[f.key] || ''));
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = fieldsValid && isRequired(address) && emailValid && passwordValid;

  const submit = async () => {
    setAttempted(true);
    if (!formValid || loading) return;
    setLoading(true);
    setServerError(null);
    try {
      const admin = await api.post('/admin/register', {
        email, password,
        hospital: { ...values, address, hospital_type: hospitalType },
      });
      session.saveAdmin(admin);
      navigate('/hospital/admin/home');
    } catch (e) {
      setServerError(e.message || 'Could not register — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HospitalShell title="Hospital setup">
      <div className="hospital-registration">
        <button onClick={() => navigate('/hospital/admin')} className="hospital-registration__back"><ChevronLeft size={14} /> Back</button>

        <div className="hospital-registration__header">
          <span className="hospital-registration__icon-badge"><Building2 size={20} /></span>
          <div>
            <h1 className="hospital-registration__title">Hospital details</h1>
            <p className="hospital-registration__lede">Tell us about your facility — this is a one-time setup.</p>
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
                    className="hospital-registration__input"
                  />
                  {showError && <p className="field-error"><AlertCircle size={12} /> {f.error}</p>}
                </div>
              );
            })}

            <div>
              <FieldLabel>Hospital type</FieldLabel>
              <select value={hospitalType} onChange={(e) => setHospitalType(e.target.value)} className="hospital-registration__input">
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
                className="hospital-registration__textarea"
              />
              {attempted && !isRequired(address) && <p className="field-error"><AlertCircle size={12} /> Enter the hospital's address.</p>}
            </div>
          </div>

          <p className="hospital-registration__section-label">Your admin account</p>
          <div className="hospital-registration__grid">
            <div>
              <FieldLabel>Email</FieldLabel>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hospital.org" className="hospital-registration__input" />
              {attempted && !emailValid && <p className="field-error"><AlertCircle size={12} /> Enter a valid email address.</p>}
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="hospital-registration__input" />
              {attempted && !passwordValid && <p className="field-error"><AlertCircle size={12} /> 8+ characters, with an uppercase letter, a number, and a symbol.</p>}
            </div>
          </div>

          {serverError && <p className="field-error"><AlertCircle size={12} /> {serverError}</p>}

          <div className="hospital-registration__footer">
            <Button onClick={submit} disabled={loading} icon={ArrowRight}>{loading ? 'Setting up…' : 'Complete setup'}</Button>
          </div>
        </Card>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="hospital-registration__field-label">{children}</label>;
}