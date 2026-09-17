import  { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Plus, X, Pencil, Check, ArrowRight, AlertCircle } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import session from '../utils/session';
import { isValidName, isValidExperienceYears } from '../utils/validators';
import './SpecialistDetails.css';

const SPECIALTIES = ['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Gynecologist', 'Dentist', 'Orthopedic', 'Neurologist', 'General Surgeon'];
const DEFAULT_ROSTER = [{ id: 1, name: 'Dr. Ananya Rao', specialty: 'General Physician', experience: 8 }];

/**
 * The hospital admin adds every specialist on staff here — this lets
 * the triage model route a patient's classified specialty to the right
 * doctor, with a fallback of "any available doctor" if none are free.
 * Reachable both during first-time setup and later from the dashboard,
 * so doctors joining or leaving is a quick edit, not a re-setup.
 */
export default function SpecialistDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [roster, setRosterState] = useState(() => session.getRoster(DEFAULT_ROSTER));
  useEffect(() => { session.saveRoster(roster); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState({ name: '', specialty: SPECIALTIES[0], experience: '' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [error, setError] = useState(null);

  // Every change is saved immediately — this is what DoctorSelect.jsx
  // and the dashboard/patient-queue filtering actually read from.
  const setRoster = (updater) => setRosterState((prev) => { const next = typeof updater === 'function' ? updater(prev) : updater; session.saveRoster(next); return next; });

  const nameValid = isValidName(draft.name);
  const experienceValid = isValidExperienceYears(draft.experience);

  const addSpecialist = () => {
    if (!nameValid) { setError('Enter a valid doctor name (letters only).'); return; }
    if (!experienceValid) { setError('Enter valid years of experience (0–60).'); return; }
    setError(null);
    setRoster((r) => [...r, { id: Date.now(), ...draft, experience: Number(draft.experience) }]);
    setDraft({ name: '', specialty: SPECIALTIES[0], experience: '' });
  };
  const remove = (id) => setRoster((r) => r.filter((d) => d.id !== id));

  const startEdit = (d) => { setEditingId(d.id); setEditDraft({ ...d, experience: String(d.experience) }); };
  const saveEdit = () => {
    if (!isValidName(editDraft.name) || !isValidExperienceYears(editDraft.experience)) return;
    setRoster((r) => r.map((d) => (d.id === editingId ? { ...editDraft, id: editingId, experience: Number(editDraft.experience) } : d)));
    setEditingId(null);
  };

  const counts = roster.reduce((acc, d) => { acc[d.specialty] = (acc[d.specialty] || 0) + 1; return acc; }, {});
  const goToDoctorSelect = () => navigate('/hospital/who-are-you', { state: { hospital: state?.hospital } });

  return (
    <HospitalShell title="Specialist setup">
      <div className="specialist-details">
        <div className="specialist-details__header">
          <span className="specialist-details__icon-badge"><Stethoscope size={20} /></span>
          <div>
            <h1 className="specialist-details__title">Manage specialists</h1>
            <p className="specialist-details__lede">Add anyone new, edit or remove anyone who's left.</p>
          </div>
        </div>

        {Object.keys(counts).length > 0 && (
          <div className="specialist-details__counts">
            {Object.entries(counts).map(([spec, n]) => <span key={spec} className="specialist-details__count-chip">{spec} · {n}</span>)}
          </div>
        )}

        <Card className="specialist-details__card">
          <div className="specialist-details__form-grid">
            <div>
              <FieldLabel>Doctor name</FieldLabel>
              <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Dr. Full name" className="specialist-details__input" />
            </div>
            <div>
              <FieldLabel>Specialty</FieldLabel>
              <select value={draft.specialty} onChange={(e) => setDraft((d) => ({ ...d, specialty: e.target.value }))} className="specialist-details__input">
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Experience</FieldLabel>
              <input type="number" value={draft.experience} onChange={(e) => setDraft((d) => ({ ...d, experience: e.target.value }))} placeholder="Years" className="specialist-details__input" />
            </div>
            <button onClick={addSpecialist} className="specialist-details__add-btn"><Plus size={16} /> Add</button>
          </div>
          {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}

          <div className="specialist-details__roster">
            {roster.map((d) => editingId === d.id ? (
              <div key={d.id} className="specialist-details__roster-row specialist-details__roster-row--editing">
                <input value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} className="specialist-details__edit-input" />
                <select value={editDraft.specialty} onChange={(e) => setEditDraft((s) => ({ ...s, specialty: e.target.value }))} className="specialist-details__edit-input">
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={editDraft.experience} onChange={(e) => setEditDraft((s) => ({ ...s, experience: e.target.value }))} className="specialist-details__edit-input specialist-details__edit-input--num" />
                <button onClick={saveEdit} aria-label="Save" className="specialist-details__save-edit"><Check size={16} /></button>
              </div>
            ) : (
              <div key={d.id} className="specialist-details__roster-row">
                <div className="specialist-details__avatar">{d.name.split(' ').filter(Boolean).slice(-2).map((n) => n[0]).join('')}</div>
                <div className="specialist-details__roster-info">
                  <p className="specialist-details__roster-name">{d.name}</p>
                  <p className="specialist-details__roster-meta">{d.specialty} · {d.experience} yrs experience</p>
                </div>
                <button onClick={() => startEdit(d)} aria-label="Edit" className="specialist-details__edit-btn"><Pencil size={15} /></button>
                <button onClick={() => remove(d.id)} aria-label="Remove" className="specialist-details__remove"><X size={16} /></button>
              </div>
            ))}
            {roster.length === 0 && <p className="specialist-details__empty">No specialists added yet.</p>}
          </div>

          <div className="specialist-details__footer">
            <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            <Button onClick={goToDoctorSelect} disabled={roster.length === 0} icon={ArrowRight}>Continue</Button>
          </div>
        </Card>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="specialist-details__field-label">{children}</label>;
}