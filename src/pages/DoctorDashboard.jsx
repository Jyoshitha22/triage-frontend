import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import Waveform from '../components/Waveform';
import './DoctorDashboard.css';

export default function DoctorDashboard({ doctorName = 'Dr. Ananya Rao', waitingCount = 6, repliedToday = 14 }) {
  const navigate = useNavigate();
  return (
    <HospitalShell title="Dashboard" doctorName={doctorName} onLogout={() => navigate('/hospital')}>
      <h1 className="doctor-dashboard__title">Good to see you, {doctorName.replace('Dr. ', '')}</h1>
      <p className="doctor-dashboard__lede">Here's what's waiting for you today.</p>

      <div className="doctor-dashboard__stats">
        <Card className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--gold"><Users size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{waitingCount}</p>
            <p className="doctor-dashboard__stat-label">patients waiting</p>
          </div>
        </Card>
        <Card className="doctor-dashboard__stat-card">
          <span className="doctor-dashboard__stat-icon doctor-dashboard__stat-icon--navy"><CheckCircle2 size={20} /></span>
          <div>
            <p className="doctor-dashboard__stat-number">{repliedToday}</p>
            <p className="doctor-dashboard__stat-label">replied today</p>
          </div>
        </Card>
      </div>

      <Card className="doctor-dashboard__wait-card">
        <div className="doctor-dashboard__wait-row"><Clock size={16} /> Longest wait right now: 11 minutes</div>
        <Waveform mode="pulse" className="doctor-dashboard__wave" />
        <Button className="doctor-dashboard__cta" onClick={() => navigate('/hospital/patients')} icon={ArrowRight}>View patient queue</Button>
      </Card>
    </HospitalShell>
  );
}