import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import patientArt from '../assets/role-patient.png';
import doctorArt from '../assets/role-doctor.png';
import brandHeart from '../assets/brand-heart.png';
import './RoleSelect.css';

/**
 * Home page: welcome hero + two role cards.
 * Patient -> language page. Hospital staff -> hospital login options.
 * It never skips ahead, even if this device has saved details.
 */
export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="role-select">
      <main className="role-select__main">
        <h1 className="role-select__title">Welcome to Triage</h1>
        <p className="role-select__intro">
          Your voice matters. Tell us your symptoms and get the right guidance — in your language, your way.
        </p>

        <div className="role-select__grid">
          <button onClick={() => navigate('/language')} className="role-select__card role-select__card--patient">
            <img src={patientArt} alt="" className="role-select__art" />
            <span className="role-select__label">I’m a Patient</span>
            <span className="role-select__desc">Share your symptoms and get proper guidance.</span>
            <span className="role-select__go"><ArrowRight size={26} strokeWidth={2.4} /></span>
          </button>

          <button onClick={() => navigate('/hospital')} className="role-select__card role-select__card--staff">
            <img src={doctorArt} alt="" className="role-select__art" />
            <span className="role-select__label">I’m Hospital Staff</span>
            <span className="role-select__desc">Access patient records, respond and provide care.</span>
            <span className="role-select__go"><ArrowRight size={26} strokeWidth={2.4} /></span>
          </button>
        </div>
      </main>
    </div>
  );
}
