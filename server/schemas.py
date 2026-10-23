from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ---------------------------------------------------------------------
# Hospital + Admin
# ---------------------------------------------------------------------
class HospitalIn(BaseModel):
    hospital_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    hospital_type: Optional[str] = None    # Government | Private | Clinic
    registration_id: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class HospitalOut(HospitalIn):
    hospital_id: int
    class Config:
        from_attributes = True


class AdminRegisterIn(BaseModel):
    email: str
    password: str
    hospital: HospitalIn


class AdminLoginIn(BaseModel):
    email: str
    password: str


class AdminOut(BaseModel):
    admin_id: int
    email: str
    hospital_id: int
    hospital: HospitalOut
    class Config:
        from_attributes = True


# ---------------------------------------------------------------------
# Doctors
# ---------------------------------------------------------------------
class DoctorRegisterIn(BaseModel):
    name: str
    phone: Optional[str] = None
    department: str
    experience_years: int = 0
    hospital_id: int
    email: str
    password: str
    languages_spoken: Optional[str] = "en"
    qualification: Optional[str] = None


class DoctorLoginIn(BaseModel):
    email: str
    password: str


class DoctorIn(BaseModel):
    """Admin manually adding/editing a doctor — no password set this way."""
    name: str
    phone: Optional[str] = None
    department: str
    experience_years: int = 0
    hospital_id: int
    languages_spoken: Optional[str] = "en"
    qualification: Optional[str] = None
    is_available: Optional[bool] = True
    is_active: Optional[bool] = True


class DoctorOut(BaseModel):
    doctor_id: int
    name: str
    phone: Optional[str] = None
    department: str
    experience_years: int
    hospital_id: Optional[int] = None
    email: Optional[str] = None
    languages_spoken: Optional[str] = None
    qualification: Optional[str] = None
    is_available: bool = True
    is_active: bool = True
    class Config:
        from_attributes = True


class DoctorAvailabilityIn(BaseModel):
    is_available: bool


# ---------------------------------------------------------------------
# Patients — email is the login identifier now (OTP dropped)
# ---------------------------------------------------------------------
class PatientLoginIn(BaseModel):
    email: str


class PatientIn(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = "en"
    email: Optional[str] = None
    city: Optional[str] = None
    allergies: Optional[str] = ""
    conditions: Optional[str] = ""


class PatientOut(PatientIn):
    patient_id: int
    class Config:
        from_attributes = True


# ---------------------------------------------------------------------
# Symptom records — the real queue
# ---------------------------------------------------------------------
class SymptomRecordIn(BaseModel):
    patient_id: int
    symptom_text: str          # already-translated-to-English text (main.py handles the translate call)
    original_text: Optional[str] = ""   # exactly what the patient said, their language
    follow_up_answers: Optional[str] = ""   # JSON string: [{"q":"...","a":"...","a_en":"..."}]
    # urgency/department are OMITTED here on purpose — the backend
    # decides them via triage.classify(), never trusts the client for this.


class SymptomRecordOut(BaseModel):
    symptom_id: int
    patient_id: int
    symptom_text: str
    original_text: Optional[str] = ""
    follow_up_answers: Optional[str] = ""
    urgency: str
    department: str
    status: str
    created_at: datetime
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    routing_note: Optional[str] = None   # e.g. "No Cardiologist on duty — routed to an experienced doctor"
    class Config:
        from_attributes = True


class SymptomStatusOut(BaseModel):
    symptom_id: int
    status: str


class ReplyPart(BaseModel):
    response_type: str      # medicine | test | advice
    response_text: str      # what the doctor actually wrote (their own language)


class DoctorResponseIn(BaseModel):
    doctor_id: int
    parts: List[ReplyPart]


class DoctorResponseOut(BaseModel):
    response_id: int
    symptom_id: int
    doctor_id: int
    response_text: str
    original_text: Optional[str] = ""
    response_type: str
    patient_language: str
    created_at: datetime
    class Config:
        from_attributes = True


class RepliedRecordOut(BaseModel):
    """One row for the doctor's 'Replied' list: patient + problem summary
    + every response part, grouped together."""
    symptom_id: int
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    symptom_text: str
    replies: List[DoctorResponseOut]


# ---------------------------------------------------------------------
# Speech
# ---------------------------------------------------------------------
class TranslateOut(BaseModel):
    translated_text: str


# ---------------------------------------------------------------------
# Patient email verification — real codes sent via Gmail SMTP, replacing
# the frontend's current window.crypto-generated popup code (which
# never actually left the browser). The code itself is never returned
# in the API response — only the real email contains it.
# ---------------------------------------------------------------------
class SendCodeIn(BaseModel):
    email: str
    language: str = "en"


class VerifyCodeIn(BaseModel):
    email: str
    code: str