import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, AlertTriangle, Info, LogOut, CheckCircle2 } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import api from '../utils/api';
import session from '../utils/session';
import { colors } from '../theme/color';
import './PatientList.css';

const URGENCY = colors.urgency;
const ORDER = { emergency: 0, medium: 1, low: 2 };

function queueCacheKey(doctorId) {
  return `triage.realQueue.waiting.doctor.${doctorId}`;
}

function readCachedQueue(doctorId) {
  try {
    const raw = window.localStorage.getItem(queueCacheKey(doctorId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedQueue(doctorId, items) {
  try {
    window.localStorage.setItem(queueCacheKey(doctorId), JSON.stringify(Array.isArray(items) ? items : []));
  } catch {
    // ignore localStorage write failures
  }
}

function scopeQueueByDoctor(items, isUrgentView) {
  const scoped = Array.isArray(items) ? items : [];
  if (!isUrgentView) return scoped;
  return scoped.filter((item) => String(item.urgency || '').toLowerCase() === 'emergency');
}

function summarize(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 120) return cleaned;
  return `${cleaned.slice(0, 117)}...`;
}

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const doctor = session.getDoctor();
  const doctorId = doctor?.doctor_id || null;
  const dashboardInitial = scopeQueueByDoctor(location.state?.initialPatients || [], searchParams.get('view') === 'urgent');
  const [patients, setPatients] = useState(dashboardInitial);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const isUrgentView = searchParams.get('view') === 'urgent';

  useEffect(() => {
    if (!doctorId) {
      navigate('/hospital/doctor', { replace: true });
      return;
    }
    let stopped = false;
    const load = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      const urgencyQuery = isUrgentView ? '&urgency=emergency' : '';
      api.get(`/symptom-records?status=waiting&doctor_id=${doctorId}${urgencyQuery}`)
        .then((items) => {
          if (stopped) return;
          const scoped = scopeQueueByDoctor(items || [], isUrgentView);
          setLoadError('');
          setPatients(scoped);
          writeCachedQueue(doctorId, scoped);
        })
        .catch((err) => {
          if (stopped) return;
          const fromDashboard = scopeQueueByDoctor(location.state?.initialPatients || [], isUrgentView);
          const cached = scopeQueueByDoctor(readCachedQueue(doctorId), isUrgentView);
          const fallback = cached.length > 0 ? cached : fromDashboard;
          setPatients(fallback);
          setLoadError(fallback.length > 0 ? '' : String(err?.message || 'Server is temporarily unreachable.'));
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
  }, [doctorId, navigate, isUrgentView, location.state]);

  const sorted = [...patients].sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency]);
  const selectPatient = (p) => navigate('/hospital/reply', { state: { symptomId: p.symptom_id, fromView: isUrgentView ? 'urgent' : 'waiting' } });
  const logout = () => { session.clearDoctor(); navigate('/hospital'); };

  if (!doctor) {
  return (
    <HospitalShell showDoctorArtwork>
      <div className="patient-list__header">
        <div>
          <h1 className="patient-list__title">Patient queue</h1>
          <p className="patient-list__lede">
            Patients are prioritized by urgency.
          </p>
        </div>
      </div>

      <Card className="patient-list__empty">
        <p>Patient queue is available for testing.</p>
      </Card>
    </HospitalShell>
  );
}
  return (
    <HospitalShell showDoctorArtwork>
      <div className="patient-list__header">
        <div>
          <h1 className="patient-list__title">{isUrgentView ? 'Urgent queue' : 'Patient queue'}</h1>
          <p className="patient-list__lede">
            {isUrgentView
              ? 'Emergency-only patients assigned to you. Respond quickly, then move to Replied.'
              : 'Patients assigned to you, prioritized by urgency. Select a patient to review and respond.'}
          </p>
        </div>
        <span className="patient-list__count-badge"><Users size={16} /> {patients.length} {isUrgentView ? 'Urgent' : 'Patients Waiting'}</span>
      </div>

      <div className="patient-list__nav">
        <button
          type="button"
          onClick={() => navigate('/hospital/patients')}
          className={`patient-list__nav-btn ${!isUrgentView ? 'patient-list__nav-btn--active' : ''}`}
        >
          <Users size={14} /> Waiting
        </button>
        <button
          type="button"
          onClick={() => navigate('/hospital/patients?view=urgent')}
          className={`patient-list__nav-btn ${isUrgentView ? 'patient-list__nav-btn--active' : ''}`}
        >
          <AlertTriangle size={14} /> Urgent
        </button>
        <button type="button" onClick={() => navigate('/hospital/replied')} className="patient-list__nav-btn">
          <CheckCircle2 size={14} /> Replied
        </button>
      </div>

      {loadError && <Card className="patient-list__empty"><p>{loadError}</p></Card>}

      {loading && <Card className="patient-list__empty"><p>Loading…</p></Card>}

      {!loading && patients.length === 0 ? (
        <Card className="patient-list__empty"><p>{isUrgentView ? 'No urgent patients in your queue right now.' : "You're all caught up — no patients waiting right now."}</p></Card>
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
                  <p className="patient-list__snippet">{summarize(p.doctor_summary || p.symptom_text)}</p>
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
      <button onClick={logout} className="patient-list__logout"><LogOut size={15} /> Log out</button>
    </HospitalShell>
  );
}