import  { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, AlertTriangle, Settings } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import session from '../utils/session';
import { INITIAL_PATIENTS } from '../utils/sampleData';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const doctor = session.getCurrentDoctor();

  // No doctor identified yet on this device (or the hospital hasn't
  // logged in at all) — send them to pick who they are first.
  useEffect(() => {
    if (!session.getHospital()) { navigate('/hospital', { replace: true }); return; }
    if (!doctor) navigate('/hospital/who-are-you', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allPatients = session.getPatients(INITIAL_PATIENTS);
  const repliedToday = session.getRepliedToday([]);

  // A specialist only sees patients matched to their own specialty —
  // plus anyone whose matching specialist isn't available, which falls
  // through to any doctor on duty (same rule PatientList uses).
  const myPatients = doctor
    ? allPatients.filter((p) => p.specialty === doctor.specialty || !p.doctorAvailable)
    : allPatients;
  const urgentCount = myPatients.filter((p) => p.urgency === 'emergency').length;

  const logout = () => { session.clearCurrentDoctor(); session.clearHospital(); navigate('/hospital'); };

  if (!doctor) return null; // redirecting, see effect above

  return (
    <HospitalShell title="Hospital Portal" doctorName={doctor.name} onLogout={logout}>
      <h1 className="doctor-dashboard__title">Good to see you, {doctor.name.replace('Dr. ', '')}</h1>
      <p className="doctor-dashboard__lede">{doctor.specialty} — here's what's waiting for you today.</p>

      <div className="doctor-dashboard__stats">
        <button onClick={() => navigate('/hospital/patients')} className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--gold"><Users size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{myPatients.length}</p>
            <p className="doctor-dashboard__stat-label">waiting</p>
          </div>
        </button>
        <div className="doctor-dashboard__stat-card doctor-dashboard__stat-card--static">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--urgent"><AlertTriangle size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{urgentCount}</p>
            <p className="doctor-dashboard__stat-label">urgent</p>
          </div>
        </div>
        <button onClick={() => navigate('/hospital/replied')} className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--navy"><CheckCircle2 size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{repliedToday.length}</p>
            <p className="doctor-dashboard__stat-label">replied today</p>
          </div>
        </button>
      </div>

      <Card className="doctor-dashboard__hint-card">
        <p>Tap <strong>waiting</strong> to review and reply to patients. Tap <strong>replied today</strong> to see what you've already sent.</p>
      </Card>

      <button onClick={() => navigate('/hospital/specialists')} className="doctor-dashboard__manage-link">
        <Settings size={14} /> Manage specialists (new doctor joined or left)
      </button>
    </HospitalShell>
  );
}