import  { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, AlertTriangle } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import session from '../utils/session';
import { INITIAL_PATIENTS } from '../utils/sampleData';
import { colors } from '../theme/color';
import './PatientList.css';

const URGENCY = colors.urgency;
const waitingTimeLabel = (agoStr) => `Waiting: ${agoStr.replace(' ago', '')}`;

export default function PatientList() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const doctor = session.getCurrentDoctor();

  useEffect(() => {
    if (!doctor) navigate('/hospital/who-are-you', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // location.state carries the just-updated list when coming back from
  // RecordReply; otherwise fall back to what's actually saved.
  const allPatients = state?.patients || session.getPatients(INITIAL_PATIENTS);

  // Scoped to this doctor's specialty, plus anyone whose matching
  // specialist isn't available (falls through to any doctor on duty).
  const patients = doctor ? allPatients.filter((p) => p.specialty === doctor.specialty || !p.doctorAvailable) : allPatients;

  const order = { emergency: 0, medium: 1, low: 2 };
  const sorted = [...patients].sort((a, b) => order[a.urgency] - order[b.urgency]);

  const selectPatient = (p) => navigate('/hospital/reply', { state: { patient: p } });

  if (!doctor) return null;

  return (
    <HospitalShell title="Hospital Portal" doctorName={doctor.name} onLogout={() => { session.clearCurrentDoctor(); session.clearHospital(); navigate('/hospital'); }}>
      <div className="patient-list__header">
        <div>
          <h1 className="patient-list__title">Patient queue</h1>
          <p className="patient-list__lede">Patients are prioritized by urgency. Select a patient to review their symptoms and respond.</p>
        </div>
        <span className="patient-list__count-badge"><Users size={16} /> {patients.length} Patients Waiting</span>
      </div>

      {patients.length === 0 ? (
        <Card className="patient-list__empty"><p>You're all caught up — no patients waiting right now.</p></Card>
      ) : (
        <div className="patient-list__items">
          {sorted.map((p) => {
            const u = URGENCY[p.urgency];
            return (
              <button key={p.id} onClick={() => selectPatient(p)} className="patient-list__row">
                <div className="patient-list__avatar">{p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>

                <div className="patient-list__info">
                  <div className="patient-list__info-top">
                    <p className="patient-list__name">{p.name}</p>
                    <span className="patient-list__demo">{p.age} · {p.gender}</span>
                  </div>
                  <span className="patient-list__urgency-badge" style={{ background: u.bg, color: u.color }}>
                    <span className="patient-list__urgency-dot" style={{ background: u.color }} />
                    {u.label.toUpperCase()}
                    {p.urgency === 'emergency' && <AlertTriangle size={12} />}
                  </span>
                  <p className="patient-list__snippet">{p.snippet}</p>
                  <div className="patient-list__meta-row">
                    <span className="patient-list__wave"><Waveform mode="playback" bars={14} /></span>
                    <div className="patient-list__specialty-block">
                      <p className="patient-list__specialty-heading">Recommended Specialist</p>
                      <p className="patient-list__specialty">
                        {p.specialty}
                        {!p.doctorAvailable && <span className="patient-list__unavailable"> · specialist unavailable, any doctor can reply</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="patient-list__right">
                  <span className="patient-list__time">{waitingTimeLabel(p.submittedAgo)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </HospitalShell>
  );
}