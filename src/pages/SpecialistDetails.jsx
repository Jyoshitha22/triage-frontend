import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Plus, X, Pencil, Check, AlertCircle, ChevronLeft, Power } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import api from '../utils/api';
import session from '../utils/session';
import { isValidName, isValidExperienceYears } from '../utils/validators';
import './SpecialistDetails.css';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' }, { code: 'ta', label: 'Tamil' },
];

/**
 * The admin's own "add/edit/remove a doctor directly" screen — used
 * alongside doctor self-registration (DoctorRegister.jsx), for cases
 * where the admin wants to add someone themselves, or quickly remove
 * someone who's resigned. Real backend-backed (GET/POST/PUT/DELETE
 * /doctors), not localStorage.
 */
export default function SpecialistDetails() {
  const navigate = useNavigate();
  const admin = session.getAdmin();
  const hospitalId = admin?.hospital?.hospital_id;

  const [departments, setDepartments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: '', department: '', experience_years: '', qualification: '', languages_spoken: ['en'] });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!admin) { navigate('/hospital/admin', { replace: true }); return; }
    Promise.all([api.get('/departments'), api.get(`/doctors?hospital_id=${hospitalId}`)])
      .then(([deps, docs]) => { setDepartments(deps.departments); setDraft((d) => ({ ...d, department: deps.departments[0] })); setRoster(docs); })
      .catch(() => setError('Could not load specialists — check the backend is running.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLang = (list, code, setter) => setter(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);

  const nameValid = isValidName(draft.name);
  const expValid = isValidExperienceYears(draft.experience_years);

  const addSpecialist = async () => {
    if (!nameValid) { setError('Enter a valid doctor name (letters only).'); return; }
    if (!expValid) { setError('Enter valid years of experience (0–60).'); return; }
    setError(null);
    try {
      const created = await api.post('/doctors', {
        name: draft.name, department: draft.department, experience_years: Number(draft.experience_years),
        hospital_id: hospitalId, qualification: draft.qualification, languages_spoken: draft.languages_spoken.join(','),
      });
      setRoster((r) => [...r, created]);
      setDraft({ name: '', department: departments[0], experience_years: '', qualification: '', languages_spoken: ['en'] });
    } catch (e) {
      setError(e.message || 'Could not add this doctor.');
    }
  };

  const remove = async (id) => {
    await api.del(`/doctors/${id}`).catch(() => {});
    setRoster((r) => r.filter((d) => d.doctor_id !== id));
  };

  const toggleAvailable = async (d) => {
    const updated = await api.put(`/doctors/${d.doctor_id}/availability`, { is_available: !d.is_available }).catch(() => null);
    if (updated) setRoster((r) => r.map((x) => (x.doctor_id === d.doctor_id ? updated : x)));
  };

  const startEdit = (d) => setEditingId(d.doctor_id) || setEditDraft({ ...d, languages_spoken: (d.languages_spoken || 'en').split(',') });
  const saveEdit = async () => {
    if (!isValidName(editDraft.name) || !isValidExperienceYears(editDraft.experience_years)) return;
    const updated = await api.put(`/doctors/${editingId}`, {
      name: editDraft.name, department: editDraft.department, experience_years: Number(editDraft.experience_years),
      hospital_id: hospitalId, qualification: editDraft.qualification, languages_spoken: editDraft.languages_spoken.join(','),
    }).catch(() => null);
    if (updated) setRoster((r) => r.map((d) => (d.doctor_id === editingId ? updated : d)));
    setEditingId(null);
  };

  const counts = roster.reduce((acc, d) => { acc[d.department] = (acc[d.department] || 0) + 1; return acc; }, {});

  return (
    <HospitalShell title="Specialist setup">
      <div className="specialist-details">
        <button onClick={() => navigate('/hospital/admin/home')} className="specialist-details__back"><ChevronLeft size={14} /> Back to Admin Home</button>

        <div className="specialist-details__header">
          <span className="specialist-details__icon-badge"><Stethoscope size={20} /></span>
          <div>
            <h1 className="specialist-details__title">Manage specialists</h1>
            <p className="specialist-details__lede">Doctors can also self-register with your Hospital ID — this is for adding or removing someone directly.</p>
          </div>
        </div>

        {Object.keys(counts).length > 0 && (
          <div className="specialist-details__counts">
            {Object.entries(counts).map(([dept, n]) => <span key={dept} className="specialist-details__count-chip">{dept} · {n}</span>)}
          </div>
        )}

        <Card className="specialist-details__card">
          <div className="specialist-details__form-grid">
            <div>
              <FieldLabel>Doctor name</FieldLabel>
              <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Dr. Full name" className="specialist-details__input" />
            </div>
            <div>
              <FieldLabel>Department</FieldLabel>
              <select value={draft.department} onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))} className="specialist-details__input">
                {departments.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Experience</FieldLabel>
              <input type="number" value={draft.experience_years} onChange={(e) => setDraft((d) => ({ ...d, experience_years: e.target.value }))} placeholder="Years" className="specialist-details__input" />
            </div>
            <div>
              <FieldLabel>Qualification</FieldLabel>
              <input value={draft.qualification} onChange={(e) => setDraft((d) => ({ ...d, qualification: e.target.value }))} placeholder="MBBS, MD" className="specialist-details__input" />
            </div>
            <div className="specialist-details__span2">
              <FieldLabel>Languages</FieldLabel>
              <div className="specialist-details__lang-chips">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button type="button" key={l.code} onClick={() => toggleLang(draft.languages_spoken, l.code, (v) => setDraft((d) => ({ ...d, languages_spoken: v })))}
                    className={`specialist-details__lang-chip ${draft.languages_spoken.includes(l.code) ? 'specialist-details__lang-chip--active' : ''}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addSpecialist} className="specialist-details__add-btn specialist-details__span2"><Plus size={16} /> Add specialist</button>
          </div>
          {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}

          <div className="specialist-details__roster">
            {loading && <p className="specialist-details__empty">Loading…</p>}
            {!loading && roster.map((d) => editingId === d.doctor_id ? (
              <div key={d.doctor_id} className="specialist-details__roster-row specialist-details__roster-row--editing">
                <input value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} className="specialist-details__edit-input" />
                <select value={editDraft.department} onChange={(e) => setEditDraft((s) => ({ ...s, department: e.target.value }))} className="specialist-details__edit-input">
                  {departments.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={editDraft.experience_years} onChange={(e) => setEditDraft((s) => ({ ...s, experience_years: e.target.value }))} className="specialist-details__edit-input specialist-details__edit-input--num" />
                <button onClick={saveEdit} aria-label="Save" className="specialist-details__save-edit"><Check size={16} /></button>
              </div>
            ) : (
              <div key={d.doctor_id} className="specialist-details__roster-row">
                <div className="specialist-details__avatar">{d.name.split(' ').filter(Boolean).slice(-2).map((n) => n[0]).join('')}</div>
                <div className="specialist-details__roster-info">
                  <p className="specialist-details__roster-name">{d.name}</p>
                  <p className="specialist-details__roster-meta">{d.department} · {d.experience_years} yrs{d.qualification ? ` · ${d.qualification}` : ''}</p>
                </div>
                <button onClick={() => toggleAvailable(d)} aria-label="Toggle on/off duty" className={`specialist-details__power ${d.is_available ? 'specialist-details__power--on' : ''}`} title={d.is_available ? 'On duty' : 'Off duty'}>
                  <Power size={14} />
                </button>
                <button onClick={() => startEdit(d)} aria-label="Edit" className="specialist-details__edit-btn"><Pencil size={15} /></button>
                <button onClick={() => remove(d.doctor_id)} aria-label="Remove" className="specialist-details__remove"><X size={16} /></button>
              </div>
            ))}
            {!loading && roster.length === 0 && <p className="specialist-details__empty">No specialists yet — add one above, or share your Hospital ID so doctors can register themselves.</p>}
          </div>
        </Card>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="specialist-details__field-label">{children}</label>;
}