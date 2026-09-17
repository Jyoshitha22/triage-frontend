
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Pill, ClipboardList, MessageSquare } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import session from '../utils/session';
import './RepliedList.css';

export default function RepliedList() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const replied = state?.repliedToday || session.getRepliedToday([]);
  const doctor = session.getCurrentDoctor();

  return (
    <HospitalShell title="Hospital Portal" doctorName={doctor?.name}>
      <h1 className="replied-list__title">Replied today</h1>
      <p className="replied-list__lede">Patients you've already responded to.</p>

      {replied.length === 0 ? (
        <Card className="replied-list__empty"><p>No replies sent yet today.</p></Card>
      ) : (
        <div className="replied-list__items">
          {replied.map((p) => (
            <Card key={p.id} className="replied-list__card">
              <div className="replied-list__header">
                <span className="replied-list__avatar">{p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                <div>
                  <p className="replied-list__name">{p.name}</p>
                  <p className="replied-list__demo">{p.age} · {p.gender}</p>
                </div>
                <CheckCircle2 size={18} className="replied-list__check" />
              </div>

              <p className="replied-list__problem"><MessageSquare size={13} /> {p.snippet}</p>

              {p.reply && (
                <div className="replied-list__reply">
                  {p.reply.medicines && <p><Pill size={13} /> <strong>Medicines:</strong> {p.reply.medicines}</p>}
                  {p.reply.tests && <p><ClipboardList size={13} /> <strong>Tests:</strong> {p.reply.tests}</p>}
                  {p.reply.advice && <p><MessageSquare size={13} /> <strong>Advice:</strong> {p.reply.advice}</p>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/hospital/dashboard')} className="replied-list__back">← Back to dashboard</button>
    </HospitalShell>
  );
}
