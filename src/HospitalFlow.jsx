import React, { useState } from 'react';
import HospitalLogin from './pages/HospitalLogin';
import HospitalRegistration from './pages/HospitalRegistration';
import SpecialistDetails from './pages/SpecialistDetails';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientList from './pages/PatientList';
import RecordReply from './pages/RecordReply';

// Sample queue — replace with the real backend list, sorted by urgency.
const INITIAL_PATIENTS = [
  { id: 'p1', name: 'Sneha Iyer', age: 34, gender: 'Female', snippet: 'Sharp pain in the lower right abdomen since this morning.', submittedAgo: '9 min ago', urgency: 'emergency', specialty: 'General Surgeon', doctorAvailable: true },
  { id: 'p2', name: 'Rahul Verma', age: 29, gender: 'Male', snippet: "I've had a headache and mild fever since yesterday evening. Since yesterday evening, so about a day. I took a paracetamol this morning, but it hasn't helped much.", submittedAgo: '4 min ago', urgency: 'medium', specialty: 'General Physician', doctorAvailable: true },
  { id: 'p3', name: 'Arjun Nair', age: 6, gender: 'Male', snippet: 'Persistent cough and sore throat for two days.', submittedAgo: '15 min ago', urgency: 'low', specialty: 'Pediatrician', doctorAvailable: false },
];

/**
 * Reference wiring for the hospital side — same note as PatientFlow.
 * Login → Registration → Specialists → Dashboard are first-time setup
 * only; once saved, a returning hospital account should skip straight
 * to the dashboard (wire that check against your auth/database).
 */
export default function HospitalFlow() {
  const [step, setStep] = useState('login');
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [activePatient, setActivePatient] = useState(null);
  const [roster, setRoster] = useState([]);

  const removePatient = (id) => {
    setPatients((list) => list.filter((p) => p.id !== id));
    setActivePatient(null);
    setStep('list');
  };

  switch (step) {
    case 'login':
      return <HospitalLogin onContinue={() => setStep('registration')} />;

    case 'registration':
      return <HospitalRegistration onContinue={() => setStep('specialists')} />;

    case 'specialists':
      return (
        <SpecialistDetails
          onBack={() => setStep('registration')}
          onContinue={(r) => { setRoster(r); setStep('dashboard'); }}
        />
      );

    case 'dashboard':
      return (
        <DoctorDashboard
          waitingCount={patients.length}
          onViewQueue={() => setStep('list')}
          onLogout={() => setStep('login')}
        />
      );

    case 'list':
      return <PatientList patients={patients} onSelectPatient={(p) => { setActivePatient(p); setStep('reply'); }} />;

    case 'reply':
      return <RecordReply patient={activePatient} onBack={() => setStep('list')} onSend={removePatient} />;

    default:
      return null;
  }
}