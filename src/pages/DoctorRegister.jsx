import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import session from '../utils/session';
import { saveLocalStaffAccount } from '../utils/localStaffAccounts';
import {
  isValidName,
  isValidExperienceYears,
  isValidEmail,
  isValidPassword,
  isRequired
} from '../utils/validators';
import './HospitalRegistration.css';
import './DoctorStaff.css';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
];

const DEPARTMENT_OPTIONS = [
  'General Physician',
  'Cardiologist',
  'Gynaecologist',
  'Dentist',
];

export default function DoctorRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [experience, setExperience] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [qualification, setQualification] = useState('');
  const [languages, setLanguages] = useState(['en']);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleLang = (code) => {
    setLanguages((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  const nameValid = isValidName(name);
  const expValid = isValidExperienceYears(experience);
  const hospitalIdValid =
    isRequired(hospitalId) && !Number.isNaN(Number(hospitalId));
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);

  const formValid =
    nameValid &&
    expValid &&
    hospitalIdValid &&
    emailValid &&
    passwordValid &&
    department &&
    languages.length > 0;

  const submit = async () => {
    setAttempted(true);

    if (!formValid || loading) return;

    setLoading(true);
    setServerError(null);

    try {
      const doctor = {
        doctor_id: `local-doctor-${Date.now()}`,
        name,
        phone,
        department,
        experience_years: Number(experience),
        hospital_id: Number(hospitalId),
        email: email.trim().toLowerCase(),
        languages_spoken: languages.join(','),
        qualification,
      };

      await saveLocalStaffAccount('doctor', email, password, doctor);
      session.saveDoctor(doctor);
      navigate('/hospital/dashboard');
    } catch (e) {
      setServerError(
        e.message ||
          'Could not register — check the hospital ID and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <HospitalShell compact wide showDoctorArtwork>
      <div className="doctor-register-layout">
        <div className="doctor-register-content">
      <div className="hospital-registration">

        <div className="hospital-registration__header">
          <span className="hospital-registration__icon-badge">
            <Stethoscope size={20} />
          </span>

          <div>
            <h1 className="hospital-registration__title">
              Register your account
            </h1>

            <p className="hospital-registration__lede">
              Ask your hospital admin for your Hospital ID before you start.
            </p>
          </div>
        </div>

        <Card className="hospital-registration__card">

          <div className="hospital-registration__grid">

            {/* Full Name */}
            <div>
              <label className="hospital-registration__field-label">
                Full name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Full name"
                className="hospital-registration__input"
              />

              {attempted && !nameValid && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  Enter a valid name.
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="hospital-registration__field-label">
                Phone
              </label>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="hospital-registration__input"
              />
            </div>

            {/* Department */}
            <div>
              <label className="hospital-registration__field-label">
                Department
              </label>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="hospital-registration__input"
              >
                <option value="">Select department</option>

                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="hospital-registration__field-label">
                Experience (years)
              </label>

              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="8"
                className="hospital-registration__input"
              />

              {attempted && !expValid && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  Enter valid years of experience (0–60).
                </p>
              )}
            </div>

            {/* Qualification */}
            <div>
              <label className="hospital-registration__field-label">
                Qualification
              </label>

              <input
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="MBBS, MD"
                className="hospital-registration__input"
              />
            </div>

            {/* Hospital ID */}
            <div>
              <label className="hospital-registration__field-label">
                Hospital ID
              </label>

              <input
                value={hospitalId}
                onChange={(e) =>
                  setHospitalId(e.target.value.replace(/\D/g, ''))
                }
                placeholder="Given by your admin"
                className="hospital-registration__input"
              />

              {attempted && !hospitalIdValid && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  Enter the Hospital ID your admin shared with you.
                </p>
              )}
            </div>

            {/* Languages */}
            <div className="hospital-registration__span2">

              <label className="hospital-registration__field-label">
                Languages you can consult in
              </label>

              <div className="hospital-registration__lang-chips">

                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    type="button"
                    key={l.code}
                    onClick={() => toggleLang(l.code)}
                    className={`hospital-registration__lang-chip ${
                      languages.includes(l.code)
                        ? 'hospital-registration__lang-chip--active'
                        : ''
                    }`}
                  >
                    {l.label}
                  </button>
                ))}

              </div>

              <p className="hospital-registration__hint">
                Matching a patient's language directly skips translation
                entirely — the most accurate reply they can get.
              </p>

            </div>
          </div>

          {/* Login Section */}
          <p className="hospital-registration__section-label">
            Your login
          </p>

          <div className="hospital-registration__grid">

            {/* Email */}
            <div>
              <label className="hospital-registration__field-label">
                Email
              </label>

              <input
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onBlur={() => setEmailTouched(true)}
                onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
                placeholder="you@hospital.org"
                className="hospital-registration__input"
              />

              {(attempted || emailTouched) && !emailValid && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  Enter a valid email address.
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="hospital-registration__field-label">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="hospital-registration__input"
              />

              {attempted && !passwordValid && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  8+ characters, with an uppercase letter, a number, and a
                  symbol.
                </p>
              )}
            </div>

          </div>

          {/* Server Error */}
          {serverError && (
            <p className="field-error">
              <AlertCircle size={12} />
              {serverError}
            </p>
          )}

          {/* Submit */}
          <div className="hospital-registration__footer">

            <Button
              onClick={submit}
              disabled={loading}
              icon={ArrowRight}
            >
              {loading ? 'Registering…' : 'Create my account'}
            </Button>

          </div>

        </Card>
        <button type="button" onClick={() => navigate('/hospital/doctor')} className="hospital-registration__back hospital-registration__back--bottom">
          <ChevronLeft size={16} /> Back
        </button>
      </div>
        </div>
      </div>
    </HospitalShell>
  );
}
