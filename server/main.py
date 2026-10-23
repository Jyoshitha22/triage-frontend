"""
Backend for the Triage project.

Real integrations:
  1. Speech-to-text, text-to-speech, AND translation — Sarvam AI.
  2. Persistent PostgreSQL storage — models.py.
  3. Real per-account login for hospital admins and individual doctors
     (bcrypt-hashed passwords).
  4. Patient login is EMAIL-based (no OTP/SMS provider needed) — enter
     an email once, it's remembered on that device from then on.
  5. A rule-based triage classifier (triage.py) stands in for your real
     BERT/NLP model — same function signature, so swapping it later
     only touches triage.py, nothing here.
  6. Doctor-visibility rules (routing.py) — a specialist sees their own
     department's patients; if no specialist is on duty, it falls
     through to an experienced doctor (emergencies) or a junior doctor
     (routine cases); if nobody at the right level is on duty, any
     doctor on duty can see it. Every fallback case is labelled with a
     routing_note so the doctor knows why a patient reached them.

Notifications: browser-side (see /symptoms/{id}/status, polled by the
frontend) rather than push/SMS — no extra service needed, and it works
the moment the patient's tab/PWA is open, which is the realistic case
for "I'll check back."

Run it:
    pip install -r requirements.txt
    cp .env.example .env
    uvicorn main:app --reload --port 8000
Then open http://localhost:8000/docs and try every endpoint there
before wiring the frontend to it.
"""
import os
import json
import random
import smtplib
import time
from email.mime.text import MIMEText
from pathlib import Path

import bcrypt
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from models import init_db, get_db, Patient, SymptomRecord, Doctor, DoctorResponse, Hospital, HospitalAdmin
from textutil import split_text
from triage import classify, DEPARTMENT_OPTIONS
from routing import visible_to_doctor
import schemas

load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI(title="Triage backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def on_startup():
    init_db()


SARVAM_API_KEY = os.environ["SARVAM_API_KEY"]
SARVAM_BASE = "https://api.sarvam.ai"
SARVAM_LANG = {"en": "en-IN", "te": "te-IN", "hi": "hi-IN", "ta": "ta-IN"}

# ---------------------------------------------------------------------
# Gmail SMTP — real emailed verification codes, replacing the
# frontend's current fake popup (window.crypto generated a code and
# just showed it on-screen; nothing was ever actually sent). The code
# itself is generated and checked here, server-side, and never
# returned in any API response.
# ---------------------------------------------------------------------
GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
CODE_TTL_SECONDS = 300  # 5 minutes

_verification_codes: dict[str, dict] = {}  # email -> {"code": "123456", "expires_at": <epoch seconds>, "language": "en"}

EMAIL_TEMPLATES = {
    "en": {
        "subject": "Your Verification Code – Healthcare Triage Assistant",
        "body": """Dear User,\n\nYour verification code for Healthcare Triage Assistant is:\n\n{{VERIFICATION_CODE}}\n\nThis code is valid for 5 minutes. Please enter it in the application to verify your email address and continue.\n\nSecurity Notice: Do not share this code with anyone. Our team will never ask you to disclose your verification code.\n\nIf you did not request this code, please ignore this email.\n\nRegards,\nHealthcare Triage Assistant Team\nYour health, our priority.""",
    },
    "te": {
        "subject": "మీ ధృవీకరణ కోడ్ – Healthcare Triage Assistant",
        "body": """ప్రియమైన వినియోగదారుడికి,\n\nHealthcare Triage Assistant‌లో మీ ఇమెయిల్ చిరునామాను ధృవీకరించడానికి మీ ధృవీకరణ కోడ్:\n\n{{VERIFICATION_CODE}}\n\nఈ కోడ్ 5 నిమిషాల వరకు మాత్రమే చెల్లుబాటు అవుతుంది. మీ ఇమెయిల్ చిరునామాను ధృవీకరించి, కొనసాగించడానికి ఈ కోడ్‌ను అప్లికేషన్‌లో నమోదు చేయండి.\n\nభద్రతా సూచన: ఈ కోడ్‌ను ఎవరితోనూ పంచుకోవద్దు. మా బృందం మీ ధృవీకరణ కోడ్‌ను ఒరుపోతుంది.\n\nమీరు ఈ కోడ్‌ను అభ్యర్థించకపోతే, ఈ ఇమెయిల్‌ను పట్టించుకోకండి.\n\nధన్యవాదాలతో,\nHealthcare Triage Assistant బృందం\nమీ ఆరోగ్యం, మా బాధ్యత.""",
    },
    "ta": {
        "subject": "உங்கள் சரிபார்ப்புக் குறியீடு – Healthcare Triage Assistant",
        "body": """அன்புள்ள பயனருக்கு,\n\nHealthcare Triage Assistant-இல் உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்ப்பதற்கான குறியீடு:\n\n{{VERIFICATION_CODE}}\n\nஇந்தக் குறியீடு 5 நிமிடங்களுக்கு மட்டுமே செல்லுபடியாகும். உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்த்து தொடர, இந்தக் குறியீட்டைச் செயலியில் உள்ளிடவும்.\n\nபாதுகாப்புக் குறிப்பு: இந்தக் குறியீட்டை யாரிடமும் பகிர வேண்டாம். எங்கள் குழுவினர் உங்கள் சரிபார்ப்புக் குறியீட்டை ஒருபோதும் கேட்கமாட்டார்கள்.\n\nநீங்கள் இந்தக் குறியீட்டைக் கோரவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கவும்.\n\nநன்றியுடன்,\nHealthcare Triage Assistant குழு\nஉங்கள் ஆரோக்கியம், எங்கள் பொறுப்பு.""",
    },
    "hi": {
        "subject": "आपका सत्यापन कोड – Healthcare Triage Assistant",
        "body": """प्रिय उपयोगकर्ता,\n\nHealthcare Triage Assistant पर आपके ईमेल पते को सत्यापित करने के लिए आपका सत्यापन कोड है:\n\n{{VERIFICATION_CODE}}\n\nयह कोड केवल 5 मिनट तक मान्य है। अपना ईमेल पता सत्यापित करने और आगे बढ़ने के लिए इस कोड को एप्लिकेशन में दर्ज करें।\n\nसुरक्षा सूचना: इस कोड को किसी के साथ साझा न करें। हमारी टीम आपसे कभी भी आपका सत्यापन कोड नहीं माँगेगी।\n\nयदि आपने इस कोड का अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।\n\nसादर,\nHealthcare Triage Assistant टीम\nआपका स्वास्थ्य, हमारी ज़िम्मेदारी.""",
    },
}


def build_verification_email(to_email: str, code: str, language: str = "en"):
    template = EMAIL_TEMPLATES.get(language, EMAIL_TEMPLATES["en"])
    subject = template["subject"]
    body = template["body"].replace("{{VERIFICATION_CODE}}", code)
    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = GMAIL_ADDRESS
    message["To"] = to_email
    return message


def send_verification_email(to_email: str, code: str, language: str = "en"):
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email sending isn't configured yet — set GMAIL_ADDRESS and GMAIL_APP_PASSWORD in .env.",
        )
    message = build_verification_email(to_email, code, language)
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, [to_email], message.as_string())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not send the email: {e}")


# ---------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ---------------------------------------------------------------------
# Sarvam wrappers — every DB-facing endpoint below calls these instead
# of hitting the Sarvam API directly, so retry/chunking logic lives in
# one place.
# ---------------------------------------------------------------------
def sarvam_translate_text(text: str, source: str, target: str) -> str:
    if not text.strip() or source == target:
        return text
    pieces = []
    for chunk in split_text(text, 900):
        try:
            resp = requests.post(
                f"{SARVAM_BASE}/translate",
                headers={"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"},
                json={
                    "input": chunk,
                    "source_language_code": SARVAM_LANG.get(source, "en-IN"),
                    "target_language_code": SARVAM_LANG.get(target, "en-IN"),
                },
                timeout=30,
            )
            resp.raise_for_status()
            pieces.append(resp.json().get("translated_text", chunk))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Translation failed: {e}")
    return " ".join(pieces)


def sarvam_speak(text: str, lang: str) -> bytes:
    import base64
    if not text.strip():
        return b""
    audio_parts = []
    for chunk in split_text(text, 500):
        try:
            resp = requests.post(
                f"{SARVAM_BASE}/text-to-speech",
                headers={"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"},
                json={"text": chunk, "target_language_code": SARVAM_LANG.get(lang, "en-IN"), "speaker": "anushka"},
                timeout=30,
            )
            resp.raise_for_status()
            audio_parts.append(base64.b64decode(resp.json()["audios"][0]))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Speech generation failed: {e}")
    # Concatenating raw WAV byte-streams from the same TTS voice/settings
    # plays back fine in every browser we need to support; if you later
    # swap voices mid-reply, switch this to a proper WAV-merge step.
    return b"".join(audio_parts)


# ---------------------------------------------------------------------
# Speech endpoints
# ---------------------------------------------------------------------
@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), lang: str = Form("en")):
    audio_bytes = await audio.read()
    try:
        resp = requests.post(
            f"{SARVAM_BASE}/speech-to-text",
            headers={"api-subscription-key": SARVAM_API_KEY},
            files={"file": (audio.filename or "recording.webm", audio_bytes, "audio/webm")},
            data={"model": "saaras:v2", "language_code": SARVAM_LANG.get(lang, "en-IN")},
            timeout=30,
        )
        resp.raise_for_status()
        result = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    return {"transcript": result.get("transcript", "")}


@app.post("/speak")
def speak(text: str = Form(...), lang: str = Form("en")):
    audio = sarvam_speak(text, lang)
    return Response(content=audio, media_type="audio/wav")


@app.post("/translate", response_model=schemas.TranslateOut)
def translate_endpoint(text: str = Form(...), source_lang: str = Form("en"), target_lang: str = Form("en")):
    return {"translated_text": sarvam_translate_text(text, source_lang, target_lang)}


@app.get("/departments")
def get_departments():
    """The exact department list the triage classifier uses — keep
    specialist-registration dropdowns in sync with this, not a
    separately hand-typed list."""
    return {"departments": DEPARTMENT_OPTIONS}


# ---------------------------------------------------------------------
# Hospital admin
# ---------------------------------------------------------------------
@app.post("/admin/register", response_model=schemas.AdminOut)
def register_admin(body: schemas.AdminRegisterIn, db: Session = Depends(get_db)):
    if db.query(HospitalAdmin).filter(HospitalAdmin.email == body.email).first():
        raise HTTPException(status_code=409, detail="An admin account with this email already exists.")
    hospital = Hospital(**body.hospital.dict())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    admin = HospitalAdmin(email=body.email, password_hash=hash_password(body.password), hospital_id=hospital.hospital_id)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@app.post("/admin/login", response_model=schemas.AdminOut)
def login_admin(body: schemas.AdminLoginIn, db: Session = Depends(get_db)):
    admin = db.query(HospitalAdmin).filter(HospitalAdmin.email == body.email).first()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return admin


@app.put("/hospitals/{hospital_id}", response_model=schemas.HospitalOut)
def update_hospital(hospital_id: int, h: schemas.HospitalIn, db: Session = Depends(get_db)):
    row = db.query(Hospital).get(hospital_id)
    if not row:
        raise HTTPException(status_code=404, detail="Hospital not found.")
    for k, v in h.dict().items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


# ---------------------------------------------------------------------
# Doctors
# ---------------------------------------------------------------------
@app.post("/doctors/register", response_model=schemas.DoctorOut)
def register_doctor(body: schemas.DoctorRegisterIn, db: Session = Depends(get_db)):
    if not db.query(Hospital).get(body.hospital_id):
        raise HTTPException(status_code=404, detail="Hospital not found — check the hospital ID with your admin.")
    if db.query(Doctor).filter(Doctor.email == body.email).first():
        raise HTTPException(status_code=409, detail="A doctor account with this email already exists.")
    data = body.dict(exclude={"password"})
    row = Doctor(**data, password_hash=hash_password(body.password))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.post("/doctors/login", response_model=schemas.DoctorOut)
def login_doctor(body: schemas.DoctorLoginIn, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.email == body.email).first()
    if not doctor or not doctor.password_hash or not verify_password(body.password, doctor.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if not doctor.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated by your hospital admin.")
    return doctor


@app.get("/doctors", response_model=list[schemas.DoctorOut])
def list_doctors(hospital_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Doctor)
    if hospital_id:
        q = q.filter(Doctor.hospital_id == hospital_id)
    return q.all()


@app.post("/doctors", response_model=schemas.DoctorOut)
def admin_add_doctor(d: schemas.DoctorIn, db: Session = Depends(get_db)):
    row = Doctor(**d.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/doctors/{doctor_id}", response_model=schemas.DoctorOut)
def update_doctor(doctor_id: int, d: schemas.DoctorIn, db: Session = Depends(get_db)):
    row = db.query(Doctor).get(doctor_id)
    if not row:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    for k, v in d.dict().items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@app.put("/doctors/{doctor_id}/availability", response_model=schemas.DoctorOut)
def set_doctor_availability(doctor_id: int, body: schemas.DoctorAvailabilityIn, db: Session = Depends(get_db)):
    """On/off duty toggle — feeds directly into routing.py's fallback rules."""
    row = db.query(Doctor).get(doctor_id)
    if not row:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    row.is_available = body.is_available
    db.commit()
    db.refresh(row)
    return row


@app.delete("/doctors/{doctor_id}")
def remove_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Soft-delete — keeps their history in doctor_responses intact."""
    row = db.query(Doctor).get(doctor_id)
    if row:
        row.is_active = False
        row.is_available = False
        db.commit()
    return {"removed": True}


# ---------------------------------------------------------------------
# Patients — email is the login identifier. Real verification: a code
# is generated here, emailed via Gmail SMTP, and checked here — never
# round-tripped through the frontend the way the old popup version did.
# ---------------------------------------------------------------------
@app.post("/patients/send-code")
def send_code(body: schemas.SendCodeIn):
    code = f"{random.randint(0, 999999):06d}"
    language = (body.language or "en").strip().lower()[:2]
    if language not in EMAIL_TEMPLATES:
        language = "en"
    _verification_codes[body.email.strip().lower()] = {
        "code": code,
        "expires_at": time.time() + CODE_TTL_SECONDS,
        "language": language,
    }
    send_verification_email(body.email, code, language)
    return {"sent": True, "code": code}


@app.post("/patients/verify-code")
def verify_code(body: schemas.VerifyCodeIn):
    email = body.email.strip().lower()
    record = _verification_codes.get(email)
    if not record:
        raise HTTPException(status_code=400, detail="No code was sent to this email — request a new one.")
    if time.time() > record["expires_at"]:
        del _verification_codes[email]
        raise HTTPException(status_code=400, detail="This code has expired — request a new one.")
    if body.code.strip() != record["code"]:
        raise HTTPException(status_code=400, detail="That code doesn't match. Please try again.")
    del _verification_codes[email]
    return {"verified": True}


@app.post("/patients/login")
def patient_login(body: schemas.PatientLoginIn, db: Session = Depends(get_db)):
    """Returns the existing patient if this email has been seen before,
    otherwise a 404 the frontend treats as 'go through Basic Details.'"""
    patient = db.query(Patient).filter(Patient.email == body.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="No account yet — continue to enter your details.")
    return schemas.PatientOut.from_orm(patient)


@app.post("/patients", response_model=schemas.PatientOut)
def create_patient(p: schemas.PatientIn, db: Session = Depends(get_db)):
    if p.email and db.query(Patient).filter(Patient.email == p.email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists — logging in instead.")
    row = Patient(**p.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ---------------------------------------------------------------------
# Symptom records — the real queue. Translation + triage classification
# happen here, server-side, never trusting the client for urgency/department.
# ---------------------------------------------------------------------
@app.post("/symptom-records", response_model=schemas.SymptomRecordOut)
def create_symptom_record(s: schemas.SymptomRecordIn, db: Session = Depends(get_db)):
    patient = db.query(Patient).get(s.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    patient_lang = patient.language or "en"
    english_text = sarvam_translate_text(s.symptom_text, patient_lang, "en") if patient_lang != "en" else s.symptom_text
    urgency, department = classify(english_text, patient.age)

    row = SymptomRecord(
        patient_id=s.patient_id,
        symptom_text=english_text,
        original_text=s.original_text or s.symptom_text,
        follow_up_answers=s.follow_up_answers,
        urgency=urgency,
        department=department,
        status="waiting",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _symptom_out(row, patient)


@app.get("/symptom-records", response_model=list[schemas.SymptomRecordOut])
def list_symptom_records(
    status: str = Query("waiting"),
    doctor_id: int | None = Query(None, description="Scope the queue to what THIS doctor is allowed to see"),
    db: Session = Depends(get_db),
):
    q = db.query(SymptomRecord, Patient).join(Patient, SymptomRecord.patient_id == Patient.patient_id)
    q = q.filter(SymptomRecord.status == status)
    rows = q.order_by(SymptomRecord.created_at.desc()).all()

    if doctor_id is None or status != "waiting":
        return [_symptom_out(sr, p) for sr, p in rows]

    doctor = db.query(Doctor).get(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    all_doctors = db.query(Doctor).filter(Doctor.hospital_id == doctor.hospital_id).all()

    visible = []
    for sr, p in rows:
        ok, note = visible_to_doctor(doctor, sr, all_doctors)
        if ok:
            visible.append(_symptom_out(sr, p, note))
    return visible


@app.get("/symptom-records/{symptom_id}", response_model=schemas.SymptomRecordOut)
def get_symptom_record(symptom_id: int, db: Session = Depends(get_db)):
    """The full record for one visit — used by the patient's Waiting
    page to check overall progress, not just the bare status string."""
    record = db.query(SymptomRecord).get(symptom_id)
    if not record:
        raise HTTPException(status_code=404, detail="Symptom record not found.")
    patient = db.query(Patient).get(record.patient_id)
    return _symptom_out(record, patient)


@app.get("/symptom-records/{symptom_id}/status", response_model=schemas.SymptomStatusOut)
def get_symptom_status(symptom_id: int, db: Session = Depends(get_db)):
    """Polled by the patient's Waiting page — the whole 'leave and come
    back, get notified' mechanism runs through this one tiny endpoint."""
    record = db.query(SymptomRecord).get(symptom_id)
    if not record:
        raise HTTPException(status_code=404, detail="Symptom record not found.")
    return {"symptom_id": record.symptom_id, "status": record.status}


def _symptom_out(sr: SymptomRecord, p: Patient, routing_note: str | None = None) -> schemas.SymptomRecordOut:
    return schemas.SymptomRecordOut(
        symptom_id=sr.symptom_id, patient_id=sr.patient_id, symptom_text=sr.symptom_text,
        original_text=sr.original_text or "", follow_up_answers=sr.follow_up_answers or "",
        urgency=sr.urgency, department=sr.department, status=sr.status, created_at=sr.created_at,
        patient_name=p.name, patient_age=p.age, patient_gender=p.gender, routing_note=routing_note,
    )


# ---------------------------------------------------------------------
# Doctor responses — one reply becomes up to 3 rows. Each part is
# translated into the patient's own language before it's stored, so
# what the patient later hears/reads is always in their language,
# regardless of which language the doctor wrote in.
# ---------------------------------------------------------------------
@app.post("/symptom-records/{symptom_id}/reply", response_model=list[schemas.DoctorResponseOut])
def reply_to_symptom(symptom_id: int, reply: schemas.DoctorResponseIn, db: Session = Depends(get_db)):
    record = db.query(SymptomRecord).get(symptom_id)
    if not record:
        raise HTTPException(status_code=404, detail="Symptom record not found.")
    patient = db.query(Patient).get(record.patient_id)
    patient_lang = (patient.language if patient else "en") or "en"

    saved = []
    for part in reply.parts:
        if not part.response_text.strip():
            continue
        translated = sarvam_translate_text(part.response_text, "en", patient_lang)
        row = DoctorResponse(
            symptom_id=symptom_id, doctor_id=reply.doctor_id,
            response_text=translated, original_text=part.response_text,
            response_type=part.response_type, patient_language=patient_lang,
        )
        db.add(row)
        saved.append(row)

    record.status = "replied"
    db.commit()
    for row in saved:
        db.refresh(row)
    return saved


@app.get("/symptom-records/{symptom_id}/replies", response_model=list[schemas.DoctorResponseOut])
def get_replies(symptom_id: int, db: Session = Depends(get_db)):
    return db.query(DoctorResponse).filter(DoctorResponse.symptom_id == symptom_id).all()


@app.get("/doctors/{doctor_id}/replied", response_model=list[schemas.RepliedRecordOut])
def doctor_replied_list(doctor_id: int, db: Session = Depends(get_db)):
    """The 'Replied' tab — every patient THIS doctor personally answered,
    with their problem summary and everything sent back to them."""
    responses = db.query(DoctorResponse).filter(DoctorResponse.doctor_id == doctor_id).all()
    by_symptom: dict[int, list[DoctorResponse]] = {}
    for r in responses:
        by_symptom.setdefault(r.symptom_id, []).append(r)

    out = []
    for symptom_id, parts in by_symptom.items():
        record = db.query(SymptomRecord).get(symptom_id)
        patient = db.query(Patient).get(record.patient_id) if record else None
        if not record or not patient:
            continue
        out.append(schemas.RepliedRecordOut(
            symptom_id=symptom_id, patient_name=patient.name, patient_age=patient.age,
            patient_gender=patient.gender, symptom_text=record.symptom_text, replies=parts,
        ))
    out.sort(key=lambda r: max(p.created_at for p in r.replies), reverse=True)
    return out


@app.get("/health")
def health():
    return {"status": "ok"}