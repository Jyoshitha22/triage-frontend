import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Copy, Check, LogOut } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import session from '../utils/session';
import './AdminHome.css';

/**
 * What an admin sees every login after the first — no re-registration,
 * ever. Just the hospital's identity, its ID (for doctors joining to
 * self-register with), and two entry points into the forms that were
 * only ever meant to run once but might need an occasional edit.
 */
export default function AdminHome() {
  const navigate = useNavigate();
  const admin = session.getAdmin();
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (!admin) navigate('/hospital/admin', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!admin) return null;
  const hospital = admin.hospital;

  const copyId = () => {
    navigator.clipboard?.writeText(String(hospital.hospital_id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const logout = () => { session.clearAdmin(); navigate('/hospital'); };

  return (
    <HospitalShell title="Admin">
      <div className="admin-home">
        <div className="admin-home__header">
          <span className="admin-home__icon-badge"><Building2 size={22} /></span>
          <div>
            <h1 className="admin-home__title">{hospital.hospital_name}</h1>
            <p className="admin-home__lede">{hospital.city}{hospital.state ? `, ${hospital.state}` : ''} · {hospital.hospital_type}</p>
          </div>
        </div>

        <Card className="admin-home__id-card">
          <p className="admin-home__id-label">Hospital ID — share this with doctors joining your hospital</p>
          <div className="admin-home__id-row">
            <span className="admin-home__id-value">{hospital.hospital_id}</span>
            <button onClick={copyId} className="admin-home__copy-btn">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button>
          </div>
          <p className="admin-home__id-hint">Doctors enter this ID when they register their own account — you don't need to add them yourself.</p>
        </Card>

        <div className="admin-home__actions">
          <button onClick={() => navigate('/hospital/admin/edit')} className="admin-home__action-card">
            <Building2 size={20} />
            <span>Edit Hospital Details</span>
            <span className="admin-home__action-sub">Address, contact, or type changed</span>
          </button>
          <button onClick={() => navigate('/hospital/specialists')} className="admin-home__action-card">
            <Users size={20} />
            <span>Manage Specialists</span>
            <span className="admin-home__action-sub">Add, edit, or remove doctors directly</span>
          </button>
        </div>

        <button onClick={logout} className="admin-home__logout"><LogOut size={14} /> Log out</button>
      </div>
    </HospitalShell>
  );
}