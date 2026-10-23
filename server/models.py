
"""
Database models — match your original 5 tables, plus the columns needed
for real login, availability, and richer patient/hospital details.

Every NEW column is listed in migration.sql (for your existing database)
and included in schema.sql (for a fresh one). create_all() at startup only
creates tables that don't exist yet — it never alters existing tables, so
run migration.sql once on your current database.
"""
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]
import os
from datetime import datetime

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Hospital(Base):
    __tablename__ = "hospitals"
    hospital_id = Column(Integer, primary_key=True)
    hospital_name = Column(String(150), nullable=False)
    address = Column(Text)
    phone = Column(String(15))
    hospital_type = Column(String(50))      # NEW: Government | Private | Clinic
    registration_id = Column(String(60))    # NEW
    city = Column(String(100))              # NEW
    state = Column(String(100))             # NEW
    created_at = Column(DateTime, default=datetime.utcnow)


class HospitalAdmin(Base):
    __tablename__ = "hospital_admins"
    admin_id = Column(Integer, primary_key=True)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    hospital = relationship("Hospital")


class Doctor(Base):
    __tablename__ = "doctors"
    doctor_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15))
    department = Column(String(100))
    experience_years = Column(Integer)
    hospital_name = Column(String(150))
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))   # NEW
    email = Column(String(100), unique=True)                             # NEW
    password_hash = Column(String(255))                                  # NEW (bcrypt)
    languages_spoken = Column(String(200))                               # NEW e.g. "en,hi,te"
    qualification = Column(String(100))                                  # NEW e.g. "MBBS, MD"
    is_available = Column(Boolean, default=True)                         # NEW on/off duty
    is_active = Column(Boolean, default=True)                            # NEW false = resigned
    created_at = Column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"
    patient_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer)
    gender = Column(String(20))
    phone = Column(String(15))
    language = Column(String(20))
    email = Column(String(100), unique=True)   # NEW — replaces phone+OTP as the login identifier
    city = Column(String(100))          # NEW
    allergies = Column(Text)            # NEW
    conditions = Column(Text)           # NEW
    created_at = Column(DateTime, default=datetime.utcnow)


class SymptomRecord(Base):
    __tablename__ = "symptom_records"
    symptom_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"))
    symptom_text = Column(Text, nullable=False)   # English (doctor-facing)
    original_text = Column(Text)                  # NEW: exactly what the patient said, in their language
    follow_up_answers = Column(Text)              # JSON: [{"q","a","a_en"}]
    urgency = Column(String(20))                  # emergency | medium | low
    department = Column(String(100))
    status = Column(String(30), default="waiting")   # waiting | replied
    created_at = Column(DateTime, default=datetime.utcnow)


class DoctorResponse(Base):
    __tablename__ = "doctor_responses"
    response_id = Column(Integer, primary_key=True)
    symptom_id = Column(Integer, ForeignKey("symptom_records.symptom_id"))
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"))
    response_text = Column(Text)        # what the PATIENT receives (translated into their language)
    original_text = Column(Text)        # NEW: what the doctor actually wrote/said
    response_type = Column(String(20))  # medicine | test | advice
    patient_language = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()