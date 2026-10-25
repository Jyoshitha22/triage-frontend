import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Pill, ClipboardList, MessageSquare, Users, AlertTriangle } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import api from '../utils/api';
import session from '../utils/session';
import './RepliedList.css';

const ICONS = { medicine: Pill, test: ClipboardList, advice: MessageSquare };
const LABELS = { medicine: 'Medicines', test: 'Tests', advice: 'Advice' };

export default function RepliedList() {
  const navigate = useNavigate();
  const doctor = session.getDoctor();
  const doctorId = doctor?.doctor_id || null;
  const [replied, setReplied] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) { navigate('/hospital/doctor', { replace: true }); return; }
    let stopped = false;
    const load = () => {
      api.get(`/doctors/${doctorId}/replied`)
        .then((items) => {
          if (!stopped) setReplied(items);
        })
        .catch(() => {
          if (!stopped) {
            const scoped = session.getRepliedRecords(doctorId);
            setReplied(scoped.length > 0 ? scoped : session.getRepliedRecords());
          }
        })
        .finally(() => {
          if (!stopped) setLoading(false);
        });
    };

    load();
    const timer = setInterval(load, 5000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [doctorId, navigate]);

  if (!doctor) return null;

  return (
    <HospitalShell showDoctorArtwork>
      <h1 className="replied-list__title">Replied</h1>
      <p className="replied-list__lede">Patients you've already responded to, and what you sent them.</p>

      <div className="replied-list__nav">
        <button type="button" onClick={() => navigate('/hospital/patients')} className="replied-list__nav-btn">
          <Users size={14} /> Waiting
        </button>
        <button type="button" onClick={() => navigate('/hospital/patients?view=urgent')} className="replied-list__nav-btn">
          <AlertTriangle size={14} /> Urgent
        </button>
        <button type="button" className="replied-list__nav-btn replied-list__nav-btn--active">
          <CheckCircle2 size={14} /> Replied
        </button>
      </div>

      {loading && <Card className="replied-list__empty"><p>Loading…</p></Card>}

      {!loading && replied.length === 0 ? (
        <Card className="replied-list__empty"><p>No replies sent yet.</p></Card>
      ) : (
        <div className="replied-list__items">
          {replied.map((r) => (
            <Card key={r.symptom_id} className="replied-list__card">
              <div className="replied-list__header">
                <span className="replied-list__avatar">{r.patient_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                <div>
                  <p className="replied-list__name">{r.patient_name}</p>
                  <p className="replied-list__demo">{r.patient_age} · {r.patient_gender}</p>
                </div>
                <CheckCircle2 size={18} className="replied-list__check" />
              </div>

              <p className="replied-list__problem"><MessageSquare size={13} /> {r.symptom_text}</p>

              <div className="replied-list__reply">
                {r.replies.map((part) => {
                  const Icon = ICONS[part.response_type] || MessageSquare;
                  return (
                    <p key={part.response_id}><Icon size={13} /> <strong>{LABELS[part.response_type] || part.response_type}:</strong> {part.original_text || part.response_text}</p>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </HospitalShell>
  );
}