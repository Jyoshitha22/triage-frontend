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
  doctor: 'triage.session.doctor',
  activeSymptomId: 'triage.session.activeSymptomId',
};

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

  // ---- Hospital admin ----
  getAdmin: () => read(KEYS.admin, null),
  saveAdmin: (data) => write(KEYS.admin, data),
  clearAdmin: () => remove(KEYS.admin),

  // ---- Doctor (real per-account login now, not a roster tap) ----
  getDoctor: () => read(KEYS.doctor, null),
  saveDoctor: (data) => write(KEYS.doctor, data),
  clearDoctor: () => remove(KEYS.doctor),

  // ---- The one symptom record the patient is currently waiting on —
  // this is what makes "leave and come back" work: on return, the app
  // checks this ID's status instead of re-asking Basic Details/Symptoms.
  getActiveSymptomId: () => read(KEYS.activeSymptomId, null),
  saveActiveSymptomId: (id) => write(KEYS.activeSymptomId, id),
  clearActiveSymptomId: () => remove(KEYS.activeSymptomId),
};

export default session;