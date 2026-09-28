import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope } from 'lucide-react';

import HeartbeatLogo from '../components/HeartbeatLogo';

import './RoleSelect.css';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="role-select">
      <div className="role-select__panel">

        <HeartbeatLogo
          size={44}
          className="role-select__logo"
        />

        <h1 className="role-select__title">
          Triage
        </h1>

        <p className="role-select__subtitle">
          Who's using this?
        </p>

        <div className="role-select__grid">

          {/* Patient */}
          <button
            onClick={() => navigate('/language')}
            className="role-select__card"
          >
            <span className="role-select__icon role-select__icon--patient">
              <User
                size={56}
                strokeWidth={1.6}
              />
            </span>

            <span className="role-select__label">
              I'm a patient
            </span>
          </button>

          {/* Hospital staff */}
          <button
            onClick={() => navigate('/hospital')}
            className="role-select__card"
          >
            <span className="role-select__icon role-select__icon--doctor">
              <Stethoscope
                size={56}
                strokeWidth={1.6}
              />
            </span>

            <span className="role-select__label">
              I'm hospital staff
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}