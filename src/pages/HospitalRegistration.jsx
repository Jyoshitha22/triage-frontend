import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import './HospitalRegistration.css';

/**
 * Admin setup, done once — unlike the patient forms, it's fine to show
 * the full set of fields at once here.
 */
export default function HospitalRegistration() {
  const navigate = useNavigate();
  return (
    <HospitalShell title="Hospital setup">
      <div className="hospital-registration">
        <div className="hospital-registration__header">
          <span className="hospital-registration__icon-badge"><Building2 size={20} /></span>
          <div>
            <h1 className="hospital-registration__title">Hospital details</h1>
            <p className="hospital-registration__lede">Tell us about your facility.</p>
          </div>
        </div>

        <Card className="hospital-registration__card">
          <div className="hospital-registration__grid">
            <Field label="Hospital name" placeholder="Sunrise Multi-Specialty Hospital" span2 />
            <Field label="Registration ID" placeholder="HOSP-2024-00458" />
            <Field label="Contact number" placeholder="080 4567 8900" />
            <Field label="City" placeholder="Hyderabad" />
            <Field label="State" placeholder="Telangana" />
            <div className="hospital-registration__span2">
              <FieldLabel>Address</FieldLabel>
              <textarea rows={3} placeholder="Street, area, PIN code" className="hospital-registration__textarea" />
            </div>
          </div>

          <div className="hospital-registration__footer">
            <Button onClick={() => navigate('/hospital/specialists')} icon={ArrowRight}>Continue to specialist details</Button>
          </div>
        </Card>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return <label className="hospital-registration__field-label">{children}</label>;
}

function Field({ label, span2, ...props }) {
  return (
    <div className={span2 ? 'hospital-registration__span2' : ''}>
      <FieldLabel>{label}</FieldLabel>
      <input {...props} className="hospital-registration__input" />
    </div>
  );
}