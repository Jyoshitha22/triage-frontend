import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Stethoscope, ChevronLeft } from 'lucide-react';
import HeartbeatLogo from '../components/HeartbeatLogo';
import './RoleSelect.css';

/**
 * Splits "hospital staff" into the two real roles: the admin who sets
 * the hospital up once, and doctors who log into their own account
 * every time. Staff are assumed literate (unlike the patient-facing
 * RoleSelect), so this leans on short labels rather than icon-only.
 */
export default function HospitalRoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="role-select">
      <div className="role-select__panel">
        <button onClick={() => navigate('/')} className="role-select__back"><ChevronLeft size={16} /> Back</button>

        <HeartbeatLogo size={40} className="role-select__logo" />
        <h1 className="role-select__title">Hospital Portal</h1>
        <p className="role-select__subtitle">Are you the admin, or a doctor?</p>

        <div className="role-select__grid">
          <button onClick={() => navigate('/hospital/admin')} className="role-select__card">
            <span className="role-select__icon role-select__icon--patient"><ShieldCheck size={48} strokeWidth={1.6} /></span>
            <span className="role-select__label">Hospital Admin</span>
            <span className="role-select__sublabel">Set up or manage the hospital</span>
          </button>

          <button onClick={() => navigate('/hospital/doctor')} className="role-select__card">
            <span className="role-select__icon role-select__icon--doctor"><Stethoscope size={48} strokeWidth={1.6} /></span>
            <span className="role-select__label">Doctor</span>
            <span className="role-select__sublabel">See your patients and reply</span>
          </button>
        </div>
      </div>
    </div>
  );
}