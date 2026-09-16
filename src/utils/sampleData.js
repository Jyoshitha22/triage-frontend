// Sample queue — replace with the real backend list, sorted by urgency.
// This is only ever used to *seed* localStorage the first time (see
// utils/session.js) — after that, whatever's actually in storage wins,
// so edits made during a demo (like a doctor replying) persist across
// reloads instead of resetting back to this list every time.
//
// preferredLanguage is here as a placeholder for what a real backend
// would send along with each patient — in this demo it's just hardcoded
// sample data, since the patient and hospital sides run in separate
// browsers with no backend to actually carry that choice between them.
export const INITIAL_PATIENTS = [
  { id: 'p1', name: 'Sneha Iyer', age: 34, gender: 'Female', snippet: 'Sharp pain in the lower right abdomen since this morning.', submittedAgo: '9 min ago', urgency: 'emergency', specialty: 'General Surgeon', doctorAvailable: true, preferredLanguage: 'en' },
  { id: 'p2', name: 'Rahul Verma', age: 29, gender: 'Male', snippet: "I've had a headache and mild fever since yesterday evening.", submittedAgo: '4 min ago', urgency: 'medium', specialty: 'General Physician', doctorAvailable: true, preferredLanguage: 'hi' },
  { id: 'p3', name: 'Arjun Nair', age: 6, gender: 'Male', snippet: 'Persistent cough and sore throat for two days.', submittedAgo: '15 min ago', urgency: 'low', specialty: 'Pediatrician', doctorAvailable: false, preferredLanguage: 'ta' },
  { id: 'p4', name: 'Kavya Reddy', age: 41, gender: 'Female', snippet: 'Chest tightness and shortness of breath climbing stairs.', submittedAgo: '2 min ago', urgency: 'emergency', specialty: 'Cardiologist', doctorAvailable: true, preferredLanguage: 'te' },
  { id: 'p5', name: 'Meera Pillai', age: 27, gender: 'Female', snippet: 'Missed period and lower abdominal cramping for a week.', submittedAgo: '11 min ago', urgency: 'medium', specialty: 'Gynecologist', doctorAvailable: true, preferredLanguage: 'en' },
];