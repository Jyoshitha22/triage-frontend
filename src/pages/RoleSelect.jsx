import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope } from 'lucide-react';
import HeartbeatLogo from '../components/HeartbeatLogo';
import session from '../utils/session';
import './RoleSelect.css';

/**
 * The very first screen anyone sees. Deliberately icon-first and
 * text-light — a person who can't read still needs to be able to tell
 * these two options apart at a glance, so each one is a big tappable
 * card built around a single, unambiguous symbol (a person vs. a
 * stethoscope), not a sentence to parse.
 *
 * If this device already has a saved patient or hospital session,
 * skip straight past this and the rest of login — see session.js.
 */
export default function RoleSelect() {
  const navigate = useNavigate();

  useEffect(() => {
    if (session.getPatient()) { navigate('/symptoms', { replace: true }); return; }
    if (session.getHospital()) { navigate('/hospital/dashboard', { replace: true }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="role-select">
      <div className="role-select__panel">
        <HeartbeatLogo size={44} className="role-select__logo" />
        <h1 className="role-select__title">Triage</h1>
        <p className="role-select__subtitle">Who's using this?</p>

        <div className="role-select__grid">
          <button onClick={() => navigate('/language')} className="role-select__card">
            <span className="role-select__icon role-select__icon--patient"><User size={56} strokeWidth={1.6} /></span>
            <span className="role-select__label">I'm a patient</span>
          </button>

          <button onClick={() => navigate('/hospital')} className="role-select__card">
            <span className="role-select__icon role-select__icon--doctor"><Stethoscope size={56} strokeWidth={1.6} /></span>
            <span className="role-select__label">I'm hospital staff</span>
          </button>
        </div>
      </div>
    </div>
  );
}
