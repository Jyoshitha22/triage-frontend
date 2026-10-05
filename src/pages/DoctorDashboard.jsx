import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, AlertTriangle, LogOut, ArrowRight } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import api from '../utils/api';
import session from '../utils/session';
import { colors } from '../theme/color';
import './DoctorDashboard.css';

const URGENCY = colors.urgency;

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const doctor = session.getDoctor();
  const [waiting, setWaiting] = useState([]);
  const [repliedCount, setRepliedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctor) { navigate('/hospital/doctor', { replace: true }); return; }
    Promise.all([
      api.get(`/symptom-records?status=waiting&doctor_id=${doctor.doctor_id}`),
      api.get(`/doctors/${doctor.doctor_id}/replied`),
    ]).then(([q, replied]) => { setWaiting(q); setRepliedCount(replied.length); }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const urgentCount = waiting.filter((p) => p.urgency === 'emergency').length;
  const logout = () => { session.clearDoctor(); navigate('/hospital'); };

  if (!doctor) return null;

  return (
    <HospitalShell title="Hospital Portal" doctorName={doctor.name} onLogout={logout}>
      <h1 className="doctor-dashboard__title">Good to see you, {doctor.name.replace('Dr. ', '')}</h1>
      <p className="doctor-dashboard__lede">{doctor.department} · {doctor.experience_years} yrs experience — here's what's waiting for you today.</p>

      <div className="doctor-dashboard__stats">
        <button onClick={() => navigate('/hospital/patients')} className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--gold"><Users size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{loading ? '…' : waiting.length}</p>
            <p className="doctor-dashboard__stat-label">waiting</p>
          </div>
        </button>
        <div className="doctor-dashboard__stat-card doctor-dashboard__stat-card--static">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--urgent"><AlertTriangle size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{loading ? '…' : urgentCount}</p>
            <p className="doctor-dashboard__stat-label">urgent</p>
          </div>
        </div>
        <button onClick={() => navigate('/hospital/replied')} className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--navy"><CheckCircle2 size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{loading ? '…' : repliedCount}</p>
            <p className="doctor-dashboard__stat-label">replied</p>
          </div>
        </button>
      </div>

      <Card className="doctor-dashboard__preview-card">
        <p className="doctor-dashboard__preview-title">Up next</p>
        {!loading && waiting.length === 0 && <p className="doctor-dashboard__preview-empty">You're all caught up — nobody's waiting right now.</p>}
        {waiting.slice(0, 3).map((p) => {
          const u = URGENCY[p.urgency] || URGENCY.medium;
          return (
            <button key={p.symptom_id} onClick={() => navigate('/hospital/patients')} className="doctor-dashboard__preview-row">
              <span className="doctor-dashboard__preview-dot" style={{ background: u.color }} />
              <span className="doctor-dashboard__preview-name">{p.patient_name}</span>
              <span className="doctor-dashboard__preview-symptom">{p.symptom_text}</span>
            </button>
          );
        })}
        {waiting.length > 3 && (
          <button onClick={() => navigate('/hospital/patients')} className="doctor-dashboard__preview-more">
            View all {waiting.length} waiting <ArrowRight size={14} />
          </button>
        )}
      </Card>

      <button onClick={logout} className="doctor-dashboard__logout"><LogOut size={14} /> Log out</button>
    </HospitalShell>
  );
}