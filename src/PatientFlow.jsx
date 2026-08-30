import React, { useState } from 'react';
import Login from './pages/login';
import BasicDetails from './pages/BasicDetails';
import SymptomRecording from './pages/SymptomRecording';
import WaitingForDoctor from './pages/WaitingForDoctor';
import DoctorReply from './pages/DoctorReply';

/**
 * Reference wiring for the patient side. Your team's convention has
 * @Sasi owning App.jsx/routing — hand this to her to merge, or drop
 * this logic straight into whatever route she sets up. Swap useState
 * for React Router if/when the app needs real URLs.
 */
export default function PatientFlow() {
  const [step, setStep] = useState('login');
  const [patient, setPatient] = useState({});
  const [symptomData, setSymptomData] = useState(null);

  switch (step) {
    case 'login':
      return <Login onContinue={(creds) => { setPatient((p) => ({ ...p, ...creds })); setStep('details'); }} />;

    case 'details':
      return (
        <BasicDetails
          onBack={() => setStep('login')}
          onContinue={(values) => { setPatient((p) => ({ ...p, ...values })); setStep('symptoms'); }}
        />
      );

    case 'symptoms':
      return (
        <SymptomRecording
          onBack={() => setStep('details')}
          onContinue={(data) => { setSymptomData(data); setStep('waiting'); }}
        />
      );

    case 'waiting':
      // No button to move forward on purpose — in production, subscribe
      // or poll for the doctor's reply here and call setStep('reply')
      // when it arrives. The patient can safely close the tab/app on
      // this screen and come back to find their reply.
      return <WaitingForDoctor />;

    case 'reply':
      return <DoctorReply onDone={() => setStep('login')} />;

    default:
      return null;
  }
}