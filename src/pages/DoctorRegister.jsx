import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import { getLocalStaffAccount, saveLocalStaffAccount, updateLocalStaffProfile } from '../utils/localStaffAccounts';
import {
  isValidName,
  isValidExperienceYears,
  isValidEmail,
  isValidPassword,
  isRequired,
} from '../utils/validators';
import './HospitalRegistration.css';
import './DoctorStaff.css';

const DEPARTMENT_OPTIONS = [
  'General Physician',
  'Cardiologist',
  'Nephrologist',
  'Pulmonologist',
  'Dermatologist',
  'Neurosurgeon',
  'Orthopaedician',
  'Ophthalmologist',
  'Plastic Surgeon',
  'Pediatrician',
  'Dentist',
];

function draftFromDoctorProfile(profile = {}, fallback = {}) {
  return {
    doctorId: profile.doctor_id || fallback.doctorId || null,
    name: profile.name || fallback.name || '',
    phone: profile.phone || fallback.phone || '',
    department: profile.department || fallback.department || '',
    experience: String(profile.experience_years ?? fallback.experience ?? ''),
    hospitalCode: String(profile.hospital_code ?? profile.hospital_id ?? fallback.hospitalCode ?? ''),
    email: profile.email || fallback.email || '',
  };
}

function isNumericHospitalCode(value) {
  return /^\d{1,12}$/.test(String(value || ''));
}

export default function DoctorRegister() {
  const navigate = useNavigate();
  const doctorDraft = useMemo(() => session.getDoctorRegistrationDraft() || {}, []);
  const activeDoctor = useMemo(() => session.getDoctor() || {}, []);
  const mergedDoctorSetup = useMemo(
    () => ({
      doctorId: doctorDraft.doctorId ?? activeDoctor.doctor_id ?? null,
      name: activeDoctor.name || doctorDraft.name || '',
      phone: activeDoctor.phone || doctorDraft.phone || '',
      department: activeDoctor.department || doctorDraft.department || '',
      experience: String(activeDoctor.experience_years || doctorDraft.experience || ''),
      hospitalCode: String(activeDoctor.hospital_code || activeDoctor.hospital_id || doctorDraft.hospitalCode || ''),
      email: doctorDraft.email || activeDoctor.email || '',
      password: doctorDraft.password || '',
      isRegistered: Boolean(doctorDraft.isRegistered || activeDoctor.doctor_id),
      previousEmail: (doctorDraft.previousEmail || doctorDraft.email || activeDoctor.email || '').trim().toLowerCase(),
      previousPassword: doctorDraft.previousPassword || doctorDraft.password || '',
    }),
    [doctorDraft, activeDoctor],
  );
  const hasPrefilledSetup = Boolean(
    mergedDoctorSetup.name ||
    mergedDoctorSetup.department ||
    mergedDoctorSetup.experience ||
    mergedDoctorSetup.hospitalCode ||
    mergedDoctorSetup.phone ||
    mergedDoctorSetup.email ||
    mergedDoctorSetup.password
  );

  const [name, setName] = useState(mergedDoctorSetup.name);
  const [phone, setPhone] = useState(mergedDoctorSetup.phone);
  const [department, setDepartment] = useState(mergedDoctorSetup.department);
  const [experience, setExperience] = useState(mergedDoctorSetup.experience);
  const [hospitalCode, setHospitalCode] = useState(mergedDoctorSetup.hospitalCode);
  const [email, setEmail] = useState(mergedDoctorSetup.email);
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState(mergedDoctorSetup.password);
  const [previousEmail] = useState(mergedDoctorSetup.previousEmail);
  const [previousPassword] = useState(mergedDoctorSetup.previousPassword);
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [liveValidationError, setLiveValidationError] = useState('');
  const [liveValidationCode, setLiveValidationCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalizedEmail = String(mergedDoctorSetup.email || '').trim().toLowerCase();
    const currentPassword = String(mergedDoctorSetup.password || '');
    if (!normalizedEmail) return;

    let cancelled = false;
    const existingDraft = session.getDoctorRegistrationDraft() || {};

    const localAccount = getLocalStaffAccount('doctor', normalizedEmail);
    if (localAccount?.profile) {
      const fromLocal = draftFromDoctorProfile(localAccount.profile, {
        ...existingDraft,
        email: normalizedEmail,
      });
      if (!cancelled) {
        setName(fromLocal.name);
        setPhone(fromLocal.phone);
        setDepartment(fromLocal.department);
        setExperience(fromLocal.experience);
        setHospitalCode(fromLocal.hospitalCode);
        setEmail(fromLocal.email || normalizedEmail);
        session.saveDoctorRegistrationDraft({
          ...existingDraft,
          ...fromLocal,
          password: currentPassword || existingDraft.password || '',
          isRegistered: true,
          previousEmail: normalizedEmail,
          previousPassword: currentPassword || existingDraft.password || '',
        });
      }
    }

    if (!isValidEmail(normalizedEmail) || !currentPassword) return () => { cancelled = true; };

    api.post('/doctors/login', { email: normalizedEmail, password: currentPassword })
      .then(async (doctor) => {
        if (cancelled || !doctor) return;
        await saveLocalStaffAccount('doctor', normalizedEmail, currentPassword, doctor);
        const fromServer = draftFromDoctorProfile(doctor, {
          ...existingDraft,
          email: normalizedEmail,
        });
        setName(fromServer.name);
        setPhone(fromServer.phone);
        setDepartment(fromServer.department);
        setExperience(fromServer.experience);
        setHospitalCode(fromServer.hospitalCode);
        setEmail(fromServer.email || normalizedEmail);
        session.saveDoctorLoginPrefill({ email: normalizedEmail, password: currentPassword });
        session.saveDoctorRegistrationDraft({
          ...existingDraft,
          ...fromServer,
          password: currentPassword,
          isRegistered: true,
          previousEmail: normalizedEmail,
          previousPassword: currentPassword,
        });
      })
      .catch(() => {
        // Keep local draft state when login sync is temporarily unavailable.
      });

    return () => { cancelled = true; };
  }, [mergedDoctorSetup.email, mergedDoctorSetup.password]);

  const isRegisteredDoctor = Boolean(
    mergedDoctorSetup.isRegistered ||
    (mergedDoctorSetup.name &&
      mergedDoctorSetup.department &&
      mergedDoctorSetup.experience &&
      mergedDoctorSetup.hospitalCode &&
      mergedDoctorSetup.doctorId)
  );

  const nameValid = isValidName(name);
  const expValid = isValidExperienceYears(experience);
  const hospitalCodeValid = /^\d{1,12}$/.test(hospitalCode);
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);

  const formValid =
    nameValid &&
    expValid &&
    hospitalCodeValid &&
    emailValid &&
    passwordValid &&
    department;

  const editableChanged =
    String(hospitalCode || '').trim() !== String(mergedDoctorSetup.hospitalCode || '').trim() ||
    String(phone || '').trim() !== String(mergedDoctorSetup.phone || '').trim() ||
    String(email || '').trim().toLowerCase() !== String(mergedDoctorSetup.email || '').trim().toLowerCase() ||
    String(password || '') !== String(mergedDoctorSetup.password || '');

  const canSubmit = isRegisteredDoctor ? (formValid && editableChanged) : formValid;

  useEffect(() => {
    if (isRegisteredDoctor) {
      setLiveValidationError('');
      setLiveValidationCode('');
      return;
    }

    const trimmedName = String(name || '').trim();
    const trimmedCode = String(hospitalCode || '').trim();

    if (!trimmedCode || !trimmedName) {
      setLiveValidationError('');
      setLiveValidationCode('');
      return;
    }

    // Avoid false "not found" while the user is still typing a 12-digit Hospital ID.
    if (trimmedCode.length < 12) {
      setLiveValidationError('');
      setLiveValidationCode('');
      return;
    }

    if (!isNumericHospitalCode(trimmedCode)) {
      setLiveValidationError('Hospital ID is invalid.');
      setLiveValidationCode('hospital_id_invalid');
      return;
    }

    if (!isValidName(trimmedName)) {
      setLiveValidationError('');
      setLiveValidationCode('');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        hospital_code: trimmedCode,
        name: trimmedName,
      });
      if (department) {
        params.set('department', department);
      }
      if (experience !== '' && !Number.isNaN(Number(experience))) {
        params.set('experience_years', String(Number(experience)));
      }

      api.getWithOptions(`/doctors/approval-check?${params.toString()}`, {
        timeoutMs: 12000,
        signal: controller.signal,
        noCache: true,
      })
        .then((result) => {
          if (result?.ok) {
            setLiveValidationError('');
            setLiveValidationCode('approved');
            return;
          }
          if (result?.code === 'doctor_not_approved') {
            setLiveValidationError('This doctor is not approved by admin yet. Please contact your hospital admin.');
            setLiveValidationCode('doctor_not_approved');
            return;
          }
          if (result?.code === 'details_mismatch') {
            setLiveValidationError('The details do not match admin-approved records for this doctor.');
            setLiveValidationCode('details_mismatch');
            return;
          }
          if (result?.code === 'hospital_id_not_found') {
            setLiveValidationError('Hospital ID not found. Please use the exact Hospital ID shared by admin.');
            setLiveValidationCode('hospital_id_not_found');
            return;
          }
          if (result?.code === 'hospital_id_invalid') {
            setLiveValidationError('Hospital ID is invalid.');
            setLiveValidationCode('hospital_id_invalid');
            return;
          }
          setLiveValidationError(result?.message || 'Could not validate doctor details right now.');
          setLiveValidationCode('validation_error');
        })
        .catch((err) => {
          if (String(err?.name || '') === 'AbortError') return;
          // Do not block registration UI when server is temporarily unavailable.
          setLiveValidationError('');
          setLiveValidationCode('');
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isRegisteredDoctor, name, hospitalCode, department, experience]);

  const submit = async () => {
    setAttempted(true);
    if (!canSubmit || loading) return;
    if (!isRegisteredDoctor && liveValidationCode && liveValidationCode !== 'approved') {
      setAttempted(true);
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const doctor = await api.post('/doctors/register', {
        hospital_code: hospitalCode,
        name,
        department,
        experience_years: Number(experience),
        email: email.trim().toLowerCase(),
        password,
        phone,
        previous_email: previousEmail || undefined,
        previous_password: previousPassword || undefined,
      });

      const normalizedEmail = email.trim().toLowerCase();
      session.saveDoctor(doctor);
      session.saveDoctorLoginPrefill({ email: normalizedEmail, password });
      session.saveDoctorRegistrationDraft({
        doctorId: doctor.doctor_id || doctorDraft.doctorId || null,
        name,
        phone,
        department,
        experience,
        hospitalCode: String(doctor.hospital_code || hospitalCode),
        email: normalizedEmail,
        password,
        isRegistered: true,
        previousEmail: normalizedEmail,
        previousPassword: password,
      });
      await saveLocalStaffAccount('doctor', normalizedEmail, password, {
        ...doctor,
        hospital_code: doctor.hospital_code || hospitalCode,
      });
      navigate('/hospital/dashboard');
    } catch (e) {
      const message = String(e?.message || '').toLowerCase();
      const isBackendDown =
        message.includes('temporarily unreachable') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('network error');

      if (isBackendDown && isRegisteredDoctor) {
        const normalizedEmail = email.trim().toLowerCase();
        const currentDoctor = session.getDoctor() || {};
        const localAccount = getLocalStaffAccount('doctor', previousEmail || normalizedEmail);
        const updatedDoctor = {
          ...(localAccount?.profile || currentDoctor || {}),
          doctor_id: currentDoctor.doctor_id || localAccount?.profile?.doctor_id || doctorDraft.doctorId || null,
          name,
          department,
          experience_years: Number(experience),
          hospital_id: Number(currentDoctor.hospital_id || localAccount?.profile?.hospital_id || 0) || null,
          hospital_code: hospitalCode,
          phone,
          email: normalizedEmail,
        };
        session.saveDoctor(updatedDoctor);
        session.saveDoctorLoginPrefill({ email: normalizedEmail, password });
        session.saveDoctorRegistrationDraft({
          doctorId: updatedDoctor.doctor_id || doctorDraft.doctorId || null,
          name,
          phone,
          department,
          experience,
          hospitalCode,
          email: normalizedEmail,
          password,
          isRegistered: true,
          previousEmail: normalizedEmail,
          previousPassword: password,
        });
        if (localAccount) {
          updateLocalStaffProfile('doctor', previousEmail || normalizedEmail, updatedDoctor);
        }
        await saveLocalStaffAccount('doctor', normalizedEmail, password, updatedDoctor);
        navigate('/hospital/dashboard');
        return;
      }

      if (message.includes('not approved by admin')) {
        setServerError('This doctor is not approved by admin yet. Please contact your hospital admin.');
      } else if (message.includes('details do not match')) {
        setServerError('The details do not match admin-approved records for this doctor.');
      } else if (message.includes('already registered')) {
        setServerError('This doctor is already registered. Use current login credentials, then update details here.');
      } else if (message.includes('hospital id not found')) {
        setServerError('Hospital ID not found. Please use the exact Hospital ID shared by admin.');
      } else {
        setServerError(
          e.message ||
            'Could not register. Enter exactly the same name, department, and experience added by admin.'
        );
      }
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
                <h1 className="hospital-registration__title">Register your account</h1>
                <p className="hospital-registration__lede">
                  Use the exact same Name, Department and Experience that your admin added.
                </p>
              </div>
            </div>

            <Card className="hospital-registration__card">
              <div className="hospital-registration__grid">
                <div>
                  <label className="hospital-registration__field-label">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Full name"
                      className={`hospital-registration__input ${isRegisteredDoctor ? 'hospital-registration__input--locked' : ''}`}
                    disabled={isRegisteredDoctor}
                    readOnly={isRegisteredDoctor}
                  />
                  {attempted && !nameValid && (
                    <p className="field-error">
                      <AlertCircle size={12} />
                      Enter a valid name.
                    </p>
                  )}
                </div>

                <div>
                  <label className="hospital-registration__field-label">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`hospital-registration__input ${isRegisteredDoctor ? 'hospital-registration__input--locked' : ''}`}
                    disabled={isRegisteredDoctor}
                  >
                    <option value="">Select department</option>
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="hospital-registration__field-label">Experience (years)</label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="8"
                      className={`hospital-registration__input ${isRegisteredDoctor ? 'hospital-registration__input--locked' : ''}`}
                    disabled={isRegisteredDoctor}
                    readOnly={isRegisteredDoctor}
                  />
                  {attempted && !expValid && (
                    <p className="field-error">
                      <AlertCircle size={12} />
                      Enter valid years of experience (0–60).
                    </p>
                  )}
                </div>

                <div>
                  <label className="hospital-registration__field-label">Hospital ID</label>
                  <input
                    value={hospitalCode}
                    maxLength={12}
                    onChange={(e) => setHospitalCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="Given by your admin"
                    className="hospital-registration__input"
                  />
                  {attempted && !hospitalCodeValid && (
                    <p className="field-error">
                      <AlertCircle size={12} />
                      Enter the Hospital ID shared by your admin.
                    </p>
                  )}
                </div>

                <div>
                  <label className="hospital-registration__field-label">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isRegisteredDoctor ? '' : '98765 43210'}
                    className="hospital-registration__input"
                  />
                </div>
              </div>

              <p className="hospital-registration__section-label">Your login</p>
              <div className="hospital-registration__grid">
                <div>
                  <label className="hospital-registration__field-label">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailTouched(true);
                    }}
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

                <div>
                  <label className="hospital-registration__field-label">Password</label>
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
                      8+ characters, with an uppercase letter, a number, and a symbol.
                    </p>
                  )}
                </div>
              </div>

              {serverError && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  {serverError}
                </p>
              )}

              {!!liveValidationError && !isRegisteredDoctor && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  {liveValidationError}
                </p>
              )}

              {isRegisteredDoctor && !editableChanged && (
                <p className="hospital-registration__hint">
                  No edits detected. Use Back if you do not want to update your setup.
                </p>
              )}

              <div className="hospital-registration__footer">
                <Button onClick={submit} disabled={loading || !canSubmit} icon={ArrowRight}>
                  {loading ? 'Registering…' : hasPrefilledSetup ? 'Complete my setup' : 'Create my account'}
                </Button>
              </div>
            </Card>

            <button
              type="button"
              onClick={() => navigate('/hospital/doctor')}
              className="hospital-registration__back hospital-registration__back--bottom"
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>
        </div>
      </div>
    </HospitalShell>
  );
}
