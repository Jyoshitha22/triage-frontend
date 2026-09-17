
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import session from '../utils/session';
import './DoctorSelect.css';

/**
 * The hospital's login only proves "someone from this hospital is
 * signing in" — it doesn't say *which* doctor is holding the phone.
 * This screen closes that gap: whoever's using the device taps their
 * own name from the roster the admin set up, and from here on, the
 * dashboard and patient queue are scoped to that specific doctor.
 */
export default function DoctorSelect() {
  const navigate = useNavigate();
  const roster = session.getRoster([]);

  const choose = (doctor) => {
    session.saveCurrentDoctor(doctor);
    navigate('/hospital/dashboard');
  };

  if (roster.length === 0) {
    return (
      <HospitalShell title="Hospital Portal">
        <Card>
          <p>No specialists have been added for this hospital yet.</p>
          <button onClick={() => navigate('/hospital/specialists')} className="doctor-select__setup-link">
            Add specialists first <ArrowRight size={14} />
          </button>
        </Card>
      </HospitalShell>
    );
  }

  return (
    <HospitalShell title="Hospital Portal">
      <h1 className="doctor-select__title">Who's this?</h1>
      <p className="doctor-select__lede">Pick your name to open your own dashboard.</p>

      <div className="doctor-select__grid">
        {roster.map((d) => (
          <button key={d.id} onClick={() => choose(d)} className="doctor-select__card">
            <span className="doctor-select__icon"><Stethoscope size={24} /></span>
            <span className="doctor-select__name">{d.name}</span>
            <span className="doctor-select__specialty">{d.specialty}</span>
          </button>
        ))}
      </div>
    </HospitalShell>
  );
}
