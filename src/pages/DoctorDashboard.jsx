import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, AlertTriangle, LogOut, ArrowRight } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import api from '../utils/api';
import session from '../utils/session';
import { colors } from '../theme/color';
import './DoctorDashboard.css';

const URGENCY = colors.urgency;

function queueCacheKey(doctorId, kind) {
  return `triage.realQueue.${kind}.doctor.${doctorId}`;
}

function readCachedQueue(doctorId, kind) {
  try {
    const raw = window.localStorage.getItem(queueCacheKey(doctorId, kind));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedQueue(doctorId, kind, items) {
  try {
    window.localStorage.setItem(queueCacheKey(doctorId, kind), JSON.stringify(Array.isArray(items) ? items : []));
  } catch {
    // ignore localStorage write failures
  }
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const doctor = session.getDoctor();
  const doctorId = doctor?.doctor_id || null;
  const [waiting, setWaiting] = useState([]);
  const [repliedCount, setRepliedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) { navigate('/hospital/doctor', { replace: true }); return; }
    let stopped = false;
    const load = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      Promise.all([
        api.get(`/symptom-records?status=waiting&doctor_id=${doctorId}`),
        api.get(`/doctors/${doctorId}/replied`),
      ])
        .then(([q, replied]) => {
          if (stopped) return;
          setWaiting(q || []);
          setRepliedCount((replied || []).length);
          writeCachedQueue(doctorId, 'waiting', q || []);
          writeCachedQueue(doctorId, 'replied', replied || []);
        })
        .catch(() => {
          if (stopped) return;
          const cachedWaiting = readCachedQueue(doctorId, 'waiting');
          const cachedReplied = readCachedQueue(doctorId, 'replied');
          setWaiting(cachedWaiting);
          setRepliedCount(cachedReplied.length);
        })
        .finally(() => {
          if (!stopped) setLoading(false);
        });
    };

    load();
    const timer = setInterval(load, 8000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [doctorId, navigate]);

  const urgentCount = waiting.filter((p) => p.urgency === 'emergency').length;
  const openWaiting = () => navigate('/hospital/patients', { state: { initialPatients: waiting, source: 'dashboard' } });
  const openUrgent = () => navigate('/hospital/patients?view=urgent', {
    state: { initialPatients: waiting.filter((p) => String(p.urgency || '').toLowerCase() === 'emergency'), source: 'dashboard' },
  });
  const logout = () => { session.clearDoctor(); navigate('/hospital'); };

  if (!doctor) return null;
  const doctorName = doctor.name.trim().replace(/^dr\.?\s*/i, '') || doctor.name;

  return (
    <HospitalShell showDoctorArtwork>
      <h1 className="doctor-dashboard__title">Good to see you, Dr. {doctorName}</h1>
      <p className="doctor-dashboard__lede">{doctor.department}.{doctor.experience_years} years of experience - here's what's waiting for you today.</p>

      <div className="doctor-dashboard__stats">
        <button onClick={openWaiting} className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--gold"><Users size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{loading ? '…' : waiting.length}</p>
            <p className="doctor-dashboard__stat-label">waiting</p>
          </div>
        </button>
        <button onClick={openUrgent} className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--urgent"><AlertTriangle size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{loading ? '…' : urgentCount}</p>
            <p className="doctor-dashboard__stat-label">urgent</p>
          </div>
        </button>
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
            <button key={p.symptom_id} onClick={openWaiting} className="doctor-dashboard__preview-row">
              <span className="doctor-dashboard__preview-dot" style={{ background: u.color }} />
              <span className="doctor-dashboard__preview-name">{p.patient_name}</span>
              <span className="doctor-dashboard__preview-symptom">{p.symptom_text}</span>
            </button>
          );
        })}
        {waiting.length > 3 && (
          <button onClick={openWaiting} className="doctor-dashboard__preview-more">
            View all {waiting.length} waiting <ArrowRight size={14} />
          </button>
        )}
      </Card>

      <button onClick={logout} className="doctor-dashboard__logout"><LogOut size={14} /> Log out</button>
    </HospitalShell>
  );
}