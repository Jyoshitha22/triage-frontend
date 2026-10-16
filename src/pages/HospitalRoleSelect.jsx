import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import nurseImage from '../assets/nurse_circle.png';
import doctorImage from '../assets/doctor_circle.png';
import './HospitalRoleSelect.css';

/**
 * Splits "hospital staff" into the two real roles: the admin who sets
 * the hospital up once, and doctors who log into their own account
 * every time.
 */
export default function HospitalRoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="hospital-role">
      <div className="hospital-role__panel">
        <h1 className="hospital-role__title">Hospital Portal</h1>
        <p className="hospital-role__subtitle">Are you the admin, or a doctor?</p>

        <div className="hospital-role__choices">
          <div className="hospital-role__grid">
            <button onClick={() => navigate('/hospital/admin')} className="hospital-role__card">
              <span className="hospital-role__icon"><img src={nurseImage} alt="" /></span>
              <span className="hospital-role__label">Hospital Admin</span>
              <span className="hospital-role__sub">Set up or manage the hospital</span>
            </button>

            <button onClick={() => navigate('/hospital/doctor')} className="hospital-role__card hospital-role__card--doctor">
              <span className="hospital-role__icon"><img src={doctorImage} alt="" /></span>
              <span className="hospital-role__label">Doctor</span>
              <span className="hospital-role__sub">See your patients and reply</span>
            </button>
          </div>
          <button type="button" onClick={() => navigate('/')} className="hospital-role__back hospital-role__back--bottom"><ChevronLeft size={16} /> Back</button>
        </div>
      </div>
    </div>
  );
}