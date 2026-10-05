
// src/utils/storage.js

const STORAGE_KEYS = {
  patients: "patients",
  symptoms: "symptoms",
  doctors: "doctors",
  hospitals: "hospitals",
  doctorResponses: "doctorResponses",
};

// ---------- Generic helpers ----------

const getItems = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
};

const saveItems = (key, items) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
};

const generateId = (items, field) => {
  if (items.length === 0) return 1;

  return Math.max(...items.map((item) => Number(item[field]) || 0)) + 1;
};

// ---------- Patients ----------

export const getPatients = () => {
  return getItems(STORAGE_KEYS.patients);
};

export const addPatient = (patient) => {
  const patients = getPatients();

  const newPatient = {
    patient_id: generateId(patients, "patient_id"),
    ...patient,
    created_at: new Date().toISOString(),
  };

  patients.push(newPatient);
  saveItems(STORAGE_KEYS.patients, patients);

  return newPatient;
};

export const getPatientById = (patientId) => {
  const patients = getPatients();

  return patients.find(
    (patient) => Number(patient.patient_id) === Number(patientId)
  );
};

// ---------- Symptoms ----------

export const getSymptoms = () => {
  return getItems(STORAGE_KEYS.symptoms);
};

export const addSymptom = (symptom) => {
  const symptoms = getSymptoms();

  const newSymptom = {
    symptom_id: generateId(symptoms, "symptom_id"),
    status: "waiting",
    created_at: new Date().toISOString(),
    ...symptom,
  };

  symptoms.push(newSymptom);
  saveItems(STORAGE_KEYS.symptoms, symptoms);

  return newSymptom;
};

export const getSymptomById = (symptomId) => {
  const symptoms = getSymptoms();

  return symptoms.find(
    (symptom) => Number(symptom.symptom_id) === Number(symptomId)
  );
};

export const updateSymptom = (symptomId, updates) => {
  const symptoms = getSymptoms();

  const updatedSymptoms = symptoms.map((symptom) =>
    Number(symptom.symptom_id) === Number(symptomId)
      ? { ...symptom, ...updates }
      : symptom
  );

  saveItems(STORAGE_KEYS.symptoms, updatedSymptoms);

  return updatedSymptoms.find(
    (symptom) => Number(symptom.symptom_id) === Number(symptomId)
  );
};

// ---------- Doctors ----------

export const getDoctors = () => {
  return getItems(STORAGE_KEYS.doctors);
};

export const addDoctor = (doctor) => {
  const doctors = getDoctors();

  const newDoctor = {
    doctor_id: generateId(doctors, "doctor_id"),
    created_at: new Date().toISOString(),
    ...doctor,
  };

  doctors.push(newDoctor);
  saveItems(STORAGE_KEYS.doctors, doctors);

  return newDoctor;
};

export const updateDoctor = (doctorId, updates) => {
  const doctors = getDoctors();

  const updatedDoctors = doctors.map((doctor) =>
    Number(doctor.doctor_id) === Number(doctorId)
      ? { ...doctor, ...updates }
      : doctor
  );

  saveItems(STORAGE_KEYS.doctors, updatedDoctors);

  return updatedDoctors.find(
    (doctor) => Number(doctor.doctor_id) === Number(doctorId)
  );
};

export const deleteDoctor = (doctorId) => {
  const doctors = getDoctors();

  const updatedDoctors = doctors.filter(
    (doctor) => Number(doctor.doctor_id) !== Number(doctorId)
  );

  saveItems(STORAGE_KEYS.doctors, updatedDoctors);
};

// ---------- Hospitals ----------

export const getHospitals = () => {
  return getItems(STORAGE_KEYS.hospitals);
};

export const addHospital = (hospital) => {
  const hospitals = getHospitals();

  const newHospital = {
    hospital_id: generateId(hospitals, "hospital_id"),
    created_at: new Date().toISOString(),
    ...hospital,
  };

  hospitals.push(newHospital);
  saveItems(STORAGE_KEYS.hospitals, hospitals);

  return newHospital;
};

export const updateHospital = (hospitalId, updates) => {
  const hospitals = getHospitals();

  const updatedHospitals = hospitals.map((hospital) =>
    Number(hospital.hospital_id) === Number(hospitalId)
      ? { ...hospital, ...updates }
      : hospital
  );

  saveItems(STORAGE_KEYS.hospitals, updatedHospitals);

  return updatedHospitals.find(
    (hospital) => Number(hospital.hospital_id) === Number(hospitalId)
  );
};

export const deleteHospital = (hospitalId) => {
  const hospitals = getHospitals();

  const updatedHospitals = hospitals.filter(
    (hospital) => Number(hospital.hospital_id) !== Number(hospitalId)
  );

  saveItems(STORAGE_KEYS.hospitals, updatedHospitals);
};

// ---------- Doctor Responses ----------

export const getDoctorResponses = () => {
  return getItems(STORAGE_KEYS.doctorResponses);
};

export const addDoctorResponse = (response) => {
  const responses = getDoctorResponses();

  const newResponse = {
    response_id: generateId(responses, "response_id"),
    created_at: new Date().toISOString(),
    ...response,
  };

  responses.push(newResponse);
  saveItems(STORAGE_KEYS.doctorResponses, responses);

  return newResponse;
};

export const getResponsesForSymptom = (symptomId) => {
  const responses = getDoctorResponses();

  return responses.filter(
    (response) => Number(response.symptom_id) === Number(symptomId)
  );
};

// ---------- Clear all temporary data ----------

export const clearAllStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};