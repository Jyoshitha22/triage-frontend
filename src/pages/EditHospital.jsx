import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, AlertCircle, ChevronLeft } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import session from '../utils/session';
import { updateLocalStaffProfile } from '../utils/localStaffAccounts';
import { isRequired, isValidLandlineOrPhone } from '../utils/validators';
import './HospitalRegistration.css';

const HOSPITAL_TYPES = ['Government', 'Private', 'Clinic'];

/**
 * Update the locally registered hospital profile without requiring the
 * backend used by the earlier server-backed setup flow.
 */
export default function EditHospital() {
  const navigate = useNavigate();
  const admin = session.getAdmin();
  const [values, setValues] = useState(admin?.hospital || {});
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!admin) navigate('/hospital/admin', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));
  const formValid = isRequired(values.hospital_name) && isRequired(values.address)
    && isRequired(values.city) && isRequired(values.state) && isValidLandlineOrPhone(values.phone || '');

  const submit = async () => {
    setAttempted(true);
    if (!formValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const hospital = { ...admin.hospital, ...values };
      const updatedAdmin = { ...admin, hospital, hospital_id: hospital.hospital_id || admin.hospital_id };
      if (!updateLocalStaffProfile('admin', admin.email, updatedAdmin)) {
        throw new Error('Could not find the saved admin account in this browser. Please register the hospital again.');
      }
      session.saveAdmin(updatedAdmin);
      setSaved(true);
      setTimeout(() => navigate('/hospital/admin/home'), 700);
    } catch (e) {
      setError(e.message || 'Could not save changes.');
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
            <p className="hospital-registration__lede">Moved address, changed your phone number, anything like that.</p>
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
          </div>

          {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}

          <div className="hospital-registration__footer">
            <Button onClick={submit} disabled={loading} icon={Check}>{loading ? 'Saving…' : saved ? 'Saved' : 'Save changes'}</Button>
          </div>
        </Card>
        <button type="button" onClick={() => navigate(-1)} className="hospital-registration__back hospital-registration__back--bottom"><ChevronLeft size={16} /> Back</button>
      </div>
    </HospitalShell>
  );
}