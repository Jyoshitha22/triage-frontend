import os
import json
import random
import re
import smtplib
import time
import uuid
import threading
from email.message import EmailMessage
from typing import Any
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

import psycopg2
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from dotenv import load_dotenv

    # Load env from both project root and server folder so uvicorn can be
    # launched from either location without losing SMTP/DB configuration.
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=False)
except Exception:
    pass


app = FastAPI(title="Healthcare Triage Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
CODE_TTL_SECONDS = 5 * 60
verification_codes: dict[str, dict[str, Any]] = {}

SCHEMA_INIT_LOCK = threading.Lock()
SCHEMA_READY = {
    "hospital": False,
    "symptom": False,
    "patient": False,
}

DATABASE_URL = os.getenv("DATABASE_URL", "")
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "").strip()
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "").strip()
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", GMAIL_ADDRESS).strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", GMAIL_APP_PASSWORD).strip()
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USERNAME).strip()
SMTP_USE_SSL = str(os.getenv("SMTP_USE_SSL", "1")).strip().lower() in {"1", "true", "yes", "on"}
SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS", "20"))
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_BASE_URL = "https://api.sarvam.ai"
SARVAM_JSON_TIMEOUT_SECONDS = int(os.getenv("SARVAM_JSON_TIMEOUT_SECONDS", "15"))
SARVAM_FILE_TIMEOUT_SECONDS = int(os.getenv("SARVAM_FILE_TIMEOUT_SECONDS", "90"))
REPLY_LOCK_SECONDS = 10 * 60
REPLY_LINK_BASE = os.getenv("APP_BASE_URL", "http://localhost:5173")
KEYWORD_TRAINING_FILE = os.path.join(os.path.dirname(__file__), "symptom_department_keywords.json")

MAIL_TEMPLATES = {
    "en": {
        "subject": "Your Verification Code – Healthcare Triage Assistant",
        "body": "Dear User,\n\nYour verification code for Healthcare Triage Assistant is:\n\n{{VERIFICATION_CODE}}\n\nThis code is valid for 5 minutes. Please enter it in the application to verify your email address and continue.\n\nSecurity Notice: Do not share this code with anyone. Our team will never ask you to disclose your verification code.\n\nIf you did not request this code, please ignore this email.\n\nRegards,\nHealthcare Triage Assistant Team\nYour health, our priority.",
    },
    "ta": {
        "subject": "உங்கள் சரிபார்ப்புக் குறியீடு – Healthcare Triage Assistant",
        "body": "அன்புள்ள பயனருக்கு,\nHealthcare Triage Assistant-இல் உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்ப்பதற்கான குறியீடு:\n{{VERIFICATION_CODE}}\nஇந்தக் குறியீடு 5 நிமிடங்களுக்கு மட்டுமே செல்லுபடியாகும். உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்த்து தொடர, இந்தக் குறியீட்டைச் செயலியில் உள்ளிடவும்.\nபாதுகாப்புக் குறிப்பு: இந்தக் குறியீட்டை யாரிடமும் பகிர வேண்டாம். எங்கள் குழுவினர் உங்கள் சரிபார்ப்புக் குறியீட்டை ஒருபோதும் கேட்கமாட்டார்கள்.\nநீங்கள் இந்தக் குறியீட்டைக் கோரவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கவும்.\nநன்றியுடன்,\nHealthcare Triage Assistant குழு\nஉங்கள் ஆரோக்கியம், எங்கள் பொறுப்பு.",
    },
    "hi": {
        "subject": "आपका सत्यापन कोड – Healthcare Triage Assistant",
        "body": "प्रिय उपयोगकर्ता,\nHealthcare Triage Assistant पर आपके ईमेल पते को सत्यापित करने के लिए आपका सत्यापन कोड है:\n{{VERIFICATION_CODE}}\nयह कोड केवल 5 मिनट तक मान्य है। अपना ईमेल पता सत्यापित करने और आगे बढ़ने के लिए इस कोड को एप्लिकेशन में दर्ज करें।\nसुरक्षा सूचना: इस कोड को किसी के साथ साझा न करें। हमारी टीम आपसे कभी भी आपका सत्यापन कोड नहीं माँगेगी।\nयदि आपने इस कोड का अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।\nसादर,\nHealthcare Triage Assistant टीम\nआपका स्वास्थ्य, हमारी ज़िम्मेदारी।",
    },
    "te": {
        "subject": "మీ ధృవీకరణ కోడ్ – Healthcare Triage Assistant",
        "body": "ప్రియమైన వినియోగదారుడికి,\nHealthcare Triage Assistant‌లో మీ ఇమెయిల్ చిరునామాను ధృవీకరించడానికి మీ ధృవీకరణ కోడ్:\n{{VERIFICATION_CODE}}\nఈ కోడ్ 5 నిమిషాల వరకు మాత్రమే చెల్లుబాటు అవుతుంది. మీ ఇమెయిల్ చిరునామాను ధృవీకరించి, కొనసాగించడానికి ఈ కోడ్‌ను అప్లికేషన్‌లో నమోదు చేయండి.\nభద్రతా సూచన: ఈ కోడ్‌ను ఎవరితోనూ పంచుకోవద్దు. మా బృందం మీ ధృవీకరణ కోడ్‌ను ఎప్పటికీ అడగదు.\nమీరు ఈ కోడ్‌ను అభ్యర్థించకపోతే, ఈ ఇమెయిల్‌ను పట్టించుకోకండి.\nధన్యవాదాలతో,\nHealthcare Triage Assistant బృందం\nమీ ఆరోగ్యం, మా బాధ్యత.",
    },
}

REPLY_READY_TEMPLATES = {
    "en": {
        "subject": "Your Doctor's Reply Is Ready – Healthcare Triage Assistant",
        "body": "Dear {{PATIENT_NAME}},\n\nYour doctor has reviewed your symptoms, and your reply is now ready!\n\nPlease click the link below to view your doctor's response.\n{{REPLY_URL}}\n\nYour health and well-being are important to us. Please log in to the Healthcare Triage Assistant to access your response securely.\n\nIf you experience severe or worsening symptoms, seek immediate medical attention.\n\nThank you for using Healthcare Triage Assistant.\n\nRegards,\nHealthcare Triage Assistant Team\nYour health, our priority.",
    },
    "te": {
        "subject": "డాక్టర్ సమాధానం సిద్ధంగా ఉంది – Healthcare Triage Assistant",
        "body": "ప్రియమైన {{PATIENT_NAME}} గారికి,\n\nడాక్టర్ మీ లక్షణాలను పరిశీలించారు. మీకు సమాధానం ఇప్పుడు సిద్ధంగా ఉంది!\n\nమీ డాక్టర్ సమాధానాన్ని చూడటానికి కింది లింక్‌పై క్లిక్ చేయండి.\n{{REPLY_URL}}\n\nమీ ఆరోగ్యం, శ్రేయస్సు మాకు ముఖ్యం. మీ సమాధానాన్ని సురక్షితంగా చూడటానికి Healthcare Triage Assistant అప్లికేషన్‌లోకి లాగిన్ అవ్వండి.\n\nమీ లక్షణాలు తీవ్రంగా మారినా లేదా మరింత తీవ్రమైనా, వెంటనే వైద్య సహాయం పొందండి.\n\nHealthcare Triage Assistant‌ను ఉపయోగించినందుకు ధన్యవాదాలు.\n\nధన్యవాదాలతో,\nHealthcare Triage Assistant బృందం\nమీ ఆరోగ్యం, మా బాధ్యత.",
    },
    "hi": {
        "subject": "डॉक्टर का जवाब तैयार है – Healthcare Triage Assistant",
        "body": "प्रिय {{PATIENT_NAME}} जी,\n\nडॉक्टर ने आपके लक्षणों की जाँच कर ली है। आपके लिए जवाब अब तैयार है!\n\nडॉक्टर का जवाब देखने के लिए नीचे दिए गए लिंक पर क्लिक करें।\n{{REPLY_URL}}\n\nआपका स्वास्थ्य और आपकी भलाई हमारे लिए महत्वपूर्ण हैं। अपना जवाब सुरक्षित रूप से देखने के लिए Healthcare Triage Assistant एप्लिकेशन में लॉग इन करें।\n\nयदि आपके लक्षण गंभीर हो जाते हैं या बिगड़ते हैं, तो तुरंत चिकित्सा सहायता लें।\n\nHealthcare Triage Assistant का उपयोग करने के लिए धन्यवाद।\n\nसादर,\nHealthcare Triage Assistant टीम\nआपका स्वास्थ्य, हमारी ज़िम्मेदारी।",
    },
    "ta": {
        "subject": "மருத்துவரின் பதில் தயாராக உள்ளது – Healthcare Triage Assistant",
        "body": "அன்புள்ள {{PATIENT_NAME}} அவர்களுக்கு,\n\nமருத்துவர் உங்கள் அறிகுறிகளைப் பரிசீலித்துள்ளார். உங்களுக்கான பதில் இப்போது தயாராக உள்ளது!\n\nமருத்துவரின் பதிலைக் காண கீழே உள்ள இணைப்பைக் கிளிக் செய்யவும்.\n{{REPLY_URL}}\n\nஉங்கள் ஆரோக்கியமும் நலனும் எங்களுக்கு முக்கியம். உங்கள் பதிலைப் பாதுகாப்பாகப் பார்க்க Healthcare Triage Assistant செயலியில் உள்நுழையவும்.\n\nஉங்கள் அறிகுறிகள் தீவிரமடைந்தாலோ அல்லது மோசமடைந்தாலோ, உடனடியாக மருத்துவ உதவியைப் பெறவும்.\n\nHealthcare Triage Assistant-ஐப் பயன்படுத்தியதற்கு நன்றி.\n\nநன்றியுடன்,\nHealthcare Triage Assistant குழு\nஉங்கள் ஆரோக்கியம், எங்கள் பொறுப்பு.",
    },
}


class SendCodePayload(BaseModel):
    email: str
    language: str = "en"


class VerifyCodePayload(BaseModel):
    email: str
    code: str


class PatientLoginPayload(BaseModel):
    email: str


class NotificationPayload(BaseModel):
    email: str
    language: str = "en"
    patientName: str = "Patient"
    replyUrl: str = ""


class PrescriptionPayload(BaseModel):
    symptom_id: str | None = None
    patient_email: str | None = None
    medicines: str = ""
    tests: str = ""
    advice: str = ""
    language: str = "en"


class DoctorLoginPayload(BaseModel):
    email: str
    password: str


class DoctorPayload(BaseModel):
    name: str
    department: str
    experience_years: int
    hospital_id: int | None = None
    email: str | None = None
    password: str | None = None
    phone: str | None = None
    qualification: str | None = ""
    languages_spoken: str | None = "en"


class DoctorAvailabilityPayload(BaseModel):
    is_available: bool


class DoctorSelfRegisterPayload(BaseModel):
    hospital_code: str
    name: str
    department: str
    experience_years: int
    email: str
    password: str
    phone: str | None = None
    previous_email: str | None = None
    previous_password: str | None = None


class PatientPayload(BaseModel):
    name: str
    age: int | None = None
    gender: str | None = None
    phone: str | None = None
    language: str | None = None
    email: str | None = None
    city: str | None = None
    allergies: str | None = ""
    conditions: str | None = ""


class TranslatePayload(BaseModel):
    input: str | None = None
    text: str | None = None
    sourceLanguageCode: str | None = None
    source_language_code: str | None = None
    targetLanguageCode: str | None = None
    target_language_code: str | None = None


class TtsPayload(BaseModel):
    text: str
    languageCode: str | None = None
    language_code: str | None = None
    speaker: str | None = None


class HospitalRegisterPayload(BaseModel):
    hospital_name: str
    registration_id: str
    phone: str
    city: str
    state: str
    address: str
    hospital_type: str
    email: str
    password: str


class HospitalUpdatePayload(BaseModel):
    hospital_name: str
    registration_id: str | None = None
    phone: str
    city: str
    state: str
    address: str
    hospital_type: str


class AdminLoginPayload(BaseModel):
    email: str
    password: str


class AdminUpdatePayload(BaseModel):
    email: str
    password: str


class SymptomReplyPartPayload(BaseModel):
    response_type: str
    response_text: str


class SymptomReplyPayload(BaseModel):
    doctor_id: int
    parts: list[SymptomReplyPartPayload]


class SymptomClaimPayload(BaseModel):
    doctor_id: int


class SymptomCreatePayload(BaseModel):
    symptom_id: str | None = None
    patient_name: str
    patient_age: int | None = None
    patient_gender: str | None = None
    patient_contact: str | None = None
    patient_location: str | None = None
    patient_email: str | None = None
    symptom_text: str
    duration_days: int | None = None
    urgency: str | None = "medium"
    department: str | None = "General Physician"
    language: str | None = "en"


def sanitize_lang(language: str) -> str:
    return language if language in {"en", "te", "hi", "ta"} else "en"


def normalize_language_code(language_code: str | None, default: str = "en-IN") -> str:
    raw = (language_code or "").strip()
    if not raw:
        return default
    lower = raw.lower()
    mapping = {
        "en": "en-IN",
        "en-in": "en-IN",
        "te": "te-IN",
        "te-in": "te-IN",
        "hi": "hi-IN",
        "hi-in": "hi-IN",
        "ta": "ta-IN",
        "ta-in": "ta-IN",
    }
    return mapping.get(lower, raw)


def sarvam_headers() -> dict[str, str]:
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=503, detail="Sarvam API key is not configured.")
    return {
        "api-subscription-key": SARVAM_API_KEY,
    }


def sarvam_post_json(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    payload_bytes = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(
        f"{SARVAM_BASE_URL}{path}",
        data=payload_bytes,
        method="POST",
        headers={"Content-Type": "application/json", **sarvam_headers()},
    )
    try:
        with urlrequest.urlopen(req, timeout=SARVAM_JSON_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        try:
            error_body = exc.read().decode("utf-8")
            detail = json.loads(error_body)
        except Exception:
            detail = {"error": str(exc)}
        raise HTTPException(status_code=502, detail=f"Sarvam error: {detail}")
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Sarvam request failed: {exc}")


def sarvam_post_file(path: str, file_name: str, file_bytes: bytes, content_type: str, data: dict[str, str]) -> dict[str, Any]:
    boundary = f"----triage-{uuid.uuid4().hex}"
    body = bytearray()

    for key, value in data.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(value).encode("utf-8"))
        body.extend(b"\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        f'Content-Disposition: form-data; name="file"; filename="{file_name}"\r\n'.encode("utf-8")
    )
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(file_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urlrequest.Request(
        f"{SARVAM_BASE_URL}{path}",
        data=bytes(body),
        method="POST",
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            **sarvam_headers(),
        },
    )

    try:
        with urlrequest.urlopen(req, timeout=SARVAM_FILE_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        try:
            error_body = exc.read().decode("utf-8")
            detail = json.loads(error_body)
        except Exception:
            detail = {"error": str(exc)}
        raise HTTPException(status_code=502, detail=f"Sarvam error: {detail}")
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Sarvam request failed: {exc}")


def ensure_email(email: str) -> str:
    normalized = (email or "").strip().lower()
    if not EMAIL_RE.match(normalized):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    return normalized


def db_conn():
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="Database is not configured.")
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            return psycopg2.connect(
                DATABASE_URL,
                connect_timeout=8,
                application_name="triage-backend",
                keepalives=1,
                keepalives_idle=30,
                keepalives_interval=10,
                keepalives_count=3,
            )
        except psycopg2.OperationalError as exc:
            last_error = exc
            if attempt == 1:
                break
            time.sleep(0.4)
    raise HTTPException(status_code=503, detail=f"Database connection failed: {last_error}")


def ensure_hospital_tables(cur):
    if SCHEMA_READY["hospital"]:
        return
    with SCHEMA_INIT_LOCK:
        if SCHEMA_READY["hospital"]:
            return
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS hospitals (
            hospital_id BIGSERIAL PRIMARY KEY,
            hospital_code TEXT UNIQUE,
            hospital_name TEXT NOT NULL,
            registration_id TEXT UNIQUE,
            phone TEXT,
            city TEXT,
            state TEXT,
            address TEXT,
            hospital_type TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    cur.execute("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS hospital_code TEXT")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_hospitals_hospital_code ON hospitals(hospital_code)")
    cur.execute(
        """
        UPDATE hospitals
        SET hospital_code = LPAD(CAST(hospital_id AS TEXT), 12, '0')
        WHERE hospital_code IS NULL OR TRIM(hospital_code) = ''
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS admins (
            admin_id BIGSERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            hospital_id BIGINT REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            password TEXT,
            phone TEXT,
            department TEXT NOT NULL,
            experience_years INTEGER NOT NULL DEFAULT 0,
            hospital_id BIGINT REFERENCES hospitals(hospital_id) ON DELETE SET NULL,
            qualification TEXT DEFAULT '',
            languages_spoken TEXT DEFAULT 'en',
            is_available BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    # Backward compatibility: older DBs may already have doctors table without auth/profile columns.
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email TEXT")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password TEXT")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone TEXT")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department TEXT")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hospital_id BIGINT")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT ''")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages_spoken TEXT DEFAULT 'en'")
    cur.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE")
    SCHEMA_READY["hospital"] = True


def ensure_symptom_tables(cur):
    if SCHEMA_READY["symptom"]:
        return
    with SCHEMA_INIT_LOCK:
        if SCHEMA_READY["symptom"]:
            return
    # Normalize legacy schemas where symptom_id was created as an integer.
    # New flow uses string IDs (e.g. symptom-<timestamp>) across frontend/backend.
    cur.execute(
        """
        DO $$
        DECLARE
            rec_type TEXT;
            col_rec RECORD;
            con_rec RECORD;
        BEGIN
            -- Drop every FK that points at symptom_records so type migration can proceed.
            FOR con_rec IN
                SELECT src_n.nspname AS src_schema, src_t.relname AS src_table, c.conname
                FROM pg_constraint c
                JOIN pg_class src_t ON src_t.oid = c.conrelid
                JOIN pg_namespace src_n ON src_n.oid = src_t.relnamespace
                JOIN pg_class ref_t ON ref_t.oid = c.confrelid
                JOIN pg_namespace ref_n ON ref_n.oid = ref_t.relnamespace
                WHERE c.contype = 'f'
                  AND ref_n.nspname = current_schema()
                  AND ref_t.relname = 'symptom_records'
            LOOP
                EXECUTE format(
                    'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
                    con_rec.src_schema,
                    con_rec.src_table,
                    con_rec.conname
                );
            END LOOP;

            SELECT data_type INTO rec_type
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'symptom_records'
              AND column_name = 'symptom_id';

            IF rec_type IS NOT NULL AND rec_type <> 'text' THEN
                EXECUTE 'ALTER TABLE symptom_records ALTER COLUMN symptom_id TYPE TEXT USING symptom_id::text';
            END IF;

            -- Normalize every legacy table column named symptom_id in this schema.
            FOR col_rec IN
                SELECT table_name
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND column_name = 'symptom_id'
                  AND data_type <> 'text'
                  AND table_name <> 'symptom_records'
            LOOP
                EXECUTE format(
                    'ALTER TABLE %I ALTER COLUMN symptom_id TYPE TEXT USING symptom_id::text',
                    col_rec.table_name
                );
            END LOOP;
        END
        $$
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS symptom_records (
            symptom_id TEXT PRIMARY KEY,
            patient_name TEXT,
            patient_age TEXT,
            patient_gender TEXT,
            patient_contact TEXT,
            patient_location TEXT,
            patient_email TEXT,
            symptom_text TEXT,
            doctor_summary TEXT,
            duration_days INTEGER,
            urgency TEXT DEFAULT 'medium',
            department TEXT DEFAULT 'General Physician',
            language TEXT DEFAULT 'en',
            status TEXT NOT NULL DEFAULT 'waiting',
            doctor_id BIGINT,
            doctor_name TEXT,
            reviewed_by_doctor_id BIGINT,
            review_locked_at TIMESTAMPTZ,
            reply_access_token TEXT UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            replied_at TIMESTAMPTZ
        )
        """
    )
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS patient_name TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS patient_age TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS patient_gender TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS patient_contact TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS patient_location TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS patient_email TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS symptom_text TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS doctor_summary TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS duration_days INTEGER")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'medium'")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Physician'")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en'")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting'")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS doctor_id BIGINT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS doctor_name TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS reviewed_by_doctor_id BIGINT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS review_locked_at TIMESTAMPTZ")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS reply_access_token TEXT")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    cur.execute("ALTER TABLE symptom_records ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ")
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS symptom_responses (
            response_id BIGSERIAL PRIMARY KEY,
            symptom_id TEXT REFERENCES symptom_records(symptom_id) ON DELETE CASCADE,
            response_type TEXT NOT NULL,
            response_text TEXT NOT NULL,
            original_text TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    cur.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname = current_schema()
                  AND t.relname = 'symptom_responses'
                  AND c.conname = 'symptom_responses_symptom_id_fkey'
            ) THEN
                ALTER TABLE symptom_responses
                ADD CONSTRAINT symptom_responses_symptom_id_fkey
                FOREIGN KEY (symptom_id) REFERENCES symptom_records(symptom_id) ON DELETE CASCADE;
            END IF;
        END
        $$
        """
    )
    cur.execute("CREATE INDEX IF NOT EXISTS idx_symptom_records_status ON symptom_records(status)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_symptom_records_doctor_status ON symptom_records(doctor_id, status)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_symptom_records_created_at ON symptom_records(created_at DESC)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_symptom_records_dept_status ON symptom_records(department, status)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_symptom_records_review_lock ON symptom_records(review_locked_at)")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_symptom_records_reply_token ON symptom_records(reply_access_token)")
    SCHEMA_READY["symptom"] = True


def ensure_patient_tables(cur):
    if SCHEMA_READY["patient"]:
        return
    with SCHEMA_INIT_LOCK:
        if SCHEMA_READY["patient"]:
            return
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS patients (
            patient_id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            language TEXT DEFAULT 'en',
            email TEXT UNIQUE,
            city TEXT,
            allergies TEXT DEFAULT '',
            conditions TEXT DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    cur.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS email TEXT")
    cur.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT")
    cur.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT ''")
    cur.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS conditions TEXT DEFAULT ''")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_email ON patients(LOWER(email))")
    SCHEMA_READY["patient"] = True


def short_lang(language_code: str | None) -> str:
    code = normalize_language_code(language_code)
    return code.split("-")[0].lower()


def generate_hospital_code(cur) -> str:
    rng = random.SystemRandom()
    for _ in range(25):
        code = str(rng.randint(10**11, 10**12 - 1))
        cur.execute("SELECT 1 FROM hospitals WHERE hospital_code = %s LIMIT 1", (code,))
        if not cur.fetchone():
            return code
    raise HTTPException(status_code=500, detail="Could not generate a unique hospital code. Please try again.")


DEPARTMENTS = [
    "General Physician",
    "Cardiologist",
    "Nephrologist",
    "Pulmonologist",
    "Dermatologist",
    "Neurosurgeon",
    "Orthopaedician",
    "Ophthalmologist",
    "Plastic Surgeon",
    "Pediatrician",
    "Dentist",
]

DEPARTMENT_ALIASES = {
    "general physician": "General Physician",
    "general doctor": "General Physician",
    "gp": "General Physician",
    "cardiologist": "Cardiologist",
    "cadiologist": "Cardiologist",
    "nephrologist": "Nephrologist",
    "pulmonologist": "Pulmonologist",
    "dermatologist": "Dermatologist",
    "neurosurgeon": "Neurosurgeon",
    "orthopaedician": "Orthopaedician",
    "orthopedic": "Orthopaedician",
    "ophthalmologist": "Ophthalmologist",
    "plastic surgeon": "Plastic Surgeon",
    "pediatrician": "Pediatrician",
    "paediatrician": "Pediatrician",
    "dentist": "Dentist",
}


def normalize_department_name(name: str | None, default: str = "General Physician") -> str:
    cleaned = (name or "").strip().lower()
    if not cleaned:
        return default
    if cleaned in DEPARTMENT_ALIASES:
        return DEPARTMENT_ALIASES[cleaned]
    for department in DEPARTMENTS:
        if cleaned == department.lower():
            return department
    return default


def load_keyword_training_data() -> dict[str, list[str]]:
    fallback = {
        "Cardiologist": ["heart", "cardiac", "chest pain", "palpitation", "angina"],
        "Dermatologist": ["skin", "rash", "itch", "eczema", "psoriasis"],
        "Pulmonologist": ["lung", "breathing", "cough", "wheezing", "asthma"],
        "Nephrologist": ["kidney", "renal", "urine", "dialysis", "creatinine"],
        "Neurosurgeon": ["brain", "spine", "seizure", "paralysis", "numbness"],
        "Orthopaedician": ["bone", "joint", "fracture", "knee", "back pain"],
        "Ophthalmologist": ["eye", "vision", "blurred", "red eye", "cataract"],
        "Dentist": ["tooth", "teeth", "gum", "dental", "jaw"],
        "Pediatrician": ["child", "baby", "infant", "pediatric", "paediatric"],
        "Plastic Surgeon": ["burn", "scar", "reconstructive", "cosmetic", "facial injury"],
        "General Physician": ["fever", "headache", "vomiting", "body pain", "weakness"],
    }
    try:
        with open(KEYWORD_TRAINING_FILE, "r", encoding="utf-8") as fp:
            data = json.load(fp)
        if not isinstance(data, dict):
            return fallback
        normalized: dict[str, list[str]] = {}
        for department, words in data.items():
            if department not in DEPARTMENTS or not isinstance(words, list):
                continue
            cleaned = [str(word).strip().lower() for word in words if str(word).strip()]
            if cleaned:
                normalized[department] = cleaned
        return normalized or fallback
    except Exception:
        return fallback


TRAINED_KEYWORDS = load_keyword_training_data()


def infer_department(symptom_text: str) -> str:
    text = (symptom_text or "").lower()
    if not text:
        return "General Physician"

    best_department = "General Physician"
    best_score = 0
    general_score = 0

    general_keywords = set(TRAINED_KEYWORDS.get("General Physician", []))
    general_keywords.update(
        [
            "cold",
            "common cold",
            "flu",
            "viral fever",
            "sore throat",
            "runny nose",
            "sneezing",
            "mild fever",
        ]
    )
    for keyword in general_keywords:
        if keyword and keyword in text:
            general_score += 1 + (len(keyword.split()) // 2)

    for department, keywords in TRAINED_KEYWORDS.items():
        if department == "General Physician":
            continue
        score = 0
        for keyword in keywords:
            if keyword and keyword in text:
                score += 1 + (len(keyword.split()) // 2)
        if score > best_score:
            best_score = score
            best_department = normalize_department_name(department)

    if best_score == 0:
        return "General Physician"
    if general_score > 0 and best_score <= general_score:
        return "General Physician"
    return best_department


def summarize_symptoms_for_doctor(symptom_text: str) -> str:
    raw = (symptom_text or "").strip()
    if not raw:
        return ""
    compact = re.sub(r"\s+", " ", raw)
    if len(compact) <= 260:
        return compact

    chunks = [chunk.strip() for chunk in re.split(r"(?<=[.!?])\s+", compact) if chunk.strip()]
    if not chunks:
        return compact[:257] + "..."

    picked: list[str] = []
    budget = 260
    for sentence in chunks:
        if len(" ".join(picked + [sentence])) <= budget:
            picked.append(sentence)
        if len(picked) >= 2:
            break

    summary = " ".join(picked).strip() or compact[:257] + "..."
    if len(summary) > budget:
        summary = summary[:257].rstrip() + "..."
    return summary


def enrich_summary_with_patient_history(summary_text: str, allergies: str | None, conditions: str | None) -> str:
    summary = (summary_text or "").strip()
    bits: list[str] = []
    if (allergies or "").strip():
        bits.append(f"Allergies: {(allergies or '').strip()}")
    if (conditions or "").strip():
        bits.append(f"Existing conditions: {(conditions or '').strip()}")
    if not bits:
        return summary
    history_suffix = " | ".join(bits)
    if not summary:
        return history_suffix
    return f"{summary} | {history_suffix}"


def build_reply_ready_email(language: str, patient_name: str, reply_url: str) -> tuple[str, str, str]:
    template = REPLY_READY_TEMPLATES.get(language, REPLY_READY_TEMPLATES["en"])
    link_text = {
        "en": "\u27a1\ufe0f Click here to view your doctor's reply \u2b05\ufe0f",
        "te": "\u27a1\ufe0f మీ డాక్టర్ సమాధానాన్ని చూడటానికి ఇక్కడ క్లిక్ చేయండి \u2b05\ufe0f",
        "hi": "\u27a1\ufe0f डॉक्टर का जवाब देखने के लिए यहाँ क्लिक करें \u2b05\ufe0f",
        "ta": "\u27a1\ufe0f மருத்துவரின் பதிலைக் காண இங்கே கிளிக் செய்யவும் \u2b05\ufe0f",
    }.get(language, "\u27a1\ufe0f Click here to view your doctor's reply \u2b05\ufe0f")
    subject = template["subject"]
    text_body = (
        template["body"]
        .replace("{{PATIENT_NAME}}", patient_name)
        .replace("{{REPLY_URL}}", f"\u27a1\ufe0f {reply_url} \u2b05\ufe0f")
    )
    link_html = f'<a href="{reply_url}" style="font-weight:700;color:#0b6f49;text-decoration:underline;">{link_text}</a>'
    html_text = (
        template["body"]
        .replace("{{PATIENT_NAME}}", patient_name)
        .replace("{{REPLY_URL}}", link_html)
        .replace("\n", "<br/>")
    )
    html_body = f"<p>{html_text}</p>"
    return subject, text_body, html_body


def assign_waiting_doctor(cur, department: str):
    if department == "General Physician":
        cur.execute(
            """
            SELECT doctor_id, name
            FROM doctors
            WHERE department = %s AND is_available = TRUE
            ORDER BY experience_years ASC, doctor_id ASC
            LIMIT 1
            """,
            (department,),
        )
        row = cur.fetchone()
        if row:
            return row

    cur.execute(
        """
        SELECT doctor_id, name
        FROM doctors
        WHERE department = %s AND is_available = TRUE
        ORDER BY experience_years ASC, doctor_id ASC
        LIMIT 1
        """,
        (department,),
    )
    row = cur.fetchone()
    if row:
        return row

    cur.execute(
        """
        SELECT doctor_id, name
        FROM doctors
        WHERE department = 'General Physician' AND is_available = TRUE
        ORDER BY experience_years ASC, doctor_id ASC
        LIMIT 1
        """
    )
    return cur.fetchone()


def send_mail(to: str, subject: str, body: str, html_body: str | None = None):
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise HTTPException(status_code=503, detail="SMTP is not configured.")

    message = EmailMessage()
    message["From"] = SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    if SMTP_USE_SSL:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS) as smtp:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)
        return

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(message)


@app.get("/health/smtp")
def smtp_healthcheck():
    return {
        "smtp_configured": bool(SMTP_USERNAME and SMTP_PASSWORD),
        "smtp_host": SMTP_HOST,
        "smtp_port": SMTP_PORT,
        "smtp_use_ssl": SMTP_USE_SSL,
        "smtp_from": SMTP_FROM,
    }


@app.get("/")
def healthcheck():
    return {"message": "Python backend is running"}


@app.post("/hospitals/register", status_code=201)
def register_hospital(payload: HospitalRegisterPayload):
    email = ensure_email(payload.email)

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)

            # Keep hospital identity stable for an already-registered admin email.
            cur.execute(
                """
                SELECT a.admin_id, a.email, h.hospital_id, h.hospital_code, h.hospital_name, h.registration_id,
                       h.phone, h.city, h.state, h.address, h.hospital_type
                FROM admins a
                JOIN hospitals h ON h.hospital_id = a.hospital_id
                WHERE LOWER(a.email) = %s
                LIMIT 1
                """,
                (email,),
            )
            existing = cur.fetchone()
            if existing:
                hospital = {
                    "hospital_id": existing[2],
                    "hospital_code": existing[3],
                    "hospital_name": existing[4],
                    "registration_id": existing[5],
                    "phone": existing[6],
                    "city": existing[7],
                    "state": existing[8],
                    "address": existing[9],
                    "hospital_type": existing[10],
                }
                return {
                    "admin_id": existing[0],
                    "email": existing[1],
                    "hospital_id": existing[2],
                    "hospital": hospital,
                }

            cur.execute(
                """
                INSERT INTO hospitals (hospital_code, hospital_name, registration_id, phone, city, state, address, hospital_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING hospital_id, hospital_code, hospital_name, registration_id, phone, city, state, address, hospital_type
                """,
                (
                    generate_hospital_code(cur),
                    payload.hospital_name.strip(),
                    payload.registration_id.strip(),
                    payload.phone.strip(),
                    payload.city.strip(),
                    payload.state.strip(),
                    payload.address.strip(),
                    payload.hospital_type.strip(),
                ),
            )
            hospital_row = cur.fetchone()
            hospital_id = hospital_row[0]

            cur.execute(
                """
                INSERT INTO admins (email, password, hospital_id)
                VALUES (%s, %s, %s)
                RETURNING admin_id
                """,
                (email, payload.password, hospital_id),
            )
            admin_id = cur.fetchone()[0]
            conn.commit()

    hospital_keys = [
        "hospital_id",
        "hospital_code",
        "hospital_name",
        "registration_id",
        "phone",
        "city",
        "state",
        "address",
        "hospital_type",
    ]
    return {
        "admin_id": admin_id,
        "email": email,
        "hospital_id": hospital_row[0],
        "hospital": dict(zip(hospital_keys, hospital_row)),
    }


@app.post("/admins/login")
def admin_login(payload: AdminLoginPayload):
    email = ensure_email(payload.email)
    password = (payload.password or "").strip()

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            cur.execute(
                """
                SELECT a.admin_id, a.email, h.hospital_id, h.hospital_name, h.registration_id,
                       h.phone, h.city, h.state, h.address, h.hospital_type, h.hospital_code, a.password
                FROM admins a
                JOIN hospitals h ON h.hospital_id = a.hospital_id
                WHERE LOWER(TRIM(a.email)) = %s
                LIMIT 1
                """,
                (email,),
            )
            row = cur.fetchone()
            if not row or (row[11] or "").strip() != password:
                raise HTTPException(status_code=401, detail="Incorrect email or password.")

    hospital = {
        "hospital_id": row[2],
        "hospital_name": row[3],
        "registration_id": row[4],
        "phone": row[5],
        "city": row[6],
        "state": row[7],
        "address": row[8],
        "hospital_type": row[9],
        "hospital_code": row[10],
    }
    return {
        "admin_id": row[0],
        "email": row[1],
        "hospital_id": row[2],
        "hospital": hospital,
    }


@app.get("/hospitals/{hospital_id}")
def get_hospital(hospital_id: int):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            cur.execute(
                """
                SELECT hospital_id, hospital_code, hospital_name, registration_id, phone, city, state, address, hospital_type
                FROM hospitals WHERE hospital_id = %s
                """,
                (hospital_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Hospital not found")

    keys = ["hospital_id", "hospital_code", "hospital_name", "registration_id", "phone", "city", "state", "address", "hospital_type"]
    return dict(zip(keys, row))


@app.put("/hospitals/{hospital_id}")
def update_hospital(hospital_id: int, payload: HospitalUpdatePayload):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            cur.execute(
                """
                UPDATE hospitals
                SET hospital_name = %s, registration_id = %s, phone = %s,
                    city = %s, state = %s, address = %s, hospital_type = %s
                WHERE hospital_id = %s
                RETURNING hospital_id, hospital_code, hospital_name, registration_id, phone, city, state, address, hospital_type
                """,
                (
                    payload.hospital_name.strip(),
                    (payload.registration_id or "").strip() or None,
                    payload.phone.strip(),
                    payload.city.strip(),
                    payload.state.strip(),
                    payload.address.strip(),
                    payload.hospital_type.strip(),
                    hospital_id,
                ),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Hospital not found")
            conn.commit()

    keys = ["hospital_id", "hospital_code", "hospital_name", "registration_id", "phone", "city", "state", "address", "hospital_type"]
    return dict(zip(keys, row))


@app.put("/admins/{admin_id}")
def update_admin(admin_id: int, payload: AdminUpdatePayload):
    email = ensure_email(payload.email)

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            try:
                cur.execute(
                    """
                    UPDATE admins
                    SET email = %s, password = %s
                    WHERE admin_id = %s
                    RETURNING admin_id, email, hospital_id
                    """,
                    (email, payload.password, admin_id),
                )
            except Exception as exc:
                if getattr(exc, "pgcode", None) == "23505":
                    raise HTTPException(status_code=409, detail="This email is already used by another admin account.")
                raise

            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Admin not found")
            conn.commit()

    return {
        "admin_id": row[0],
        "email": row[1],
        "hospital_id": row[2],
    }


@app.post("/patients/send-code")
def send_code(payload: SendCodePayload):
    email = ensure_email(payload.email)
    language = sanitize_lang((payload.language or "en").strip().lower())

    code = str(random.randint(0, 999999)).zfill(6)
    verification_codes[email] = {
        "code": code,
        "expires_at": int(time.time()) + CODE_TTL_SECONDS,
        "language": language,
    }

    template = MAIL_TEMPLATES.get(language, MAIL_TEMPLATES["en"])
    body = template["body"].replace("{{VERIFICATION_CODE}}", code)

    try:
        send_mail(email, template["subject"], body)
        return {"sent": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not send verification email: {exc}")


@app.post("/patients/verify-code")
def verify_code(payload: VerifyCodePayload):
    email = (payload.email or "").strip().lower()
    code = (payload.code or "").strip()
    record = verification_codes.get(email)

    if not record:
        raise HTTPException(status_code=400, detail="No code sent for this email.")
    if int(time.time()) > int(record["expires_at"]):
        verification_codes.pop(email, None)
        raise HTTPException(status_code=400, detail="Verification code expired.")
    if record["code"] != code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    verification_codes.pop(email, None)
    return {"verified": True}


@app.post("/patients/login")
def patient_login(payload: PatientLoginPayload):
    email = ensure_email(payload.email)

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_patient_tables(cur)
            cur.execute(
                """
                SELECT patient_id, name, age, gender, phone, language, email, city, allergies, conditions
                FROM patients WHERE LOWER(email) = %s LIMIT 1
                """,
                (email,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="No patient found.")
            keys = [
                "patient_id", "name", "age", "gender", "phone", "language", "email", "city", "allergies", "conditions",
            ]
            return dict(zip(keys, row))


@app.post("/api/patients")
def create_patient(payload: PatientPayload):
    if not (payload.name or "").strip():
        raise HTTPException(status_code=400, detail="Patient name is required")

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_patient_tables(cur)
            cur.execute(
                """
                INSERT INTO patients (name, age, gender, phone, language, email, city, allergies, conditions)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING patient_id, name, age, gender, phone, language, email, city, allergies, conditions
                """,
                (
                    payload.name,
                    payload.age,
                    payload.gender,
                    payload.phone,
                    payload.language,
                    payload.email,
                    payload.city,
                    payload.allergies or "",
                    payload.conditions or "",
                ),
            )
            saved = cur.fetchone()
            conn.commit()
            keys = [
                "patient_id", "name", "age", "gender", "phone", "language", "email", "city", "allergies", "conditions",
            ]
            return {"message": "Patient created successfully", "patient": dict(zip(keys, saved))}


@app.post("/notifications/reply-ready")
def notify_reply_ready(payload: NotificationPayload):
    email = ensure_email(payload.email)
    language = sanitize_lang((payload.language or "en").strip().lower())
    patient_name = (payload.patientName or "Patient").strip() or "Patient"
    reply_url = (payload.replyUrl or "").strip()

    subject, body, html_body = build_reply_ready_email(language, patient_name, reply_url)

    try:
        send_mail(email, subject, body, html_body)
        return {"sent": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not send notification email: {exc}")


@app.post("/prescriptions", status_code=201)
def save_prescription(payload: PrescriptionPayload):
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS prescriptions (
                    prescription_id BIGSERIAL PRIMARY KEY,
                    symptom_id TEXT,
                    patient_email TEXT,
                    medicines TEXT,
                    tests TEXT,
                    advice TEXT,
                    language TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cur.execute(
                """
                INSERT INTO prescriptions (symptom_id, patient_email, medicines, tests, advice, language)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING prescription_id
                """,
                (
                    payload.symptom_id,
                    payload.patient_email,
                    payload.medicines,
                    payload.tests,
                    payload.advice,
                    payload.language,
                ),
            )
            pid = cur.fetchone()[0]
            conn.commit()
            return {"saved": True, "prescription_id": pid}


@app.get("/departments")
def list_departments():
    return {"departments": DEPARTMENTS}


@app.get("/routing/keywords/export")
def export_routing_keywords():
    return {
        "departments": TRAINED_KEYWORDS,
        "exported_at": int(time.time()),
    }


@app.get("/doctors")
def list_doctors(hospital_id: int | None = None):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            if hospital_id is None:
                cur.execute("SELECT doctor_id, name, department, experience_years, hospital_id, qualification, languages_spoken, is_available, phone, email FROM doctors ORDER BY doctor_id DESC")
            else:
                cur.execute(
                    "SELECT doctor_id, name, department, experience_years, hospital_id, qualification, languages_spoken, is_available, phone, email FROM doctors WHERE hospital_id = %s ORDER BY doctor_id DESC",
                    (hospital_id,),
                )
            rows = cur.fetchall()
            conn.commit()

    keys = ["doctor_id", "name", "department", "experience_years", "hospital_id", "qualification", "languages_spoken", "is_available", "phone", "email"]
    return [dict(zip(keys, row)) for row in rows]


@app.post("/doctors", status_code=201)
def create_doctor(payload: DoctorPayload):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            normalized_email = ensure_email(payload.email) if payload.email else None
            cur.execute(
                """
                INSERT INTO doctors (name, email, password, phone, department, experience_years, hospital_id, qualification, languages_spoken, is_available)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING doctor_id, name, department, experience_years, hospital_id, qualification, languages_spoken, is_available, phone, email
                """,
                (
                    payload.name,
                    normalized_email,
                    payload.password,
                    payload.phone,
                    normalize_department_name(payload.department),
                    payload.experience_years,
                    payload.hospital_id,
                    payload.qualification or "",
                    payload.languages_spoken or "en",
                ),
            )
            row = cur.fetchone()
            conn.commit()

    keys = ["doctor_id", "name", "department", "experience_years", "hospital_id", "qualification", "languages_spoken", "is_available", "phone", "email"]
    return dict(zip(keys, row))


@app.post("/doctors/register")
def doctor_self_register(payload: DoctorSelfRegisterPayload):
    email = ensure_email(payload.email)
    previous_email = ensure_email(payload.previous_email) if payload.previous_email else None
    previous_password = (payload.previous_password or "").strip()
    hospital_code = (payload.hospital_code or "").strip().lstrip('0') or '0'
    if not hospital_code.isdigit() or len(hospital_code) > 12:
        raise HTTPException(status_code=400, detail="Hospital ID is invalid.")
    normalized_name = (payload.name or "").strip()
    normalized_department = normalize_department_name(payload.department)
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Doctor name is required.")

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            padded_hospital_code = hospital_code.zfill(12)
            cur.execute(
                """
                SELECT hospital_id
                FROM hospitals
                WHERE TRIM(hospital_code) = %s
                   OR TRIM(hospital_code) = %s
                   OR CAST(hospital_id AS TEXT) = %s
                   OR LPAD(CAST(hospital_id AS TEXT), 12, '0') = %s
                   OR LTRIM(TRIM(hospital_code), '0') = %s
                   OR (COALESCE(LTRIM(TRIM(hospital_code), '0'), '') = '' AND %s = '0')
                LIMIT 1
                """,
                (hospital_code, padded_hospital_code, hospital_code, padded_hospital_code, hospital_code, hospital_code),
            )
            hospital_row = cur.fetchone()
            if not hospital_row:
                raise HTTPException(status_code=400, detail="Hospital ID not found. Please use the Hospital ID shared by admin.")
            hospital_id = hospital_row[0]

            cur.execute(
                """
                SELECT doctor_id, name, department, experience_years, hospital_id, qualification,
                       languages_spoken, is_available, phone, email, password
                FROM doctors
                WHERE hospital_id = %s
                  AND LOWER(TRIM(name)) = LOWER(TRIM(%s))
                LIMIT 1
                """,
                (hospital_id, normalized_name),
            )
            name_row = cur.fetchone()
            if not name_row:
                raise HTTPException(
                    status_code=400,
                    detail="This doctor is not approved by admin yet. Please contact your hospital admin.",
                )

            if normalize_department_name(name_row[2]) != normalized_department or int(name_row[3] or 0) != int(payload.experience_years):
                raise HTTPException(
                    status_code=400,
                    detail="Details do not match admin-approved records for this doctor.",
                )

            cur.execute(
                """
                SELECT doctor_id, name, department, experience_years, hospital_id, qualification,
                       languages_spoken, is_available, phone, email, password
                FROM doctors
                WHERE hospital_id = %s
                  AND LOWER(TRIM(name)) = LOWER(TRIM(%s))
                  AND department = %s
                  AND experience_years = %s
                LIMIT 1
                """,
                (hospital_id, normalized_name, normalized_department, payload.experience_years),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(
                    status_code=400,
                    detail="Details do not match admin-approved records for this doctor.",
                )

            saved_email = (row[9] or "").strip().lower()
            saved_password = (row[10] or "").strip()
            if saved_email and saved_password:
                credential_match = saved_email == email and saved_password == payload.password
                previous_match = previous_email == saved_email and previous_password == saved_password
                if not credential_match and not previous_match:
                    raise HTTPException(
                        status_code=409,
                        detail="This doctor is already registered. Login with current credentials before updating details.",
                    )

            try:
                cur.execute(
                    """
                    UPDATE doctors
                    SET email = %s,
                        password = %s,
                        phone = COALESCE(NULLIF(%s, ''), phone)
                    WHERE doctor_id = %s
                    RETURNING doctor_id, name, department, experience_years, hospital_id, qualification, languages_spoken, is_available, phone, email
                    """,
                    (
                        email,
                        payload.password,
                        payload.phone or "",
                        row[0],
                    ),
                )
            except Exception as exc:
                if getattr(exc, "pgcode", None) == "23505":
                    raise HTTPException(status_code=409, detail="This email is already used by another doctor account.")
                raise
            saved = cur.fetchone()
            cur.execute("SELECT hospital_code FROM hospitals WHERE hospital_id = %s LIMIT 1", (saved[4],))
            hospital_code_row = cur.fetchone()
            conn.commit()

    keys = ["doctor_id", "name", "department", "experience_years", "hospital_id", "qualification", "languages_spoken", "is_available", "phone", "email"]
    doctor_data = dict(zip(keys, saved))
    doctor_data["hospital_code"] = (hospital_code_row[0] if hospital_code_row else None)
    return doctor_data


@app.get("/doctors/approval-check")
def doctor_approval_check(
    hospital_code: str,
    name: str,
    department: str | None = None,
    experience_years: int | None = None,
):
    code_raw = (hospital_code or "").strip().lstrip("0") or "0"
    if not code_raw.isdigit() or len(code_raw) > 12:
        return {"ok": False, "code": "hospital_id_invalid", "message": "Hospital ID is invalid."}

    normalized_name = (name or "").strip()
    if not normalized_name:
        return {"ok": False, "code": "name_required", "message": "Doctor name is required."}

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)

            padded_hospital_code = code_raw.zfill(12)
            cur.execute(
                """
                SELECT hospital_id
                FROM hospitals
                WHERE TRIM(hospital_code) = %s
                   OR TRIM(hospital_code) = %s
                   OR CAST(hospital_id AS TEXT) = %s
                   OR LPAD(CAST(hospital_id AS TEXT), 12, '0') = %s
                   OR LTRIM(TRIM(hospital_code), '0') = %s
                   OR (COALESCE(LTRIM(TRIM(hospital_code), '0'), '') = '' AND %s = '0')
                LIMIT 1
                """,
                (code_raw, padded_hospital_code, code_raw, padded_hospital_code, code_raw, code_raw),
            )
            hospital_row = cur.fetchone()
            if not hospital_row:
                return {
                    "ok": False,
                    "code": "hospital_id_not_found",
                    "message": "Hospital ID not found. Please use the Hospital ID shared by admin.",
                }

            hospital_id = hospital_row[0]
            cur.execute(
                """
                SELECT doctor_id, name, department, experience_years, phone, email, password
                FROM doctors
                WHERE hospital_id = %s
                  AND LOWER(TRIM(name)) = LOWER(TRIM(%s))
                LIMIT 1
                """,
                (hospital_id, normalized_name),
            )
            row = cur.fetchone()
            if not row:
                return {
                    "ok": False,
                    "code": "doctor_not_approved",
                    "message": "This doctor is not approved by admin yet. Please contact your hospital admin.",
                }

            approved_department = normalize_department_name(row[2])
            approved_experience = int(row[3] or 0)
            dept_mismatch = False
            exp_mismatch = False

            if department is not None and str(department).strip():
                dept_mismatch = normalize_department_name(department) != approved_department
            if experience_years is not None:
                exp_mismatch = int(experience_years) != approved_experience

            if dept_mismatch or exp_mismatch:
                return {
                    "ok": False,
                    "code": "details_mismatch",
                    "message": "Details do not match admin-approved records for this doctor.",
                    "approved": {
                        "doctor_id": row[0],
                        "name": row[1],
                        "department": approved_department,
                        "experience_years": approved_experience,
                    },
                }

            return {
                "ok": True,
                "code": "approved",
                "approved": {
                    "doctor_id": row[0],
                    "name": row[1],
                    "department": approved_department,
                    "experience_years": approved_experience,
                    "phone": row[4],
                    "email": row[5],
                    "is_registered": bool((row[5] or "").strip() and (row[6] or "").strip()),
                },
            }


@app.put("/doctors/{doctor_id}")
def update_doctor(doctor_id: int, payload: DoctorPayload):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            cur.execute(
                """
                UPDATE doctors
                SET name = %s, department = %s, experience_years = %s, hospital_id = %s,
                    qualification = %s, languages_spoken = %s
                WHERE doctor_id = %s
                RETURNING doctor_id, name, department, experience_years, hospital_id, qualification, languages_spoken, is_available, phone, email
                """,
                (
                    payload.name,
                    normalize_department_name(payload.department),
                    payload.experience_years,
                    payload.hospital_id,
                    payload.qualification or "",
                    payload.languages_spoken or "en",
                    doctor_id,
                ),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Doctor not found")
            conn.commit()

    keys = ["doctor_id", "name", "department", "experience_years", "hospital_id", "qualification", "languages_spoken", "is_available", "phone", "email"]
    return dict(zip(keys, row))


@app.put("/doctors/{doctor_id}/availability")
def update_doctor_availability(doctor_id: int, payload: DoctorAvailabilityPayload):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            cur.execute(
                """
                UPDATE doctors
                SET is_available = %s
                WHERE doctor_id = %s
                RETURNING doctor_id, name, department, experience_years, hospital_id, qualification, languages_spoken, is_available, phone, email
                """,
                (payload.is_available, doctor_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Doctor not found")
            conn.commit()

    keys = ["doctor_id", "name", "department", "experience_years", "hospital_id", "qualification", "languages_spoken", "is_available", "phone", "email"]
    return dict(zip(keys, row))


@app.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: int):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            cur.execute("DELETE FROM doctors WHERE doctor_id = %s", (doctor_id,))
            conn.commit()
    return {"deleted": True}


@app.post("/doctors/login")
def doctor_login(payload: DoctorLoginPayload):
    email = ensure_email(payload.email)
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            cur.execute(
                """
                SELECT d.doctor_id, d.name, d.email, d.department, d.experience_years, d.hospital_id,
                       d.qualification, d.languages_spoken, d.is_available, d.phone, d.password, h.hospital_code
                FROM doctors d
                LEFT JOIN hospitals h ON h.hospital_id = d.hospital_id
                WHERE LOWER(d.email) = %s
                LIMIT 1
                """,
                (email,),
            )
            row = cur.fetchone()
            if not row or (row[10] or "") != (payload.password or ""):
                raise HTTPException(status_code=401, detail="Incorrect email or password.")
            keys = ["doctor_id", "name", "email", "department", "experience_years", "hospital_id", "qualification", "languages_spoken", "is_available", "phone", "hospital_code"]
            return dict(zip(keys, row[:10] + (row[11],)))


@app.get("/symptom-records")
def list_symptom_records(status: str | None = None, doctor_id: int | None = None, urgency: str | None = None):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            ensure_symptom_tables(cur)
            base = """
                SELECT symptom_id, patient_name, patient_age, patient_gender, patient_contact,
                       patient_location, patient_email, symptom_text, doctor_summary, duration_days, urgency, department,
                       language, status, doctor_id, doctor_name, reviewed_by_doctor_id, review_locked_at, reply_access_token, created_at, replied_at
                FROM symptom_records
            """
            params: list[Any] = []
            conditions: list[str] = []
            if status:
                conditions.append("status = %s")
                params.append(status)
            if urgency:
                conditions.append("urgency = %s")
                params.append(urgency)
            if doctor_id is not None and status in {"waiting", "replied"}:
                cur.execute("SELECT department FROM doctors WHERE doctor_id = %s LIMIT 1", (doctor_id,))
                doctor_row = cur.fetchone()
                if not doctor_row:
                    raise HTTPException(status_code=404, detail="Doctor not found")
                normalized_department = normalize_department_name(doctor_row[0])
                conditions.append("(LOWER(TRIM(department)) = LOWER(TRIM(%s)) OR LOWER(TRIM(department)) = LOWER(TRIM(%s)))")
                params.append(doctor_row[0])
                params.append(normalized_department)
            if conditions:
                base += " WHERE " + " AND ".join(conditions)
            base += " ORDER BY created_at DESC"
            cur.execute(base, tuple(params))
            rows = cur.fetchall()

    keys = [
        "symptom_id",
        "patient_name",
        "patient_age",
        "patient_gender",
        "patient_contact",
        "patient_location",
        "patient_email",
        "symptom_text",
        "doctor_summary",
        "duration_days",
        "urgency",
        "department",
        "language",
        "status",
        "doctor_id",
        "doctor_name",
        "reviewed_by_doctor_id",
        "review_locked_at",
        "reply_access_token",
        "created_at",
        "replied_at",
    ]
    return [dict(zip(keys, row)) for row in rows]


@app.post("/symptom-records", status_code=201)
def create_symptom_record(payload: SymptomCreatePayload):
    symptom_id = (payload.symptom_id or f"symptom-{int(time.time() * 1000)}").strip()
    if not symptom_id:
        raise HTTPException(status_code=400, detail="symptom_id is required")

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            ensure_symptom_tables(cur)
            ensure_patient_tables(cur)
            inferred_department = infer_department(payload.symptom_text)
            doctor_summary = summarize_symptoms_for_doctor(payload.symptom_text)

            normalized_email = ensure_email(payload.patient_email) if payload.patient_email else None
            patient_allergies = ""
            patient_conditions = ""
            if normalized_email:
                cur.execute(
                    """
                    SELECT allergies, conditions
                    FROM patients
                    WHERE LOWER(email) = %s
                    LIMIT 1
                    """,
                    (normalized_email,),
                )
                patient_row = cur.fetchone()
                if patient_row:
                    patient_allergies = patient_row[0] or ""
                    patient_conditions = patient_row[1] or ""

            doctor_summary = enrich_summary_with_patient_history(
                doctor_summary,
                patient_allergies,
                patient_conditions,
            )
            cur.execute(
                """
                INSERT INTO symptom_records (
                    symptom_id, patient_name, patient_age, patient_gender, patient_contact,
                    patient_location, patient_email, symptom_text, doctor_summary, duration_days, urgency, department,
                    language, status, doctor_id, doctor_name, reviewed_by_doctor_id, review_locked_at, reply_access_token, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'waiting', NULL, NULL, NULL, NULL, NULL, NOW())
                ON CONFLICT (symptom_id) DO UPDATE
                SET patient_name = EXCLUDED.patient_name,
                    patient_age = EXCLUDED.patient_age,
                    patient_gender = EXCLUDED.patient_gender,
                    patient_contact = EXCLUDED.patient_contact,
                    patient_location = EXCLUDED.patient_location,
                    patient_email = EXCLUDED.patient_email,
                    symptom_text = EXCLUDED.symptom_text,
                    doctor_summary = EXCLUDED.doctor_summary,
                    duration_days = EXCLUDED.duration_days,
                    urgency = EXCLUDED.urgency,
                    department = EXCLUDED.department,
                    language = EXCLUDED.language,
                    status = 'waiting',
                    doctor_id = NULL,
                    doctor_name = NULL,
                    reviewed_by_doctor_id = NULL,
                    review_locked_at = NULL,
                    reply_access_token = NULL,
                    replied_at = NULL
                """,
                (
                    symptom_id,
                    payload.patient_name.strip(),
                    payload.patient_age,
                    (payload.patient_gender or "").strip() or None,
                    (payload.patient_contact or "").strip() or None,
                    (payload.patient_location or "").strip() or None,
                    normalized_email,
                    payload.symptom_text.strip(),
                    doctor_summary,
                    payload.duration_days,
                    (payload.urgency or "medium").strip(),
                    inferred_department,
                    short_lang(payload.language or "en"),
                ),
            )
            conn.commit()

    return get_symptom_record(symptom_id)


@app.get("/symptom-records/{symptom_id}")
def get_symptom_record(symptom_id: str):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_symptom_tables(cur)
            cur.execute(
                """
                SELECT symptom_id, patient_name, patient_age, patient_gender, patient_contact,
                      patient_location, patient_email, symptom_text, doctor_summary, duration_days, urgency, department,
                      language, status, doctor_id, doctor_name, reviewed_by_doctor_id, review_locked_at, reply_access_token, created_at, replied_at
                FROM symptom_records
                WHERE symptom_id = %s
                """,
                (symptom_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="No symptom record found.")
            cur.execute(
                """
                SELECT response_id, response_type, response_text, original_text, created_at
                FROM symptom_responses
                WHERE symptom_id = %s
                ORDER BY response_id ASC
                """,
                (symptom_id,),
            )
            reply_rows = cur.fetchall()

    keys = [
        "symptom_id",
        "patient_name",
        "patient_age",
        "patient_gender",
        "patient_contact",
        "patient_location",
        "patient_email",
        "symptom_text",
        "doctor_summary",
        "duration_days",
        "urgency",
        "department",
        "language",
        "status",
        "doctor_id",
        "doctor_name",
        "reviewed_by_doctor_id",
        "review_locked_at",
        "reply_access_token",
        "created_at",
        "replied_at",
    ]
    record = dict(zip(keys, row))
    record["replies"] = [
        {
            "response_id": r[0],
            "response_type": r[1],
            "response_text": r[2],
            "original_text": r[3],
            "created_at": r[4],
        }
        for r in reply_rows
    ]
    return record


@app.post("/symptom-records/{symptom_id}/claim")
def claim_symptom_record(symptom_id: str, payload: SymptomClaimPayload):
    now_ts = int(time.time())
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            ensure_symptom_tables(cur)

            cur.execute(
                """
                SELECT doctor_id, name, department
                FROM doctors
                WHERE doctor_id = %s
                LIMIT 1
                """,
                (payload.doctor_id,),
            )
            doctor = cur.fetchone()
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor not found")

            cur.execute(
                """
                SELECT symptom_id, status, department, reviewed_by_doctor_id,
                       EXTRACT(EPOCH FROM review_locked_at)::BIGINT
                FROM symptom_records
                WHERE symptom_id = %s
                LIMIT 1
                """,
                (symptom_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Symptom record not found")

            if row[1] == "replied":
                raise HTTPException(status_code=409, detail="This patient has already been replied.")

            symptom_department = normalize_department_name(row[2])
            doctor_department = normalize_department_name(doctor[2])
            if symptom_department != doctor_department:
                raise HTTPException(status_code=403, detail="This patient is assigned to another department.")

            locked_by = row[3]
            locked_at_epoch = row[4] or 0
            lock_active = locked_by is not None and (now_ts - locked_at_epoch) < REPLY_LOCK_SECONDS

            if lock_active and int(locked_by) != int(payload.doctor_id):
                cur.execute("SELECT name FROM doctors WHERE doctor_id = %s LIMIT 1", (locked_by,))
                reviewer = cur.fetchone()
                reviewer_name = reviewer[0] if reviewer else "another doctor"
                raise HTTPException(status_code=409, detail=f"This patient is being reviewed by {reviewer_name}.")

            cur.execute(
                """
                UPDATE symptom_records
                SET reviewed_by_doctor_id = %s,
                    review_locked_at = NOW()
                WHERE symptom_id = %s
                """,
                (payload.doctor_id, symptom_id),
            )
            conn.commit()

    return {"claimed": True, "symptom_id": symptom_id, "doctor_id": payload.doctor_id}


@app.get("/symptom-records/reply-access/{reply_token}")
def get_reply_by_token(reply_token: str):
    token = (reply_token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Invalid reply access link.")

    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_symptom_tables(cur)
            cur.execute(
                """
                SELECT symptom_id, status
                FROM symptom_records
                WHERE reply_access_token = %s
                LIMIT 1
                """,
                (token,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Reply link is invalid or expired.")
            if row[1] != "replied":
                raise HTTPException(status_code=409, detail="Doctor reply is not ready yet.")

    return get_symptom_record(row[0])


@app.post("/symptom-records/{symptom_id}/reply")
def save_symptom_reply(symptom_id: str, payload: SymptomReplyPayload):
    reply_notification: dict[str, str] | None = None
    mail_sent = False
    mail_error = ""
    now_ts = int(time.time())
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            ensure_symptom_tables(cur)

            cur.execute(
                """
                  SELECT symptom_id, language, status, patient_email, patient_name,
                      reviewed_by_doctor_id, EXTRACT(EPOCH FROM review_locked_at)::BIGINT
                FROM symptom_records
                WHERE symptom_id = %s
                """,
                (symptom_id,),
            )
            symptom = cur.fetchone()
            if not symptom:
                raise HTTPException(status_code=404, detail="Symptom record not found")
            if symptom[2] == "replied":
                raise HTTPException(status_code=409, detail="This patient has already been replied.")

            cur.execute(
                """
                SELECT doctor_id, name, languages_spoken
                FROM doctors
                WHERE doctor_id = %s
                """,
                (payload.doctor_id,),
            )
            doctor = cur.fetchone()
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor not found")

            locked_by = symptom[5]
            locked_at_epoch = symptom[6] or 0
            lock_active = locked_by is not None and (now_ts - locked_at_epoch) < REPLY_LOCK_SECONDS
            if lock_active and int(locked_by) != int(payload.doctor_id):
                raise HTTPException(status_code=409, detail="This patient is being reviewed by another doctor.")

            target_lang = normalize_language_code(symptom[1] or "en")
            doctor_pref_lang = normalize_language_code((doctor[2] or "en").split(",")[0])

            cur.execute("DELETE FROM symptom_responses WHERE symptom_id = %s", (symptom_id,))

            for part in payload.parts:
                original_text = (part.response_text or "").strip()
                if not original_text:
                    continue

                translated_text = original_text
                if short_lang(target_lang) != short_lang(doctor_pref_lang):
                    try:
                        translated = sarvam_post_json(
                            "/translate",
                            {
                                "input": original_text,
                                "source_language_code": doctor_pref_lang,
                                "target_language_code": target_lang,
                                "model": "mayura:v1",
                            },
                        )
                        translated_text = translated.get("translated_text") or original_text
                    except Exception:
                        translated_text = original_text

                cur.execute(
                    """
                    INSERT INTO symptom_responses (symptom_id, response_type, response_text, original_text)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (symptom_id, part.response_type, translated_text, original_text),
                )

            reply_access_token = uuid.uuid4().hex
            cur.execute(
                """
                UPDATE symptom_records
                SET status = 'replied', doctor_id = %s, doctor_name = %s, replied_at = NOW(),
                    reviewed_by_doctor_id = NULL, review_locked_at = NULL, reply_access_token = %s
                WHERE symptom_id = %s
                """,
                (doctor[0], doctor[1], reply_access_token, symptom_id),
            )

            patient_email = (symptom[3] or "").strip().lower()
            if patient_email:
                reply_notification = {
                    "email": patient_email,
                    "language": short_lang(symptom[1] or "en"),
                    "patient_name": symptom[4] or "Patient",
                    "reply_url": f"{REPLY_LINK_BASE}/reply/{reply_access_token}",
                }
            conn.commit()

    if reply_notification:
        try:
            subject, body, html_body = build_reply_ready_email(
                reply_notification["language"],
                reply_notification["patient_name"],
                reply_notification["reply_url"],
            )
            send_mail(reply_notification["email"], subject, body, html_body)
            mail_sent = True
        except Exception:
            # Do not fail doctor reply completion if email provider is temporarily unavailable.
            mail_error = "Reply saved but email send failed."

    response = get_symptom_record(symptom_id)
    response["mail_sent"] = mail_sent
    if mail_error:
        response["mail_error"] = mail_error
    return response


@app.get("/doctors/{doctor_id}/replied")
def list_doctor_replied(doctor_id: int):
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_hospital_tables(cur)
            ensure_symptom_tables(cur)
            cur.execute("SELECT department FROM doctors WHERE doctor_id = %s LIMIT 1", (doctor_id,))
            doctor_row = cur.fetchone()
            if not doctor_row:
                raise HTTPException(status_code=404, detail="Doctor not found")
            normalized_department = normalize_department_name(doctor_row[0])
            cur.execute(
                """
                SELECT symptom_id
                FROM symptom_records
                WHERE status = 'replied'
                  AND (LOWER(TRIM(department)) = LOWER(TRIM(%s)) OR LOWER(TRIM(department)) = LOWER(TRIM(%s)))
                ORDER BY replied_at DESC NULLS LAST, created_at DESC
                """,
                (doctor_row[0], normalized_department),
            )
            ids = [row[0] for row in cur.fetchall()]

    return [get_symptom_record(symptom_id) for symptom_id in ids]


@app.post("/api/translate")
def translate_text(payload: TranslatePayload):
    input_text = (payload.input or payload.text or "").strip()
    if not input_text:
        raise HTTPException(status_code=400, detail="Input text is required for translation.")

    source_language_code = normalize_language_code(payload.sourceLanguageCode or payload.source_language_code)
    target_language_code = normalize_language_code(payload.targetLanguageCode or payload.target_language_code)

    result = sarvam_post_json(
        "/translate",
        {
            "input": input_text,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "model": "mayura:v1",
        },
    )
    translated_text = result.get("translated_text")
    if not translated_text:
        raise HTTPException(status_code=502, detail="Sarvam did not return translated text.")

    return {
        "translatedText": translated_text,
        "sourceLanguageCode": result.get("source_language_code", source_language_code),
        "targetLanguageCode": target_language_code,
    }


@app.post("/api/tts")
def tts_text(payload: TtsPayload):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required for speech synthesis.")

    language_code = normalize_language_code(payload.languageCode or payload.language_code)
    result = sarvam_post_json(
        "/text-to-speech",
        {
            "text": text,
            "language_code": language_code,
            "model": "bulbul:v3",
            "speaker": payload.speaker or "priya",
            "speech_sample_rate": 24000,
        },
    )

    audio_list = result.get("audios") or []
    if not audio_list:
        raise HTTPException(status_code=502, detail="Sarvam did not return synthesized audio.")
    audio_base64 = audio_list[0]

    return {
        "audio": f"data:audio/wav;base64,{audio_base64}",
        "mimeType": "audio/wav",
        "languageCode": language_code,
    }


@app.post("/api/stt")
def speech_to_text(audio: UploadFile = File(...), languageCode: str = Form(default="en-IN")):
    file_name = audio.filename or "recording.webm"
    file_bytes = audio.file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    language_code = normalize_language_code(languageCode, default="en-IN")
    content_type = audio.content_type or "application/octet-stream"

    result = sarvam_post_file(
        "/speech-to-text",
        file_name=file_name,
        file_bytes=file_bytes,
        content_type=content_type,
        data={
            "model": "saaras:v4",
            "mode": "transcribe",
            "language_code": language_code,
        },
    )
    transcript = result.get("transcript", "")
    return {
        "transcript": transcript,
        "languageCode": result.get("language_code", language_code),
        "requestId": result.get("request_id"),
    }


@app.post("/transcribe")
def transcribe_alias(audio: UploadFile = File(...), lang: str = Form(default="en")):
    return speech_to_text(audio=audio, languageCode=lang)


@app.post("/speak")
def speak_alias(text: str = Form(...), lang: str = Form(default="en")):
    return tts_text(TtsPayload(text=text, languageCode=lang))
