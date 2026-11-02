import { useEffect, useState } from 'react';
import { ChevronLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import api from '../utils/api';
import session from '../utils/session';
import './HospitalRecords.css';

function formatDate(value) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString();
}

function formatPrescription(row) {
  const parts = [];
  const medicines = String(row?.medicines || '').trim();
  const tests = String(row?.tests || '').trim();
  const advice = String(row?.advice || '').trim();
  const reason = String(row?.reason || '').trim();
  if (medicines) parts.push(`Medicines: ${medicines}`);
  if (tests) parts.push(`Tests: ${tests}`);
  if (advice) parts.push(`Advice: ${advice}`);
  if (reason) parts.push(`Reason: ${reason}`);
  return parts.length ? parts.join(' | ') : '-';
}

export default function HospitalRecords() {
  const navigate = useNavigate();
  const admin = session.getAdmin();
  const hospitalId = admin?.hospital?.hospital_id || admin?.hospital_id;
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [roster, setRoster] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [mode, setMode] = useState('doctors');
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (!hospitalId) {
      navigate('/hospital/admin', { replace: true });
      return;
    }
    setLoadingDoctors(true);
    Promise.all([
      api.get('/departments').catch(() => ({ departments: [] })),
      api.get(`/doctors?hospital_id=${hospitalId}`).catch(() => []),
    ])
      .then(([deps, docs]) => {
        setDepartments(Array.isArray(deps?.departments) ? deps.departments : []);
        setRoster(Array.isArray(docs) ? docs : []);
      })
      .finally(() => setLoadingDoctors(false));
  }, [hospitalId, navigate]);

  const filteredDoctors = roster.filter((doc) => {
    if (!department) return true;
    return String(doc?.department || '').trim().toLowerCase() === String(department).trim().toLowerCase();
  });

  useEffect(() => {
    if (!selectedDoctor) return;
    const stillVisible = filteredDoctors.some((doc) => doc.doctor_id === selectedDoctor.doctor_id);
    if (!stillVisible) {
      setSelectedDoctor(null);
      setPatients([]);
      setMode('doctors');
    }
  }, [filteredDoctors, selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctor || !hospitalId || mode !== 'patients') return;
    let stopped = false;

    const loadPatients = () => {
      setLoadingPatients(true);
      api.get(`/hospital-records/doctors/${selectedDoctor.doctor_id}/patients?hospital_id=${hospitalId}`)
        .then((rows) => {
          if (!stopped) setPatients(Array.isArray(rows) ? rows : []);
        })
        .catch(() => {
          if (!stopped) setPatients([]);
        })
        .finally(() => {
          if (!stopped) setLoadingPatients(false);
        });
    };

    loadPatients();
    const timer = setInterval(loadPatients, 8000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [selectedDoctor, hospitalId, mode]);

  const openDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setMode('patients');
    setLoadingPatients(true);
    api.get(`/hospital-records/doctors/${doctor.doctor_id}/patients?hospital_id=${hospitalId}`)
      .then((rows) => setPatients(Array.isArray(rows) ? rows : []))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  };

  const filterOptions = Array.from(new Set([
    ...departments,
    ...roster.map((doc) => doc.department).filter(Boolean),
  ])).sort((a, b) => String(a).localeCompare(String(b)));

  return (
    <HospitalShell wide showDoctorArtwork doctorArtworkSide="right">
      <div className="hospital-records">
        <div className="hospital-records__head">
          <h1>Hospital Records</h1>
          <p>Doctors and treated patients by department.</p>
        </div>

        <Card>
          <div className="hospital-records__mode-tabs">
            <button type="button" className={mode === 'doctors' ? 'is-active' : ''} onClick={() => setMode('doctors')}>Doctors</button>
            <button type="button" className={mode === 'patients' ? 'is-active' : ''} onClick={() => setMode('patients')} disabled={!selectedDoctor}>Patients</button>
          </div>

          <div className="hospital-records__toolbar">
            <label htmlFor="dept">Department filter</label>
            <select id="dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {filterOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <p className="hospital-records__count">Doctors shown: {filteredDoctors.length}</p>
          </div>

          <div className="hospital-records__grid">
            <div>
              <h2><Users size={16} /> Doctors</h2>
              <div className="hospital-records__list">
                {loadingDoctors && <p className="hospital-records__empty">Loading doctors...</p>}
                {filteredDoctors.map((doc) => (
                  <button
                    key={doc.doctor_id}
                    type="button"
                    className={`hospital-records__doctor ${selectedDoctor?.doctor_id === doc.doctor_id ? 'is-selected' : ''}`}
                    onClick={() => openDoctor(doc)}
                  >
                    <span>{doc.name || '-'}</span>
                    <small>{doc.department || '-'}</small>
                    <small>Experience: {doc.experience_years ?? '-'} years</small>
                    <small>Email: {doc.email || '-'}</small>
                    <small>Phone: {doc.phone || '-'}</small>
                    <small>Qualification: {doc.qualification || '-'}</small>
                    <small>Languages: {doc.languages_spoken || '-'}</small>
                    <small>Status: {doc.is_available ? 'Available' : 'Unavailable'}</small>
                  </button>
                ))}
                {!loadingDoctors && filteredDoctors.length === 0 && <p className="hospital-records__empty">No doctors found.</p>}
              </div>
            </div>

            <div style={{ display: mode === 'patients' ? 'block' : 'none' }}>
              <h2>Patients treated {selectedDoctor ? `by ${selectedDoctor.name}` : ''}</h2>
              {selectedDoctor && (
                <p className="hospital-records__doctor-summary">
                  Total treated patients: <b>{patients.length}</b>
                </p>
              )}
              <div className="hospital-records__patients">
                {loadingPatients && selectedDoctor && <p className="hospital-records__empty">Loading treated patients...</p>}
                {patients.map((row) => (
                  <article key={row.symptom_id} className="hospital-records__patient-row">
                    <p><strong>{row.patient_name}</strong> ({row.patient_age || '-'} · {row.patient_gender || '-'})</p>
                    <p><b>Symptom:</b> {row.symptom_text || '-'}</p>
                    <p><b>Prescription:</b> {formatPrescription(row)}</p>
                    <p><b>Treated date:</b> {formatDate(row.treated_at || row.replied_at || row.created_at)}</p>
                  </article>
                ))}
                {!loadingPatients && selectedDoctor && patients.length === 0 && <p className="hospital-records__empty">No treated patients for this doctor yet.</p>}
              </div>
            </div>
          </div>
        </Card>

        <button type="button" onClick={() => navigate('/hospital/admin/home')} className="hospital-records__back"><ChevronLeft size={16} /> Back</button>
      </div>
    </HospitalShell>
  );
}
