import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, AlertCircle } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import { isRequired, isValidLandlineOrPhone } from '../utils/validators';
import './HospitalRegistration.css';

const FIELDS = [
  { key: 'name', label: 'Hospital name', placeholder: 'Sunrise Multi-Specialty Hospital', span2: true, validate: isRequired, error: "Enter your hospital's name." },
  { key: 'registrationId', label: 'Registration ID', placeholder: 'HOSP-2024-00458', validate: isRequired, error: 'Enter your registration ID.' },
  { key: 'contact', label: 'Contact number', placeholder: '080 4567 8900', validate: isValidLandlineOrPhone, error: 'Enter a valid contact number (8–12 digits).' },
  { key: 'city', label: 'City', placeholder: 'Hyderabad', validate: isRequired, error: 'Enter a city.' },
  { key: 'state', label: 'State', placeholder: 'Telangana', validate: isRequired, error: 'Enter a state.' },
];

/**
 * Admin setup, done once — unlike the patient forms, it's fine to show
 * the full set of fields at once here.
 */
export default function HospitalRegistration() {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [address, setAddress] = useState('');
  const [attempted, setAttempted] = useState(false);

  const set = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));
  const errors = FIELDS.filter((f) => !f.validate(values[f.key] || ''));
  const formValid = errors.length === 0 && isRequired(address);

  const submit = () => {
    setAttempted(true);
    if (formValid) navigate('/hospital/specialists', { state: { hospital: { ...values, address } } });
  };

  return (
    <HospitalShell title="Hospital setup">
      <div className="hospital-registration">
        <div className="hospital-registration__header">
          <span className="hospital-registration__icon-badge"><Building2 size={20} /></span>
          <div>
            <h1 className="hospital-registration__title">Hospital details</h1>
            <p className="hospital-registration__lede">Tell us about your facility.</p>
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

          <div className="hospital-registration__footer">
            <Button onClick={submit} icon={ArrowRight}>Continue to specialist details</Button>
          </div>
        </Card>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="hospital-registration__field-label">{children}</label>;
}