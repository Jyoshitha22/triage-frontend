import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import { isValidName, isValidExperienceYears, isValidEmail, isValidPassword, isRequired } from '../utils/validators';
import './HospitalRegistration.css';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
];

/**
 * "Once the hospital is registered, the doctor should register" — this
 * is that step. The doctor needs the hospital's ID (shown on Admin
 * Home) to link their account to the right hospital; the admin never
 * has to manually type this doctor's details in themselves.
 */
export default function DoctorRegister() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [experience, setExperience] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [qualification, setQualification] = useState('');
  const [languages, setLanguages] = useState(['en']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/departments').then((r) => { setDepartments(r.departments); setDepartment(r.departments[0]); }).catch(() => {});
  }, []);

  const toggleLang = (code) => setLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const nameValid = isValidName(name);
  const expValid = isValidExperienceYears(experience);
  const hospitalIdValid = isRequired(hospitalId) && !Number.isNaN(Number(hospitalId));
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = nameValid && expValid && hospitalIdValid && emailValid && passwordValid && department && languages.length > 0;

  const submit = async () => {
    setAttempted(true);
    if (!formValid || loading) return;
    setLoading(true);
    setServerError(null);
    try {
      const doctor = await api.post('/doctors/register', {
        name, phone, department, experience_years: Number(experience),
        hospital_id: Number(hospitalId), email, password,
        languages_spoken: languages.join(','), qualification,
      });
      session.saveDoctor(doctor);
      navigate('/hospital/dashboard');
    } catch (e) {
      setServerError(e.message || 'Could not register — check the hospital ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HospitalShell title="Doctor registration">
      <div className="hospital-registration">
        <button onClick={() => navigate('/hospital/doctor')} className="hospital-registration__back"><ChevronLeft size={14} /> Back</button>

        <div className="hospital-registration__header">
          <span className="hospital-registration__icon-badge"><Stethoscope size={20} /></span>
          <div>
            <h1 className="hospital-registration__title">Register your account</h1>
            <p className="hospital-registration__lede">Ask your hospital admin for your Hospital ID before you start.</p>
          </div>
        </div>

        <Card className="hospital-registration__card">
          <div className="hospital-registration__grid">
            <div>
              <label className="hospital-registration__field-label">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Full name" className="hospital-registration__input" />
              {attempted && !nameValid && <p className="field-error"><AlertCircle size={12} /> Enter a valid name.</p>}
            </div>
            <div>
              <label className="hospital-registration__field-label">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="hospital-registration__input" />
            </div>

            <div>
              <label className="hospital-registration__field-label">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="hospital-registration__input">
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="hospital-registration__field-label">Experience (years)</label>
              <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="8" className="hospital-registration__input" />
              {attempted && !expValid && <p className="field-error"><AlertCircle size={12} /> Enter valid years of experience (0–60).</p>}
            </div>

            <div>
              <label className="hospital-registration__field-label">Qualification</label>
              <input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="MBBS, MD" className="hospital-registration__input" />
            </div>
            <div>
              <label className="hospital-registration__field-label">Hospital ID</label>
              <input value={hospitalId} onChange={(e) => setHospitalId(e.target.value.replace(/\D/g, ''))} placeholder="Given by your admin" className="hospital-registration__input" />
              {attempted && !hospitalIdValid && <p className="field-error"><AlertCircle size={12} /> Enter the Hospital ID your admin shared with you.</p>}
            </div>

            <div className="hospital-registration__span2">
              <label className="hospital-registration__field-label">Languages you can consult in</label>
              <div className="hospital-registration__lang-chips">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    type="button" key={l.code} onClick={() => toggleLang(l.code)}
                    className={`hospital-registration__lang-chip ${languages.includes(l.code) ? 'hospital-registration__lang-chip--active' : ''}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="hospital-registration__hint">Matching a patient's language directly skips translation entirely — the most accurate reply they can get.</p>
            </div>
          </div>

          <p className="hospital-registration__section-label">Your login</p>
          <div className="hospital-registration__grid">
            <div>
              <label className="hospital-registration__field-label">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.org" className="hospital-registration__input" />
              {attempted && !emailValid && <p className="field-error"><AlertCircle size={12} /> Enter a valid email address.</p>}
            </div>
            <div>
              <label className="hospital-registration__field-label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="hospital-registration__input" />
              {attempted && !passwordValid && <p className="field-error"><AlertCircle size={12} /> 8+ characters, with an uppercase letter, a number, and a symbol.</p>}
            </div>
          </div>

          {serverError && <p className="field-error"><AlertCircle size={12} /> {serverError}</p>}

          <div className="hospital-registration__footer">
            <Button onClick={submit} disabled={loading} icon={ArrowRight}>{loading ? 'Registering…' : 'Create my account'}</Button>
          </div>
        </Card>
      </div>
    </HospitalShell>
  );
}