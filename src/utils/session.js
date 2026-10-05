/**
<<<<<<< HEAD
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
=======

⚠️ THIS IS NOT A REAL DATABASE. Read this before using it.

There's no backend yet, so "store this so the patient isn't asked to

log in again" and "the hospital admin's roster changes should stick

around" have to live somewhere. This file uses the browser's

localStorage to fake that — data survives page reloads and closing

the tab, on THIS device, in THIS browser, for THIS person only.

What this means in practice:

It does NOT sync across devices (a patient's phone and laptop are


two totally separate "databases").

It's NOT secure storage — anyone with access to the device/browser


devtools can read it in plain text. Never store anything here you

wouldn't be fine with being fully readable locally.

Clearing browser data / private browsing wipes it instantly.


It does NOT give you a real multi-hospital, multi-doctor account


system — it's a convincing stand-in for demoing the flow.

When a real backend exists, every function below gets replaced with

an actual API call — but every caller in the app (session.getX(),

session.saveX()) stays exactly the same, so that swap won't touch

any page's logic, only this one file.
*/


const KEYS = {
patient: 'triage.session.patient',
hospital: 'triage.session.hospital',
currentDoctor: 'triage.session.currentDoctor',
roster: 'triage.db.roster',
patients: 'triage.db.patients',
repliedToday: 'triage.db.repliedToday',
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
try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable — fail quietly / }
}
function remove(key) {
try { window.localStorage.removeItem(key); } catch { / no-op */ }
}

export const session = {
// ---- Patient login persistence ----
getPatient: () => read(KEYS.patient, null),
savePatient: (data) => write(KEYS.patient, { ...data, savedAt: Date.now() }),
clearPatient: () => localStorage.removeItemc(KEYS.patient),

// ---- Hospital staff login persistence ----
getHospital: () => read(KEYS.hospital, null),
saveHospital: (data) => write(KEYS.hospital, { ...data, savedAt: Date.now() }),
clearHospital: () => localStorage.removeItem(KEYS.hospital),

// ---- Which doctor is currently using this device ----
getCurrentDoctor: () => read(KEYS.currentDoctor, null),
saveCurrentDoctor: (doctor) => write(KEYS.currentDoctor, doctor),
clearCurrentDoctor: () => localStorage.removeItem(KEYS.currentDoctor),

// ---- Specialist roster (added/edited by the hospital admin) ----
getRoster: (fallback) => read(KEYS.roster, fallback),
saveRoster: (roster) => write(KEYS.roster, roster),

// ---- Patient queue (waiting + replied-today) ----
getPatients: (fallback) => read(KEYS.patients, fallback),
savePatients: (patients) => write(KEYS.patients, patients),
getRepliedToday: (fallback) => read(KEYS.repliedToday, fallback),
saveRepliedToday: (list) => write(KEYS.repliedToday, list),
>>>>>>> 26c388c (changes)
};

export default session;