const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const multer = require("multer");
const { SarvamAIClient } = require("sarvamai");
const { Pool } = require("pg");
const crypto = require("crypto");
const { promisify } = require("util");
const scrypt = promisify(crypto.scrypt);

dotenv.config();

const app = express();
const PORT = 5000;

// -----------------------------
// PostgreSQL connection
// -----------------------------
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "healthcare_triage",
  password: "postgres123",
  port: 5432,
});

// Test PostgreSQL connection
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("PostgreSQL connection failed:", err.message);
  } else {
    console.log("PostgreSQL connected successfully");
  }
});

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// -----------------------------
// Sarvam client
// -----------------------------
const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

// -----------------------------
// 1. SPEECH TO TEXT
// -----------------------------
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file received",
      });
    }

    const audioFile = fs.createReadStream(req.file.path);

    const response = await client.speechToText.transcribe({
      file: audioFile,
      model: "saaras:v4",
      languageCode: req.body.languageCode || "unknown",
    });

    fs.unlinkSync(req.file.path);

    res.json({
      transcript: response.transcript,
      languageCode: response.languageCode,
    });
  } catch (error) {
    console.error("STT error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Speech-to-text failed",
      details: error.message,
    });
  }
});

// -----------------------------
// 2. TRANSLATION
// -----------------------------
app.post("/api/translate", async (req, res) => {
  try {
    const {
      text,
      sourceLanguageCode,
      targetLanguageCode,
    } = req.body;

    if (!text || !sourceLanguageCode || !targetLanguageCode) {
      return res.status(400).json({
        error:
          "text, sourceLanguageCode and targetLanguageCode are required",
      });
    }

    const response = await client.text.translate({
      input: text,
      sourceLanguageCode,
      targetLanguageCode,
      model: "sarvam-translate:v1",
    });

    res.json({
      translatedText: response.translatedText,
    });
  } catch (error) {
    console.error("Translation error:", error);

    res.status(500).json({
      error: "Translation failed",
      details: error.message,
    });
  }
});

// -----------------------------
// 3. TEXT TO SPEECH
// -----------------------------
app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      languageCode,
    } = req.body;

    if (!text || !languageCode) {
      return res.status(400).json({
        error: "text and languageCode are required",
      });
    }

    const response = await client.textToSpeech.convert({
      text,
      languageCode,
      model: "bulbul:v3",
      speaker: "priya",
    });

    res.json({
      audio: response.audios[0],
    });
  } catch (error) {
    console.error("TTS error:", error);

    res.status(500).json({
      error: "Text-to-speech failed",
      details: error.message,
    });
  }
});

// -----------------------------
// Hospital admin registration and login
// Passwords are stored as salted scrypt hashes, never as plaintext.
// -----------------------------
let adminSchemaReady;
function ensureAdminSchema() {
  if (!adminSchemaReady) {
    adminSchemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS triage_hospitals (
        hospital_id BIGSERIAL PRIMARY KEY,
        hospital_name TEXT NOT NULL,
        registration_id TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        address TEXT NOT NULL,
        hospital_type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS triage_admin_accounts (
        admin_id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        hospital_id BIGINT NOT NULL UNIQUE REFERENCES triage_hospitals(hospital_id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }
  return adminSchemaReady;
}

function validAdminPassword(password) {
  return typeof password === "string" && password.length >= 8 &&
    /[a-z]/.test(password) && /[A-Z]/.test(password) &&
    /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function adminResponse(row) {
  return {
    admin_id: row.admin_id,
    email: row.email,
    hospital_id: row.hospital_id,
    hospital: {
      hospital_id: row.hospital_id,
      hospital_name: row.hospital_name,
      registration_id: row.registration_id,
      phone: row.phone,
      city: row.city,
      state: row.state,
      address: row.address,
      hospital_type: row.hospital_type,
    },
  };
}

app.post("/api/admin/register", async (req, res) => {
  const { email, password, hospital } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const hospitalFields = ["hospital_name", "registration_id", "phone", "city", "state", "address", "hospital_type"];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      !validAdminPassword(password) || !hospital ||
      hospitalFields.some((field) => typeof hospital[field] !== "string" || !hospital[field].trim())) {
    return res.status(400).json({ error: "Enter valid account credentials and complete hospital details." });
  }

  let db;
  try {
    await ensureAdminSchema();
    const salt = crypto.randomBytes(16);
    const passwordHash = await scrypt(password, salt, 64);
    db = await pool.connect();
    await db.query("BEGIN");
    const hospitalResult = await db.query(
      `INSERT INTO triage_hospitals
       (hospital_name, registration_id, phone, city, state, address, hospital_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [hospital.hospital_name.trim(), hospital.registration_id.trim(), hospital.phone.trim(),
        hospital.city.trim(), hospital.state.trim(), hospital.address.trim(), hospital.hospital_type.trim()]
    );
    const savedHospital = hospitalResult.rows[0];
    const adminResult = await db.query(
      `INSERT INTO triage_admin_accounts (email, password_salt, password_hash, hospital_id)
       VALUES ($1, $2, $3, $4) RETURNING admin_id, email, hospital_id`,
      [normalizedEmail, salt.toString("hex"), passwordHash.toString("hex"), savedHospital.hospital_id]
    );
    await db.query("COMMIT");
    return res.status(201).json(adminResponse({ ...adminResult.rows[0], ...savedHospital }));
  } catch (error) {
    if (db) await db.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") {
      return res.status(409).json({ error: "That admin email or hospital registration ID is already registered." });
    }
    console.error("Hospital admin registration failed:", error.message);
    return res.status(503).json({ error: "Hospital registration is temporarily unavailable." });
  } finally {
    if (db) db.release();
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    await ensureAdminSchema();
    const result = await pool.query(
      `SELECT a.admin_id, a.email, a.hospital_id, a.password_salt, a.password_hash,
              h.hospital_name, h.registration_id, h.phone, h.city, h.state, h.address, h.hospital_type
       FROM triage_admin_accounts a
       JOIN triage_hospitals h ON h.hospital_id = a.hospital_id
       WHERE a.email = $1`,
      [normalizedEmail]
    );
    if (!result.rows.length) return res.status(401).json({ error: "Incorrect email or password." });

    const row = result.rows[0];
    const salt = Buffer.from(row.password_salt, "hex");
    const expectedHash = Buffer.from(row.password_hash, "hex");
    const suppliedHash = await scrypt(password, salt, expectedHash.length);
    if (expectedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    return res.json(adminResponse(row));
  } catch (error) {
    console.error("Hospital admin login failed:", error.message);
    return res.status(503).json({ error: "Hospital login is temporarily unavailable." });
  }
});

// -----------------------------
// 4. CREATE PATIENT
// -----------------------------
app.post("/api/patients", async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      language,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Patient name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO patients
       (name, age, gender, phone, language)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, age, gender, phone, language]
    );

    res.status(201).json({
      message: "Patient created successfully",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Patient creation error:", error);

    res.status(500).json({
      error: "Failed to create patient",
      details: error.message,
    });
  }
});

// -----------------------------
// HOME
// -----------------------------
app.get("/", (req, res) => {
  res.send("Sarvam backend is running");
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => {
  console.log(`Sarvam server running at http://localhost:${PORT}`);
});
