import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Pill, ClipboardList, MessageSquare, ChevronLeft } from 'lucide-react';
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
  const [replied, setReplied] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctor) { navigate('/hospital/doctor', { replace: true }); return; }
    api.get(`/doctors/${doctor.doctor_id}/replied`).then(setReplied).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!doctor) return null;

  return (
    <HospitalShell title="Hospital Portal" doctorName={doctor.name}>
      <h1 className="replied-list__title">Replied</h1>
      <p className="replied-list__lede">Patients you've already responded to, and what you sent them.</p>

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

      <button onClick={() => navigate('/hospital/dashboard')} className="replied-list__back">← Back to dashboard</button>
    </HospitalShell>
  );
}