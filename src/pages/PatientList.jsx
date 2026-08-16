import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Users, AlertTriangle } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Waveform from '../components/Waveform';
import { colors } from '../theme/color';
import './PatientList.css';

// Urgency is decided by the triage model server-side — this UI just
// renders whatever level comes back.
const URGENCY = colors.urgency;

// Sample data — replace with the real queue from the backend, sorted by
// urgency. Once a doctor sends a reply (see RecordReply), that patient's
// id is filtered out and the updated list is carried back here through
// router state — see the comment on `patients` below for why.
const SAMPLE_PATIENTS = [
  { id: 'p1', name: 'Sneha Iyer', age: 34, gender: 'Female', snippet: 'Sharp pain in the lower right abdomen since this morning.', submittedAgo: '9 min ago', urgency: 'emergency', specialty: 'General Surgeon', doctorAvailable: true },
  { id: 'p2', name: 'Rahul Verma', age: 29, gender: 'Male', snippet: "Headache and mild fever since yesterday evening.", submittedAgo: '4 min ago', urgency: 'medium', specialty: 'General Physician', doctorAvailable: true },
  { id: 'p3', name: 'Arjun Nair', age: 6, gender: 'Male', snippet: 'Persistent cough and sore throat for two days.', submittedAgo: '15 min ago', urgency: 'low', specialty: 'Pediatrician', doctorAvailable: false },
];

export default function PatientList() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // On first visit there's no router state yet, so fall back to sample
  // data. On the way back from RecordReply, state.patients is the
  // already-updated list (selected patient removed) — this is a stand-in
  // for refetching the queue from your backend once one exists.
  const patients = state?.patients || SAMPLE_PATIENTS;

  const order = { emergency: 0, medium: 1, low: 2 };
  const sorted = [...patients].sort((a, b) => order[a.urgency] - order[b.urgency]);

  const selectPatient = (p) => navigate('/hospital/reply', { state: { patient: p, patients } });

  return (
    <HospitalShell title="Patient queue">
      <div className="patient-list__header">
        <div>
          <h1 className="patient-list__title">Patient queue</h1>
          <p className="patient-list__lede">Sorted by urgency — tap a patient to listen and reply.</p>
        </div>
        <span className="patient-list__count-badge"><Users size={16} /> {patients.length} waiting</span>
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
                    <span className="patient-list__urgency-badge" style={{ background: u.bg, color: u.color }}>
                      <span className="patient-list__urgency-dot" style={{ background: u.color }} />
                      {u.label}
                      {p.urgency === 'emergency' && <AlertTriangle size={12} />}
                    </span>
                  </div>
                  <p className="patient-list__snippet">{p.snippet}</p>
                  <div className="patient-list__meta-row">
                    <span className="patient-list__wave"><Waveform mode="playback" bars={14} /></span>
                    <span className="patient-list__specialty">
                      {p.specialty}
                      {!p.doctorAvailable && <span className="patient-list__unavailable"> · specialist unavailable, any doctor can reply</span>}
                    </span>
                  </div>
                </div>

                <div className="patient-list__right">
                  <span className="patient-list__time">{p.submittedAgo}</span>
                  <ChevronRight size={16} className="patient-list__chevron" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </HospitalShell>
  );
}