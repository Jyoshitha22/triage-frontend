# Backend Setup (Patient + SMTP)

This backend powers patient email verification and doctor reply-ready emails.

## 1) Install dependencies

```bash
cd server
pip install -r requirements.txt
```

## 2) Configure environment

Create or update `server/.env` with these values:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
SARVAM_API_KEY=<your_sarvam_key>

# SMTP (Gmail recommended)
GMAIL_ADDRESS=<your_gmail_address>
GMAIL_APP_PASSWORD=<your_16_char_app_password>

# Optional generic SMTP overrides
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=<your_gmail_address>
SMTP_PASSWORD=<your_16_char_app_password>
SMTP_FROM=<your_gmail_address>
SMTP_USE_SSL=1

# Frontend base URL for secure reply links
APP_BASE_URL=http://localhost:5173
```

Notes:
- Use a Gmail App Password (not your regular account password).
- If you use port `587`, set `SMTP_USE_SSL=0` (backend will use STARTTLS).

## 3) Run backend

```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Important:
- Run only this FastAPI backend for both patient and hospital flows.
- Frontend should point to port `8000` so both flows use the same DB and APIs.

## 4) What should work

- `POST /patients/send-code` sends verification code email.
- `POST /patients/verify-code` verifies code.
- `POST /symptom-records/{id}/reply` triggers reply-ready email (secure `/reply/{token}` link).
- `POST /notifications/reply-ready` sends manual re-notify email for the same secure reply link.
- `GET /health/smtp` returns current SMTP configuration state (without exposing password).
