import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, AlertCircle, ChevronLeft } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../utils/api';
import session from '../utils/session';
import { isRequired, isValidLandlineOrPhone } from '../utils/validators';
import './HospitalRegistration.css';

const HOSPITAL_TYPES = ['Government', 'Private', 'Clinic'];

/**
 * The "address changed, phone number changed" screen — edits the
 * EXISTING hospital row (PUT), never creates a new one. Separate from
 * AdminRegister.jsx on purpose: that one creates the hospital+admin
 * together, once; this one only ever updates fields on a hospital that
 * already exists.
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
      const updated = await api.put(`/hospitals/${admin.hospital_id}`, {
        hospital_name: values.hospital_name, address: values.address, phone: values.phone,
        hospital_type: values.hospital_type, registration_id: values.registration_id,
        city: values.city, state: values.state,
      });
      session.saveAdmin({ ...admin, hospital: updated });
      setSaved(true);
      setTimeout(() => navigate('/hospital/admin/home'), 1000);
    } catch (e) {
      setError(e.message || 'Could not save changes.');
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  return (
    <HospitalShell title="Edit hospital details">
      <div className="hospital-registration">
        <button onClick={() => navigate('/hospital/admin/home')} className="hospital-registration__back"><ChevronLeft size={14} /> Back to Admin Home</button>

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
      </div>
    </HospitalShell>
  );
}