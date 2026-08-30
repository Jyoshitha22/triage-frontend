import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Plus, X, ArrowRight, AlertCircle } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import { isValidName, isValidExperienceYears } from '../utils/validators';
import './SpecialistDetails.css';

const SPECIALTIES = ['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Gynecologist', 'Dentist', 'Orthopedic', 'Neurologist'];

/**
 * The hospital admin adds every specialist on staff here — this lets
 * the triage model route a patient's classified specialty to the right
 * doctor, with a fallback of "any available doctor" if none are free.
 */
export default function SpecialistDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [roster, setRoster] = useState([{ id: 1, name: 'Dr. Ananya Rao', specialty: 'General Physician', experience: 8 }]);
  const [draft, setDraft] = useState({ name: '', specialty: SPECIALTIES[0], experience: '' });
  const [error, setError] = useState(null);

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
  const counts = roster.reduce((acc, d) => { acc[d.specialty] = (acc[d.specialty] || 0) + 1; return acc; }, {});

  return (
    <HospitalShell title="Specialist setup">
      <div className="specialist-details">
        <div className="specialist-details__header">
          <span className="specialist-details__icon-badge"><Stethoscope size={20} /></span>
          <div>
            <h1 className="specialist-details__title">Add your specialists</h1>
            <p className="specialist-details__lede">One entry per doctor — add as many as you have.</p>
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
            {roster.map((d) => (
              <div key={d.id} className="specialist-details__roster-row">
                <div className="specialist-details__avatar">{d.name.split(' ').filter(Boolean).slice(-2).map((n) => n[0]).join('')}</div>
                <div className="specialist-details__roster-info">
                  <p className="specialist-details__roster-name">{d.name}</p>
                  <p className="specialist-details__roster-meta">{d.specialty} · {d.experience} yrs experience</p>
                </div>
                <button onClick={() => remove(d.id)} aria-label="Remove" className="specialist-details__remove"><X size={16} /></button>
              </div>
            ))}
            {roster.length === 0 && <p className="specialist-details__empty">No specialists added yet.</p>}
          </div>

          <div className="specialist-details__footer">
            <Button variant="ghost" onClick={() => navigate('/hospital/registration')}>Back</Button>
            <Button onClick={() => navigate('/hospital/dashboard', { state: { roster, hospital: state?.hospital } })} disabled={roster.length === 0} icon={ArrowRight}>Go to dashboard</Button>
          </div>
        </Card>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="specialist-details__field-label">{children}</label>;
}