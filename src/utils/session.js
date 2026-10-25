/**
 * What THIS file is for, now that a real backend exists: remembering
 * "who is using this device" — patient/admin/doctor identity, plus one
 * "which symptom record am I currently waiting on" pointer. It is
 * NOT a database substitute anymore (the old version faked the whole
 * specialist roster and patient queue here; that's gone — PatientList,
 * DoctorDashboard, SpecialistDetails etc. now fetch real data via
 * utils/api.js).
 *
 * Still just localStorage: per-device, unencrypted, wiped by clearing
 * browser data. Fine for "don't ask me to log in again on my own
 * phone" — never store anything more sensitive than an ID + email here.
 */

const KEYS = {
  patient: 'triage.session.patient',
  admin: 'triage.session.admin',
  adminLoginPrefill: 'triage.session.adminLoginPrefill',
  adminRegistrationDraft: 'triage.session.adminRegistrationDraft',
  doctor: 'triage.session.doctor',
  doctorLoginPrefill: 'triage.session.doctorLoginPrefill',
  doctorRegistrationDraft: 'triage.session.doctorRegistrationDraft',
  activeSymptomId: 'triage.session.activeSymptomId',
  pending: 'triage.session.pending',
  symptomQueue: 'triage.session.symptomQueue',
  patientRegistry: 'triage.patientRegistry',
};

const DEFAULT_PATIENTS = [
  { symptom_id: 's-101', patient_name: 'Sneha Iyer', patient_age: 34, patient_gender: 'Female', symptom_text: 'Sharp pain in the lower right abdomen since this morning.', urgency: 'emergency', department: 'General Physician', status: 'waiting', replies: [], created_at: new Date(Date.now() - 9 * 60000).toISOString() },
  { symptom_id: 's-102', patient_name: 'Rahul Verma', patient_age: 29, patient_gender: 'Male', symptom_text: "I've had a headache and mild fever since yesterday evening.", urgency: 'medium', department: 'General Physician', status: 'waiting', replies: [], created_at: new Date(Date.now() - 4 * 60000).toISOString() },
  { symptom_id: 's-103', patient_name: 'Kavya Reddy', patient_age: 41, patient_gender: 'Female', symptom_text: 'Chest tightness and shortness of breath while climbing stairs.', urgency: 'emergency', department: 'Cardiologist', status: 'waiting', replies: [], created_at: new Date(Date.now() - 2 * 60000).toISOString() },
  { symptom_id: 's-104', patient_name: 'Arjun Nair', patient_age: 6, patient_gender: 'Male', symptom_text: 'Persistent cough and sore throat for two days.', urgency: 'low', department: 'General Physician', status: 'waiting', replies: [], created_at: new Date(Date.now() - 15 * 60000).toISOString() },
];

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable — fail quietly */ }
}
function remove(key) {
  try { window.localStorage.removeItem(key); } catch { /* no-op */ }
}

export const session = {
  // ---- Patient (email-based identity) ----
  getPatient: () => read(KEYS.patient, null),
  savePatient: (data) => write(KEYS.patient, { ...data, savedAt: Date.now() }),
  clearPatient: () => remove(KEYS.patient),
  getRegisteredPatientByEmail: (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;
    return read(KEYS.patientRegistry, []).find((patient) => patient.email === normalizedEmail) || null;
  },
  registerPatient: (data) => {
    const normalizedEmail = String(data.email || '').trim().toLowerCase();
    const registered = { ...data, email: normalizedEmail, registeredAt: Date.now() };
    const patients = read(KEYS.patientRegistry, []).filter((patient) => patient.email !== normalizedEmail);
    write(KEYS.patientRegistry, [...patients, registered]);
    return registered;
  },

  // ---- Hospital admin ----
  getAdmin: () => read(KEYS.admin, null),
  saveAdmin: (data) => write(KEYS.admin, data),
  clearAdmin: () => remove(KEYS.admin),
  getAdminLoginPrefill: () => read(KEYS.adminLoginPrefill, null),
  saveAdminLoginPrefill: (data) => write(KEYS.adminLoginPrefill, data),
  clearAdminLoginPrefill: () => remove(KEYS.adminLoginPrefill),
  getAdminRegistrationDraft: () => read(KEYS.adminRegistrationDraft, null),
  saveAdminRegistrationDraft: (data) => write(KEYS.adminRegistrationDraft, data),
  clearAdminRegistrationDraft: () => remove(KEYS.adminRegistrationDraft),

  // ---- Doctor (real per-account login now, not a roster tap) ----
  getDoctor: () => read(KEYS.doctor, null),
  saveDoctor: (data) => write(KEYS.doctor, data),
  clearDoctor: () => remove(KEYS.doctor),
  getDoctorLoginPrefill: () => read(KEYS.doctorLoginPrefill, null),
  saveDoctorLoginPrefill: (data) => write(KEYS.doctorLoginPrefill, data),
  clearDoctorLoginPrefill: () => remove(KEYS.doctorLoginPrefill),
  getDoctorRegistrationDraft: () => read(KEYS.doctorRegistrationDraft, null),
  saveDoctorRegistrationDraft: (data) => write(KEYS.doctorRegistrationDraft, data),
  clearDoctorRegistrationDraft: () => remove(KEYS.doctorRegistrationDraft),

  // ---- Active symptom pointer ----
  getActiveSymptomId: () => read(KEYS.activeSymptomId, null),
  saveActiveSymptomId: (id) => write(KEYS.activeSymptomId, id),
  clearActiveSymptomId: () => remove(KEYS.activeSymptomId),
    // ---- The symptoms the patient just sent + when the wait ends, so a
  // refresh continues where they were ----
  getPending: () => read(KEYS.pending, null),
  savePending: (data) => write(KEYS.pending, data),
  clearPending: () => remove(KEYS.pending),

  // ---- Symptom queue management for frontend end-to-end operation ----
  getAllRecords: () => {
    const stored = read(KEYS.symptomQueue, null);
    if (!stored) {
      write(KEYS.symptomQueue, DEFAULT_PATIENTS);
      return DEFAULT_PATIENTS;
    }
    return stored;
  },
  getWaitingRecords: () => {
    const all = session.getAllRecords();
    return all.filter((r) => r.status === 'waiting');
  },
  getRepliedRecords: (doctorId) => {
    const all = session.getAllRecords();
    return all.filter((r) => r.status === 'replied' && (!doctorId || r.doctorId === doctorId || !r.doctorId));
  },
  getSymptomRecord: (id) => {
    const all = session.getAllRecords();
    return all.find((r) => String(r.symptom_id) === String(id)) || null;
  },
  addSymptomRecord: (record) => {
    const all = session.getAllRecords();
    const updated = [record, ...all];
    write(KEYS.symptomQueue, updated);
    session.saveActiveSymptomId(record.symptom_id);
    return record;
  },
  addDoctorReply: (symptomId, parts, doctorId, doctorName) => {
    const all = session.getAllRecords();
    const updated = all.map((r) => {
      if (String(r.symptom_id) === String(symptomId)) {
        return {
          ...r,
          status: 'replied',
          doctorId: doctorId || r.doctorId,
          doctor_name: doctorName || r.doctor_name,
          replied_at: new Date().toISOString(),
          replies: parts.map((p, idx) => ({
            response_id: `resp-${idx}-${Date.now()}`,
            response_type: p.response_type,
            response_text: p.response_text,
            original_text: p.response_text,
          })),
        };
      }
      return r;
    });
    write(KEYS.symptomQueue, updated);
    return updated.find((r) => String(r.symptom_id) === String(symptomId));
  },
};

export default session;