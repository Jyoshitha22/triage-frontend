import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Info } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import api from '../utils/api';
import session from '../utils/session';
import { colors } from '../theme/color';
import './PatientList.css';

const URGENCY = colors.urgency;
const ORDER = { emergency: 0, medium: 1, low: 2 };

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Waiting: just now';
  if (mins < 60) return `Waiting: ${mins} min`;
  return `Waiting: ${Math.round(mins / 60)} hr`;
}

/**
 * The real, routing-filtered queue — what each doctor sees here is
 * already scoped server-side (routing.py): their own department, or
 * (when nobody from that department is on duty) the senior/junior
 * fallback. routing_note explains WHY a patient reached a doctor
 * outside their usual department, so it's never a mystery.
 */
export default function PatientList() {
  const navigate = useNavigate();
  const doctor = session.getDoctor();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctor) { navigate('/hospital/doctor', { replace: true }); return; }
    api.get(`/symptom-records?status=waiting&doctor_id=${doctor.doctor_id}`)
      .then(setPatients)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = [...patients].sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency]);
  const selectPatient = (p) => navigate('/hospital/reply', { state: { symptomId: p.symptom_id } });
  const logout = () => { session.clearDoctor(); navigate('/hospital'); };

  if (!doctor) return null;

  return (
    <HospitalShell title="Hospital Portal" doctorName={doctor.name} onLogout={logout}>
      <div className="patient-list__header">
        <div>
          <h1 className="patient-list__title">Patient queue</h1>
          <p className="patient-list__lede">Patients are prioritized by urgency. Select a patient to review their symptoms and respond.</p>
        </div>
        <span className="patient-list__count-badge"><Users size={16} /> {patients.length} Patients Waiting</span>
      </div>

      {loading && <Card className="patient-list__empty"><p>Loading…</p></Card>}

      {!loading && patients.length === 0 ? (
        <Card className="patient-list__empty"><p>You're all caught up — no patients waiting right now.</p></Card>
      ) : (
        <div className="patient-list__items">
          {sorted.map((p) => {
            const u = URGENCY[p.urgency] || URGENCY.medium;
            return (
              <button key={p.symptom_id} onClick={() => selectPatient(p)} className="patient-list__row">
                <div className="patient-list__avatar">{p.patient_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>

                <div className="patient-list__info">
                  <div className="patient-list__info-top">
                    <p className="patient-list__name">{p.patient_name}</p>
                    <span className="patient-list__demo">{p.patient_age} · {p.patient_gender}</span>
                  </div>
                  <span className="patient-list__urgency-badge" style={{ background: u.bg, color: u.color }}>
                    <span className="patient-list__urgency-dot" style={{ background: u.color }} />
                    {u.label.toUpperCase()}
                    {p.urgency === 'emergency' && <AlertTriangle size={12} />}
                  </span>
                  <p className="patient-list__snippet">{p.symptom_text}</p>
                  <div className="patient-list__meta-row">
                    <span className="patient-list__wave"><Waveform mode="playback" bars={14} /></span>
                    <div className="patient-list__specialty-block">
                      <p className="patient-list__specialty-heading">Recommended Specialist</p>
                      <p className="patient-list__specialty">{p.department}</p>
                    </div>
                  </div>
                  {p.routing_note && (
                    <p className="patient-list__routing-note"><Info size={12} /> {p.routing_note}</p>
                  )}
                </div>

                <div className="patient-list__right">
                  <span className="patient-list__time">{timeAgo(p.created_at)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </HospitalShell>
  );
}