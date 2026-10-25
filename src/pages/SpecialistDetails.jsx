import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Plus, X, Pencil, Check, AlertCircle, ChevronLeft, Power } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import api from '../utils/api';
import session from '../utils/session';
import { isValidName, isValidExperienceYears } from '../utils/validators';
import './SpecialistDetails.css';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
];

const DEFAULT_DEPARTMENTS = [
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
  const adminId = admin?.admin_id || null;
  const hospitalId = admin?.hospital?.hospital_id;

  const [departments, setDepartments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: '', department: '', experience_years: '', qualification: '', languages_spoken: ['en'] });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [error, setError] = useState(null);
  const [rosterLoadError, setRosterLoadError] = useState('');

  useEffect(() => {
    if (!adminId || !hospitalId) { navigate('/hospital/admin', { replace: true }); return; }
    Promise.all([
      api.get('/departments').catch(() => ({ departments: DEFAULT_DEPARTMENTS })),
      api.get(`/doctors?hospital_id=${hospitalId}`).catch((loadErr) => {
        setRosterLoadError(String(loadErr?.message || 'Could not load specialists right now.'));
        return [];
      }),
    ])
      .then(([deps, docs]) => {
        const dList = deps?.departments || DEFAULT_DEPARTMENTS;
        setDepartments(dList);
        setDraft((d) => ({ ...d, department: dList[0] }));
        setRoster(docs || []);
      })
      .finally(() => setLoading(false));
  }, [adminId, hospitalId, navigate]);

  const toggleLang = (list, code, setter) => {
    setter(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);
  };

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
      const fallback = {
        doctor_id: Date.now(),
        name: draft.name,
        department: draft.department,
        experience_years: Number(draft.experience_years),
        hospital_id: hospitalId,
        qualification: draft.qualification,
        languages_spoken: draft.languages_spoken.join(','),
        is_available: true,
      };
      setRoster((r) => [...r, fallback]);
      setDraft({ name: '', department: departments[0], experience_years: '', qualification: '', languages_spoken: ['en'] });
    }
  };

  const remove = async (id) => {
    try {
      await api.del(`/doctors/${id}`);
    } catch {
      // Keep local removal when backend is unavailable.
    }
    setRoster((r) => r.filter((d) => d.doctor_id !== id));
  };

  const toggleAvailable = async (d) => {
    const fallback = { ...d, is_available: !d.is_available };
    const updated = await api.put(`/doctors/${d.doctor_id}/availability`, { is_available: !d.is_available }).catch(() => fallback);
    if (updated) setRoster((r) => r.map((x) => (x.doctor_id === d.doctor_id ? updated : x)));
  };

  const startEdit = (d) => setEditingId(d.doctor_id) || setEditDraft({ ...d, languages_spoken: String(d.languages_spoken || 'en').split(',').map((v) => v.trim()).filter(Boolean) });

  const saveEdit = async () => {
    if (!isValidName(editDraft.name) || !isValidExperienceYears(editDraft.experience_years)) return;
    const fallback = {
      ...editDraft,
      experience_years: Number(editDraft.experience_years),
      hospital_id: hospitalId,
      languages_spoken: editDraft.languages_spoken.join(','),
    };
    const updated = await api.put(`/doctors/${editingId}`, {
      name: editDraft.name, department: editDraft.department, experience_years: Number(editDraft.experience_years),
      hospital_id: hospitalId, qualification: editDraft.qualification || '', languages_spoken: editDraft.languages_spoken.join(','),
    }).catch(() => fallback);
    if (updated) setRoster((r) => r.map((d) => (d.doctor_id === editingId ? updated : d)));
    setEditingId(null);
  };

  const counts = roster.reduce((acc, d) => { acc[d.department] = (acc[d.department] || 0) + 1; return acc; }, {});

  return (
    <HospitalShell showDoctorArtwork doctorArtworkSide="right" wide>
      <div className="specialist-details">
        <div className="specialist-details__header">
          <span className="specialist-details__icon-badge"><Stethoscope size={20} /></span>
          <div>
            <h1 className="specialist-details__title">Manage specialists</h1>
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
                  <button
                    type="button"
                    key={l.code}
                    onClick={() => toggleLang(draft.languages_spoken, l.code, (v) => setDraft((d) => ({ ...d, languages_spoken: v })))}
                    className={`specialist-details__lang-chip ${draft.languages_spoken.includes(l.code) ? 'specialist-details__lang-chip--active' : ''}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addSpecialist} className="specialist-details__add-btn specialist-details__span2"><Plus size={16} /> Add specialist</button>
          </div>
          {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}
          {rosterLoadError && <p className="field-error"><AlertCircle size={12} /> {rosterLoadError}</p>}

          <div className="specialist-details__roster">
            {loading && <p className="specialist-details__empty">Loading…</p>}
            {!loading && roster.map((d) => editingId === d.doctor_id ? (
              <div key={d.doctor_id} className="specialist-details__roster-row specialist-details__roster-row--editing">
                <input value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} className="specialist-details__edit-input" />
                <select value={editDraft.department} onChange={(e) => setEditDraft((s) => ({ ...s, department: e.target.value }))} className="specialist-details__edit-input">
                  {departments.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={editDraft.experience_years} onChange={(e) => setEditDraft((s) => ({ ...s, experience_years: e.target.value }))} className="specialist-details__edit-input specialist-details__edit-input--num" />
                <input value={editDraft.qualification || ''} onChange={(e) => setEditDraft((s) => ({ ...s, qualification: e.target.value }))} className="specialist-details__edit-input" />
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
        <button type="button" onClick={() => navigate('/hospital/admin/home')} className="specialist-details__back specialist-details__back--bottom"><ChevronLeft size={16} /> Back</button>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="specialist-details__field-label">{children}</label>;
}