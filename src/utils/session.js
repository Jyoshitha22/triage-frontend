/**
 * ⚠️ THIS IS NOT A REAL DATABASE. Read this before using it.
 *
 * There's no backend yet, so "store this so the patient isn't asked to
 * log in again" and "the hospital admin's roster changes should stick
 * around" have to live *somewhere*. This file uses the browser's
 * localStorage to fake that — data survives page reloads and closing
 * the tab, on THIS device, in THIS browser, for THIS person only.
 *
 * What this means in practice:
 * - It does NOT sync across devices (a patient's phone and laptop are
 *   two totally separate "databases").
 * - It's NOT secure storage — anyone with access to the device/browser
 *   devtools can read it in plain text. Never store anything here you
 *   wouldn't be fine with being fully readable locally.
 * - Clearing browser data / private browsing wipes it instantly.
 * - It does NOT give you a real multi-hospital, multi-doctor account
 *   system — it's a convincing stand-in for demoing the flow.
 *
 * When a real backend exists, every function below gets replaced with
 * an actual API call — but every *caller* in the app (session.getX(),
 * session.saveX()) stays exactly the same, so that swap won't touch
 * any page's logic, only this one file.
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
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable — fail quietly */ }
}
function remove(key) {
  try { window.localStorage.removeItem(key); } catch { /* no-op */ }
}

export const session = {
  // ---- Patient login persistence ----
  getPatient: () => read(KEYS.patient, null),
  savePatient: (data) => write(KEYS.patient, { ...data, savedAt: Date.now() }),
  clearPatient: () => remove(KEYS.patient),

  // ---- Hospital staff login persistence ----
  getHospital: () => read(KEYS.hospital, null),
  saveHospital: (data) => write(KEYS.hospital, { ...data, savedAt: Date.now() }),
  clearHospital: () => remove(KEYS.hospital),

  // ---- Which doctor is currently using this device ----
  getCurrentDoctor: () => read(KEYS.currentDoctor, null),
  saveCurrentDoctor: (doctor) => write(KEYS.currentDoctor, doctor),
  clearCurrentDoctor: () => remove(KEYS.currentDoctor),

  // ---- Specialist roster (added/edited by the hospital admin) ----
  getRoster: (fallback) => read(KEYS.roster, fallback),
  saveRoster: (roster) => write(KEYS.roster, roster),

  // ---- Patient queue (waiting + replied-today) ----
  getPatients: (fallback) => read(KEYS.patients, fallback),
  savePatients: (patients) => write(KEYS.patients, patients),
  getRepliedToday: (fallback) => read(KEYS.repliedToday, fallback),
  saveRepliedToday: (list) => write(KEYS.repliedToday, list),
};

export default session;